#include <errno.h>
#include <inttypes.h>
#include <librdkafka/rdkafka.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <unistd.h>

#define DEFAULT_BROKERS "localhost:29092"
#define DEFAULT_TOPIC "transactions.raw"
#define DEFAULT_CURRENCY "EUR"
#define DEFAULT_TYPE "TRANSFER"

typedef struct {
    char transaction_id[32];
    char account_id[32];
    char recipient_id[32];
    double amount;
    char currency[8];
    char transaction_type[16];
    char country[4];
    char timestamp[32];
} Transaction;

typedef struct {
    const char *brokers;
    const char *topic;
    int total_events;
    int tps;
    int suspicious_ratio;
} AppConfig;

static void usage(const char *program) {
    fprintf(stderr,
            "Usage: %s [--brokers host:port] [--topic name] [--events N] [--tps N] [--suspicious-ratio 0-100]\n",
            program);
}

static int parse_int_arg(const char *value, const char *name) {
    char *endptr = NULL;
    long parsed = strtol(value, &endptr, 10);
    if (endptr == value || *endptr != '\0' || parsed <= 0 || parsed > 10000000) {
        fprintf(stderr, "Invalid value for %s: %s\n", name, value);
        return -1;
    }
    return (int)parsed;
}

static int parse_ratio_arg(const char *value) {
    char *endptr = NULL;
    long parsed = strtol(value, &endptr, 10);
    if (endptr == value || *endptr != '\0' || parsed < 0 || parsed > 100) {
        fprintf(stderr, "Invalid suspicious ratio: %s (expected 0-100)\n", value);
        return -1;
    }
    return (int)parsed;
}

static bool parse_args(int argc, char **argv, AppConfig *cfg) {
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--brokers") == 0 && i + 1 < argc) {
            cfg->brokers = argv[++i];
        } else if (strcmp(argv[i], "--topic") == 0 && i + 1 < argc) {
            cfg->topic = argv[++i];
        } else if (strcmp(argv[i], "--events") == 0 && i + 1 < argc) {
            cfg->total_events = parse_int_arg(argv[++i], "events");
            if (cfg->total_events < 0) {
                return false;
            }
        } else if (strcmp(argv[i], "--tps") == 0 && i + 1 < argc) {
            cfg->tps = parse_int_arg(argv[++i], "tps");
            if (cfg->tps < 0) {
                return false;
            }
        } else if (strcmp(argv[i], "--suspicious-ratio") == 0 && i + 1 < argc) {
            cfg->suspicious_ratio = parse_ratio_arg(argv[++i]);
            if (cfg->suspicious_ratio < 0) {
                return false;
            }
        } else {
            usage(argv[0]);
            return false;
        }
    }

    return true;
}

static void build_timestamp_utc(char *buffer, size_t size) {
    time_t now = time(NULL);
    struct tm utc_tm;
    gmtime_r(&now, &utc_tm);
    strftime(buffer, size, "%Y-%m-%dT%H:%M:%SZ", &utc_tm);
}

static void generate_country(bool suspicious, char *country, size_t size) {
    static const char *normal_countries[] = {"SE", "NO", "DK", "FI", "DE"};
    static const char *suspicious_countries[] = {"RU", "IR", "KP", "SY", "BY"};

    const char **pool = suspicious ? suspicious_countries : normal_countries;
    size_t pool_size = suspicious ? sizeof(suspicious_countries) / sizeof(suspicious_countries[0])
                                  : sizeof(normal_countries) / sizeof(normal_countries[0]);

    snprintf(country, size, "%s", pool[rand() % pool_size]);
}

static double random_amount(bool suspicious) {
    if (suspicious) {
        return 5000.0 + (double)(rand() % 25001);
    }
    return 10.0 + (double)(rand() % 2991);
}

static void generate_transaction(Transaction *tx, int event_idx, bool suspicious) {
    snprintf(tx->transaction_id, sizeof(tx->transaction_id), "TX-%06d", event_idx + 1);
    snprintf(tx->account_id, sizeof(tx->account_id), "ACC-%04d", 1000 + (rand() % 9000));
    snprintf(tx->recipient_id, sizeof(tx->recipient_id), "REC-%04d", 1000 + (rand() % 9000));

    tx->amount = random_amount(suspicious);
    snprintf(tx->currency, sizeof(tx->currency), "%s", DEFAULT_CURRENCY);
    snprintf(tx->transaction_type, sizeof(tx->transaction_type), "%s", DEFAULT_TYPE);
    generate_country(suspicious, tx->country, sizeof(tx->country));
    build_timestamp_utc(tx->timestamp, sizeof(tx->timestamp));
}

static int serialize_transaction(const Transaction *tx, bool suspicious, char *buffer, size_t size) {
    return snprintf(
        buffer,
        size,
        "{\"event_version\":1,\"event_type\":\"transaction_created\",\"source\":\"simulator-c\",\"transaction_id\":\"%s\",\"account_id\":\"%s\",\"recipient_id\":\"%s\",\"amount\":%.2f,\"currency\":\"%s\",\"transaction_type\":\"%s\",\"country\":\"%s\",\"timestamp\":\"%s\",\"simulated_pattern\":\"%s\"}",
        tx->transaction_id,
        tx->account_id,
        tx->recipient_id,
        tx->amount,
        tx->currency,
        tx->transaction_type,
        tx->country,
        tx->timestamp,
        suspicious ? "SUSPICIOUS" : "NORMAL");
}

static void delivery_report(rd_kafka_t *rk,
                            const rd_kafka_message_t *rkmessage,
                            void *opaque) {
    (void)rk;
    (void)opaque;

    if (rkmessage->err) {
        fprintf(stderr,
                "Delivery failed for message key %.*s: %s\n",
                (int)rkmessage->key_len,
                (const char *)rkmessage->key,
                rd_kafka_err2str(rkmessage->err));
    }
}

static void throttle_tps(int tps) {
    if (tps <= 0) {
        return;
    }

    useconds_t sleep_micro = (useconds_t)(1000000 / tps);
    usleep(sleep_micro);
}

static int run_simulation(const AppConfig *cfg) {
    char errstr[512];
    rd_kafka_conf_t *kconf = rd_kafka_conf_new();

    if (rd_kafka_conf_set(kconf, "bootstrap.servers", cfg->brokers, errstr, sizeof(errstr))
        != RD_KAFKA_CONF_OK) {
        fprintf(stderr, "Kafka configuration error: %s\n", errstr);
        rd_kafka_conf_destroy(kconf);
        return 1;
    }

    rd_kafka_conf_set_dr_msg_cb(kconf, delivery_report);

    rd_kafka_t *producer = rd_kafka_new(RD_KAFKA_PRODUCER, kconf, errstr, sizeof(errstr));
    if (producer == NULL) {
        fprintf(stderr, "Failed to create Kafka producer: %s\n", errstr);
        return 1;
    }

    rd_kafka_topic_t *topic = rd_kafka_topic_new(producer, cfg->topic, NULL);
    if (topic == NULL) {
        fprintf(stderr, "Failed to create topic object '%s'\n", cfg->topic);
        rd_kafka_destroy(producer);
        return 1;
    }

    struct timespec start_time;
    clock_gettime(CLOCK_MONOTONIC, &start_time);

    int produced = 0;
    for (int i = 0; i < cfg->total_events; i++) {
        bool suspicious = (rand() % 100) < cfg->suspicious_ratio;
        Transaction tx;
        generate_transaction(&tx, i, suspicious);

        char payload[512];
        int payload_len = serialize_transaction(&tx, suspicious, payload, sizeof(payload));
        if (payload_len <= 0 || (size_t)payload_len >= sizeof(payload)) {
            fprintf(stderr, "Serialization error for event %d\n", i + 1);
            continue;
        }

        if (rd_kafka_produce(topic,
                             RD_KAFKA_PARTITION_UA,
                             RD_KAFKA_MSG_F_COPY,
                             payload,
                             (size_t)payload_len,
                             tx.transaction_id,
                             strlen(tx.transaction_id),
                             NULL)
            != 0) {
            fprintf(stderr,
                    "Failed to produce event %d: %s\n",
                    i + 1,
                    rd_kafka_err2str(rd_kafka_last_error()));
        } else {
            produced++;
        }

        rd_kafka_poll(producer, 0);
        throttle_tps(cfg->tps);
    }

    rd_kafka_flush(producer, 10 * 1000);

    struct timespec end_time;
    clock_gettime(CLOCK_MONOTONIC, &end_time);

    double elapsed_sec = (double)(end_time.tv_sec - start_time.tv_sec)
                         + (double)(end_time.tv_nsec - start_time.tv_nsec) / 1000000000.0;
    double eps = (elapsed_sec > 0.0) ? ((double)produced / elapsed_sec) : 0.0;

    printf("Simulation complete. Produced %d/%d events in %.2f sec (%.2f events/sec).\n",
           produced,
           cfg->total_events,
           elapsed_sec,
           eps);

    rd_kafka_topic_destroy(topic);
    rd_kafka_destroy(producer);

    return 0;
}

int main(int argc, char **argv) {
    AppConfig cfg = {
        .brokers = DEFAULT_BROKERS,
        .topic = DEFAULT_TOPIC,
        .total_events = 100,
        .tps = 20,
        .suspicious_ratio = 10,
    };

    if (!parse_args(argc, argv, &cfg)) {
        return 1;
    }

    srand((unsigned int)time(NULL));

    return run_simulation(&cfg);
}

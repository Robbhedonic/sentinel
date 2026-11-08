#include "fraud_engine/messaging/kafka_pipeline.hpp"

#include <cstring>

namespace sentinel {

namespace {

void set_conf_or_fail(rd_kafka_conf_t *conf,
                      const char *key,
                      const std::string &value,
                      std::string &error,
                      bool &ok) {
    if (!ok) {
        return;
    }

    char errbuf[512];
    if (rd_kafka_conf_set(conf, key, value.c_str(), errbuf, sizeof(errbuf))
        != RD_KAFKA_CONF_OK) {
        error = std::string("failed to set ") + key + ": " + errbuf;
        ok = false;
    }
}

} // namespace

KafkaPipeline::KafkaPipeline(KafkaConfig cfg)
    : cfg_(std::move(cfg)),
      consumer_(nullptr),
      producer_(nullptr),
      scored_topic_handle_(nullptr),
      alerts_topic_handle_(nullptr) {}

KafkaPipeline::~KafkaPipeline() {
    if (scored_topic_handle_ != nullptr) {
        rd_kafka_topic_destroy(scored_topic_handle_);
        scored_topic_handle_ = nullptr;
    }

    if (alerts_topic_handle_ != nullptr) {
        rd_kafka_topic_destroy(alerts_topic_handle_);
        alerts_topic_handle_ = nullptr;
    }

    if (consumer_ != nullptr) {
        rd_kafka_consumer_close(consumer_);
        rd_kafka_destroy(consumer_);
        consumer_ = nullptr;
    }

    if (producer_ != nullptr) {
        rd_kafka_destroy(producer_);
        producer_ = nullptr;
    }
}

bool KafkaPipeline::init(std::string &error) {
    bool ok = true;
    char errbuf[512];

    rd_kafka_conf_t *producer_conf = rd_kafka_conf_new();
    set_conf_or_fail(producer_conf, "bootstrap.servers", cfg_.brokers, error, ok);
    if (!ok) {
        rd_kafka_conf_destroy(producer_conf);
        return false;
    }

    producer_ = rd_kafka_new(RD_KAFKA_PRODUCER, producer_conf, errbuf, sizeof(errbuf));
    if (producer_ == nullptr) {
        error = std::string("producer init failed: ") + errbuf;
        return false;
    }

    scored_topic_handle_ = rd_kafka_topic_new(producer_, cfg_.scored_topic.c_str(), nullptr);
    alerts_topic_handle_ = rd_kafka_topic_new(producer_, cfg_.alerts_topic.c_str(), nullptr);
    if (scored_topic_handle_ == nullptr || alerts_topic_handle_ == nullptr) {
        error = "failed to create producer topic handles";
        return false;
    }

    rd_kafka_conf_t *consumer_conf = rd_kafka_conf_new();
    set_conf_or_fail(consumer_conf, "bootstrap.servers", cfg_.brokers, error, ok);
    set_conf_or_fail(consumer_conf, "group.id", cfg_.group_id, error, ok);
    set_conf_or_fail(consumer_conf, "enable.auto.commit", "true", error, ok);
    set_conf_or_fail(consumer_conf, "auto.offset.reset", "earliest", error, ok);
    if (!ok) {
        rd_kafka_conf_destroy(consumer_conf);
        return false;
    }

    consumer_ = rd_kafka_new(RD_KAFKA_CONSUMER, consumer_conf, errbuf, sizeof(errbuf));
    if (consumer_ == nullptr) {
        error = std::string("consumer init failed: ") + errbuf;
        return false;
    }

    rd_kafka_poll_set_consumer(consumer_);

    rd_kafka_topic_partition_list_t *topics = rd_kafka_topic_partition_list_new(1);
    rd_kafka_topic_partition_list_add(topics, cfg_.input_topic.c_str(), RD_KAFKA_PARTITION_UA);

    const auto subscription_result = rd_kafka_subscribe(consumer_, topics);
    rd_kafka_topic_partition_list_destroy(topics);

    if (subscription_result != RD_KAFKA_RESP_ERR_NO_ERROR) {
        error = std::string("subscribe failed: ") + rd_kafka_err2str(subscription_result);
        return false;
    }

    return true;
}

bool KafkaPipeline::poll_message(std::string &payload, int timeout_ms, std::string &error) {
    rd_kafka_message_t *message = rd_kafka_consumer_poll(consumer_, timeout_ms);
    if (message == nullptr) {
        return false;
    }

    if (message->err != RD_KAFKA_RESP_ERR_NO_ERROR) {
        if (message->err != RD_KAFKA_RESP_ERR__PARTITION_EOF
            && message->err != RD_KAFKA_RESP_ERR__TIMED_OUT) {
            error = rd_kafka_message_errstr(message);
        }
        rd_kafka_message_destroy(message);
        return false;
    }

    payload.assign(static_cast<const char *>(message->payload), message->len);
    rd_kafka_message_destroy(message);
    return true;
}

bool KafkaPipeline::publish_scored(const std::string &key, const std::string &payload, std::string &error) {
    if (rd_kafka_produce(scored_topic_handle_,
                         RD_KAFKA_PARTITION_UA,
                         RD_KAFKA_MSG_F_COPY,
                         const_cast<char *>(payload.data()),
                         payload.size(),
                         key.data(),
                         key.size(),
                         nullptr)
        != 0) {
        error = rd_kafka_err2str(rd_kafka_last_error());
        return false;
    }

    rd_kafka_poll(producer_, 0);
    return true;
}

bool KafkaPipeline::publish_alert(const std::string &key, const std::string &payload, std::string &error) {
    if (rd_kafka_produce(alerts_topic_handle_,
                         RD_KAFKA_PARTITION_UA,
                         RD_KAFKA_MSG_F_COPY,
                         const_cast<char *>(payload.data()),
                         payload.size(),
                         key.data(),
                         key.size(),
                         nullptr)
        != 0) {
        error = rd_kafka_err2str(rd_kafka_last_error());
        return false;
    }

    rd_kafka_poll(producer_, 0);
    return true;
}

void KafkaPipeline::flush(int timeout_ms) {
    if (producer_ != nullptr) {
        rd_kafka_flush(producer_, timeout_ms);
    }
}

} // namespace sentinel

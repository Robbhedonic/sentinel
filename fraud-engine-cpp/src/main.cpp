#include "fraud_engine/detection/transaction_codec.hpp"
#include "fraud_engine/messaging/kafka_pipeline.hpp"
#include "fraud_engine/rules/geographic_anomaly_rule.hpp"
#include "fraud_engine/rules/high_amount_rule.hpp"
#include "fraud_engine/rules/velocity_rule.hpp"
#include "fraud_engine/scoring/risk_scorer.hpp"

#include <atomic>
#include <chrono>
#include <csignal>
#include <cstdlib>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

namespace {

std::atomic<bool> running {true};

void handle_signal(int signal) {
    if (signal == SIGINT || signal == SIGTERM) {
        running.store(false);
    }
}

std::string env_or_default(const char *key, const char *fallback) {
    const char *value = std::getenv(key);
    if (value == nullptr || value[0] == '\0') {
        return fallback;
    }
    return value;
}

int env_or_default_int(const char *key, int fallback) {
    const char *value = std::getenv(key);
    if (value == nullptr || value[0] == '\0') {
        return fallback;
    }

    try {
        return std::stoi(value);
    } catch (...) {
        return fallback;
    }
}

} // namespace

int main() {
    std::signal(SIGINT, handle_signal);
    std::signal(SIGTERM, handle_signal);

    sentinel::KafkaConfig kafka_config {
        .brokers = env_or_default("SENTINEL_KAFKA_BROKERS", "localhost:29092"),
        .input_topic = env_or_default("SENTINEL_INPUT_TOPIC", "transactions.raw"),
        .scored_topic = env_or_default("SENTINEL_SCORED_TOPIC", "transactions.scored"),
        .alerts_topic = env_or_default("SENTINEL_ALERTS_TOPIC", "alerts.generated"),
        .group_id = env_or_default("SENTINEL_CONSUMER_GROUP", "sentinel-fraud-engine"),
    };

    const double high_amount_threshold = static_cast<double>(env_or_default_int("SENTINEL_HIGH_AMOUNT_THRESHOLD", 5000));
    const int high_amount_points = env_or_default_int("SENTINEL_HIGH_AMOUNT_POINTS", 30);
    const int velocity_window_seconds = env_or_default_int("SENTINEL_VELOCITY_WINDOW_SECONDS", 60);
    const int velocity_max = env_or_default_int("SENTINEL_VELOCITY_MAX_TX", 5);
    const int velocity_points = env_or_default_int("SENTINEL_VELOCITY_POINTS", 25);
    const int geographic_window_seconds = env_or_default_int("SENTINEL_GEO_WINDOW_SECONDS", 120);
    const int geographic_points = env_or_default_int("SENTINEL_GEO_POINTS", 20);
    const int high_risk_threshold = env_or_default_int("SENTINEL_HIGH_RISK_THRESHOLD", 70);

    std::vector<std::unique_ptr<sentinel::RiskRule>> rules;
    rules.push_back(std::make_unique<sentinel::HighAmountRule>(high_amount_threshold, high_amount_points));
    rules.push_back(std::make_unique<sentinel::VelocityRule>(velocity_max,
                                                              std::chrono::seconds(velocity_window_seconds),
                                                              velocity_points));
    rules.push_back(std::make_unique<sentinel::GeographicAnomalyRule>(
        std::chrono::seconds(geographic_window_seconds),
        geographic_points));

    sentinel::RiskScorer scorer(std::move(rules));
    sentinel::KafkaPipeline pipeline(kafka_config);

    std::string init_error;
    if (!pipeline.init(init_error)) {
        std::cerr << "[fraud-engine] startup error: " << init_error << std::endl;
        return 1;
    }

    std::cout << "[fraud-engine] running with brokers=" << kafka_config.brokers
              << " input_topic=" << kafka_config.input_topic
              << " scored_topic=" << kafka_config.scored_topic
              << " alerts_topic=" << kafka_config.alerts_topic
              << std::endl;

    int processed = 0;
    int alerts = 0;

    while (running.load()) {
        std::string payload;
        std::string poll_error;
        if (!pipeline.poll_message(payload, 500, poll_error)) {
            if (!poll_error.empty()) {
                std::cerr << "[fraud-engine] poll warning: " << poll_error << std::endl;
            }
            continue;
        }

        std::string parse_error;
        auto event = sentinel::parse_transaction_json(payload, parse_error);
        if (!event.has_value()) {
            std::cerr << "[fraud-engine] invalid transaction payload: " << parse_error << std::endl;
            continue;
        }

        const auto evaluation = scorer.evaluate(*event);
        const auto scored_json = sentinel::serialize_scored_event(evaluation);

        std::string produce_error;
        if (!pipeline.publish_scored(event->transaction_id, scored_json, produce_error)) {
            std::cerr << "[fraud-engine] failed to publish scored event: " << produce_error << std::endl;
            continue;
        }

        processed++;

        if (evaluation.risk_score >= high_risk_threshold) {
            const auto alert_json = sentinel::serialize_alert_event(evaluation);
            if (!pipeline.publish_alert(event->transaction_id, alert_json, produce_error)) {
                std::cerr << "[fraud-engine] failed to publish alert: " << produce_error << std::endl;
            } else {
                alerts++;
            }
        }

        if (processed % 25 == 0) {
            std::cout << "[fraud-engine] processed=" << processed
                      << " alerts=" << alerts
                      << std::endl;
        }
    }

    pipeline.flush(5000);
    std::cout << "[fraud-engine] stopped. processed=" << processed
              << " alerts=" << alerts
              << std::endl;

    return 0;
}

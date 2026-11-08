#pragma once

#include <librdkafka/rdkafka.h>

#include <string>

namespace sentinel {

struct KafkaConfig {
    std::string brokers;
    std::string input_topic;
    std::string scored_topic;
    std::string alerts_topic;
    std::string group_id;
};

class KafkaPipeline {
  public:
    explicit KafkaPipeline(KafkaConfig cfg);
    ~KafkaPipeline();

    bool init(std::string &error);
    bool poll_message(std::string &payload, int timeout_ms, std::string &error);
    bool publish_scored(const std::string &key, const std::string &payload, std::string &error);
    bool publish_alert(const std::string &key, const std::string &payload, std::string &error);
    void flush(int timeout_ms);

  private:
    KafkaConfig cfg_;
    rd_kafka_t *consumer_;
    rd_kafka_t *producer_;
    rd_kafka_topic_t *scored_topic_handle_;
    rd_kafka_topic_t *alerts_topic_handle_;
};

} // namespace sentinel

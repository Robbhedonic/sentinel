#pragma once

#include <hiredis/hiredis.h>

#include <chrono>
#include <string>

namespace sentinel {

class RedisState {
  public:
    RedisState(const std::string &host, int port);
    ~RedisState();

    RedisState(const RedisState &) = delete;
    RedisState &operator=(const RedisState &) = delete;

    bool available() const;
    bool addTimestamp(const std::string &key, long long timestamp, std::chrono::seconds ttl);
    bool countTimestamps(const std::string &key, long long from_timestamp, long long &count);
    bool setValue(const std::string &key, const std::string &value, std::chrono::seconds ttl);
    bool getValue(const std::string &key, std::string &value);

  private:
    redisContext *context_;
};

} // namespace sentinel

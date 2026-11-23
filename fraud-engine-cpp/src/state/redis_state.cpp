#include "fraud_engine/state/redis_state.hpp"

#include <cstdlib>

namespace sentinel {

RedisState::RedisState(const std::string &host, int port) {
    context_ = redisConnect(host.c_str(), port);
}

RedisState::~RedisState() {
    if (context_) {
        redisFree(context_);
    }
}

bool RedisState::available() const {
    return context_ != nullptr && context_->err == 0;
}

bool RedisState::addTimestamp(const std::string &key, long long timestamp, std::chrono::seconds ttl) {
    if (!available()) {
        return false;
    }

    std::string member = std::to_string(timestamp);
    redisReply *reply = reinterpret_cast<redisReply *>(redisCommand(
        context_, "ZADD %s %lld %s",
        key.c_str(), timestamp, member.c_str()
    ));
    if (!reply) {
        return false;
    }
    freeReplyObject(reply);

    reply = reinterpret_cast<redisReply *>(redisCommand(
        context_, "PEXPIRE %s %lld",
        key.c_str(), ttl.count() * 1000
    ));
    if (!reply) {
        return false;
    }
    freeReplyObject(reply);
    return true;
}

bool RedisState::setValue(const std::string &key, const std::string &value, std::chrono::seconds ttl) {
    if (!available()) {
        return false;
    }

    redisReply *reply = reinterpret_cast<redisReply *>(redisCommand(
        context_, "SET %s %s EX %lld",
        key.c_str(), value.c_str(), ttl.count()
    ));
    if (!reply) {
        return false;
    }
    freeReplyObject(reply);
    return true;
}

bool RedisState::getValue(const std::string &key, std::string &value) {
    if (!available()) {
        return false;
    }

    redisReply *reply = reinterpret_cast<redisReply *>(redisCommand(context_, "GET %s", key.c_str()));
    if (!reply || reply->type != REDIS_REPLY_STRING) {
        if (reply) {
            freeReplyObject(reply);
        }
        return false;
    }

    value.assign(reply->str, reply->len);
    freeReplyObject(reply);
    return true;
}

bool RedisState::countTimestamps(const std::string &key, long long from_timestamp, long long &count) {
    if (!available()) {
        return false;
    }

    redisReply *reply = reinterpret_cast<redisReply *>(redisCommand(
        context_, "ZREMRANGEBYSCORE %s -inf %lld",
        key.c_str(), from_timestamp
    ));
    if (!reply) {
        return false;
    }
    freeReplyObject(reply);

    reply = reinterpret_cast<redisReply *>(redisCommand(context_, "ZCARD %s", key.c_str()));
    if (!reply || reply->type != REDIS_REPLY_INTEGER) {
        if (reply) {
            freeReplyObject(reply);
        }
        return false;
    }

    count = reply->integer;
    freeReplyObject(reply);
    return true;
}

} // namespace sentinel

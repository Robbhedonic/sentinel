#pragma once

#include "fraud_engine/rules/risk_rule.hpp"
#include "fraud_engine/state/redis_state.hpp"

#include <chrono>
#include <deque>
#include <string>
#include <unordered_map>

namespace sentinel {

class VelocityRule final : public RiskRule {
  public:
    VelocityRule(int max_transactions_in_window,
                 std::chrono::seconds window,
                 int points,
                 RedisState *redis_state = nullptr);
    std::optional<RuleFinding> evaluate(const TransactionEvent &event) override;

  private:
    int max_transactions_in_window_;
    std::chrono::seconds window_;
    int points_;
    RedisState *redis_state_;
    std::unordered_map<std::string, std::deque<std::chrono::steady_clock::time_point>> windows_;
};

} // namespace sentinel

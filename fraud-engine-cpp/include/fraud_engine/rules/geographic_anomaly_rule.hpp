#pragma once

#include "fraud_engine/rules/risk_rule.hpp"

#include <chrono>
#include <string>
#include <unordered_map>

namespace sentinel {

class GeographicAnomalyRule final : public RiskRule {
  public:
    GeographicAnomalyRule(std::chrono::seconds window, int points);
    std::optional<RuleFinding> evaluate(const TransactionEvent &event) override;

  private:
    struct LastSeen {
        std::string country;
        std::chrono::steady_clock::time_point seen_at;
    };

    std::chrono::seconds window_;
    int points_;
    std::unordered_map<std::string, LastSeen> last_seen_by_account_;
};

} // namespace sentinel

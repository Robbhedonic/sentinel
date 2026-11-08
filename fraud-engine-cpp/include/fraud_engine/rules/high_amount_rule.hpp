#pragma once

#include "fraud_engine/rules/risk_rule.hpp"

namespace sentinel {

class HighAmountRule final : public RiskRule {
  public:
    HighAmountRule(double threshold, int points);
    std::optional<RuleFinding> evaluate(const TransactionEvent &event) override;

  private:
    double threshold_;
    int points_;
};

} // namespace sentinel

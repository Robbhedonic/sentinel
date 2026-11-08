#pragma once

#include "fraud_engine/detection/types.hpp"
#include "fraud_engine/rules/risk_rule.hpp"

#include <memory>
#include <vector>

namespace sentinel {

class RiskScorer {
  public:
    explicit RiskScorer(std::vector<std::unique_ptr<RiskRule>> rules);
    RiskEvaluation evaluate(const TransactionEvent &event) const;

  private:
    std::vector<std::unique_ptr<RiskRule>> rules_;
};

} // namespace sentinel

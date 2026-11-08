#pragma once

#include "fraud_engine/detection/types.hpp"

#include <optional>

namespace sentinel {

class RiskRule {
  public:
    virtual ~RiskRule() = default;
    virtual std::optional<RuleFinding> evaluate(const TransactionEvent &event) = 0;
};

} // namespace sentinel

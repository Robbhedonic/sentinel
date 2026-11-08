#include "fraud_engine/rules/high_amount_rule.hpp"

#include <sstream>

namespace sentinel {

HighAmountRule::HighAmountRule(double threshold, int points)
    : threshold_(threshold), points_(points) {}

std::optional<RuleFinding> HighAmountRule::evaluate(const TransactionEvent &event) {
    if (event.amount < threshold_) {
        return std::nullopt;
    }

    std::ostringstream reason;
    reason << "amount " << event.amount << " >= threshold " << threshold_;

    return RuleFinding {
        .rule = "high_amount",
        .points = points_,
        .reason = reason.str(),
    };
}

} // namespace sentinel

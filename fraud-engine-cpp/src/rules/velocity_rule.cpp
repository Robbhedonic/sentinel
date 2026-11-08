#include "fraud_engine/rules/velocity_rule.hpp"

#include <sstream>

namespace sentinel {

VelocityRule::VelocityRule(int max_transactions_in_window,
                           std::chrono::seconds window,
                           int points)
    : max_transactions_in_window_(max_transactions_in_window),
      window_(window),
      points_(points) {}

std::optional<RuleFinding> VelocityRule::evaluate(const TransactionEvent &event) {
    const auto now = std::chrono::steady_clock::now();
    auto &window = windows_[event.account_id];
    window.push_back(now);

    while (!window.empty() && (now - window.front()) > window_) {
        window.pop_front();
    }

    if (static_cast<int>(window.size()) <= max_transactions_in_window_) {
        return std::nullopt;
    }

    std::ostringstream reason;
    reason << window.size() << " tx in " << window_.count()
           << "s window for account " << event.account_id;

    return RuleFinding {
        .rule = "velocity_check",
        .points = points_,
        .reason = reason.str(),
    };
}

} // namespace sentinel

#include "fraud_engine/rules/velocity_rule.hpp"

#include <sstream>

namespace sentinel {

VelocityRule::VelocityRule(int max_transactions_in_window,
                           std::chrono::seconds window,
                           int points,
                           RedisState *redis_state)
    : max_transactions_in_window_(max_transactions_in_window),
      window_(window),
      points_(points),
      redis_state_(redis_state) {}

std::optional<RuleFinding> VelocityRule::evaluate(const TransactionEvent &event) {
    const auto now = std::chrono::steady_clock::now();
    std::size_t window_count = 0;

    if (redis_state_ && redis_state_->available()) {
        const long long epoch_ms = std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()
        ).count();
        const long long from_ms = epoch_ms - (window_.count() * 1000);
        redis_state_->addTimestamp("velocity:" + event.account_id, epoch_ms, window_);

        long long redis_count = 0;
        if (redis_state_->countTimestamps("velocity:" + event.account_id, from_ms, redis_count)) {
            window_count = static_cast<std::size_t>(redis_count);
        }
    }

    if (window_count == 0) {
        auto &window = windows_[event.account_id];
        window.push_back(now);
        while (!window.empty() && (now - window.front()) > window_) {
            window.pop_front();
        }
        window_count = window.size();
    }

    if (static_cast<int>(window_count) <= max_transactions_in_window_) {
        return std::nullopt;
    }

    std::ostringstream reason;
    reason << window_count << " tx in " << window_.count()
           << "s window for account " << event.account_id;

    return RuleFinding {
        .rule = "velocity_check",
        .points = points_,
        .reason = reason.str(),
    };
}

} // namespace sentinel

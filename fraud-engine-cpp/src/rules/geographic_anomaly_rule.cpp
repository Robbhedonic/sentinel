#include "fraud_engine/rules/geographic_anomaly_rule.hpp"

#include <sstream>

namespace sentinel {

GeographicAnomalyRule::GeographicAnomalyRule(std::chrono::seconds window, int points)
    : window_(window), points_(points) {}

std::optional<RuleFinding> GeographicAnomalyRule::evaluate(const TransactionEvent &event) {
    const auto now = std::chrono::steady_clock::now();

    auto existing = last_seen_by_account_.find(event.account_id);
    if (existing == last_seen_by_account_.end()) {
        last_seen_by_account_[event.account_id] = LastSeen {
            .country = event.country,
            .seen_at = now,
        };
        return std::nullopt;
    }

    const std::string previous_country = existing->second.country;
    const auto elapsed = now - existing->second.seen_at;
    const bool country_changed = previous_country != event.country;
    const bool inside_window = elapsed <= window_;

    existing->second.country = event.country;
    existing->second.seen_at = now;

    if (!country_changed || !inside_window) {
        return std::nullopt;
    }

    std::ostringstream reason;
    reason << "country changed from " << previous_country
           << " to " << event.country
           << " within " << window_.count() << "s";

    return RuleFinding {
        .rule = "geographic_anomaly",
        .points = points_,
        .reason = reason.str(),
    };
}

} // namespace sentinel

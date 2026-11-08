#include "fraud_engine/scoring/risk_scorer.hpp"

#include "fraud_engine/detection/transaction_codec.hpp"

#include <algorithm>

namespace sentinel {

RiskScorer::RiskScorer(std::vector<std::unique_ptr<RiskRule>> rules)
    : rules_(std::move(rules)) {}

RiskEvaluation RiskScorer::evaluate(const TransactionEvent &event) const {
    std::vector<RuleFinding> findings;
    int score = 0;

    for (const auto &rule : rules_) {
        auto finding = rule->evaluate(event);
        if (!finding.has_value()) {
            continue;
        }

        score += finding->points;
        findings.push_back(*finding);
    }

    score = std::min(score, 100);

    std::string level = "LOW";
    if (score >= 70) {
        level = "HIGH";
    } else if (score >= 40) {
        level = "MEDIUM";
    }

    return RiskEvaluation {
        .event_version = 1,
        .transaction = event,
        .risk_score = score,
        .risk_level = level,
        .findings = std::move(findings),
        .processed_at = utc_timestamp_now(),
    };
}

} // namespace sentinel

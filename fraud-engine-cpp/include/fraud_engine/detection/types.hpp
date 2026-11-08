#pragma once

#include <string>
#include <vector>

namespace sentinel {

struct TransactionEvent {
    std::string transaction_id;
    std::string account_id;
    std::string recipient_id;
    double amount;
    std::string currency;
    std::string transaction_type;
    std::string country;
    std::string timestamp;
    std::string simulated_pattern;
};

struct RuleFinding {
    std::string rule;
    int points;
    std::string reason;
};

struct RiskEvaluation {
    TransactionEvent transaction;
    int risk_score;
    std::string risk_level;
    std::vector<RuleFinding> findings;
    std::string processed_at;
};

} // namespace sentinel

#include "fraud_engine/detection/transaction_codec.hpp"

#include <nlohmann/json.hpp>

#include <ctime>
#include <iomanip>
#include <sstream>

namespace sentinel {

std::string utc_timestamp_now() {
    std::time_t now = std::time(nullptr);
    std::tm utc_tm {};
#if defined(_WIN32)
    gmtime_s(&utc_tm, &now);
#else
    gmtime_r(&now, &utc_tm);
#endif

    std::ostringstream oss;
    oss << std::put_time(&utc_tm, "%Y-%m-%dT%H:%M:%SZ");
    return oss.str();
}

std::optional<TransactionEvent> parse_transaction_json(const std::string &payload, std::string &error) {
    try {
        const auto json = nlohmann::json::parse(payload);

        TransactionEvent event {
            .transaction_id = json.value("transaction_id", ""),
            .account_id = json.value("account_id", ""),
            .recipient_id = json.value("recipient_id", ""),
            .amount = json.value("amount", 0.0),
            .currency = json.value("currency", ""),
            .transaction_type = json.value("transaction_type", ""),
            .country = json.value("country", ""),
            .timestamp = json.value("timestamp", ""),
            .simulated_pattern = json.value("simulated_pattern", "UNKNOWN")
        };

        if (event.transaction_id.empty() || event.account_id.empty()) {
            error = "missing required fields transaction_id/account_id";
            return std::nullopt;
        }

        return event;
    } catch (const std::exception &ex) {
        error = ex.what();
        return std::nullopt;
    }
}

std::string serialize_scored_event(const RiskEvaluation &evaluation) {
    nlohmann::json findings = nlohmann::json::array();
    for (const auto &finding : evaluation.findings) {
        findings.push_back({
            {"rule", finding.rule},
            {"points", finding.points},
            {"reason", finding.reason},
        });
    }

    nlohmann::json payload {
        {"transaction_id", evaluation.transaction.transaction_id},
        {"account_id", evaluation.transaction.account_id},
        {"recipient_id", evaluation.transaction.recipient_id},
        {"amount", evaluation.transaction.amount},
        {"currency", evaluation.transaction.currency},
        {"transaction_type", evaluation.transaction.transaction_type},
        {"country", evaluation.transaction.country},
        {"timestamp", evaluation.transaction.timestamp},
        {"simulated_pattern", evaluation.transaction.simulated_pattern},
        {"risk_score", evaluation.risk_score},
        {"risk_level", evaluation.risk_level},
        {"findings", findings},
        {"processed_at", evaluation.processed_at},
    };

    return payload.dump();
}

std::string serialize_alert_event(const RiskEvaluation &evaluation) {
    nlohmann::json findings = nlohmann::json::array();
    for (const auto &finding : evaluation.findings) {
        findings.push_back({
            {"rule", finding.rule},
            {"points", finding.points},
            {"reason", finding.reason},
        });
    }

    nlohmann::json payload {
        {"alert_id", "AL-" + evaluation.transaction.transaction_id},
        {"transaction_id", evaluation.transaction.transaction_id},
        {"account_id", evaluation.transaction.account_id},
        {"risk_score", evaluation.risk_score},
        {"risk_level", evaluation.risk_level},
        {"status", "OPEN"},
        {"findings", findings},
        {"created_at", evaluation.processed_at},
    };

    return payload.dump();
}

} // namespace sentinel

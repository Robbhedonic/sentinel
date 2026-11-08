#include "fraud_engine/detection/transaction_codec.hpp"

#include <nlohmann/json.hpp>

#include <cmath>
#include <cctype>
#include <ctime>
#include <iomanip>
#include <sstream>

namespace sentinel {

namespace {

bool is_upper_ascii_word(const std::string &value, std::size_t expected_size) {
    if (value.size() != expected_size) {
        return false;
    }

    for (const auto ch : value) {
        if (!std::isupper(static_cast<unsigned char>(ch))) {
            return false;
        }
    }

    return true;
}

bool is_rfc3339_utc_basic(const std::string &value) {
    if (value.size() != 20) {
        return false;
    }

    return std::isdigit(value[0])
           && std::isdigit(value[1])
           && std::isdigit(value[2])
           && std::isdigit(value[3])
           && value[4] == '-'
           && std::isdigit(value[5])
           && std::isdigit(value[6])
           && value[7] == '-'
           && std::isdigit(value[8])
           && std::isdigit(value[9])
           && value[10] == 'T'
           && std::isdigit(value[11])
           && std::isdigit(value[12])
           && value[13] == ':'
           && std::isdigit(value[14])
           && std::isdigit(value[15])
           && value[16] == ':'
           && std::isdigit(value[17])
           && std::isdigit(value[18])
           && value[19] == 'Z';
}

bool validate_transaction_event(const TransactionEvent &event, std::string &error) {
    if (event.event_version <= 0) {
        error = "event_version must be >= 1";
        return false;
    }

    if (event.transaction_id.empty()
        || event.account_id.empty()
        || event.recipient_id.empty()
        || event.currency.empty()
        || event.transaction_type.empty()
        || event.country.empty()
        || event.timestamp.empty()) {
        error = "missing required transaction fields";
        return false;
    }

    if (!std::isfinite(event.amount) || event.amount <= 0.0) {
        error = "amount must be a positive finite number";
        return false;
    }

    if (!is_upper_ascii_word(event.currency, 3)) {
        error = "currency must be a 3-letter uppercase code";
        return false;
    }

    if (!is_upper_ascii_word(event.country, 2)) {
        error = "country must be a 2-letter uppercase code";
        return false;
    }

    if (!is_rfc3339_utc_basic(event.timestamp)) {
        error = "timestamp must follow basic RFC3339 UTC format YYYY-MM-DDTHH:MM:SSZ";
        return false;
    }

    return true;
}

} // namespace

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
            .event_version = json.value("event_version", 1),
            .event_type = json.value("event_type", "transaction_created"),
            .source = json.value("source", "unknown"),
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

        if (!validate_transaction_event(event, error)) {
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
        {"event_version", evaluation.event_version},
        {"event_type", "transaction_scored"},
        {"source", "fraud-engine-cpp"},
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
        {"event_version", evaluation.event_version},
        {"event_type", "fraud_alert_generated"},
        {"source", "fraud-engine-cpp"},
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

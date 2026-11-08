#pragma once

#include "fraud_engine/detection/types.hpp"

#include <optional>
#include <string>

namespace sentinel {

std::optional<TransactionEvent> parse_transaction_json(const std::string &payload, std::string &error);
std::string serialize_scored_event(const RiskEvaluation &evaluation);
std::string serialize_alert_event(const RiskEvaluation &evaluation);
std::string utc_timestamp_now();

} // namespace sentinel

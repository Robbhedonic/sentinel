#include "fraud_engine/rules/high_amount_rule.hpp"

#include <cstdlib>
#include <iostream>

namespace {

sentinel::TransactionEvent make_event(double amount) {
    return sentinel::TransactionEvent {
        .transaction_id = "TX-1",
        .account_id = "ACC-1",
        .recipient_id = "REC-1",
        .amount = amount,
        .currency = "EUR",
        .transaction_type = "TRANSFER",
        .country = "SE",
        .timestamp = "2026-01-01T00:00:00Z",
        .simulated_pattern = "NORMAL",
    };
}

} // namespace

int main() {
    sentinel::HighAmountRule rule(5000.0, 30);

    const auto low_amount = rule.evaluate(make_event(4999.0));
    if (low_amount.has_value()) {
        std::cerr << "Expected no finding for low amount event" << std::endl;
        return EXIT_FAILURE;
    }

    const auto high_amount = rule.evaluate(make_event(5000.0));
    if (!high_amount.has_value()) {
        std::cerr << "Expected finding for threshold amount event" << std::endl;
        return EXIT_FAILURE;
    }

    if (high_amount->rule != "high_amount" || high_amount->points != 30) {
        std::cerr << "Unexpected finding payload for high amount rule" << std::endl;
        return EXIT_FAILURE;
    }

    std::cout << "HighAmountRule tests passed" << std::endl;
    return EXIT_SUCCESS;
}

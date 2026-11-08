#include "fraud_engine/rules/velocity_rule.hpp"

#include <chrono>
#include <cstdlib>
#include <iostream>

namespace {

sentinel::TransactionEvent make_event(const std::string &account_id) {
    return sentinel::TransactionEvent {
        .transaction_id = "TX-1",
        .account_id = account_id,
        .recipient_id = "REC-1",
        .amount = 120.0,
        .currency = "EUR",
        .transaction_type = "TRANSFER",
        .country = "SE",
        .timestamp = "2026-01-01T00:00:00Z",
        .simulated_pattern = "NORMAL",
    };
}

} // namespace

int main() {
    sentinel::VelocityRule rule(2, std::chrono::seconds(60), 25);

    const auto first = rule.evaluate(make_event("ACC-1"));
    if (first.has_value()) {
        std::cerr << "Expected no finding on first event" << std::endl;
        return EXIT_FAILURE;
    }

    const auto second = rule.evaluate(make_event("ACC-1"));
    if (second.has_value()) {
        std::cerr << "Expected no finding on second event" << std::endl;
        return EXIT_FAILURE;
    }

    const auto third = rule.evaluate(make_event("ACC-1"));
    if (!third.has_value()) {
        std::cerr << "Expected finding on third event" << std::endl;
        return EXIT_FAILURE;
    }

    if (third->rule != "velocity_check" || third->points != 25) {
        std::cerr << "Unexpected finding payload for velocity rule" << std::endl;
        return EXIT_FAILURE;
    }

    const auto other_account = rule.evaluate(make_event("ACC-2"));
    if (other_account.has_value()) {
        std::cerr << "Expected independent window per account" << std::endl;
        return EXIT_FAILURE;
    }

    std::cout << "VelocityRule tests passed" << std::endl;
    return EXIT_SUCCESS;
}

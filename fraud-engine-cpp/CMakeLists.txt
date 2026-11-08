cmake_minimum_required(VERSION 3.16)
project(sentinel_fraud_engine_cpp CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(nlohmann_json REQUIRED)

add_executable(
	fraud_engine
	src/main.cpp
	src/detection/transaction_codec.cpp
	src/messaging/kafka_pipeline.cpp
	src/rules/geographic_anomaly_rule.cpp
	src/rules/high_amount_rule.cpp
	src/rules/velocity_rule.cpp
	src/scoring/risk_scorer.cpp
)

target_include_directories(fraud_engine PRIVATE include)
target_compile_options(fraud_engine PRIVATE -Wall -Wextra -Wpedantic)
target_link_libraries(fraud_engine PRIVATE rdkafka nlohmann_json::nlohmann_json)

enable_testing()

add_executable(
	high_amount_rule_test
	tests/high_amount_rule_test.cpp
	src/rules/high_amount_rule.cpp
)
target_include_directories(high_amount_rule_test PRIVATE include)
target_compile_options(high_amount_rule_test PRIVATE -Wall -Wextra -Wpedantic)

add_executable(
	velocity_rule_test
	tests/velocity_rule_test.cpp
	src/rules/velocity_rule.cpp
)
target_include_directories(velocity_rule_test PRIVATE include)
target_compile_options(velocity_rule_test PRIVATE -Wall -Wextra -Wpedantic)

add_test(NAME HighAmountRuleTest COMMAND high_amount_rule_test)
add_test(NAME VelocityRuleTest COMMAND velocity_rule_test)

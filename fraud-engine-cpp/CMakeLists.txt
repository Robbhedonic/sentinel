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
	src/rules/high_amount_rule.cpp
	src/rules/velocity_rule.cpp
	src/scoring/risk_scorer.cpp
)

target_include_directories(fraud_engine PRIVATE include)
target_compile_options(fraud_engine PRIVATE -Wall -Wextra -Wpedantic)
target_link_libraries(fraud_engine PRIVATE rdkafka nlohmann_json::nlohmann_json)

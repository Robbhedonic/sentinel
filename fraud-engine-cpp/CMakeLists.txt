cmake_minimum_required(VERSION 3.16)
project(sentinel_fraud_engine_cpp CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(fraud_engine src/main.cpp)
target_include_directories(fraud_engine PRIVATE include)

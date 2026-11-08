cmake_minimum_required(VERSION 3.16)
project(sentinel_simulator_c C)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

add_executable(simulator src/main.c)
target_include_directories(simulator PRIVATE include)
target_compile_options(simulator PRIVATE -Wall -Wextra -Wpedantic)
target_link_libraries(simulator PRIVATE rdkafka)

FROM alpine:3.20
RUN apk add --no-cache build-base cmake librdkafka-dev librdkafka nlohmann-json
WORKDIR /app
COPY . .
RUN cmake -S . -B build && cmake --build build
CMD ["./build/fraud_engine"]

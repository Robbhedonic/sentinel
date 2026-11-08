# simulator-c

C-based transaction simulator for Sentinel.

## Features

- Generates fictional transaction events
- Supports normal and suspicious behavior mix
- Publishes JSON events to Kafka topic `transactions.raw`
- Configurable volume and throughput

## Local Build (macOS)

Install dependency:

```zsh
brew install librdkafka
```

Build:

```zsh
cd simulator-c
cmake -S . -B build
cmake --build build
```

Run:

```zsh
./build/simulator --brokers localhost:29092 --topic transactions.raw --events 200 --tps 50 --suspicious-ratio 15
```

## Kafka Verification

Consume events from the topic in another terminal:

```zsh
kcat -b localhost:29092 -t transactions.raw -C -o beginning -e
```

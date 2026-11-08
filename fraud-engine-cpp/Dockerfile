FROM alpine:3.20
RUN apk add --no-cache build-base cmake
WORKDIR /app
COPY . .
RUN cmake -S . -B build && cmake --build build
CMD ["./build/fraud_engine"]

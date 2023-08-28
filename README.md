# fly-io-challenge

a toy distributed systems

## License

MIT

## Prerequisites

```bash
brew install openjdk graphviz gnuplot
```

## Installation

Download the latest tarball from [Github](https://github.com/jepsen-io/maelstrom/releases/tag/v0.2.3), and untar it anywhere. In that directory, run ./maelstrom <args> to launch Maelstrom.

## Challenges

### 1. Echo

https://fly.io/dist-sys/1/

```bash
./maelstrom/maelstrom test -w echo --bin ./src/echo.js --time-limit 5 --log-stderr
```

### 2. Unique ID Generation

https://fly.io/dist-sys/2/

```bash
./maelstrom/maelstrom test -w unique-ids --bin ./src/unique-ids.js --time-limit 30 --rate 1000 --node-count 3 --availability total --nemesis partition --log-stderr
```

### 3. Broadcast

https://fly.io/dist-sys/3a/

Single-Node Broadcast
```bash
./maelstrom/maelstrom test -w broadcast --bin ./src/broadcast.js --node-count 1 --time-limit 20 --rate 100 --log-stderr 
```

Multi-Node Broadcast

```bash
./maelstrom/maelstrom test -w broadcast --bin ./src/broadcast.js --node-count 5 --time-limit 20 --rate 100 --log-stderr
```

Fault Tolerant Broadcast

```bash
./maelstrom/maelstrom test -w broadcast --bin ./src/broadcast.js --node-count 5 --time-limit 20 --rate 100 --nemesis partition --log-stderr
```

Efficient Broadcast

```bash
./maelstrom/maelstrom test -w broadcast --bin ./src/broadcast.js --node-count 25 --time-limit 20 --rate 100 --latency 100 --log-stderr
```

### 4. Grow-Only Counter

status: WIP

https://fly.io/dist-sys/4/

Single-Node Counter

```bash
./maelstrom/maelstrom test -w g-counter --bin ./src/g-counter.js --node-count 1 --rate 100 --time-limit 20 --nemesis partition --log-stderr
```

Multi-Node Counter

```bash
./maelstrom/maelstrom test -w g-counter --bin ./src/g-counter.js --node-count 3 --rate 100 --time-limit 20 --nemesis partition --log-stderr
```

### 5. Kafka-Style Log

status: WIP

https://fly.io/dist-sys/5a/

Single-Node

```bash
./maelstrom/maelstrom test -w kafka --bin ./src/kafka.js --node-count 1 --concurrency 2n --time-limit 20 --rate 1000 --log-stderr
```

Multi-Node

```bash
./maelstrom/maelstrom test -w kafka --bin ./src/kafka.js --node-count 2 --concurrency 2n --time-limit 20 --rate 1000 --log-stderr
```

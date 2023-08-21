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
./maelstrom/maelstrom test -w echo --bin ./src/echo.js --time-limit 5
```

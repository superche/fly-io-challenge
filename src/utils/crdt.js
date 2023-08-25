class GCounter {
  // Takes a map of node names to the count on that node.
  constructor(counts) {
    this.counts = counts
  }

  // Returns the effective value of the counter.
  value() {
    var total = 0
    for (const node in this.counts) {
      total += this.counts[node]
    }
    return total
  }

  // Merges another GCounter into this one
  merge(other) {
    const counts = {
      ...this.counts,
    }
    for (const node in other.counts) {
      if (counts[node] == undefined) {
        counts[node] = other.counts[node]
      } else {
        counts[node] = Math.max(this.counts[node], other.counts[node])
      }
    }
    return new GCounter(counts)
  }

  // Convert to a JSON-serializable object
  toJSON() {
    return this.counts
  }

  // Inflates a JSON-serialized object back into a fresh GCounter
  fromJSON(json) {
    return new GCounter(json)
  }

  // Increment by delta
  increment(node, delta) {
    var count = this.counts[node]
    if (count == undefined) {
      count = 0
    }
    var counts = {
      ...this.counts,
    }
    counts[node] = count + delta
    return new GCounter(counts)
  }
}

class PNCounter {
  // Takes an increment GCounter and a decrement GCounter
  constructor(plus, minus) {
    this.plus = plus
    this.minus = minus
  }

  // The effective value is all increments minus decrements
  value() {
    return this.plus.value() - this.minus.value()
  }

  // Merges another PNCounter into this one
  merge(other) {
    return new PNCounter(
      this.plus.merge(other.plus),
      this.minus.merge(other.minus),
    )
  }

  // Converts to a JSON-serializable object
  toJSON() {
    return {
      plus: this.plus,
      minus: this.minus,
    }
  }

  // Inflates a JSON-serialized object back into a fresh PNCounter
  fromJSON(json) {
    return new PNCounter(
      this.plus.fromJSON(json.plus),
      this.minus.fromJSON(json.minus),
    )
  }

  // Increment by delta
  increment(node, delta) {
    if (0 < delta) {
      return new PNCounter(this.plus.increment(node, delta), this.minus)
    } else {
      return new PNCounter(this.plus, this.minus.increment(node, delta * -1))
    }
  }
}

exports.GCounter = GCounter
exports.PNCounter = PNCounter

// All the existing JavaScript PCG32 implementations that I could find were
// either:
// 1. Broken
// 2. Had a bunch of unnecessary dependencies
// 3. Or excessively complicated
//
// So I made my own. The implementation is based on the C implementation from
//    https://www.pcg-random.org/ and uses BigInts to avoid any issues with
//    64-bit unsigned integers. It also uses JSDoc comments that fully specify
//    the TypeScript types

export const MAX_UINT64 = 2n ** 64n;

export function randomUInt64() {
  return (
    (BigInt(Math.floor(Math.random() * 0xffffffff)) << 32n) |
    BigInt(Math.floor(Math.random() * 0xffffffff))
  );
}

/**
 * An implementation of the PCG32 PRNG algorithm from:
 * https://www.pcg-random.org/
 */
export class PCG32 {
  /**
   * For this generator, there are 2^63 possible sequences of pseudorandom
   * numbers. Each sequence is entirely distinct and has a period of 2^64. The
   * `seq` argument selects which stream you will use. The `seed argument
   * specifies where you are in that 2^64 period.
   *
   * Passing in no arguments will use a random seed and sequence from
   * `Math.random()`.
   *
   * @param {bigint} seed Is the starting state for the RNG, you can pass any
   *   positive 64-bit value.
   * @param {bigint} seq Selects the output sequence for the RNG, you can pass
   *   any positive 64-bit value, although only the low 63 bits are
   *   significant.
   */
  constructor(seed = randomUInt64(), seq = randomUInt64()) {
    if (seed < 0n || seed >= MAX_UINT64) {
      throw new Error("Seed must be a positive 64-bit integer");
    }
    if (seq < 0n || seq >= MAX_UINT64) {
      throw new Error("Sequence must be a positive 64-bit integer");
    }
    this.state = 0n;
    this.inc = (seq << 1n) | 1n;
    this.next();
    this.state = (this.state + seed) % MAX_UINT64;
    this.next();
  }

  /** Returns a uniformly distributed random integer between 0 and 2^32 - 1 */
  next() {
    const oldState = this.state;
    this.state = (oldState * 6364136223846793005n + this.inc) % MAX_UINT64;
    const xorShifted = ((oldState >> 18n) ^ oldState) >> 27n;
    const rot = oldState >> 59n;
    return Number((xorShifted >> rot) | (xorShifted << (-rot & 31n)));
  }

  /**
   * Advance the internal state of the RNG by `delta` steps
   *
   * @param {bigint} delta The number of steps to advance the RNG. You can use
   *   negative values to go backwards
   */
  advance(delta) {
    if (delta < 0) {
      // To go backwords, we go the "long way around" by going forwards until we
      // wrap around. We modulo into the uint64 range (to handle numbers more
      // negative than -MAX_UINT64), then add to MAX_UINT64 (but delta is
      // negative so this "subtracts")
      delta = MAX_UINT64 + (delta % MAX_UINT64);
    }
    // Based on: https://github.com/imneme/pcg-c/blob/83252d9c23df9c82ecb42210afed61a7b42402d7/src/pcg-advance-64.c#L44-L59
    let accMult = 1n;
    let accPlus = 0n;
    let curMult = 6364136223846793005n;
    let curPlus = this.inc;
    while (delta > 0) {
      if (delta & 1n) {
        accMult = (accMult * curMult) % MAX_UINT64;
        accPlus = (accPlus * curMult + curPlus) % MAX_UINT64;
      }
      curPlus = ((curMult + 1n) * curPlus) % MAX_UINT64;
      curMult = (curMult * curMult) % MAX_UINT64;
      delta >>= 1n;
    }
    this.state = (accMult * this.state + accPlus) % MAX_UINT64;
  }

  /**
   * Returns a uniformly distributed random integer in the range [0, bound).
   *
   * @param {number} bound Generated value will be less than this number (must
   * be positive, and not greater than 2^32)
   */
  randomBound(bound) {
    if (bound <= 0) {
      throw new Error("Bound must be positive");
    }
    if (bound > 2 ** 32) {
      throw new Error("Bound must not be greater than 2^32");
    }
    // To avoid bias, we need to make the range of the RNG a multiple of
    // bound, which we do by dropping output less than a threshold.

    // from: https://github.com/imneme/pcg-c-basic/blob/bc39cd76ac3d541e618606bcc6e1e5ba5e5e6aa3/pcg_basic.c#L97-L103
    // Uniformity guarantees that this loop will terminate.  In practice, it
    // should usually terminate quickly; on average (assuming all bounds are
    // equally likely), 82.25% of the time, we can expect it to require just
    // one iteration.  In the worst case, someone passes a bound of 2^31 + 1
    // (i.e., 2147483649), which invalidates almost 50% of the range.  In
    // practice, bounds are typically small and only a tiny amount of the range
    // is eliminated.
    const threshold = -bound % bound;
    for (;;) {
      const r = this.next();
      if (r >= threshold) {
        return r % bound;
      }
    }
  }

  /**
   * Generates a random integer in the range [min, max)
   *
   * @param {number} min
   * @param {number} max
   */
  randomInt(min, max) {
    return this.randomBound(max - min) + min;
  }

  /**
   * Generates a number in the range [0, 1) rounded down to the nearest multiple
   * of 1/2^32
   */
  random() {
    // This is a common approach that works well for many cases, but there are
    // some subtleties here that depend on what exactly you want from a random
    // floating point number, see: http://mumble.net/~campbell/tmp/random_real.c
    return this.next() / 0x100000000;
  }

  /**
   * Takes an array and returns a shuffled copy
   *
   * @template T
   * @param {T[]} array
   */
  shuffle(array) {
    // Uses the Fisher-Yates shuffle: https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = this.randomBound(i + 1);
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
  }

  /**
   * Selects a random element from an array
   *
   * @template T
   * @param {T[]} array
   */
  choose(array) {
    return array[this.randomBound(array.length)];
  }

  toJSON() {
    // JSON.stringify won't serialize the BigInts, so we convert them to strings
    return {
      state: this.state.toString(),
      inc: this.inc.toString(),
    };
  }

  /** @param {{ state: string; inc: string; }} json */
  static fromJSON(json) {
    const rng = {
      state: BigInt(json.state),
      inc: BigInt(json.inc)
    };
    Object.setPrototypeOf(rng, PCG32.prototype);
    return rng;
  }
}

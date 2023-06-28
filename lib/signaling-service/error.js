export class TimeoutError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "TimeoutError";
  }
}

export class KVError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "KVError";
  }
}

export class ETagMismatchError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "ETagMismatchError";
  }
}

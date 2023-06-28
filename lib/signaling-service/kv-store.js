import { AESKey } from "../crypto/aes.js";
import { ETagMismatchError, KVError, TimeoutError } from "./error.js";

/** @template T */
export class KVStore {
  static serviceUrl = "https://kv.valkeyrie.com/encrypted-store";
  /**
   * @param {AESKey} aesKey - The AES key used to encrypt the data.
   * @param {string} storeKey - The key to store encrypted values at.
   */
  constructor(aesKey, storeKey) {
    this.serviceUrl = KVStore.serviceUrl;
    this.aesKey = aesKey;
    this.storeKey = storeKey;
  }

  url() {
    return `${this.serviceUrl}/${this.storeKey}`;
  }

  /**
   * Creates a new EncryptedValkeyrieKVStore with a new AES key. You can
   * optionally provide an initial value to store.
   *
   * @template T
   * @param {T | undefined} [initialValue]
   * @returns {Promise<KVStore<T>>}
   */
  static async newStore(initialValue) {
    const aesKey = await AESKey.generate();
    const storeKey = await aesKey.hash();
    const store = new KVStore(aesKey, storeKey);
    if (initialValue !== undefined) {
      await store.setValue(initialValue);
    }
    return store;
  }

  async getValue() {
    const response = await fetch(this.url());

    if (!response.ok) {
      throw new KVError(`Request failed with status ${response.status}`);
    }

    const encryptedValue = await response.json();

    const etag = response.headers.get("ETag");

    const decryptedValue = await this.aesKey.decrypt(encryptedValue);
    return { value: decryptedValue, etag };
  }

  /**
   * Writes a value the store.
   *
   * @param {T} value The value to write.
   * @param {string | undefined | null} [etag] An optional ETag to use for the
   *   write. If the ETag of the value does not match this ETag, the write will
   *   fail.
   * @throws {ETagMismatchError} If the ETag provided does not match the ETag of
   *   the value.
   * @throws {KVError} If the write failed for any other reason.
   */
  async setValue(value, etag) {
    const encryptedValue = await this.aesKey.encrypt(value);

    /** @type {Record<string, string>} */
    const headers = {
      "Content-Type": "application/json",
    };
    if (etag) {
      headers["If-Match"] = etag;
    }
    const response = await fetch(this.url(), {
      method: "POST",
      headers,
      body: JSON.stringify(encryptedValue),
    });

    if (response.status === 412) {
      throw new ETagMismatchError("ETag mismatch");
    }

    if (!response.ok) {
      throw new KVError(`Request failed with status ${response.status}`);
    }
  }

  async toToken() {
    const rawKey = await this.aesKey.export();
    return bufferToHex(rawKey);
  }

  /** @param {string} token */
  static async fromToken(token) {
    const rawKey = hexToBuffer(token);
    const aesKey = await AESKey.import(rawKey);
    const storeKey = await aesKey.hash();
    return new KVStore(aesKey, storeKey);
  }

  /**
   * It waits for a new value to be set, and returns that new value
   *
   * We need to know the original value in order to prevent an update race
   * between a set and a follow up get.
   *
   * If we implemented a "wait for new value" that just did a `getValue`, and
   * then repeatedly called `getValue` until it got a different answer, it would
   * be very hard to prevent a race in the set-and-wait case.
   *
   * @param {T} oldValue - The original value.
   * @param {number} [timeout=5000] - The maximum time in milliseconds to wait
   *   for a new value before giving up. Default is 5000 ms (5 seconds). Default
   *   is `5000`. Default is `5000`
   * @returns {Promise<T>} The new value, after a change is detected.
   * @throws {TimeoutError} If the timeout is reached.
   */
  async waitForNewValue(oldValue, timeout = 5000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const { value } = await this.getValue();
      if (JSON.stringify(value) !== JSON.stringify(oldValue)) {
        return value;
      }

      // Wait for a short time before checking again
      await wait(250);
    }

    // No update to the value within the timeout period
    throw new TimeoutError(`No new value after ${timeout} milliseconds`);
  }

  /**
   * Merge the valueToMerge with the current value, using the function f
   *
   * If the backend supports ETag-based conditional updates (which Valkeyrie
   * does), then this will complete as soon as the conditional POST succeeds.
   * Otherwise it will keep trying to merge until the merge doesn't change the
   * value for 1.2 seconds. Because this does a merge and not a set, it should
   * converge quickly even if there are multiple concurrent updaters. Throws an
   * exception on failure.
   *
   * @template V
   * @param {V} valueToMerge - The value to merge with the existing value.
   * @param {(a: T, b: V) => Promise<T>} f - A function that takes the current
   *   value and the value to merge, and returns the merged value.
   * @returns {Promise<void>}
   */
  async mergeValueWith(valueToMerge, f) {
    let timeSinceLastUpdate = 0;

    for (let i = 0; i < 20; i++) {
      // Get the current value and ETag
      const { value: existingValue, etag } = await this.getValue();
      // Merge the existing value with the valueToMerge
      const mergedValue = await f(existingValue, valueToMerge);

      if (JSON.stringify(existingValue) !== JSON.stringify(mergedValue)) {
        // If the mergedValue is different than what's stored, then update it.

        try {
          await this.setValue(mergedValue, etag);

          // If there is an ETag and the conditional POST succeeds, immediately return
          if (etag) {
            return;
          }
          timeSinceLastUpdate = 0;
        } catch (e) {
          if (e instanceof ETagMismatchError) {
            // If the condition failed, it means another client updated the value.
            // Continue with the next iteration to retry the merge.
            continue;
          }
          // If the error is not due to the condition, re-throw the error.
          throw e;
        }
      }

      if (!etag && timeSinceLastUpdate > 1200) {
        // If no values have needed updating for 1.2 seconds
        // then assume we've succeeded
        return;
      }

      // Wait at least 100ms (plus a random component to help avoid ties)
      const waitTime = 100 + 100 * Math.random();
      await wait(waitTime);
      timeSinceLastUpdate += waitTime;
    }

    throw new KVError("mergeValueWith failed to converge");
  }
}

/**
 * Wait returns a promise that resolves after `ms` milliseconds.
 *
 * @param {number} ms - The number of milliseconds to wait.
 */
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * It takes a buffer and returns it's representation as a string of hexadecimal
 * characters
 *
 * @param {ArrayBuffer} buffer - The buffer to convert to a hex string.
 * @returns The buffer as a string of hexadecimal characters.
 */
export const bufferToHex = (buffer) => {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

/**
 * It takes a string of hexadecimal characters and returns it's representation
 * as a buffer
 *
 * @param {string} hex - The hex string to convert to a buffer.
 * @returns The hex string as a buffer.
 */
export const hexToBuffer = (hex) => {
  if (hex.length % 2 !== 0) {
    throw new Error("Hex string must have an even number of characters");
  }
  const buffer = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    buffer[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return buffer;
};

/** Override the KVStore methods to use localStorage instead of the network. */
export function enableOfflineMode() {
  KVStore.prototype.getValue = async function () {
    const value = window.localStorage.getItem(this.storeKey);
    if (!value) {
      throw new KVError("GET failed");
    }
    const encryptedValue = JSON.parse(value);

    const etag = encryptedValue.etag;

    const decryptedValue = await this.aesKey.decrypt(encryptedValue);
    return { value: decryptedValue, etag };
  };

  /**
   * @template T
   * @param {T} value
   * @param {string | undefined | null} [etag]
   */
  KVStore.prototype.setValue = async function (value, etag) {
    const encryptedValue = await this.aesKey.encrypt(value);

    const newETag = encryptedValue.iv;
    if (etag) {
      const oldValue = window.localStorage.getItem(this.storeKey);
      if (oldValue) {
        const oldETag = JSON.parse(oldValue).etag;
        if (etag !== oldETag) {
          throw new ETagMismatchError("ETag mismatch");
        }
      }
    }
    window.localStorage.setItem(
      this.storeKey,
      JSON.stringify({ ...encryptedValue, etag: newETag })
    );
  };
}

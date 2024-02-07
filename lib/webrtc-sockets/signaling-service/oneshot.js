import { KVStore } from "./kv-store.js";

/**
 * Class just for namespacing
 */
export class Oneshot {
  /**
   * Exchange a single message between two parties using KVStore.
   *
   * @example
   *   // Alice
   *   const { token, waitForResponse } = await Oneshot.start("Hello Bob!");
   *   // Send token to Bob using some other out-of-band method
   *   // (i.e. put the token in a link that the user can copy and paste to their
   *   // friends on discord)
   *   // Then wait for Bob to respond:
   *   const response = await waitForResponse();
   *   // (see Bob's example on `fromToken` below)
   *
   * @template T
   * @param {T} msg Message to send
   * @param {number} [timeout] Timeout in milliseconds, default is 10000
   * @returns {Promise<{ token: string; response: Promise<T> }>}
   */
  static async start(msg, timeout = 10000) {
    const store = await KVStore.newStore(msg);
    const response = store.waitForNewValue(msg, timeout);
    const token = await store.toToken();
    return { token, response };
  }

  /**
   * The other side of `start`.
   *
   * @example
   *   // Bob
   *   const { msg, sendResponse } = await Oneshot.fromToken(token);
   *   // then do stuff with the message we got and send a response
   *   const response = await doStuff(msg);
   *   await sendResponse(response);
   *   // (see Alice's example on `start` above)
   *
   * @template T
   * @param {string} token
   * @returns {Promise<{
   *   msg: T;
   *   sendResponse: (resp: T) => Promise<void>;
   * }>}
   */
  static async fromToken(token) {
    const store = await KVStore.fromToken(token);
    const { value: msg } = await store.getValue();
    const sendResponse = async (/** @type {T} */ response) => {
      await store.setValue(response);
    };
    return { msg, sendResponse };
  }
}
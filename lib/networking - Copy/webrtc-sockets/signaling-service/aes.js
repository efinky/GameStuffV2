import { base64ToBuffer, bufferToBase64, bufferToHex } from "./buffers.js";

/**
 * Represents an AES key that can be used to encrypt and decrypt data using the AES-GCM algorithm.
 * This class provides methods to generate, import, export, hash, encrypt and decrypt data.
 */
export class AESKey {
  /** @param {CryptoKey} key */
  constructor(key) {
    this.key = key;
  }
  static async generate() {
    // Generate a 128 bit key for the AES-GCM algorithm
    return new AESKey(
      await crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 128,
        },
        true,
        ["encrypt", "decrypt"]
      )
    );
  }

  /**
   * Encrypts a javascript object
   *
   * @template T
   * @param {T} obj - The object to be encrypted. (must be
   *   `JSON.stringify`'able)
   * @returns Base64 encoded, initialization vector and encrypted data
   */
  async encrypt(obj) {
    const encoder = new TextEncoder();
    const unencryptedArray = encoder.encode(JSON.stringify(obj));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedArray = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      this.key,
      unencryptedArray
    );
    const encryptedBase64 = bufferToBase64(new Uint8Array(encryptedArray));
    const ivBase64 = bufferToBase64(iv);
    return { iv: ivBase64, data: encryptedBase64 };
  }

  /**
   * Decrypts a javascript object encrypted by `encrypt()`
   *
   * @template T
   * @param {{ iv: string; data: string }} encrypted - A base64 encoded IV
   *   paired with base64 encoded encrypted data
   * @returns {Promise<T>} The decrypted object.
   */
  async decrypt({ iv: ivBase64, data: encryptedBase64 }) {
    const encryptedArray = base64ToBuffer(encryptedBase64);
    const iv = base64ToBuffer(ivBase64);
    const unencryptedArray = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      this.key,
      encryptedArray
    );
    const decoder = new TextDecoder();
    const obj = JSON.parse(decoder.decode(unencryptedArray));
    return obj;
  }

  async export() {
    return crypto.subtle.exportKey("raw", this.key);
  }

  /**
   * It takes a raw AES key and returns a `CryptoKey`
   *
   * @param {ArrayBuffer} rawKey - The AES key as a Uint8Array.
   */
  static async import(rawKey) {
    return new AESKey(
      await crypto.subtle.importKey("raw", rawKey, "AES-GCM", true, [
        "encrypt",
        "decrypt",
      ])
    );
  }

  /**
   * Computes the SHA-256 hash of the first 12 bytes of the CryptoKey and
   * returns it as a hexadecimal string. This is useful if you want to use the
   * CryptoKey as a identifier in some semi-public place, without exposing the
   * key itself. Anyone with the AES key will be able to derive the same key,
   * but nobody with _just_ the derived key will be able to derive the original
   * AES key.
   */
  async hash() {
    const keyData = await this.export();
    const hashBuffer = await crypto.subtle.digest(
      { name: "SHA-256" },
      keyData.slice(0, 12)
    );
    return bufferToHex(hashBuffer);
  }
}

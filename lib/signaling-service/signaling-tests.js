import { assert, assertEq, describe, it } from "../../test/test-helpers.js";
import { AESKey } from "../crypto/aes.js";
import { KVStore } from "./kv-store.js";
import { fromToken, start } from "./oneshot-exchange.js";
import { WaitingList } from "./waiting-list.js";

describe("WaitingList", function () {
  it("should work", async function() {
    const waitingList = await WaitingList.start();
    const token = await waitingList.toToken();

    const joining1 = await WaitingList.fromToken(token);
    const joining2 = await WaitingList.fromToken(token);
    const foo1 = joining1.put("foo1");
    const bar2 = joining2.put("bar2");
    const [cleanup1, cleanup2] = await Promise.all([foo1, bar2]);
    // console.log(await waitingList.store.getValue());
    let fooBar = await waitingList.take();
    // console.log(await waitingList.store.getValue());
    assert(fooBar.includes("foo1"), `expected ${fooBar} to include "foo1"`);
    assert(fooBar.includes("bar2"), `expected ${fooBar} to include "bar2"`);
    const cleanup3 = await joining2.put("baz3");
    // console.log(await waitingList.store.getValue());
    let baz3 = await waitingList.take();
    assertEq(baz3[0], "baz3");
    const c3 = cleanup3();
    // console.log(await waitingList.store.getValue());
    await Promise.all([cleanup1(), cleanup2(), c3]);
    let emptyList = await waitingList.take();
    assert(emptyList.length === 0, `expected ${emptyList} to be empty`);
  });
});


describe("OneshotExchangeTest", function() {
  it("should work", async function() {
    const testMsg = { test: "asdf" };
    const { token, waitForResponse } = await start(testMsg, 300);

    const { msg, sendResponse } = await fromToken(token);
    assertEq(msg.test, "asdf");
    const testResponse = { test: "foo" };

    await sendResponse(testResponse);
    const response = await waitForResponse();
    assertEq(response.test, "foo");
  });
});


describe("AESKey", function () {
  it("should encrypt and decrypt data", async function() {
    let testObj = { test: "foo" };
    let key = await AESKey.generate();
    let encryptedData = JSON.stringify(await key.encrypt(testObj));
    let exportedKey = await key.export();
    let importedKey = await AESKey.import(exportedKey);
    let decryptedData = await importedKey.decrypt(JSON.parse(encryptedData));
    assertEq(decryptedData.test, "foo");
  });
});

describe("KVStore", function () {
  it("should work", async function() {
    const store = await KVStore.newStore("foo");
    const token = await store.toToken();
    const store2 = await KVStore.fromToken(token);
    const { value } = await store2.getValue();
    assertEq(value, "foo");
  });
});


// @ts-check
import { Queue } from "../queue.js";
import { assertEq, assertPromiseThrows, barrierMsg, describe, it } from "../../test/test-helpers.js";
import { startOffer, answerOffer } from "./webrtc.js";


/**
 * @param {RTCDataChannel} channel
 */
function messageQueue(channel) {
  /** @type {Queue<string|null>} */
  const queue = new Queue();
  channel.addEventListener("message", (event) => {
    queue.push(event.data);
  });
  channel.addEventListener("close", () => {
    queue.push(null);
  });
  return queue;
}

describe("WebRTC", function () {
  it("TestAnswerIceFail", async function () {
    const { offer } = await startOffer({ name: "a" });
    const { waitForConnect } = await answerOffer(offer, { name: "b" });
    await assertPromiseThrows(waitForConnect(), (e) => {
      assertEq(e.message, "Failed ICE negotiation");
    });
  });

  it("webRTCTestOfferTimeout", async function () {
    const { offer, acceptAnswer } = await startOffer({ name: "a" });

    const connection = new RTCPeerConnection();
    connection.setRemoteDescription(offer);
    const answerInit = await connection.createAnswer();
    await connection.setLocalDescription(answerInit);
    const answer = /** @type {RTCSessionDescription} */ (
      connection.localDescription
    );

    // Close answering peer to cause a timeout
    connection.close();

    // This should time out
    await assertPromiseThrows(acceptAnswer(answer), (e) => {
      assertEq(e.message, "Failed ICE negotiation");
    });
  });

  it("should be able to connect", async function () {
    const { send: sendOffer, recv: recvOffer } = barrierMsg();
    const { send: sendAnswer, recv: recvAnswer } = barrierMsg();

    const a = async () => {
      const { offer, acceptAnswer } = await startOffer({ name: "a" });
      await sendOffer(offer);
      const answer = await recvAnswer();
      const channel = await acceptAnswer(answer);
      /** @type {Queue<string | null>} */
      const queue = messageQueue(channel);
      await channel.send("ping");
      const msg = await queue.recv();

      assertEq(msg, "pong");

      channel.close();
    };

    const b = async () => {
      const offer = await recvOffer();
      const { answer, waitForConnect } = await answerOffer(offer, {
        name: "b",
      });
      await sendAnswer(answer);
      const channel = await waitForConnect();
      const queue = messageQueue(channel);
      const msg = await queue.recv();

      assertEq(msg, "ping");

      await channel.send("pong");

      channel.close();
    };

    await Promise.all([a(), b()]);
  })
})



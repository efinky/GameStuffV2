import { Identity } from "../crypto/identity.js";
import { TimeChunkedEventQueue } from "./time-chunked-event-queue.js";
import { channelRecv, channelSend } from "./message.js";

/**
 * @template S, E
 * @typedef {import("./message.js").Message<S, E>} Message<S, E>
 */
/**
 * @template E
 * @typedef {import("./simulation.js").PeerMessage<E>} PeerMessage<E>
 */

/**
 * @template E
 */
export class Client {
  /**
   * @param {{
   *   channel: RTCDataChannel;
   *   clientId: string;
   *   simTime: number;
   *   tickPeriodMs: number;
   *   timeChunkMs: number;
   *   now?: number;
   * }} init
   */
  constructor({
    channel,
    clientId,
    simTime,
    tickPeriodMs,
    timeChunkMs,
    now = performance.now(),
  }) {
    /**
     * @type {TimeChunkedEventQueue<{
     *   msg: PeerMessage<E>;
     *   clientId: string;
     *   msgTime: number;
     * }>}
     */
    this.eventQueue = new TimeChunkedEventQueue({
      simTime,
      tickPeriodMs,
      timeChunkMs,
      now,
    });
    this.channel = channel;
    this.clientId = clientId;
  }

  /** @param {E} peerEvent */
  sendEvent(peerEvent) {
    const msg = JSON.stringify(peerEvent);
    this.channel.send(msg);
  }

  getEvents(time = performance.now()) {
    return this.eventQueue.getEvents(time);
  }

  /**
   * @template S,E
   * @param {RTCDataChannel} channel
   * @returns {Promise<{
   *   client: Client<E>;
   *   clientId: string;
   *   state: S;
   *   identity: Identity;
   * }>}
   */
  static async init(channel) {
    const identity = await Identity.generate();
    const publicIdentity = await identity.publicId();

    channelSend(channel, { identity: publicIdentity.toJSON() }, "identity");

    const { challenge } = await channelRecv(channel, "challenge");

    channelSend(channel, await identity.signChallenge(challenge), "signature");

    const { clientId, simTime, tickPeriodMs, timeChunkMs, state } =
      await channelRecv(channel, "connected");

    const client = new Client({
      channel,
      clientId,
      simTime,
      tickPeriodMs,
      timeChunkMs,
      now: 0,
    });

    channel.onmessage = (e) => {
      /** @type {Message<S, E>} */
      const msg = JSON.parse(e.data);
      if (msg.type === "peerMessage") {
        client.eventQueue.pushMsg({msg: msg.msg, clientId: msg.clientId, msgTime: msg.msgTime});
      } else if (msg.type === "tick") {
        client.eventQueue.processTick(msg.msgTime);
      } else {
        throw new Error(`Unexpected message type: ${msg.type}`);
      }
    };

    channel.onclose = () => {
      client.eventQueue.endTicks();
    };

    channel.onerror = (e) => {
      console.error(e);
      client.eventQueue.endTicks();
    };

    return { client, clientId, state, identity };
  }
}

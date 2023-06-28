
/**
 * @template E
 * @typedef {import("./simulation.js").PeerMessage<E>} PeerMessage<E>
 */


/**
 * @template S, E
 * @typedef {| { type: "tick"; msgTime: number }
 *   | { type: "identity"; identity: { publicKey: string } }
 *   | { type: "challenge"; challenge: string }
 *   | { type: "signature"; signature: string }
 *   | {
 *       type: "connected";
 *       clientId: string;
 *       simTime: number;
 *       tickPeriodMs: number;
 *       timeChunkMs: number;
 *       state: S;
 *     }
 *   | {
 *       type: "peerMessage";
 *       msg: PeerMessage<E>;
 *       clientId: string;
 *       msgTime: number;
 *     }} Message
 */

/**
 * @template S, E
 * @template {Message<S, E>["type"]} T
 * @param {Omit<Extract<Message<S, E>, { type: T }>, "type">} msg
 * @param {RTCDataChannel} channel
 * @param {T} msgType
 */
export async function channelSend(channel, msg, msgType) {
  channel.send(JSON.stringify({ type: msgType, ...msg }));
}

/**
 * @template S, E
 * @template {Message<S, E>["type"]} T
 * @param {RTCDataChannel} channel
 * @param {T} msgType
 * @returns {Promise<Extract<Message<S, E>, { type: T }>>}
 */
export async function channelRecv(channel, msgType) {
  const msg = await new Promise((resolve, reject) => {
    channel.onmessage = resolve;
    channel.onerror = reject;
    channel.onclose = reject;
  });
  const parsedMsg = JSON.parse(msg.data);

  if (parsedMsg.type !== msgType) {
    throw new Error(`Expected ${msgType}, got ${parsedMsg.type}`);
  }

  return parsedMsg;
}

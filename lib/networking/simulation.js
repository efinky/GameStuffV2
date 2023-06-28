/**
 * @template E
 * @typedef {| { type: "peerJoined" }
 *   | { type: "peerLeft" }
 *   | {
 *       type: "peerEvent";
 *       peerEvent: E;
 *     }} PeerMessage
 */

/**
 * @template E
 * @typedef {{
 *   msg: PeerMessage<E>;
 *   clientId: string;
 *   msgTime: number;
 * }} SimulationMsg
 */

/**
 * @template E
 * @typedef {import("./time-chunked-event-queue.js").TimeChunk<SimulationMsg<E>>} SimChunk<E>
 */

/**
 * @template E
 * @typedef {{
 *   sendEvent: (peerEvent: E) => void;
 *   getEvents: (time?: number) => SimChunk<E>[] | null;
 * }} SimulationClient<E>
 */

export {};
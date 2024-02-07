import { Client } from "./client.js";
import { Identity } from "./identity.js";
import { Server } from "./server.js";
import { connect, listen } from "./webrtc-sockets/webrtc-sockets.js";

// TODO make it easy to use for single player games
// TODO need a way to handle asynchronous updates (for example level changes)
// maybe we should have assets be explicitly separate from the state?

// TODO add how-to for how to load assets on join
// TODO add how-to for how to handle level changes
// TODO add how-to for how to handle player joining/leaving

// TODO make serialization work with byte arrays?
// TODO Also make it easy to use for single player games
// TODO also make the event serializer configurable (and actually use one)
// TODO separate the message type from the event type

/**
 * @template IE - The type of events that can be sent between peers
 * @template OE - Output events (often sent to the UI)
 * @typedef {Object} NetworkedGameHandlers
 * @property {(clientId: string) => void} onPlayerJoined - Handle a new player
 *   joining the game.
 * @property {(clientId: string) => void} onPlayerLeft - Handle a player leaving
 *   the game.
 * @property {(clientId: string, event: IE) => void} onEvent - Handle an event
 *   from a player.
 * @property {(dt: number) => OE[]} update - Run the game forward by dt seconds.
 * @property {() => string} serialize - Serialize
 */

/** @param {string} str */
function fletcher32(str) {
  let sum1 = 0xffff,
    sum2 = 0xffff;
  for (let i = 0; i < str.length; i++) {
    sum1 += str.charCodeAt(i);
    sum2 += sum1;
  }
  /* Second reduction step to reduce sums to 16 bits */
  sum1 = (sum1 & 0xffff) + (sum1 >>> 16);
  sum2 = (sum2 & 0xffff) + (sum2 >>> 16);
  return (sum2 << 16) | sum1;
}

/** @typedef {import("./message.js").PeerMessage} PeerMessage */
/** @typedef {import("./message.js").Diagnostic} Diagnostic */

/**
 * @typedef {import("./time-chunked-event-queue.js").TimeChunk<
 *   import("./message.js").SimulationMsg
 * >} SimChunk
 */

/**
 * @typedef {{
 *   sendEvent: (peerEvent: string) => void;
 *   getEvents: (time?: number) => SimChunk[] | null;
 *   getTickChunkMs: () => number;
 *   disconnect: () => void;
 *   sendDiagnostics: (diagnostics: Diagnostic[]) => void;
 * }} SimulationClient
 */

/**
 * @template IE
 * @template OE
 * @template {NetworkedGameHandlers<IE, OE>} S
 * @class NetworkedGame
 */
export class NetworkedGame {
  static debug = false;
  /**
   * @param {string} clientId
   * @param {Identity} identity
   * @param {S} state
   * @param {SimulationClient} network
   * @param {() => void} stop
   * @param {Diagnostic[]} [diagnostics]
   * @param {number} [now]
   */
  constructor(
    clientId,
    identity,
    state,
    network,
    stop,
    diagnostics = [],
    now = performance.now()
  ) {
    this.clientId = clientId;
    this.identity = identity;
    this.network = network;
    this.stop = stop;
    this.isHost = network instanceof Server;
    this.state = state;
    /** @type {(() => () => void)[]} */
    this.watchers = [];
    this.lastUpdate = now;
    this.diagnostics = diagnostics;
  }

  /**
   * @template V
   * @param {() => V} get
   * @param {(prev: V, next: V) => void} onChange
   */
  addWatcher(get, onChange) {
    // JDV is this a good idea? I'm not sure
    const getS = get.bind(this.state);
    const watch = () => {
      const prevVal = getS();
      return () => {
        const nextVal = getS();
        if (prevVal !== nextVal) {
          onChange(prevVal, nextVal);
        }
      };
    };
    this.watchers.push(watch);
  }

  disconnect() {
    this.stop();
    this.network.disconnect();
  }

  update(now = performance.now()) {
    /** @type {OE[]} */
    const outputEvents = [];
    let chunks = this.network.getEvents();
    if (!chunks) {
      return { disconnected: true, timeSinceLastUpdate: 0, outputEvents: [] };
    }
    if (chunks.length > 0) {
      const prevWatches = this.watchers.map((watch) => watch());
      for (let chunk of chunks) {
        for (let { msg, clientId, msgTime } of chunk.peerEvents) {
          if (NetworkedGame.debug) {
            this.diagnostics.push({
              type: "peerMessage",
              peerMessage: msg,
              updates: 0,
            });
          }
          switch (msg.type) {
            case "peerJoined":
              if (NetworkedGame.debug) {
                const stateHash = fletcher32(this.state.serialize());
                this.diagnostics.push({
                  type: "stateHash",
                  stateHash,
                  updates: 0,
                  // TODO also include tick and chunk sizes
                });
              }
              this.state.onPlayerJoined(clientId);
              break;
            case "peerLeft":
              this.state.onPlayerLeft(clientId);
              break;
            case "peerEvent":
              const pe = JSON.parse(msg.peerEvent);
              this.state.onEvent(clientId, pe);
              break;
            case "collectDiagnostics":
              const stateHash = fletcher32(this.state.serialize());
              this.diagnostics.push({
                type: "stateHash",
                stateHash,
                updates: 0,
                // TODO also include tick and chunk sizes
              });
              this.network.sendDiagnostics(this.diagnostics);
              break;
          }
        }
        if (NetworkedGame.debug) {
          this.diagnostics[this.diagnostics.length - 1].updates++;
        }
        const oe = this.state.update(chunk.dt / 1000);
        outputEvents.push(...oe);
      }
      prevWatches.forEach((watch) => watch());
      this.lastUpdate = now;
    } else {
      const timeSinceLastUpdate =
        Math.min(now - this.lastUpdate, this.network.getTickChunkMs()) / 1000;
      return { disconnected: false, timeSinceLastUpdate, outputEvents: [] };
    }
    return { disconnected: false, timeSinceLastUpdate: 0, outputEvents };
  }

  /**
   * @template IE
   * @template OE
   * @template {NetworkedGameHandlers<IE, OE>} S
   * @param {S} state
   * @param {{
   *   now: number;
   *   tickPeriodMs: number;
   *   tickChunkMs: number;
   * }} [options]
   */
  static async hostGame(state, options = Server.defaultOptions()) {
    const { token, start: startListen } = await listen();
    const { server, clientId, identity } = await Server.init(options);

    const { stop } = await startListen({
      onConnect: (channel) => {
        return server.onConnect(channel, () => ({
          state: state.serialize(),
          diagnostics: networkedGame.diagnostics,
        }));
      },
    });

    const networkedGame = new NetworkedGame(
      clientId,
      identity,
      state,
      server,
      stop
    );

    return {
      token,
      networkedGame,
      identity,
      stop,
    };
  }

  /**
   * @template IE
   * @template OE
   * @template {NetworkedGameHandlers<IE, OE>} S
   * @param {S} state
   * @param {{
   *   now: number;
   *   tickPeriodMs: number;
   *   tickChunkMs: number;
   * }} [options]
   */
  static async singlePlayerGame(state, options = Server.defaultOptions()) {
    const { server, clientId, identity } = await Server.init(options);
    const networkedGame = new NetworkedGame(
      clientId,
      identity,
      state,
      server,
      () => {}
    );
    return { networkedGame, identity };
  }

  /**
   * @template IE
   * @template OE
   * @template {NetworkedGameHandlers<IE, OE>} S
   * @param {string} token
   * @param {(s: string) => S | Promise<S>} deserialize
   * @param {Identity} [existingIdentity]
   */
  static async joinGame(token, deserialize, existingIdentity = undefined) {
    let channel = await connect(token, 15000);
    const { client, clientId, identity, state, diagnostics } =
      await Client.init(channel, existingIdentity);
    const gameState = await deserialize(state);
    const networkedGame = new NetworkedGame(
      clientId,
      identity,
      gameState,
      client,
      () => {},
      diagnostics
    );
    return { networkedGame, identity, gameState };
  }

  /** @param {IE} peerEvent */
  sendEvent(peerEvent) {
    const pe = JSON.stringify(peerEvent);
    this.network.sendEvent(pe);
  }
}

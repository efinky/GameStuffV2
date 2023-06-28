// @ts-check
import {
  assertDeepEq,
  assertEq,
  describe,
  it,
} from "../../test/test-helpers.js";
import { connect, listen } from "../webrtc/webrtc-sockets.js";
import { Client } from "./client.js";
import { Server } from "./server.js";

/**
 * @template E
 * @typedef {import("./simulation.js").PeerMessage<E>} PeerMessage<E>
 */

/**
 * @template E
 * @typedef {import("./simulation.js").SimulationClient<E>} SimulationClient<E>
 */

// test connection between client and server, and that the state gets sent to
// the client test that the client can send events to the server test that the
// server can send events to the client test multiple clients connecting to the
//   server, verify that the clients and server can send events to each other, and
//   the all get the same events in order

// test that the client can re-connect with the same identity. (need to actually have a way to specify the identity)

// split client and server into separate files, come up with a better name for TimeChunkedEventQueue

// need a nicer way to enable/disable logging

/**
 * @template E
 * @param {SimulationClient<E>} client
 * @param {number} t
 * @param {import("./simulation.js").SimChunk<E>[]} events
 */
async function expectExactEvents(client, t, events) {
  let clientEvents = client.getEvents(t);
  if (!clientEvents) {
    throw new Error("no clientEvents");
  }
  let waits = 0;
  while (clientEvents.length === 0) {
    if (waits > 100) {
      throw new Error("timed out waiting for events");
    }
    await new Promise((resolve) => setTimeout(resolve, 1));
    clientEvents = client.getEvents(t);
    if (!clientEvents) {
      throw new Error("no clientEvents");
    }
    waits++;
  }
  assertEq(clientEvents.length, events.length);
  for (let i = 0; i < events.length; i++) {
    assertDeepEq(clientEvents[i], events[i]);
  }
}

describe("Server", function () {
  it("client should get the correct server state on connect", async function () {
    const { token, start } = await listen();

    const server = new Server(
      {
        getState: () => "foo",
      },
      0
    );

    const { stop } = await start({
      onConnect: (channel) => server.onConnect(channel),
    });

    const channel = await connect(token);

    const { state } = await Client.init(channel);

    assertEq(state, "foo");
  });
  it("should work", async function () {
    const { token, start } = await listen();

    /**
     * @type {Server<
     *   { x: number; y: number },
     *   { type: "move"; x: number; y: number }
     * >}
     */
    const server = new Server(
      {
        getState: () => ({ x: 0, y: 0 }),
      },
      0
    );

    const { stop } = await start({
      onConnect: (channel) => server.onConnect(channel),
    });

    const channel = await connect(token);
    const { client, clientId, state, identity } = await Client.init(channel);

    console.log("client: ", client.clientId);

    const channel2 = await connect(token);
    const {
      client: client2,
      clientId: clientId2,
      state: state2,
    } = await Client.init(channel2);

    client.sendEvent({ type: "move", x: 1, y: 1 });
    client2.sendEvent({ type: "move", x: 2, y: 2 });

    // client sends event, need to wait for server to get it
    // server sends event, I don't think we need to wait here?
    // on tick, don't need to wait as long as we've waited for client events to complete

    /** @type {ReturnType<(typeof server)["getEvents"]>} */
    const exactEvents = [
      {
        simTime: 10,
        dt: 10,
        peerEvents: [
          {
            msg: { type: "peerJoined" },
            clientId: server.clientId,
            msgTime: 0,
          },
          {
            msg: { type: "peerJoined" },
            clientId: clientId,
            msgTime: 0,
          },
          {
            msg: { type: "peerJoined" },
            clientId: clientId2,
            msgTime: 0,
          },
          {
            msg: {
              type: "peerEvent",
              peerEvent: {
                type: "move",
                x: 1,
                y: 1,
              },
            },
            clientId: clientId,
            msgTime: 0,
          },
          {
            msg: {
              type: "peerEvent",
              peerEvent: {
                type: "move",
                x: 2,
                y: 2,
              },
            },
            clientId: clientId2,
            msgTime: 0,
          },
        ],
      },
      {
        simTime: 20,
        dt: 10,
        peerEvents: [],
      },
      {
        simTime: 30,
        dt: 10,
        peerEvents: [],
      },
      {
        simTime: 40,
        dt: 10,
        peerEvents: [],
      },
      {
        simTime: 50,
        dt: 10,
        peerEvents: [],
      },
    ];

    await new Promise((resolve) => setTimeout(resolve, 10));

    server.onTick();

    await expectExactEvents(server, server.tickPeriodMs, exactEvents);

    console.log("sent events");

    // let javascript process events
    // Should I have a way to wait for the server to process events?

    // await new Promise((resolve) => setTimeout(resolve, 10));

    // server.onTick();
    // await new Promise((resolve) => setTimeout(resolve, 0));
    // server.onTick();
    // await new Promise((resolve) => setTimeout(resolve, 0));
    // server.onTick();
    // await new Promise((resolve) => setTimeout(resolve, 0));

    // client 1 should have received the move event from client 2
    // let events = client.getEvents(0);
    // await new Promise((resolve) => setTimeout(resolve, 0));
    // console.log("events1:", events);
    // server.onTick();
    // console.log("tick 1");
    // await new Promise((resolve) => setTimeout(resolve, 10));

    // let events = client.getEvents(server.tickPeriodMs);
    // console.log("events1:", events);

    // server.onTick();
    // console.log("tick 2");

    // await new Promise((resolve) => setTimeout(resolve, 0));

    // server.onTick();
    // await new Promise((resolve) => setTimeout(resolve, 0));
    // events = client.getEvents(server.tickPeriodMs);
    // console.log("events2:", events);
    // server.onTick();
    // await new Promise((resolve) => setTimeout(resolve, 0));

    // events = client.getEvents(server.tickPeriodMs * 2);
    // console.log("events3:", events);

    // await client.disconnect();
    // await client2.disconnect();

    stop();
  });
});

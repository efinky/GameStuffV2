// @ts-check

/**
Here are some resources for WebRTC that I found particularly helpful making this:
https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity
https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Simple_RTCDataChannel_sample
https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/addIceCandidate
https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/icecandidate_event
https://developer.mozilla.org/en-US/docs/Glossary/SDP
*/


/**
 * Creates an offer and returns a promise that resolves with the offer and a
 * function to accept an answer.
 *
 * @param {Object} [options] - Optional settings for the connection.
 * @param {string} [options.name="localPeer"] - The name of the local peer.
 *   Default is `"localPeer"`
 * @param {RTCIceServer[]} [options.iceServers=defaultIceServers] - An array of
 *   ICE servers to use for the connection. Default is `defaultIceServers`
 * @param {number} [options.timeout=15000] - The maximum amount of time to wait
 *   for the connection to be established, in milliseconds. Default is `15000`
 * @returns {Promise<{
 *   offer: RTCSessionDescription;
 *   acceptAnswer: (answer: RTCSessionDescription) => Promise<RTCDataChannel>;
 * }>}
 * @example
 * const { offer, acceptAnswer } = await createOffer();
 * const answer = await useSomeMethodToSendOfferAndGetAnswerFromPeer(offer);
 * const dataChannel = await acceptAnswer(answer);
 */
export async function startOffer(options = {}) {
  const mergedOptions = { ...defaultOptions, ...options };
  const { name, iceServers, timeout } = mergedOptions;

  const connection = new RTCPeerConnection({
    iceServers,
  });
  enableConnectionLogs(name, connection);

  const channelOpen = waitForOpen(
    connection,
    connection.createDataChannel("dataChannel")
  );

  const offerInit = await connection.createOffer();
  await connection.setLocalDescription(offerInit);
  log("setting local description", offerInit);
  await waitIceComplete(connection);
  log("ICE complete");
  const offer = /** @type {RTCSessionDescription} */ (
    connection.localDescription
  );
  log("offer", offer);

  /** @param {RTCSessionDescription} answer; */
  const acceptAnswer = async (answer) => {
    await connection.setRemoteDescription(new RTCSessionDescription(answer));
    return Promise.race([
      channelOpen,
      connectionTimeout(name, timeout),
      iceFailed(name, connection),
    ]);
  };

  return { offer, acceptAnswer };
}

/**
 * @param {RTCPeerConnection} connection
 * @returns {Promise<RTCDataChannel>}
 */
function waitForDataChannel(connection) {
  return waitForEvent(connection, "datachannel", (source, event, done) => {
    done(event.channel);
  });
}

/**
 * Creates an answer to an offer and returns a promise that resolves with the
 * answer and a function to wait for the connection to be established.
 *
 * @param {RTCSessionDescription} offer - The offer to answer.
 * @param {Object} [options] - Optional settings for the connection.
 * @param {string} [options.name="localPeer"] - The name of the local peer.
 *   Default is `"localPeer"`
 * @param {RTCIceServer[]} [options.iceServers=defaultIceServers] - An array of
 *   ICE servers to use for the connection. Default is `defaultIceServers`
 * @param {number} [options.timeout=15000] - The maximum amount of time to wait
 *   for the connection to be established, in milliseconds. Default is `15000`
 * @returns {Promise<{
 *   answer: RTCSessionDescription;
 *   waitForConnect: () => Promise<RTCDataChannel>;
 * }>}
 *   - A promise that resolves with the answer and a function to wait for the
 *       connection to be established.
  * @example
  * const { answer, waitForConnect } = await answerOffer(offer);
  * await useSomeMethodToSendAnswerToPeer(answer);
  * const dataChannel = await waitForConnect();
 */
export async function answerOffer(
  offer,
  options = {}
) {
  const mergedOptions = { ...defaultOptions, ...options };
  const { name, iceServers, timeout } = mergedOptions;

  const connection = new RTCPeerConnection({
    iceServers,
  });
  enableConnectionLogs(name, connection);

  await connection.setRemoteDescription(new RTCSessionDescription(offer));

  const answerInit = await connection.createAnswer();
  await connection.setLocalDescription(answerInit);
  log("setting local description", answerInit);
  await waitIceComplete(connection);
  log("ICE complete");
  const answer = /** @type {RTCSessionDescription} */ (
    connection.localDescription
  );
  log("answer", answer);

  const waitForChannel = async () => {
    const dataChannel = await waitForDataChannel(connection);
    return waitForOpen(connection, dataChannel);
  };
  const race = Promise.race([
    waitForChannel(),
    iceFailed(name, connection),
    connectionTimeout(name, timeout),
  ]);

  const waitForConnect = () => race;

  return { answer, waitForConnect };
}

export class WebRTCError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "WebRTCConnectError";
  }
}

export let defaultIceServers = [
  {
    urls: "stun:stun.wtfismyip.com",
  },
];

export const defaultOptions = {
  name: "localPeer",
  iceServers: defaultIceServers,
  timeout: 15000,
};

export let loggingEnabled = false;

/** @param {any[]} args */
function log(...args) {
  if (loggingEnabled) {
    console.log("WebRTC:", ...args);
  }
}

/** @param {number} ms */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @template K
 * @template T
 * @callback Predicate
 * @param {RTCPeerConnection} source
 * @param {RTCPeerConnectionEventMap[K]} event
 * @param {(result: T) => void} done
 */

/**
 * @template {keyof RTCPeerConnectionEventMap} K
 * @template T
 * @param {RTCPeerConnection} source
 * @param {K} eventType
 * @param {Predicate<K, T>} predicate
 * @returns {Promise<T>}
 */
function waitForEvent(source, eventType, predicate) {
  return new Promise((resolve) => {
    /** @type {(result: T) => void} */
    let done;

    /** @param {RTCPeerConnectionEventMap[K]} event */
    const listener = (event) => predicate(source, event, done);
    done = (a) => {
      source.removeEventListener(eventType, listener);
      resolve(a);
    };
    source.addEventListener(eventType, listener);
  });
}

/**
 * @param {RTCPeerConnection} connection
 * @returns {Promise<void>}
 */
function waitForConnectionFailed(connection) {
  return waitForEvent(
    connection,
    "iceconnectionstatechange",
    (source, event, done) => {
      if (source.iceConnectionState === "failed") {
        done();
      }
    }
  );
}

/**
 * @param {RTCPeerConnection} connection
 * @returns {Promise<void>}
 */
function waitIceComplete(connection) {
  return waitForEvent(
    connection,
    "icegatheringstatechange",
    (source, event, done) => {
      log("waiting for ice gathering state to change to complete, got: ", source.iceGatheringState, event);
      if (source.iceGatheringState === "complete") {
        done();
      }
    }
  );
}

/**
 * @param {string} name
 * @param {number} timeoutMsecs
 * @returns {Promise<never>}
 */
async function connectionTimeout(name, timeoutMsecs) {
  await wait(timeoutMsecs);
  throw new WebRTCError(`Timed out waiting to connect (${name})`);
}

/**
 * @param {string} name
 * @param {RTCPeerConnection} connection
 * @returns {Promise<never>}
 */
async function iceFailed(name, connection) {
  await waitForConnectionFailed(connection);
  throw new WebRTCError("Failed ICE negotiation");
}

/**
 * @param {RTCPeerConnection} connection
 * @param {RTCDataChannel} channel
 * @returns {Promise<RTCDataChannel>} ;
 */
function waitForOpen(connection, channel) {
  return new Promise((resolve) => {
    channel.addEventListener("open", () => {
      channel.addEventListener("close", () => {
        connection.close();
      });
      window.addEventListener("beforeunload", () => {
        channel.close();
      });
      resolve(channel);
    });
  });
}

/**
 * @param {string} name
 * @param {RTCPeerConnection} connection
 */
function enableConnectionLogs(name, connection) {
  if (!loggingEnabled) {
    return;
  }
  connection.addEventListener("iceconnectionstatechange", (ev) => {
    const target = /** @type {RTCPeerConnection} */ (ev.target);
    log(
      "Ice Connection State Change: ",
      name,
      ", gathering state: ",
      target.iceGatheringState,
      ", connection state: ",
      target.iceConnectionState
    );
  });

  connection.addEventListener("icegatheringstatechange", (ev) => {
    const target = /** @type {RTCPeerConnection} */ (ev.target);
    log(
      "Ice Gathering State Change: ",
      name,
      ", gathering state: ",
      target.iceGatheringState,
      ", connection state: ",
      target.iceConnectionState
    );
  });
}

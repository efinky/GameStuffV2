import { WaitingList, Oneshot } from "./signaling-service/signaling-service.js";
import { startOffer, answerOffer } from "./webrtc/webrtc.js";

/** @param {string} token */
export async function accept(token) {
  let { msg, sendResponse } = await Oneshot.fromToken(token);
  let offer = msg;
  const { answer, waitForConnect } = await answerOffer(offer, {
    name: "host",
  });
  await sendResponse(answer);
  let channel = await waitForConnect();
  return channel;
}

export async function listen() {
  const waitingList = await WaitingList.start();
  const token = await waitingList.toToken();

  /**
   * @param {{
   *   onConnect: (channel: RTCDataChannel) => Promise<void>;
   *   onError?: (token: string, error: any) => void;
   *   checkPeriod?: number;
   * }} callbacks
   */
  const start = async ({
    onConnect,
    onError = (/** @type {string} */ token, /** @type {any} */ err) =>
      console.error("Error connecting client", token, err),
    checkPeriod = 1000, // 1 second
  }) => {
    /** @type {ReturnType<setTimeout> | undefined} */
    let timerId = undefined;

    let checkForConnections = async () => {
      let waitingConnection = await waitingList.take();

      for (let waitingToken of waitingConnection) {
        accept(waitingToken)
          .then(onConnect)
          .catch((error) => onError(waitingToken, error));
      }
      timerId = setTimeout(checkForConnections, checkPeriod);
    };

    setTimeout(checkForConnections, checkPeriod);

    return {
      token,
      stop: () => clearTimeout(timerId),
    };
  };
  return { token, start };
}

/**
 * @param {string} token
 * @param {number} [timeout]
 */
export async function connect(token, timeout = 15000) {
  const waitingList = await WaitingList.fromToken(token);
  const { offer, acceptAnswer } = await startOffer();
  const { token: internalToken, response } = await Oneshot.start(
    offer,
    timeout
  );
  await waitingList.put(internalToken);

  const answer = await response;

  const channel = await acceptAnswer(answer);
  return channel;
}

/** @param {number} [timeout] */
export async function connectDirect(timeout) {
  const { offer, acceptAnswer } = await startOffer();
  const { token, response } = await Oneshot.start(
    offer,
    timeout
  );

  const waitForConnect = async () => {
    const answer = await response;

    const channel = await acceptAnswer(answer);
    return channel;
  };
  return { token, waitForConnect };
}

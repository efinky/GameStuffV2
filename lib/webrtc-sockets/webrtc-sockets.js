import { WaitingList, Oneshot } from "./signaling-service/signaling-service.js";
import { startOffer, answerOffer, defaultOptions } from "./webrtc/webrtc.js";

/**
 * @param {string} token
 * @param {Partial<typeof defaultOptions>} [options]
 */
export async function accept(token, options = { name: "host" }) {
  let { msg, sendResponse } = await Oneshot.fromToken(token);
  let offer = msg;
  const { answer, waitForConnect } = await answerOffer(offer, options);
  await sendResponse(answer);
  let channel = await waitForConnect();
  return channel;
}

/** @param {Partial<typeof defaultOptions>} [options] */
export async function listen(options = {}) {
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
        accept(waitingToken, options)
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
 * @param {Partial<typeof defaultOptions>} [options]
 */
export async function connect(token, options = {}) {
  const waitingList = await WaitingList.fromToken(token);
  const { offer, acceptAnswer } = await startOffer(options);
  const { token: internalToken, response } = await Oneshot.start(
    offer,
    options.timeout ?? 15000
  );
  await waitingList.put(internalToken);

  const answer = await response;

  const channel = await acceptAnswer(answer);
  return channel;
}

/** @param {Partial<typeof defaultOptions>} [options] */
export async function connectDirect(options = {}) {
  const { offer, acceptAnswer } = await startOffer(options);
  const { token, response } = await Oneshot.start(
    offer,
    options.timeout ?? 15000
  );

  const waitForConnect = async () => {
    const answer = await response;

    const channel = await acceptAnswer(answer);
    return channel;
  };
  return { token, waitForConnect };
}

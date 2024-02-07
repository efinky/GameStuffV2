import { dispatch } from "../app.js";
import { NetworkedGame } from "../lib/networking/networked-game.js";
import { WorldState } from "../game-state/worldState.js";
import { hostGame, joinGame, singlePlayerGame } from "./ui-actions.js";

/** @typedef {import("../game-state/worldState.js").PlayerAction} PlayerAction */
/** @typedef {import("../game-state/worldState.js").WorldEvent} WorldEvent */

/** @typedef {{ ui_state: "main"; errorMsg?: string }} MainState */
/**
 * @typedef {{
 *   ui_state: "playing";
 *   joinLink: string;
 *   isHost: boolean;
 *   networkedGame: NetworkedGame;
 *   worldState: WorldState;
 * }} PlayingState
 */
/** @typedef {{ ui_state: "join_menu"; token: string }} JoinMenuState */
/** @typedef {{ ui_state: "starting"; msg: string }} StartingState */
/** @typedef {MainState | JoinMenuState | StartingState | PlayingState} State */

/** @type {State} */
export const mainState = { ui_state: "main" };

export const transitionMainMenu = () => mainState;

/**
 * @param {string} token
 * @returns {(state: State) => JoinMenuState}
 */
export const transitionJoinMenu = (token) => (state) => {
  if (state.ui_state === "playing") {
    // We can be in this state if someone pastes a new join link into the
    // address bar while they are already playing.

    // If we are already playing, we need to disconnect from the current game.
    // If we don't do this then the old game will continue to run in the
    // background, and for example if you are the host, the game will continue
    // to let new players connect and play. This is not what we want.

    state.networkedGame.disconnect(); // TODO can I make this automatic?
  }
  return {
    ui_state: "join_menu",
    token,
  };
};

/**
 * @param {string} joinToken
 * @param {NetworkedGame} networkedGame
 * @param {WorldState} worldState
 * @returns {(state: State) => PlayingState}
 */
export const transitionPlaying = (joinToken, networkedGame, worldState) => {
  const isHost = networkedGame.isHost;
  const joinLink = joinToken ? window.location.href + "#" + joinToken : "";
  if (joinLink) {
    if (isHost) {
      // Otherwise we get yelled at for not being triggered by a user action.
      // Still doesn't work in Safari, but I can't fix that because generating
      // the token requires awaiting on promises returned from the Crypto API,
      // so 🤷‍♂️ Users can still get the link from the settings dialog.
      navigator.clipboard.writeText(joinLink);
    }
  }
  return (_state) => ({
    ui_state: "playing",
    joinLink,
    isHost,
    networkedGame,
    worldState,
  });
};

/**
 * @param {string} msg
 * @returns {StartingState}
 */
export const starting = (msg) => ({
  ui_state: "starting",
  msg,
});

/**
 * @param {string} errorMsg
 * @returns {(state: State) => MainState}
 */
export const transitionError = (errorMsg) => (_state) => ({
  ui_state: "main",
  errorMsg,
});

/** @param {State} state */
export const transitionSinglePlayerGame = (state) => {
  if (state.ui_state !== "main") {
    return state;
  }

  singlePlayerGame().then(dispatch);

  return starting("Starting Game");
};

/** @param {State} state */
export const transitionHostGame = (state) => {
  if (state.ui_state !== "main") {
    return state;
  }

  hostGame().then(dispatch);

  return starting("Starting Host");
};

/**
 * @param {string} joinToken
 * @returns {(state: State) => State}
 */
export const transitionJoinGame = (joinToken) => (state) => {
  if (state.ui_state !== "join_menu") {
    return state;
  }

  joinGame(joinToken).then(dispatch);

  return starting("Joining Game");
};

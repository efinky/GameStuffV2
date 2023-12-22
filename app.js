import { createStore } from "./lib/not-react-redux/not-redux.js";
import { renderMainMenu } from "./ui/main-menu.js";
import { renderPlaying } from "./ui/playing.js";
import { mainState, transitionJoinGame, transitionJoinMenu } from "./ui/ui-state.js";
import { renderStarting } from "./ui/starting.js";
import { renderJoinMenu } from "./ui/join-menu.js";

// We use the url hash to pass the join token which is used to join a game. This
// way we can just paste a join link into the browser and it will join the game.
function getJoinToken() {
  const hash = window.location.hash;
  if (hash) {
    // Remove hash from url
    window.history.replaceState(null, "", window.location.pathname);
    return hash.slice(1);
  }
  return null;
}

function joinGameIfHash() {
  const joinToken = getJoinToken();
  if (joinToken) {
    // If we have a join token, try to join the game
    dispatch(transitionJoinMenu(joinToken));
  }
}

// On hash change, try to join game
window.addEventListener("hashchange", joinGameIfHash);

// Create a store for our UI state, and render the UI based on the state.
export const { dispatch, getState } = createStore(mainState, (state) => {
  if (state.ui_state === "main") {
    renderMainMenu(document.body, state);
  } else if (state.ui_state === "playing") {
    renderPlaying(document.body, state);
  } else if (state.ui_state === "starting") {
    renderStarting(document.body, state);
  } else if (state.ui_state === "join_menu") {
    renderJoinMenu(document.body, state);
  } else {
    throw new Error(`Unknown state ${JSON.stringify(state)}`);
  }
});

// Join game if hash is present
joinGameIfHash();

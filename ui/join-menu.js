import {
  render,
  html,
  findElements,
} from "../lib/not-react-redux/not-react.js";
import { dispatch } from "../app.js";
import { transitionJoinGame, transitionMainMenu } from "./ui-state.js";

/**
 * This extra state is unfortunately load bearing. If we don't have this state
 * then "joining" will not be a UI initiated action, and the browser won't allow
 * us to play audio.
 *
 * @param {HTMLElement} element
 * @param {import("./ui-state.js").JoinMenuState} state
 */
export function renderJoinMenu(element, state) {
  const node = render(
    element,
    html`
      <div class="main-menu flex-column">
        <h1>Tank Game!</h1>
        <button class="btn" id="joinButton">Join Game</button>
      </div>
    `
  );
  const { joinButton } = findElements(node, {
    joinButton: HTMLButtonElement,
  });

  joinButton.addEventListener("click", () => {
    dispatch(transitionJoinGame(state.token));
  });
}

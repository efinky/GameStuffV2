import {
  render,
  html,
  findElements,
} from "../lib/not-react-redux/not-react.js";
import { dispatch } from "../app.js";
import {
  transitionHostGame,
  transitionSinglePlayerGame,
} from "./ui-state.js";

/**
 * @param {HTMLElement} element
 * @param {import("./ui-state.js").MainState} state
 */
export function renderMainMenu(element, state) {
  const node = render(
    element,
    html`
      <div class="main-menu flex-column">
        <h1>Tank Game!</h1>
        <button class="btn" id="singlePlayerButton">Single Player</button>
        <button class="btn" id="multiplayerButton">Host Game</button>
      </div>
      <dialog id="errorDialog">
        <form class="flex-column" method="dialog">
          <strong>Error</strong>
          <p>${state.errorMsg}</p>
          <button autofocus>Close</button>
        </form>
      </dialog>
    `
  );
  const { errorDialog, multiplayerButton, singlePlayerButton } =
    findElements(node, {
      errorDialog: HTMLDialogElement,
      multiplayerButton: HTMLButtonElement,
      singlePlayerButton: HTMLButtonElement,
    });

  if (state.errorMsg) {
    errorDialog.showModal();
  }
  multiplayerButton.addEventListener("click", () => {
    dispatch(transitionHostGame);
  });
  singlePlayerButton.addEventListener("click", () => {
    dispatch(transitionSinglePlayerGame);
  });
}

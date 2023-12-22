import { render, html } from "../lib/not-react-redux/not-react.js";

/**
 * @param {HTMLElement} element
 * @param {import("./ui-state.js").StartingState} state
 */
export function renderStarting(element, state) {
  render(
    element,
    html`
      <div class="main-menu flex-column">
        <h1>${state.msg}</h1>
        <div class="spinner"></div>
      </div>
    `
  );
}

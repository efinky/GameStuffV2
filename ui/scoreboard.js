import { render, html } from "../lib/not-react-redux/not-react.js";
import { GameState } from "../tank/game-state.js";

/**
 * @param {HTMLElement} element
 * @param {GameState} gameState
 */
export function renderScoreboard(element, gameState) {
  render(
    element,
    Object.values(gameState.scores)
      .map(
        ({ playerName, score }) => html`
          <div class="score-entry">
            <span class="player-name">${playerName}</span>
            <span class="player-score">${score}</span>
          </div>
        `
      )
      .join("")
  );
}

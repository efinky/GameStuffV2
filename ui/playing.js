import {
  render,
  html,
  findElements,
} from "../lib/not-react-redux/not-react.js";
import { dispatch } from "../app.js";
import { ResponsiveCanvasElement } from "../lib/responsive-canvas/responsive-canvas.js";
// import { keyHandlers } from "../tank/input.js";
// import { onFrame } from "../tank/onFrame.js";
// import { renderScoreboard } from "./scoreboard.js";
import { transitionError } from "./ui-state.js";
import { NetworkedGame } from "../lib/networking/networked-game.js";
import { Server } from "../lib/networking/server.js";

/**
 * @param {HTMLElement} element
 * @param {import("./ui-state.js").PlayingState} state
 */
export function renderPlaying(element, state) {
  const joinLink = state.joinLink;
  const node = render(
    element,
    html`
      <responsive-canvas id="canvas"></responsive-canvas>
      <button class="settings-btn" id="settingsButton" title="Settings">
        ⚙️
      </button>

      <div id="scoreboard" class="scoreboard"></div>

      <dialog id="settingsDialog">
        <label
          >Controls:
          <ul>
            <li>Arrow keys to move</li>
            <li>Space to shoot</li>
            <li>'A' and 'D' to rotate turret</li>
          </ul>
        </label>

        <form method="dialog">
          <label
            >Player Name:
            <input
              autofocus
              type="text"
              id="playerName"
              placeholder="Enter your player name"
          /></label>
          <label style="display: ${joinLink !== "" ? "block" : "none"};">
            Join Link:
            <div class="flex-row">
              <input type="text" value="${joinLink}" readonly />
              <button type="button" id="copyButton" title="Copy to Clipboard">
                📋
              </button>
            </div>
          </label>
          <button>Back</button>
          ${NetworkedGame.debug && state.networkedGame.isHost
            ? html`
                <button
                  type="button"
                  id="collectDiagnostics"
                  title="Collect Diagnostics"
                >
                  Collect Diagnostics 📝
                </button>
              `
            : html``}
        </form>
      </dialog>
    `
  );

  const elements = findElements(node, {
    playerName: HTMLInputElement,
    copyButton: HTMLButtonElement,
    settingsButton: HTMLButtonElement,
    settingsDialog: HTMLDialogElement,
    canvas: ResponsiveCanvasElement,
    // scoreboard: HTMLDivElement,
  });

  const { settingsDialog, scoreboard, canvas } = elements;

  if (NetworkedGame.debug && state.networkedGame.isHost) {
    const { collectDiagnostics } = findElements(node, {
      collectDiagnostics: HTMLButtonElement,
    });
    collectDiagnostics.addEventListener("click", async () => {
      if (state.networkedGame.network instanceof Server) {
        const collectedDiagnostics =
          await state.networkedGame.network.collectDiagnostics();
        // copy to clipboard
        navigator.clipboard.writeText(
          JSON.stringify(collectedDiagnostics, null, 2)
        );
      }
    });
  }

  const toggleDialog = () => {
    if (settingsDialog.open) {
      settingsDialog.close();
    } else {
      settingsDialog.showModal();
    }
  };

  // escape key toggles the settings dialog
  node.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      toggleDialog();
      e.preventDefault();
    }
  });

  elements.settingsButton.addEventListener("click", toggleDialog);

  elements.copyButton.addEventListener("click", () => {
    navigator.clipboard.writeText(joinLink);
  });

  const playerName = localStorage.getItem("playerName");
  if (playerName) {
    state.networkedGame.sendEvent({
      type: "setPlayerName",
      playerName,
    });
  }

  elements.playerName.addEventListener("blur", function (e) {
    // set player name in Local Storage
    localStorage.setItem("playerName", this.value);

    state.networkedGame.sendEvent({
      type: "setPlayerName",
      playerName: this.value,
    });
  });

  // state.networkedGame.addWatcher(
  //   () => JSON.stringify(state.gameState.scores),
  //   (_prev, _next) => {
  //     renderScoreboard(scoreboard, state.gameState);
  //   }
  // );
  // renderScoreboard(scoreboard, state.gameState);

  // state.networkedGame.addWatcher(
  //   () => state.gameState.scores[state.networkedGame.clientId]?.playerName,
  //   (_prev, next) => {
  //     elements.playerName.setAttribute("value", next);
  //   }
  // );

  canvas.onFrame((e) => {
    const { context, time } = e.detail;

    const { disconnected, timeSinceLastUpdate, outputEvents } =
      state.networkedGame.update(time);

    if (disconnected) {
      dispatch(transitionError("Disconnected from game"));
    } else {
      onFrame(
        timeSinceLastUpdate,
        context,
        state.networkedGame.clientId,
        state.gameState,
        outputEvents
      );
    }
  });

  const { onkeydown, onkeyup } = keyHandlers((event) => {
    state.networkedGame.sendEvent(event);
  });

  canvas.addEventListener("keydown", onkeydown);

  canvas.addEventListener("keyup", onkeyup);
}

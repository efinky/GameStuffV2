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

import { draw } from "../draw/draw.js";
import { WorldState, serializer } from "../game-state/worldState.js";
import { Inventory } from "./inventory.js";
import { Vector2d } from "../lib/vector2d/vector2d.js";
import { Rect } from "../lib/vector2d/rect.js";

/**
 *
 * @param {number} timeSinceLastUpdate
 * @param {CanvasRenderingContext2D} context
 * @param {string} clientId
 * @param {WorldState} worldState
 * @param {import("./ui-state.js").WorldEvent[]} outputEvents
 */
function onFrame(
  timeSinceLastUpdate,
  context,
  clientId,
  worldState,
  outputEvents
) {
  draw(context, worldState, clientId);
}

/** @param {MouseEvent} mouseEvent */
function getCanvasMousePos(mouseEvent) {
  console.log(mouseEvent);
  if (
    !mouseEvent.target ||
    !(mouseEvent.target instanceof ResponsiveCanvasElement)
  ) {
    return null;
  }

  const rect = mouseEvent.target.getBoundingClientRect();
  return new Vector2d(
    mouseEvent.clientX - rect.left,
    mouseEvent.clientY - rect.top
  );
}

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
      <player-inventory id="inventory"></player-inventory>

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
    inventory: Inventory,
  });

  const { settingsDialog, canvas, inventory } = elements;

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

  /** @param {import("../game-state/worldState.js").PlayerAction} event */
  function sendEvent(event) {
    const serializedEvent = serializer.stringify(event);
    state.networkedGame.sendEvent(serializedEvent);
  }

  const playerName = localStorage.getItem("playerName");
  if (playerName) {
    sendEvent({
      type: "setPlayerName",
      playerName,
    });
  }

  elements.playerName.addEventListener("blur", function (e) {
    // set player name in Local Storage
    localStorage.setItem("playerName", this.value);

    sendEvent({
      type: "setPlayerName",
      playerName: this.value,
    });
  });

  // state.networkedGame.addWatcher(
  //   () => JSON.stringify(state.worldState.scores),
  //   (_prev, _next) => {
  //     renderScoreboard(scoreboard, state.worldState);
  //   }
  // );
  // renderScoreboard(scoreboard, state.worldState);

  // state.networkedGame.addWatcher(
  //   () => state.worldState.scores[state.networkedGame.clientId]?.playerName,
  //   (_prev, next) => {
  //     elements.playerName.setAttribute("value", next);
  //   }
  // );

  canvas.onFrame((e) => {
    const { context, time } = e.detail;

    const { disconnected, timeSinceLastUpdate, outputEvents } =
      state.networkedGame.update(state.worldState);

    const itemMap = (/** @type {number} */ id) => {
      let item = state.worldState.items[id];
      let image = /** @type {HTMLImageElement} */ (
        state.worldState.itemImages[item.tileNumber].cloneNode(false)
      );
      return { id, image, item };
    };

    for (const event of outputEvents) {
      if (
        event.type === "inventoryUpdated" &&
        event.clientId === state.networkedGame.clientId
      ) {
        const equippedItems =
          state.worldState.players[state.networkedGame.clientId].equipped;
        const playerInventory =
          state.worldState.players[state.networkedGame.clientId].inventory.map(
            itemMap
          );
        let playerEquipped = {
          head: equippedItems.head === null ? null : itemMap(equippedItems.head),
          leftHand: equippedItems.leftHand === null ? null : itemMap(equippedItems.leftHand),
          rightHand: equippedItems.rightHand === null ? null : itemMap(equippedItems.rightHand),
          torso: equippedItems.torso === null ? null : itemMap(equippedItems.torso),
          legs: equippedItems.legs === null ? null : itemMap(equippedItems.legs),
          leftFoot: equippedItems.leftFoot === null ? null : itemMap(equippedItems.leftFoot),
          rightFoot: equippedItems.rightFoot === null ? null : itemMap(equippedItems.rightFoot),
        };
        console.log("playerInventory", playerInventory);
        console.log("playerEquipped", playerEquipped);
        inventory.update(playerInventory, playerEquipped);
      }
    }

    if (disconnected) {
      dispatch(transitionError("Disconnected from game"));
    } else {
      onFrame(
        timeSinceLastUpdate,
        context,
        state.networkedGame.clientId,
        state.worldState,
        outputEvents
      );
    }
  });

  // const { onkeydown, onkeyup } = keyHandlers((event) => {
  //   state.networkedGame.sendEvent(event);
  // });

  //Make types happy
  //fix events
  //fix equip from slot

  /** @param {import("./inventory.js").InventoryEvent} event */
  const equipFromInventory = (event) => {
    sendEvent({
      type: "equipItem",
      slot: event.detail.slot,
      id: event.detail.inventoryItem.id,
    });
  }

  inventory.addEventListener("drop-from-inventory", (event) => {
    sendEvent({
      type: "dropItemFromInventory",
      id: event.detail.inventoryItem.id,
    });
  });

  inventory.addEventListener("drop-from-slot", (event) => {
    sendEvent({
      type: "dropItemFromSlot",
      slot: event.detail.slot,
      id: event.detail.inventoryItem.id,
    });
  });

  inventory.addEventListener("equip-from-inventory", equipFromInventory);

  inventory.addEventListener("equip-from-slot", (event) => {
    sendEvent({
      type: "equipItemFromSlot",
      newSlot: event.detail.newSlot,
      oldSlot: event.detail.oldSlot,
    });
  });
  inventory.addEventListener("unequip", (event) => {
    sendEvent({
      type: "unEquipItem",
      slot: event.detail.slot,
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.key == "i") {
      inventory.toggle();
      event.preventDefault();
    } else if (event.key == "g") {
      sendEvent({
        type: "pickupItem",
      });

      event.preventDefault();
    } else if (event.key == "a") {
      
      sendEvent({
        type: "attack",
      });
      event.preventDefault();
    }
  });
  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
  let mouseDown = false;
  canvas.addEventListener("mousedown", (event) => {
    if (event.button == 0) {
      const cPos = new Vector2d(event.offsetX, event.offsetY);
      let tileSize = state.worldState.map.tileSize();
      let mapSize = state.worldState.map.size().mul(tileSize);
      let canvasSize = new Vector2d(canvas.width(), canvas.height());
      let mapRect = new Rect(new Vector2d(0, 0), mapSize.sub(canvasSize));
      let player = state.worldState.players[state.networkedGame.clientId];
      let viewportOrigin_w = player.characterPos_w
        .sub(canvasSize.scale(0.5))
        .clamp(mapRect);
      const moveTarget = state.worldState.map.viewportToWorld(
        cPos,
        viewportOrigin_w
      );
      console;
      if (!cPos) {
        return;
      }
      mouseDown = true;
      sendEvent({
        type: "moveTarget",
        moveTarget,
      });
      event.stopPropagation();
    }
  });
  canvas.addEventListener("mouseup", (event) => {
    if (event.button == 0) {
      mouseDown = false;
      sendEvent({
        type: "moveTarget",
        moveTarget: null,
      });
    }
  });
  canvas.addEventListener("mousemove", (event) => {
    if (event.buttons === 1) {
      const cPos = new Vector2d(event.offsetX, event.offsetY);
      let tileSize = state.worldState.map.tileSize();
      let mapSize = state.worldState.map.size().mul(tileSize);
      let canvasSize = new Vector2d(canvas.width(), canvas.height());
      let mapRect = new Rect(new Vector2d(0, 0), mapSize.sub(canvasSize));
      let player = state.worldState.players[state.networkedGame.clientId];
      let viewportOrigin_w = player.characterPos_w
        .sub(canvasSize.scale(0.5))
        .clamp(mapRect);
      const moveTarget = state.worldState.map.viewportToWorld(
        cPos,
        viewportOrigin_w
      );
      if (!cPos) {
        return;
      }
      sendEvent({
        type: "moveTarget",
        moveTarget,
      });
      event.stopPropagation();
    }
  });
}

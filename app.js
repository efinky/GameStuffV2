// @ts-check

import { Vector2d } from "./vector2d.js";
import { Rect } from "./rect.js";
import { WorldMap } from "./worldMap.js";
import { PlayerSet as CharacterSet } from "./playerSet.js";
import { Inventory } from "./inventory.js";
import { WorldState, serializer } from "./worldState.js";
import * as Events from "./events.js";
import { moveMonsters, movePlayer } from "./movement.js";
import { Player } from "./player.js";
import { Server } from "./lib/networking/server.js";
import { connect, listen } from "./lib/webrtc/webrtc-sockets.js";
import { Client } from "./lib/networking/client.js";
import { Serializer } from "./serializer.js";
import { Monster } from "./monster.js";
import { draw } from "./draw.js";
import { PCG32 } from "./lib/pcg.js";
import { Watcher } from "./watcher.js";

/** @typedef {import("./tiledLoader.js").ItemProperty} ItemProperty */
/** @typedef {import("./tiledLoader.js").EquipType} EquipType */
/** @typedef {import("./character.js").EquippableSlot}  EquippableSlot */
// import someData from "./test.json" assert { type: "json" };

/** @typedef {{type: "pickupItem", id: number}} PickupAction */
/** @typedef {{type: "dropItem", id: number}} DropAction */
/** @typedef {{type: "equipItem", id: number, slot: EquippableSlot}} EquipAction */
/** @typedef {{type: "unEquipItem", slot: EquippableSlot}} UnEquipAction */
/** @typedef {PickupAction|DropAction|EquipAction|UnEquipAction} InventoryAction */


/** @typedef {{type: "moveTarget", moveTarget: Vector2d|null}} MovementAction */
/** @typedef {{type: "attack"}} AttackAction */
/** @typedef {{type: "monsterUpdateAction", monsters: Monster[]}} MonsterUpdateAction */
/** @typedef {MovementAction|AttackAction|MonsterUpdateAction|InventoryAction} PlayerAction */
/** @typedef {import("./lib/networking/simulation.js").SimChunk<PlayerAction>} SimChunk */

/**
 * @typedef {import("./lib/networking/simulation.js").SimulationClient<PlayerAction>} SimulationClient
 */

/*


 * ItemTypes
Consumable
Small
Hand
Chest
Head
Feet
 */

/** @param {string} id */
function getElement(id) {
  let elem = document.getElementById(id);
  if (!elem) {
    throw Error(`Failed to find element with id: ${id}`);
  }
  return elem;
}

/** @param {MouseEvent} mouseEvent */
function getCanvasMousePos(mouseEvent) {
  if (!mouseEvent.target || !(mouseEvent.target instanceof HTMLCanvasElement)) {
    return null;
  }

  const rect = mouseEvent.target.getBoundingClientRect();
  return new Vector2d(
    mouseEvent.clientX - rect.left,
    mouseEvent.clientY - rect.top
  );
}

export async function run() {
  let worldState = await WorldState.init({
    map: "BasicMap.json",
    monsterSet: "Monsters.json",
    playerSet: "Player.json",
  });

  // worldState.initItems(assets.mapCurrent);

  const url = new URL(document.URL);
  const hash = decodeURIComponent(url.hash.slice(1));
  /** @type {SimulationClient} */
  let networkHandler;
  if (hash == "") {
    // console.log("hash", hash);
    // if (hash === "host") {
    const { token, start: startListen } = await listen();
    const server = Server.init({ getState: () => worldState });
    const { stop } = await startListen({
      onConnect: (channel) => server.onConnect(channel),
    });
    // set the hash to the token so that clients can connect
    url.hash = encodeURIComponent(token);
    history.replaceState(null, "", url.toString());
    networkHandler = server;
  } else {
    const token = decodeURIComponent(hash);
    let channel = await connect(token);
    const { client, clientId, state: s } = await Client.init(channel);

    worldState = await WorldState.fromJSON(s);
    console.log("WorldState:", worldState);
    networkHandler = client;
  }
  // }

  Events.setWorldState(worldState);

  /** @type {{[key: number]: boolean}} */
  let keystate = [];
  /** @type {Vector2d|null} */
  let localMoveTarget = null;
  let timestamp = performance.now();
  let lastSent = 0;

  const player = worldState.players[networkHandler.clientId];

  const inventory = document.getElementById("inventory");


  // let inventory = new Inventory(
  //   getElement("inventoryBox"),
  //   player,
  //   worldState.itemImages
  // );

  let canvas = document.getElementById("canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  updateCanvasSize(document, canvas);
  document.addEventListener("keydown", (event) => {
    keystate[event.keyCode] = true;
    if (event.key == "i") {
      if (inventory instanceof Inventory) {
          inventory.toggle();
      }
      event.preventDefault();
    } else if (event.key == "g") {
      // Events.dispatch(Events.PickupItem(worldState.map, player.clientID));
      const player = worldState.players[networkHandler.clientId];
      console.log(player);
      let id = worldState.getItemOnGround(player.characterPos_w)?.id;
      if (id) {
        networkHandler.sendEvent({
          type: "pickupItem",
          id: id
        });
      }
      event.preventDefault();
    } else if (event.key == "a") {
      //find direction player is facing
      //get bounding box for where character is facing
      //search character list for any character in that bounding box.
      // console.log("dir",worldState.player.direction);
      // console.log("position", worldState.player.characterPos_w);
      // console.log("lastVel", worldState.player.lastVelocity);
      // Events.dispatch(Events.PlayerAttack);
      networkHandler.sendEvent({
        type: "attack",
      });
      event.preventDefault();
    }
  });
  document.addEventListener("keyup", (event) => {
    keystate[event.keyCode] = false;
  });
  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
  canvas.addEventListener("mousedown", (event) => {
    if (event.button == 0) {
      const cPos = getCanvasMousePos(event);
      if (!cPos) {
        return;
      }
      localMoveTarget = cPos;
      event.stopPropagation();
    } else if (event.button == 2) {
      //   const cPos = getCanvasMousePos(event);
      //   if (cPos && canvas instanceof HTMLCanvasElement) {
      //     let tileSize = assets.mapCurrent.tileSize();
      //     let mapSize = assets.mapCurrent.size().mul(tileSize);
      //     let canvasSize = new Vector2d(canvas.width, canvas.height);
      //     let mapRect = new Rect(new Vector2d(0, 0), mapSize.sub(canvasSize));
      //     let viewportOrigin_w = worldState.player.characterPos_w
      //       .sub(canvasSize.scale(0.5))
      //       .clamp(mapRect);
      //     worldState.player.setDebugPathTarget(cPos.add(viewportOrigin_w));
      //     // const debugPath = assets.mapCurrent.findPath(worldState.player.characterPos_w, cPos.add(viewportOrigin_w), 0);
      //     // worldState.player.debugPath = debugPath;
      //   }
      event.stopPropagation();
      event.preventDefault();
    }
  });
  canvas.addEventListener("mouseup", (event) => {
    if (event.button == 0) {
      console.log("mouseup");
      localMoveTarget = null;
      networkHandler.sendEvent({
        type: "moveTarget",
        moveTarget: null,
      });
    }
    if (event.button == 2) {
      event.stopPropagation();
      event.preventDefault();
    }
  });
  canvas.addEventListener("mousemove", (event) => {
    if (localMoveTarget != null) {
      const cPos = getCanvasMousePos(event);
      if (!cPos) {
        return;
      }
      localMoveTarget = cPos;
      event.stopPropagation();
    }
  });

  window.addEventListener(
    "resize",
    () => {
      if (!(canvas instanceof HTMLCanvasElement)) {
        console.log("Canvas is null... there is no hope");
        return;
      }
      updateCanvasSize(document, canvas);
    },
    false
  );
  window.requestAnimationFrame(onFrame);


  // TODO FIX THIS Maybe use a class instead so that the generics work between getter and onChange
  /**
    * @type {Watcher<WorldState, any>[]}
   */
  const watchers = [new Watcher((state) => state.players[networkHandler.clientId], (oldPlayer, newPlayer) => {
    // inventory.updatePlayer(newPlayer);
  })]
  /**
   *
   * @param {number} now
   */
  function onFrame(now) {
    if (localMoveTarget != null) {
      if (!(canvas instanceof HTMLCanvasElement)) {
        return;
      }
      let player = worldState.players[networkHandler.clientId];
      console.log("player position", player.characterPos_w);
      let tileSize = worldState.map.tileSize();

      let mapSize = worldState.map.size().mul(tileSize);
      let canvasSize = new Vector2d(canvas.width, canvas.height);
      let mapRect = new Rect(new Vector2d(0, 0), mapSize.sub(canvasSize));

      let viewportOrigin_w = player.characterPos_w
        .sub(canvasSize.scale(0.5))
        .clamp(mapRect);
      const moveTarget = worldState.map.viewportToWorld(
        localMoveTarget,
        viewportOrigin_w
      );
      console.log("moveTarget", moveTarget);
      networkHandler.sendEvent({
        type: "moveTarget",
        moveTarget,
      });
    }

    if (now > lastSent) {
      lastSent = now + 1000;
      networkHandler.sendEvent({
        type: "monsterUpdateAction",
        monsters: worldState.monsters,
      });
      console.log("last state:", networkHandler.stateAtLastConnect);
      console.log(
        "events since last connect: ",
        networkHandler.eventsSinceLastConnect
      );
    }

    const oldWatches = watchers.map((w) => w.get(worldState));

    let chunks = networkHandler.getEvents();
    if (chunks != null) {
      for (let chunk of chunks) {
        worldState.processChunk(chunk);
      }
    }

    const newWatches = watchers.map((w) => w.get(worldState));
    for (let i = 0; i < watchers.length; i++) {
      watchers[i].check(oldWatches[i], newWatches[i])
    }

    draw(worldState, networkHandler.clientId);
    window.requestAnimationFrame(onFrame);
  }

  //haha I am in your codes!

  //TODO only draw map in viewportOrigin_w
  //add mountains
  //get a better person/add animation as well.

  /**
   *
   * @param {Document} doc
   * @param {HTMLCanvasElement} canvas
   */
  function updateCanvasSize(doc, canvas) {
    canvas.width = doc.body.clientWidth;
    canvas.height = doc.body.clientHeight;
  }
}

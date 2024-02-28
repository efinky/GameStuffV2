import { WorldMap } from "./worldMap.js";
import { PlayerSet as CharacterSet } from "../tileset/playerSet.js";
import { Player } from "./player.js";
import { Monster } from "./monster.js";
import { Vector2d } from "../lib/vector2d/vector2d.js";
import { Serializer } from "../lib/serializer/serializer.js";
import { Item } from "./item.js";
import { moveMonsters, movePlayer, playerAttack } from "./movement.js";
import { Character } from "./character.js";
import { PCG32 } from "../lib/pcg/pcg.js";

/** @typedef {import("../tileset/tiledLoader.js").ItemProperty} ItemProperty */
/** @typedef {import("../tileset/tiledLoader.js").EquipType} EquipType */
/** @typedef {import("../game-state/character.js").EquippableSlot}  EquippableSlot */
// import someData from "./test.json" assert { type: "json" };

/** @typedef {{type: "pickupItem"}} PickupAction */
/** @typedef {{type: "dropItem", id: number}} DropAction */
/** @typedef {{type: "equipItem", id: number, slot: EquippableSlot}} EquipAction */
/** @typedef {{type: "equipItemFromSlot", id: number, newSlot: EquippableSlot, oldSlot: EquippableSlot}} EquipFromSlotAction */
/** @typedef {{type: "unEquipItem", slot: EquippableSlot}} UnEquipAction */
/** @typedef {PickupAction|DropAction|EquipAction|EquipFromSlotAction|UnEquipAction} InventoryAction */

/** @typedef {{type: "moveTarget", moveTarget: Vector2d|null}} MovementAction */
/** @typedef {{type: "attack"}} AttackAction */
/** @typedef {{type: "monsterUpdateAction", monsters: Monster[]}} MonsterUpdateAction */
/** @typedef {MovementAction|AttackAction|MonsterUpdateAction|InventoryAction} PlayerAction */


/** @typedef {{type: "inventoryUpdated", clientId: string}} InventoryOutput */
/** @typedef {InventoryOutput} WorldEvent */


/**
 * @param {never} x
 * @returns {never}
 */
function assertUnreachable(x) {
  throw new Error("Didn't expect to get here");
}

/** @typedef {Awaited<ReturnType<typeof WorldState.loadAssets>>} Assets */
// // Typedef of the return type of loadAssets
// /**
//     * @typedef {Object} Assets
//     * @property {WorldMap} mapCurrent
//     * @property {CharacterSet} playerSet
//     * @property {CharacterSet} monsterSet
//     * @property {HTMLImageElement[]} itemImages
//     */

export const serializer = new Serializer([
  WorldMap,
  Player,
  Monster,
  Vector2d,
  PCG32,
  Item,
]);

export class WorldState {
  /**
   * @param {Assets} assets
   * @param {{map: string, monsterSet: string, playerSet: string }} assetJson
   */
  constructor(assets, assetJson) {
    this.rng = new PCG32();
    this.map = assets.map;
    this.assetJson = assetJson;
    this.playerSet = assets.playerSet;
    this.monsterSet = assets.monsterSet;
    this.itemImages = assets.itemImages;
    /** @type {{[key: string]: Player}} */
    this.players = {};
    /** @type {{[key: string]: Monster[]} }*/
    this.otherPlayersMonsters = {};
    /** @type {WorldEvent[]} */
    this.outputEvents = [];
    /** @type {Monster[]} */
    this.monsters = [];
    this.monsters.push(
      new Monster("bob", "Goblin", new Vector2d(1100, 1100), this.rng)
    );
    this.monsters.push(
      new Monster(
        "bob1",
        "Goblin",
        new Vector2d(
          this.rng.randomInt(1000, 2000),
          this.rng.randomInt(1000, 2000)
        ),
        this.rng
      )
    );
    this.monsters.push(
      new Monster(
        "bob2",
        "Goblin",
        new Vector2d(
          this.rng.randomInt(1000, 2000),
          this.rng.randomInt(1000, 2000)
        ),
        this.rng
      )
    );
    this.monsters.push(
      new Monster(
        "bob3",
        "Goblin",
        new Vector2d(
          this.rng.randomInt(1000, 2000),
          this.rng.randomInt(1000, 2000)
        ),
        this.rng
      )
    );
    this.monsters.push(
      new Monster(
        "bob4",
        "Goblin",
        new Vector2d(
          this.rng.randomInt(1000, 2000),
          this.rng.randomInt(1000, 2000)
        ),
        this.rng
      )
    );
    this.time = 0;
    /** @type {Item[]} */
    this.items = [];
    /** @type {{pos: Vector2d, id: number}[]} */
    this.itemsOnGround = [];
    // let serializer = new Serializer([WorldState, WorldMap, Player, Monster, Vector2d]);
    // const jsony = serializer.stringify(this);

    // console.log("state:", jsony);
  }
  /**
   *
   * @param {{map: string, playerSet: string, monsterSet: string}} assetJson
   */
  static async init(assetJson) {
    const assets = await WorldState.loadAssets(assetJson);
    const worldState = new WorldState(assets, assetJson);
    worldState.loadMapItems(assets.items);

    return worldState;
  }

  /** @param {Vector2d} pos */
  getItemOnGround(pos) {
    let tileSize = this.map.tileSize();
    const item = this.itemsOnGround.find(
      (e) => e.pos.mul(tileSize).distance(pos) < tileSize.magnitude() / 2
    );
    return item;
  }

  /**
   *
   * @param {{pos: Vector2d, item: Item}[]} items
   */
  loadMapItems(items) {
    for (let { pos, item } of items) {
      let id = this.items.push(item) - 1;
      this.itemsOnGround.push({ pos, id });
    }
  }
  characters() {
    let playerArray = [];
    for (let key in this.players) {
      playerArray.push(this.players[key]);
    }
    return [...this.monsters, ...playerArray];
  }

  /**
   * @param {{map: string, playerSet: string, monsterSet: string}} assetJson
   */
  static async loadAssets(assetJson) {
    let { map, items } = await WorldMap.load(assetJson.map);

    /** @type {{[idx: number]: HTMLImageElement}} */
    let itemImages = [];
    for (let item of Object.values(items).map((i) => i.item)) {
      const itemImage = map.itemImageFromTileNumber(item.tileNumber);
      if (itemImage) {
        itemImages[item.tileNumber] = itemImage;
      }
    }

    let playerSet = await CharacterSet.load(assetJson.playerSet); // "Player.json"
    let monsterSet = await CharacterSet.load(assetJson.monsterSet); // "Monsters.json"
    return { map, playerSet, monsterSet, itemImages, items };
  }

  /** 
    @param {number} dt
     */
  update(dt) {
    this.time += dt;
    moveMonsters(
      dt,
      this.time,
      this.monsters,
      this.players,
      this.characters(),
      this.map,
      this
    );

    movePlayer(dt, this.players, this.characters(), this.map);
    return this.outputEvents.splice(0);
  }

  /**
   * @param {Character} monster
   */
  monsterDeath(monster) {
    this.monsters = this.monsters.filter((e) => e !== monster);
  }

  /**
   * @param {string} clientId
   */

  playerAttack(clientId) {
    const player = this.players[clientId];
    let deadMonster = playerAttack(this.time, player, this.monsters);
    if (deadMonster) {
      this.monsterDeath(deadMonster);
    }
  }

  /**
   *
   * @param {string} clientId
   */
  onPlayerJoined(clientId) {
    if (!this.players[clientId]) {
      this.players[clientId] = new Player(
        "Bob",
        "Warrior",
        new Vector2d(900, 900),
        clientId
      );
      console.log("player added");
    } else {
      console.log("player " + clientId + " has rejoined the game");
    }
  }

  /**
   *
   * @param {string} clientId
   */
  onPlayerLeft(clientId) {}

  /**
   *
   * @param {string} clientId
   * @param {string} event
   */
  onEvent(clientId, event) {
    /** @type {PlayerAction} */
    const peerEvent = serializer.parse(event);
    switch (peerEvent.type) {
      case "moveTarget":
        {
          // Add move target onto player
          this.players[clientId].setMoveTarget(peerEvent.moveTarget);
        }
        break;
      case "attack":
        {
          this.playerAttack(clientId);
        }
        break;
      case "monsterUpdateAction": {
        this.otherPlayersMonsters[clientId] = peerEvent.monsters;
        break;
      }
      case "pickupItem": {
        const player = this.players[clientId];
        const itemId = this.getItemOnGround(player.characterPos_w)?.id;
        console.log(itemId);
        if (itemId){
          const itemIndex = this.itemsOnGround.findIndex((e) => e.id === itemId);
          if (itemIndex === -1) {
            console.log("item not found");
            break;
          }
          const item = this.itemsOnGround[itemIndex];
          player.pickupItem(item.id);
          this.itemsOnGround.splice(itemIndex, 1);
        }
        else {
          console.log("No Items for you! (error... item was a holagram)");
        }
        // Find item in itemsOnGround, remove it from itemsOnGround, and add it to player's inventory
        this.outputEvents.push({ type: "inventoryUpdated", clientId });
        break;
      }
      case "dropItem": {
        const player = this.players[clientId];
        const itemId = peerEvent.id;
        if (player.dropItem(itemId)) {
          this.itemsOnGround.push({ pos: player.characterPos_w, id: itemId });
        }
        this.outputEvents.push({ type: "inventoryUpdated", clientId });
        break;
      }
      case "equipItem": {
        const player = this.players[clientId];
        const itemId = peerEvent.id;
        const slot = peerEvent.slot;
        player.equipItem(itemId, slot);
        this.outputEvents.push({ type: "inventoryUpdated", clientId });
        break;
      }
      case "unEquipItem": {
        const player = this.players[clientId];
        const slot = peerEvent.slot;
        player.unEquipItem(slot);
        this.outputEvents.push({ type: "inventoryUpdated", clientId });
        break;
      }
      case "equipItemFromSlot" : {
        const player = this.players[clientId];
        const oldSlot = peerEvent.oldSlot;
        const newSlot = peerEvent.newSlot;
        player.equipFromSlot(oldSlot, newSlot);
        this.outputEvents.push({type: "inventoryUpdated", clientId});
        break;
      }
    }
  }

  /**
   * @param {string} json
   * @returns {Promise<WorldState>}
   */
  static async deserialize(json) {
    const obj = serializer.parse(json);
    const assetJson = obj.assetJson;
    const assets = await WorldState.loadAssets(assetJson);
    obj.map = assets.map;
    obj.playerSet = assets.playerSet;
    obj.monsterSet = assets.monsterSet;
    obj.itemImages = assets.itemImages;
    Object.setPrototypeOf(obj, WorldState.prototype);
    return obj;
  }

  serialize() {
    return serializer.stringify({
      rng: this.rng,
      assetJson: this.assetJson,
      players: this.players,
      monsters: this.monsters,
      items: this.items,
      itemsOnGround: this.itemsOnGround,
      otherPlayersMonsters: {},
      time: this.time,
      outputEvents: [],
    });
  }
}

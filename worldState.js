import { WorldMap } from "./worldMap.js";
import { PlayerSet as CharacterSet } from "./playerSet.js";
import { Player } from "./player.js";
import { Monster } from "./monster.js";
import { Vector2d } from "./vector2d.js";
import { Serializer } from "./serializer.js";
import { Item } from "./item.js";
import { moveMonsters, movePlayer, playerAttack } from "./movement.js";
import { Character } from "./character.js";
import { PCG32 } from "./lib/pcg.js";

/**
  * @param {never} x
  * @returns {never}
  */
function assertUnreachable(x) {
  throw new Error("Didn't expect to get here");
}

/** @typedef {import("./app.js").SimChunk} SimChunk */

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
    const assets = await this.loadAssets(assetJson);
    const worldState = new WorldState(assets, assetJson);
    worldState.loadMapItems(assets.items);

    return worldState;
  }

  /** @param {Vector2d} pos */
  getItemOnGround(pos) {
    return this.itemsOnGround.find((e) => e.pos.distance(pos) < 32);
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
   *
   * @param {string} clientId
   */
  playerConnected(clientId) {
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
    @param {SimChunk} chunk
     */
  processChunk(chunk) {
    const { peerEvents, dt } = chunk;
    for (const event of peerEvents) {
      switch (event.msg.type) {
        case "peerJoined":
          this.playerConnected(event.clientId);
          break;
        case "peerLeft":
          break;
        case "peerEvent":
          switch (event.msg.peerEvent.type) {
            case "moveTarget":
              {
                const clientId = event.clientId;
                // Add move target onto player
                this.players[clientId].setMoveTarget(
                  event.msg.peerEvent.moveTarget
                );
              }
              break;
            case "attack":
              {
                const clientId = event.clientId;
                this.playerAttack(clientId);
              }
              break;
            case "monsterUpdateAction": {
              this.otherPlayersMonsters[event.clientId] =
                event.msg.peerEvent.monsters;
                break;
            }
            case "pickupItem": {
              const clientId = event.clientId;
              const player = this.players[clientId];
              const itemId = event.msg.peerEvent.id;
              // Find item in itemsOnGround, remove it from itemsOnGround, and add it to player's inventory
              const itemIndex = this.itemsOnGround.findIndex((e) => e.id === itemId);
              if (itemIndex === -1) {
                console.log("item not found");
                break;
              }
              const item = this.itemsOnGround[itemIndex];
              player.pickupItem(item.id);
              this.itemsOnGround.splice(itemIndex, 1);
              break;

            }
            case "dropItem": {
              const clientId = event.clientId;
              const player = this.players[clientId];
              const itemId = event.msg.peerEvent.id;
              if (player.dropItem(itemId)) {
                this.itemsOnGround.push({ pos: player.characterPos_w, id: itemId });
              }
              break;

            }
            case "equipItem": {
              const clientId = event.clientId;
              const player = this.players[clientId];
              const itemId = event.msg.peerEvent.id;
              const slot = event.msg.peerEvent.slot;
              player.equipItem(itemId, slot);
              break;

            }
            case "unEquipItem": {
              const clientId = event.clientId;
              const player = this.players[clientId];
              const slot = event.msg.peerEvent.slot;
              player.unequipItem(slot);
              break;
            }
          }

          break;
      }
    }
    this.update(dt / 1000);
  }

  /**
   * @param {string} json
   */
  static async fromJSON(json) {
    const obj = serializer.parse(json);
    const assetJson = obj.assetJson;
    const assets = await this.loadAssets(assetJson);
    obj.map = assets.map;
    obj.playerSet = assets.playerSet;
    obj.monsterSet = assets.monsterSet;
    obj.itemImages = assets.itemImages;
    Object.setPrototypeOf(obj, WorldState.prototype);
    return obj;
  }

  toJSON() {
    return serializer.stringify({
      rng: this.rng,
      assetJson: this.assetJson,
      players: this.players,
      monsters: this.monsters,
      items: this.items,
      itemsOnGround: this.itemsOnGround,
      otherPlayersMonsters: {},
      time: this.time,
    });
  }
}

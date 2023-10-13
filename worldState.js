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

/** @typedef {import("./app.js").SimChunk} SimChunk */

export const serializer = new Serializer([
  WorldMap,
  Player,
  Monster,
  Vector2d,
  PCG32,
]);

export class WorldState {
  /**
   * @param {string} map
   */
  constructor(map) {
    this.rng = new PCG32();
    this.map = map;
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

  async loadAssets() {
    let mapCurrent = await WorldMap.load(this.map);

    for (let {pos, item} of mapCurrent.getAllItems()) {
      let id = this.items.push(item) - 1;
      this.itemsOnGround.push({pos, id});
    }

    /** @type {{[idx: number]: HTMLImageElement}} */
    let itemImages = [];
    for (let item of Object.values(this.items)) {
      const itemImage = mapCurrent.itemImageFromTileNumber(item.tileNumber);
      if (itemImage) {
        itemImages[item.tileNumber] = itemImage;
      }
    }

    let playerSet = await CharacterSet.load("Player.json");
    let monsterSet = await CharacterSet.load("Monsters.json");
    return { mapCurrent, playerSet, monsterSet, itemImages };
  }

  /** 
    @param {number} dt
    @param {WorldMap} map
     */
  update(dt, map) {
    this.time += dt;
    moveMonsters(
      dt,
      this.time,
      this.monsters,
      this.players,
      this.characters(),
      map,
      this
    );

    movePlayer(dt, this.players, this.characters(), map);
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
    @param {WorldMap} map
     */
  processChunk(chunk, map) {
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
            case "attack": {
              const clientId = event.clientId;
              this.playerAttack(clientId);
            }
            break;
            case "monsterUpdateAction": {
              this.otherPlayersMonsters[event.clientId] = event.msg.peerEvent.monsters
            }
          }

          break;
      }
    }
    this.update(dt / 1000, map);
  }

  /**
   * @param {string} json
   */
  static fromJSON(json) {
    const obj = serializer.parse(json);
    Object.setPrototypeOf(obj, WorldState.prototype);
    return obj;
  }

  toJSON() {
    return serializer.stringify({
      rng: this.rng,
      map: this.map,
      players: this.players,
      monsters: this.monsters,
      otherPlayersMonsters: {},
      time: this.time,
    });
  }
}

/** @typedef {Awaited<ReturnType<typeof WorldState.prototype.loadAssets>>} Assets */
// // Typedef of the return type of loadAssets
// /**
//     * @typedef {Object} Assets
//     * @property {WorldMap} mapCurrent
//     * @property {CharacterSet} playerSet
//     * @property {CharacterSet} monsterSet
//     * @property {HTMLImageElement[]} itemImages
//     */

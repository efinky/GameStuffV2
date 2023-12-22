import { Character } from "./character.js";
import { Monster } from "./monster.js";
import { playerAttack } from "./movement.js";
import { WorldMap } from "./worldMap.js";
import { WorldState } from "./worldState.js";
/** @typedef {{eventType: "monsterDied", monster: Monster}} WorldEvent */

// const monsterDied = (monster) => { type: "monsterDied", monster};

/**  @type {WorldState} */
let worldState;

/** 
 @param {WorldMap}  map
 @param {number} clientID
 @return {(state: WorldState) => void } */
export const PickupItem = (map, clientID) => (state) => {
  const coord = map.getLinearCoord(state.players[clientID].characterPos_w);
  console.log("PickupItem", coord);
  let item = state.items[coord];
  if (item) {
    delete state.items[coord];
    state.players[clientID].inventory.push(item);
  }
};
/**
 *
 * @param {WorldState} state
 */
export const PlayerAttack = (state) => {
  /**@type {Character | null} */
  let deadMonster = playerAttack(state.time, state.player, state.monsters);
  if (deadMonster) {
    MonsterDeath(deadMonster)(state);
  }
};
/**
 *
 * @type {(monster: Character) => ((state: WorldState) => void)}
 */
export const MonsterDeath = (monster) => (state) => {
  state.monsters = state.monsters.filter((e) => e !== monster);
};

//dispatch(MonsterDeath(monster))

/**
 *
 * @param {WorldState} ws
 */
export function setWorldState(ws) {
  worldState = ws;
}

/** @param {(state: WorldState) => void} f */
export function dispatch(f) {
  f(worldState);
}

//Events
/*
Pickup Item
Drop Item
Attack character
Heal character
Character Die
Character Move
Cast spell
Create Fire


State has Map and players and items.  Events will update State.
Everything else updates with events?
*/

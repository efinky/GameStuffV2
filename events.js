import { Character } from "./character.js";
import { Monster } from "./monster.js";
import { WorldState } from "./worldState.js";
/** @typedef {{eventType: "monsterDied", monster: Monster}} WorldEvent */

// const monsterDied = (monster) => { type: "monsterDied", monster};

/**  @type {WorldState} */
let worldState;



/** @param {WorldState} state */
export const PickupItem = (state) => {
    let item = state.mapCurrent.getItem(state.player.characterPos_w);
    if (item) {
        state.player.inventory.push(item);
    }
}
/**
 * 
 * @param {WorldState} state
 */
export const PlayerAttack = (state) => {
  /**@type {Character | null} */
  let deadMonster = state.player.attack(state.monsters);
  if (deadMonster) {
    MonsterDeath(deadMonster)(state)
  }
}
/**
 * 
 * @type {(monster: Character) => ((state: WorldState) => void)}
 */
export const MonsterDeath = (monster) => (state) => {
  state.monsters = state.monsters.filter((e) => e !== monster);
}

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
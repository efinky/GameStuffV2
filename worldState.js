import { Map } from "./map.js";
import { PlayerSet as CharacterSet } from "./playerSet.js";
import { Player } from "./player.js"
import { Monster } from "./monster.js"
import { Vector2d } from "./vector2d.js"


export class WorldState {
    /**
     * 
     * @param {Map} mapCurrent 
     * @param {CharacterSet} playerSet 
     * @param {CharacterSet} monsterSet 
     */
    constructor(mapCurrent, playerSet, monsterSet) {
        this.mapCurrent = mapCurrent;
        this.playerSet = playerSet;
        this.monsterSet = monsterSet;
        this.player = new Player("Bob", "Warrior", new Vector2d(128, 128));
        /** @type {Monster[]} */
        this.monsters = [];
        this.monsters.push(new Monster("bob", "Goblin", new Vector2d(200, 200)));
        this.monsters.push(new Monster("bob1", "Goblin", new Vector2d((Math.random() * 1000), (Math.random() * 1000))));
        this.monsters.push(new Monster("bob2", "Goblin", new Vector2d((Math.random() * 1000), (Math.random() * 1000))));
        this.monsters.push(new Monster("bob3", "Goblin", new Vector2d((Math.random() * 1000), (Math.random() * 1000))));
        this.monsters.push(new Monster("bob4", "Goblin", new Vector2d((Math.random() * 1000), (Math.random() * 1000))));
        this.time = 0;
    }

    characters() {
        return [...this.monsters, this.player];
    }
}


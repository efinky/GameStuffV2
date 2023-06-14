import { WorldMap } from "./worldMap.js";
import { PlayerSet as CharacterSet } from "./playerSet.js";
import { Player } from "./player.js"
import { Monster } from "./monster.js"
import { Vector2d } from "./vector2d.js"
import { Serializer } from "./serializer.js"


export class WorldState {
    constructor() {

        this.player = new Player("Bob", "Warrior", new Vector2d(900, 900));
        /** @type {Monster[]} */
        this.monsters = [];
        this.monsters.push(new Monster("bob", "Goblin", new Vector2d(1100, 1100)));
        this.monsters.push(new Monster("bob1", "Goblin", new Vector2d((Math.random() * 1000)+1000, (Math.random() * 1000)+1000)));
        this.monsters.push(new Monster("bob2", "Goblin", new Vector2d((Math.random() * 1000)+1000, (Math.random() * 1000)+1000)));
        this.monsters.push(new Monster("bob3", "Goblin", new Vector2d((Math.random() * 1000)+1000, (Math.random() * 1000)+1000)));
        this.monsters.push(new Monster("bob4", "Goblin", new Vector2d((Math.random() * 1000)+1000, (Math.random() * 1000)+1000)));
        this.time = 0;
        // this.toJson();
        let serializer = new Serializer([WorldState, WorldMap, Player, Monster, Vector2d]);
        const jsony = serializer.stringify(this);
        
        console.log("state:", jsony);    
    }
    //"map":{"compressionlevel":-1,"height":100,"infinite":false,"layers":[{"data":[289,289,289,289,289,289,289,289,289,289,289,289,289,289,289,289,292,295,289,28

    characters() {
        return [...this.monsters, this.player];
    }

    // toJson() {
    //     let serializer = new Serializer([WorldState]);
    //     // let jsony = "state : {"
    //     // console.log("json");
    //     // const jsony = JSON.stringify(this);
    //     const jsony = serializer.stringify(this);
        
    //     console.log("state:", jsony);

    // }
}


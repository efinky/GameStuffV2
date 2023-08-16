import { WorldMap } from "./worldMap.js";
import { PlayerSet as CharacterSet } from "./playerSet.js";
import { Player } from "./player.js"
import { Monster } from "./monster.js"
import { Vector2d } from "./vector2d.js"
import { Serializer } from "./serializer.js"
import { Item } from "./item.js";

/** @typedef {import("./app.js").SimChunk} SimChunk */

const serializer = new Serializer([WorldMap, Player, Monster, Vector2d]);

export class WorldState {
    /**
     * @param {string} map
     */
    constructor(map) {
        this.map = map;
        /** @type {{[key: string]: Player}} */
        this.players = {};
        /** @type {Monster[]} */
        this.monsters = [];
        this.monsters.push(new Monster("bob", "Goblin", new Vector2d(1100, 1100)));
        this.monsters.push(new Monster("bob1", "Goblin", new Vector2d((Math.random() * 1000)+1000, (Math.random() * 1000)+1000)));
        this.monsters.push(new Monster("bob2", "Goblin", new Vector2d((Math.random() * 1000)+1000, (Math.random() * 1000)+1000)));
        this.monsters.push(new Monster("bob3", "Goblin", new Vector2d((Math.random() * 1000)+1000, (Math.random() * 1000)+1000)));
        this.monsters.push(new Monster("bob4", "Goblin", new Vector2d((Math.random() * 1000)+1000, (Math.random() * 1000)+1000)));
        this.time = 0;
        /** @type {{[idx: number]: Item}} */
        this.items = [];
        // let serializer = new Serializer([WorldState, WorldMap, Player, Monster, Vector2d]);
        // const jsony = serializer.stringify(this);
        
        // console.log("state:", jsony);    
    }

    characters() {
        let playerArray = []
        for (let key in this.players) {
            playerArray.push(this.players[key])
        }
        return [...this.monsters, ...playerArray];
    }
    /**
     * 
     * @param {string} clientId 
     */
    playerConnected(clientId) {
        if (!this.players[clientId]) {
            this.players[clientId] = new Player("Bob", "Warrior", new Vector2d(900, 900));
            console.log("player added");
        }
        else {
            console.log("player " + clientId + " has rejoined the game");
        }
    }

    async loadAssets() {
        let mapCurrent = await WorldMap.load(this.map);

        this.items = mapCurrent.getAllItems();

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
        return {mapCurrent, playerSet, monsterSet, itemImages};
    }

    update(dt) {
        this.time += dt;
        moveMonsters(
            dt,
            this.time,
            this.monsters,
            this.players,
            this.characters(),
            assets.mapCurrent
        );

        movePlayer(
            dt,
            this.players,
            myVelocity,
            this.characters(),
            assets.mapCurrent
        );
    }

    /** @param {SimChunk} chunk */
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
                if (event.msg.type === "moveTarget") {
                    
                }
            break;
        }
        }
        this.update(dt / 1000);
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
            map: this.map,
            players: this.players,
            monsters: this.monsters,
            time: this.time
        });
    }

}


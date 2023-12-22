import {Character} from "./character.js"
import { PCG32 } from "../lib/pcg/pcg.js";

import { Vector2d } from "../lib/vector2d/vector2d.js"


/** @typedef {import("../tileset/tiledLoader.js").PlayerClass} CharacterClass*/
export class Monster extends Character {
    /**
     *
     * @param {string} name
     * @param {CharacterClass} cClass
     * @param {Vector2d} characterPos_w
     * @param {PCG32} rng
     */
    constructor(name, cClass, characterPos_w, rng) {
        super(name, cClass, characterPos_w)
        this.direction = rng.randomInt(1, 4);
        this.moveCount = rng.randomInt(10, 60);
        this.speedMultiplier = 0.7;
        this.cooldown = .7
        this.stuckCounter = 0;
        this.prevPos = characterPos_w;
        this.goalPosition = characterPos_w;
        /**@type {Vector2d[] | []} */
        this.path = [];
        this.pathTimer = 0;
    }
//incorcorate speed into astar pathing
//monsters need goals
//  pick random spot in 10 squares from center, or head towards player
//use pathing to take monster to goal
    /**
     * 
     * @param {Vector2d} monster_pos 
     * @param {PCG32} rng
     */
    findRandomGoal(monster_pos, rng){
        let newx = rng.randomInt(-5, 5);
        let newy = rng.randomInt(-5, 5);
        let newPos = new Vector2d(newx, newy).scale(32);
        return monster_pos.add(newPos);
    }
    /**
     * 
     */
    ifStuck() {
        if (this.prevPos.equal(this.characterPos_w)) {
            this.stuckCounter++;
        }
        else
        {
            this.stuckCounter=0;
        }
        // console.log('stuck', this.stuckCounter);
        if(this.stuckCounter > 20) {
            this.path = []
        }
        this.prevPos = this.characterPos_w;
    }


}
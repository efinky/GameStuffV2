import {Character} from "./character.js"

import { Vector2d } from "./vector2d.js"


/** @typedef {import("./tiledLoader.js").PlayerClass} CharacterClass*/
export class Monster extends Character {
    /**
     *
     * @param {string} name
     * @param {CharacterClass} cClass
     * @param {Vector2d} characterPos_w
     */
    constructor(name, cClass, characterPos_w) {
        super(name, cClass, characterPos_w)
        this.direction = Math.floor(Math.random() * 4) + 1;
        this.moveCount = Math.floor(Math.random() * 50) + 10;
        this.speedMultiplier = 0.7;
    }

    timeToMove() {
        this.moveCount--;
        if (this.moveCount === 0) {

            this.moveCount = Math.floor(Math.random() * 50) + 10;
            this.direction = Math.floor(Math.random() * 4) + 1;
            let newVelocity = [
                new Vector2d(0, -1),
                new Vector2d(1, 0),
                new Vector2d(0, 1),
                new Vector2d(-1, 0),
            ][this.direction-1];
            if (!newVelocity) {
                throw Error("Error calculating new monster velocity");
            }
            this.myVelocity = newVelocity;
        }
        return this.direction;
    }
    //up is 1, right is 2, down is 3 and left is 4

}
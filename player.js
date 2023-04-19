import {Character} from "./character.js"

import { Vector2d } from "./vector2d.js"


/** @typedef {import("./tiledLoader.js").PlayerClass} CharacterClass*/
export class Player extends Character {
    /**
     *
     * @param {string} name
     * @param {CharacterClass} cClass
     *
     * @param {Vector2d} characterPos_w
     */
    constructor(name, cClass, characterPos_w) {
        super(name, cClass, characterPos_w)
        this.direction = Math.floor(Math.random() * 4) + 1;
        /** @type {{ from: Vector2d, to: Vector2d, path: Vector2d[] | null }| null} */
        this.debugPath = null;
    }

    /**
     * @param {Vector2d} target
     */
    setDebugPathTarget(target) {
        this.debugPath = {
            from: this.characterPos_w,
            to: target,
            path: null,
        };
    }
    //up is 1, right is 2, down is 3 and left is 4
    // /**
    //  *
    //  * @param {number} direction
    //  * @param {Vector2d} pos
    //  */
    // move(direction, pos) {
    //     if (this.direction != direction || this.lastStepPos.distance(pos) > 20.0) {
    //         this.step = this.step == 0 ? 1 : 0;
    //         this.lastStepPos = pos;
    //     }

    //     this.direction = direction;
    // }
}
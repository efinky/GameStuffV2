
import { Vector2d } from "./vector2d.js"

import { Item } from "./item.js";
/** @typedef {"head" | "leftHand" | "rightHand" | "torso" | "legs" | "leftFoot" | "rightFoot"} EquippableSlot */


/** @typedef {import("./tiledLoader.js").PlayerClass} CharacterClass*/

export class Character {
    /**
     *
     * @param {string} name
     * @param {CharacterClass} cClass
     *
     * @param {Vector2d} characterPos_w
     */
    constructor(name, cClass, characterPos_w) {
        this.name = name;
        this.class = cClass;
        /** @type {Item[]} */
        this.inventory = [];
        /** @type {Record<EquippableSlot, Item | null>} */
        this.equipped = {
            "head": null,
            "leftHand": null,
            "rightHand": null,
            "torso": null,
            "legs": null,
            "leftFoot": null,
            "rightFoot": null
        }
        //used to animate step
        this.step = 0;
        //used to control direction facing
        //up is 1, right is 2, down is 3 and left is 4
        this.direction = 1;
        this.myVelocity = new Vector2d(1, 0);
        this.images = []
        this.lastStepPos = new Vector2d(0, 0);
        this.characterPos_w = characterPos_w;
        this.speedMultiplier = 1;
    }
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
    directionFrame() {
        //up is 1, right is 2, down is 3 and left is 4
        return this.myVelocity.lookupByDir([
            { key: new Vector2d(-1, 0), value: 4 },
            { key: new Vector2d(1, 0), value: 2 },
            { key: new Vector2d(0, -1), value: 1 },
            { key: new Vector2d(0, 1), value: 3 }]);
    }

    /** @param {Vector2d} myDirection */
    updateDirection(myDirection) {
        this.myVelocity = myDirection;
    }

    /** @param {(pos_w: Vector2d, direction: Vector2d, speedMultiplier: number) => Vector2d} f */
    updatePosition(f) {
        this.characterPos_w = f(this.characterPos_w, this.myVelocity, this.speedMultiplier)
        let direction = this.directionFrame();
        if (this.direction != direction || this.lastStepPos.distance(this.characterPos_w) > 20.0) {
            this.step = this.step == 0 ? 1 : 0;
            this.lastStepPos = this.characterPos_w;
        }

        this.direction = direction;
    }
}
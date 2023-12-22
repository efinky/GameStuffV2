
import { Vector2d } from "../lib/vector2d/vector2d.js"

import { Item } from "./item.js";
import { Rect } from "../lib/vector2d/rect.js";
/** @typedef {"head" | "leftHand" | "rightHand" | "torso" | "legs" | "leftFoot" | "rightFoot"} EquippableSlot */


/** @typedef {import("../tileset/tiledLoader.js").PlayerClass} CharacterClass*/

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
        /** @type {number[]} */
        this.inventory = [];
        /** @type {Record<EquippableSlot, number | null>} */
        this.equipped = {
            "head": null,
            "leftHand": null,
            "rightHand": null,
            "torso": null,
            "legs": null,
            "leftFoot": null,
            "rightFoot": null
        }
        this.maxHp = 100;
        this.hp = 100;
        this.baseDamage = 10;
        //used to animate step
        this.step = 0;
        //used to control direction facing
        //up is 1, right is 2, down is 3 and left is 4
        this.direction = 1;
        this.attackReady = 0;
        this.cooldown = 0.1;
        this.myVelocity = new Vector2d(1, 0);
        this.collideVelocity = new Vector2d(0.0, 0);
        this.lastVelocity = this.myVelocity;
        /**@type {string[]} */
        this.images = [];
        this.lastStepPos = characterPos_w;
        this.characterPos_w = characterPos_w;
        this.speedMultiplier = 1;
    }

    velocity() {
        return this.myVelocity.add(this.collideVelocity);
    }

    healthPercent() {
        return this.hp / this.maxHp;
    }

    
    boundRect() {
        const tl = this.characterPos_w;
        const br = this.characterPos_w.add(Vector2d.fromScalar(32));
        return new Rect(tl, br);
    }
    /**
     * 
     * @param {number} damageDealt
     */
    hit(damageDealt) {
        this.hp -= damageDealt;
        return this.hp <= 0;
    }
    /**
    * @param {number} time
    * @param {Character} character
     */
    attack(time, character) {
        let died = false;
        if (time > this.attackReady) {
            died = character.hit(this.baseDamage);
            this.attackReady = time + this.cooldown;
        }
        return died;
    }

    /**
     * @param {Vector2d} newCharacterPos
     */
    collidesWith(newCharacterPos) {
        // return this.characterPos_w.distance(newCharacterPos) < 32;
        //.add(Vector2d.fromScalar(16))
        const tl = newCharacterPos.add(Vector2d.fromScalar(8));
        const br = newCharacterPos.add(Vector2d.fromScalar(8)).add(Vector2d.fromScalar(16));
        return this.boundRect().overlaps(new Rect(tl, br));
    }

    /**
     * @param {Vector2d} newCharacterPos
     */
    softCollidesWith(newCharacterPos) {
        return this.boundRect().overlaps(new Rect(newCharacterPos, newCharacterPos.add(Vector2d.fromScalar(32))))
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
        //let direction = this.directionFrame();
        
        //this.direction = direction;
           if (this.myVelocity.magnitude() > 0) {
            this.lastVelocity = this.myVelocity;
            this.direction = this.directionFrame();;
        }
    }

    /** @param {Vector2d} newPos */
    updatePosition(newPos) {
        this.characterPos_w = newPos;// f(this.characterPos_w, this.myVelocity, this.speedMultiplier);
        // let direction = this.directionFrame();
        if (this.lastStepPos.distance(this.characterPos_w) > 20.0) {
            this.step = this.step == 0 ? 1 : 0;
            this.lastStepPos = this.characterPos_w;
        }
        // if (this.myVelocity.magnitude() > 0) {
        //     this.lastVelocity = this.myVelocity;
        //     this.direction = direction;
        // }

    }
    /**
     * 
     * @param {number} itemID 
     */
    pickupItem(itemID) {
        this.inventory.push(itemID);
    }
    /**
     * 
     * @param {number} itemID 
     */
    dropItem(itemID) {
        const index = this.inventory.indexOf(itemID);
        if (index != -1) {
            this.inventory.splice(index, 1);
            return true;
        }
        else {
            console.log(itemID, " does not exist");
            return false;
        }
    }
    /**
     * 
     * @param {number} itemID 
     * @param {EquippableSlot} slot 
     */
    equipItem(itemID, slot) {
        this.equipped[slot] = itemID;
    }
    /**
     * 
     * @param {EquippableSlot} slot 
     */
    unequipItem(slot) {
        this.equipped[slot] = null;
    }

}
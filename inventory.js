/** @typedef {import("./tiledLoader.js").EquipType} EquipType */
/** @typedef {"head" | "leftHand" | "rightHand" | "torso" | "legs" | "leftFoot" | "rightFoot"} EquippableSlot */

import { Player } from "./player.js";
import { Item } from "./item.js";
import { WorldState } from "./worldState.js";
import { dispatch } from "./events.js";

/** 
@param {string} source 
 @return {(state: WorldState) => void}  */
const UnEquip = (source) => (state) => {
    let equippedItem = state.player.equipped[equipSlots[source]];
    if (equippedItem) {
        delete state.player.equipped[equipSlots[source]];
        state.player.inventory.push(equippedItem);
    }
}


/** @param {string} id */
function getElement(id) {
    let elem = document.getElementById(id);
    if (!elem) {
        throw Error(`Failed to find element with id: ${id}`);
    }
    return elem;
}


/** @type {{[key: string]: EquippableSlot}} */
let equipSlots = {
    personHead: "head",
    personLeftHand: "leftHand",
    personRightHand: "rightHand",
    personTorso: "torso",
    personLegs: "legs",
    personLeftFoot: "leftFoot",
    personRightFoot: "rightFoot",
}

/**
    *
    * @param {EquipType} equipType
    * @returns {EquippableSlot[]}
    */
function equipableSlots(equipType) {
    switch (equipType) {
        case "Hand":
            return ["leftHand", "rightHand"];
        case "Chest":
            return ["torso"];
        case "Legs":
            return ["legs"];
        case "Feet":
            return ["leftFoot", "rightFoot"];
        default:
            return [];
    }
}
/**
    *
    * @param {EquipType} equipType
    * @param {EquippableSlot} slot
    * @returns
    */
function equipableInSlot(equipType, slot) {
    return equipableSlots(equipType).includes(slot);
}

/**
 * @typedef {Object} DraggedItem
 * @property {HTMLElement} element
 * @property {Item} item
 * @property {string} source
 */

export class Inventory {
    /**
     * @param { HTMLElement } inventoryBox
     *  @param {Player} player 
     * @param {{[idx: number]: HTMLImageElement}} images
     */
    constructor(inventoryBox, player, images) {
        this.inventoryBox = inventoryBox;
        this.player = player;
        /** @type {DraggedItem | null} */
        this.draggedItem = null;
        this.images = images;
        this.init();
    }

    toggleVisibility() {
        const inventoryUI = getElement('box');
        if (inventoryUI.style.visibility != "hidden") {
            inventoryUI.style.visibility = "hidden"
        } else {
            this.updateInventory()
            inventoryUI.style.visibility = "visible"
        }
    }

    init() {


        this.inventoryBox.addEventListener("dragover", (event) => {
            if (this.inventoryBox != event.target || !this.draggedItem || this.draggedItem.source == "inventory") { return; }
            event.preventDefault();
        })
        this.inventoryBox.addEventListener("dragenter", (event) => {
            if (this.inventoryBox != event.target || !this.draggedItem || this.draggedItem.source == "inventory") { return; }
            this.inventoryBox.classList.add("dragHover");
            event.preventDefault();
        })
        this.inventoryBox.addEventListener("dragleave", (event) => {
            if (this.inventoryBox != event.target || !this.draggedItem || this.draggedItem.source == "inventory") { return; }
            this.inventoryBox.classList.remove("dragHover");
            event.preventDefault();
        })
        this.inventoryBox.addEventListener("drop", (event) => {
            if (this.inventoryBox != event.target || !this.draggedItem || this.draggedItem.source == "inventory") { return; }

            dispatch(UnEquip(this.draggedItem.source));
            this.inventoryBox.classList.remove("dragHover");
            this.updateInventory()
            event.preventDefault();
        })

        for (let slot in equipSlots) {
            this.addDropListener(slot);
        }


    }

    updateInventory() {

        while (this.inventoryBox.lastChild) {
            this.inventoryBox.removeChild(this.inventoryBox.lastChild);
        }
        this.player.inventory.forEach(i => {
            let x = this.images[i.tileNumber].cloneNode(false);
            if (!(x instanceof HTMLElement)) {
                console.log("Not an element: ", x);
                return;
            }
            // x.dataset = {
            //     "tileNumber":i.tileNumber,
            //     "name":i.name
            // };
            x.dataset.tileNumber = "" + i.tileNumber;
            x.dataset.name = i.name;
            x.draggable = true;
            x.addEventListener("dragstart", (event) => {
                if (!(event.target instanceof HTMLElement)) {
                    console.log("empty target", event);
                    return;
                }
                this.draggedItem = { element: event.target, item: i, source: "inventory" };
                // This is called for inventory items only
                // event.preventDefault()
            })
            this.inventoryBox.appendChild(x);
        });

        for (let slot in equipSlots) {
            const elem = document.getElementById(slot);
            if (!elem) {
                return;
            }
            // There is a loop here, but it should only be one
            while (elem.lastChild) {
                elem.removeChild(elem.lastChild);
            }
            let i = this.player.equipped[equipSlots[slot]];
            if (i) {
                let x = this.images[i.tileNumber].cloneNode(false);
                if (!(x instanceof HTMLElement)) {
                    console.log("Not an element: ", x);
                    return;
                }
                x.dataset.tileNumber = "" + i.tileNumber;
                x.dataset.name = i.name;
                x.draggable = true;
                x.addEventListener("dragstart", (event) => {
                    if (!(event.target instanceof HTMLElement)) {
                        console.log("empty target", event);
                        return;
                    }
                    if (!i) {
                        console.log("Empty Item", this.player.equipped, equipSlots[slot]);
                        return;
                    }
                    this.draggedItem = { element: event.target, item: i, source: "inventory" };
                    // This is called for inventory items only
                    // event.preventDefault()
                })
                elem.appendChild(x)
            }
        }
    }


    /**
    * Add a drop listener for an equipment slot
    * @param {string} id
    */
    addDropListener(id) {
        const elem = getElement(id);
        elem.addEventListener("dragstart", (event) => {
            if (!(event.target instanceof HTMLElement)) {
                console.log("Target not an element: ", event);
                return;
            }
            let item = this.player.equipped[equipSlots[id]];
            if (!item) {
                console.log("item is null", this.player.equipped, equipSlots, id)
                return;
            }
            this.draggedItem = { element: event.target, item: item, source: id }
            //delete this.player.equipped[equipSlots[id]];
            // This is called for equip slots only
            // event.preventDefault();
        })
        elem.addEventListener("dragover", (event) => {
            event.preventDefault();
        })
        elem.addEventListener("dragenter", (event) => {
            event.preventDefault();
            // let item = mapCurrent.getItemByTileNumber(this.draggedItem.element.dataset.tileNumber);
            if (!this.draggedItem || !(event.target instanceof HTMLElement)) {
                return;
            }
            let item = this.draggedItem.item;
            if (id in equipSlots && !this.player.equipped[equipSlots[id]] && event.target.id == id && equipableInSlot(item.equippedType, equipSlots[id])) {
                event.target.classList.add("dragHover");
            }
        })
        elem.addEventListener("dragleave", (event) => {
            event.preventDefault();
            if (!this.draggedItem || !(event.target instanceof HTMLElement)) {
                return;
            }
            // let item = mapCurrent.getItemByTileNumber(this.draggedItem.element.dataset.tileNumber);
            let item = this.draggedItem.item;
            if (id in equipSlots && !this.player.equipped[equipSlots[id]] && event.target.id == id && equipableInSlot(item.equippedType, equipSlots[id])) {
                event.target.classList.remove("dragHover");
            }
        })
        elem.addEventListener("drop", (event) => {
            event.preventDefault();
            if (!this.draggedItem || !(event.target instanceof HTMLElement)) {
                return;
            }
            // let item = mapCurrent.getItemByTileNumber(this.draggedItem.element.dataset.tileNumber);
            let item = this.draggedItem.item;
            if (id in equipSlots && !this.player.equipped[equipSlots[id]] && event.target.id == id && equipableInSlot(item.equippedType, equipSlots[id])) {
                // this.draggedItem.parentNode.removeChild( this.draggedItem );

                if (this.draggedItem.source == "inventory") {
                    let inventory = []
                    let removed = false
                    for (let i in this.player.inventory) {
                        if (!removed && this.player.inventory[i].tileNumber == item.tileNumber) {
                            removed = true;
                        } else {
                            inventory.push(this.player.inventory[i]);
                        }
                    }
                    this.player.inventory = inventory;
                } else {
                    delete this.player.equipped[equipSlots[this.draggedItem.source]];
                }
                this.player.equipped[equipSlots[id]] = item;
                // event.target.appendChild( this.draggedItem.element );
                event.target.classList.remove("dragHover");
                this.updateInventory();
            }
        })
    }


}


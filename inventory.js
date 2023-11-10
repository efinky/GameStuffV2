/** @typedef {import("./tiledLoader.js").EquipType} EquipType */
/** @typedef {"head" | "leftHand" | "rightHand" | "torso" | "legs" | "leftFoot" | "rightFoot"} EquippableSlot */

import { Player } from "./player.js";
import { Item } from "./item.js";
import { WorldState } from "./worldState.js";
import { dispatch } from "./events.js";

const template = document.createElement('template');
template.innerHTML = `
  <style>
    *, *:before, *:after {
                box-sizing: border-box;
            }

            .personBox > * {
                border-width: 1px;
                border-color: green;
                border-style: solid;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .dragHover {
                border-width: 5px;
                border-color: red;
                border-style: solid;
            }
            .personBox {
                /* background-color: darkmagenta; */
                background-image: url(Pictures/PersonItems.png);
                background-size: cover;
                aspect-ratio: 4 / 5;
                height: 100%;
                box-sizing:border-box;
                display: grid;
                gap:5px;
                grid-template-columns: 1fr 1fr 1fr;
                grid-template-rows:  1fr 1fr 1fr 1fr;
                grid-template-areas: 
                    "nothinga head nothingb"
                    "lefthand torso righthand"
                    "nothingc legs nothingd"
                    "leftfoot nothinge rightfoot";
            }
            .box {
                box-sizing:border-box;
                gap:10px;
                padding: 20px;
                border-radius:15px;
                background-color: rgba(30, 30, 30, 0.7);
                box-shadow:20px 20px 20px rgba(0,0,0,0.5);
                /* position:absolute; */
                /* top:20%;
                left:20%; */
                width: 60%;
                height: 80%;
                min-height: 250px;
                max-height: 500px;
                /* aspect-ratio: 2.5 / 1; */
            }
            .dialogInternalBox {
                display:flex;
                flex-flow: row;
                width: 100%;
                height: 100%;
            }
            .inventoryBox {
                box-sizing:border-box;
                display: grid;
                grid-template-columns: repeat(auto-fill, 32px);
                /* grid-template-rows: repeat(auto-fill, 32px); */
                /* grid-template-columns: repeat(auto-fill, minmax(64px, 64px)); */
                overflow-y: auto;
                /* grid: 64px / auto auto auto; */
                /* grid-auto-columns: 64px; */
                grid-auto-rows: 32px;
                /* grid-auto-flow: column; */
                gap:10px;
                justify-content: center;
                padding: 20px;
                border-radius:15px;
                background-color: rgba(30, 30, 30, 1.0);
                box-shadow:20px 20px 20px rgba(0,0,0,0.5);
                flex: 1;
                height:100%;
            }
  </style>
  <dialog id="inventoryDialog" class="box">
    <div class="dialogInternalBox">
        <div id="inventoryBox" class="inventoryBox"> </div>
        <div id="personBox" class="personBox">
            <div id="personHead" style="grid-area: head;"></div>
            <div id="personLeftHand" style="grid-area: lefthand;"></div>
            <div id="personRightHand" style="grid-area: righthand;"></div>
            <div id="personTorso" style="grid-area: torso;"></div>
            <div id="personLegs" style="grid-area: legs;"></div>
            <div id="personLeftFoot" style="grid-area: leftfoot;"></div>
            <div id="personRightFoot" style="grid-area: rightfoot;"></div>
        </div>
    </div>
</dialog>
`;

//Need to Dispatch drop and equip and unequip.

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
 * @property {number} item
 * @property {string} source
 */

export class Inventory extends HTMLElement {
    constructor() {
        super();
        /** @type {DraggedItem | null} */
        this.draggedItem = null;

        this.attachShadow({ mode: 'open' }).appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        this.init();
    }
    get open() {
        const dialog = this.shadowRoot.querySelector('dialog');
        return dialog.open;
        // return this.hasAttribute('open');
    }
    close(){
        const dialog = this.shadowRoot.querySelector('dialog');
        dialog.close();
        // this.removeAttribute('open');
    }
    showModal() {
        const dialog = this.shadowRoot.querySelector('dialog');
        dialog.showModal();
    }
    toggle() {
        const dialog = this.shadowRoot.querySelector('dialog');
        if (dialog.open) {
            dialog.close();
        } else {
            dialog.showModal();
        }
    }

    /**
        * @param {Player} player
        */
    updatePlayer(player) {
        this.player = player;
        this.updateInventory();
    }

    init() {


        this.addEventListener("dragover", (event) => {
            if (this != event.target || !this.draggedItem || this.draggedItem.source == "inventory") { return; }
            event.preventDefault();
        })
        this.addEventListener("dragenter", (event) => {
            if (this != event.target || !this.draggedItem || this.draggedItem.source == "inventory") { return; }
            this.classList.add("dragHover");
            event.preventDefault();
        })
        this.addEventListener("dragleave", (event) => {
            if (this != event.target || !this.draggedItem || this.draggedItem.source == "inventory") { return; }
            this.classList.remove("dragHover");
            event.preventDefault();
        })
        this.addEventListener("drop", (event) => {
            if (this != event.target || !this.draggedItem || this.draggedItem.source == "inventory") { return; }

            dispatch(UnEquip(this.draggedItem.source));
            this.classList.remove("dragHover");
            this.updateInventory()
            event.preventDefault();
        })

        for (let slot in equipSlots) {
            // this.addDropListener(slot);
        }


    }

    updateInventory() {

        while (this.lastChild) {
            this.removeChild(this.lastChild);
        }
        //Display items
        this.player.inventory.forEach(i => {
            let item = this.worldState.items[i]
            let x = this.worldState.itemImages[item.tileNumber].cloneNode(false);
            if (!(x instanceof HTMLElement)) {
                console.log("Not an element: ", x);
                return;
            }
            // x.dataset = {
            //     "tileNumber":i.tileNumber,
            //     "name":i.name
            // };
            x.dataset.tileNumber = "" + item.tileNumber;
            x.dataset.name = item.name;
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
            this.appendChild(x);
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
                let item = this.worldState.items[i];
                let x = this.worldState.itemImages[item.tileNumber].cloneNode(false);
                if (!(x instanceof HTMLElement)) {
                    console.log("Not an element: ", x);
                    return;
                }
                x.dataset.tileNumber = "" + item.tileNumber;
                x.dataset.name = item.name;
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
            let i = this.draggedItem.item;
            let item = this.worldState.items[i];
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
            let i = this.draggedItem.item;
            let item = this.worldState.items[i];
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
            let i = this.draggedItem.item;
            let item = this.worldState.items[i];
            if (id in equipSlots && !this.player.equipped[equipSlots[id]] && event.target.id == id && equipableInSlot(item.equippedType, equipSlots[id])) {
                // this.draggedItem.parentNode.removeChild( this.draggedItem );

                if (this.draggedItem.source == "inventory") {
                    let inventory = []
                    let removed = false
                    for (let i in this.player.inventory) {
                        if (!removed && this.worldState.items[this.player.inventory[i]].tileNumber == item.tileNumber) {
                            removed = true;
                        } else {
                            inventory.push(this.player.inventory[i]);
                        }
                    }
                    this.player.inventory = inventory;
                } else {
                    delete this.player.equipped[equipSlots[this.draggedItem.source]];
                }
                this.player.equipped[equipSlots[id]] = i;
                // event.target.appendChild( this.draggedItem.element );
                event.target.classList.remove("dragHover");
                this.updateInventory();
            }
        })
    }


}

customElements.define('player-inventory', Inventory);

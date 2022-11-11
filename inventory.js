/** @typedef {import("./tiledLoader.js").EquipType} EquipType */
/** @typedef {"head" | "leftHand" | "rightHand" | "torso" | "legs" | "leftFoot" | "rightFoot"} EquippableSlot */

import { Player } from "./player.js";


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


    class Inventory {
      constructor() {

      }

    }

    /** @param {Player} player */
    function updateInventory(player) {
        const inventoryBox = document.getElementById('inventoryBox');
        if (!inventoryBox) {
            return;
        }
        while (inventoryBox.lastChild) {
            inventoryBox.removeChild(inventoryBox.lastChild);
        }
        player.inventory.forEach(i => {
            let x = i.image.cloneNode(false);
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
                draggedItem = { element: event.target, item: i, source: "inventory" };
                // This is called for inventory items only
                // event.preventDefault()
            })
            inventoryBox.appendChild(x);
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
            let i = player.equipped[equipSlots[slot]];
            if (i) {
                let x = i.image.cloneNode(false);
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
                        console.log("Empty Item", player.equipped, equipSlots[slot]);
                        return;
                    }
                    draggedItem = { element: event.target, item: i, source: "inventory" };
                    // This is called for inventory items only
                    // event.preventDefault()
                })
                elem.appendChild(x)
            }
        }
    }

    
        /**
     *
     * @param {string} id
     */
    function addDropListener(id) {
        const elem = getElement(id);
        elem.addEventListener("dragstart", (event) => {
            if (!(event.target instanceof HTMLElement)) {
                console.log("Target not an element: ", event);
                return;
            }
            let item = player.equipped[equipSlots[id]];
            if (!item) {
                console.log("item is null", player.equipped, equipSlots, id)
                return;
            }
            draggedItem = { element: event.target, item: item, source: id }
            //delete player.equipped[equipSlots[id]];
            // This is called for equip slots only
            // event.preventDefault();
        })
        elem.addEventListener("dragover", (event) => {
            event.preventDefault();
        })
        elem.addEventListener("dragenter", (event) => {
            event.preventDefault();
            // let item = mapCurrent.getItemByTileNumber(draggedItem.element.dataset.tileNumber);
            if (!draggedItem || !(event.target instanceof HTMLElement)) {
                return;
            }
            let item = draggedItem.item;
            if (id in equipSlots && !player.equipped[equipSlots[id]] && event.target.id == id && equipableInSlot(item.equippedType, equipSlots[id])) {
                event.target.classList.add("dragHover");
            }
        })
        elem.addEventListener("dragleave", (event) => {
            event.preventDefault();
            if (!draggedItem || !(event.target instanceof HTMLElement)) {
                return;
            }
            // let item = mapCurrent.getItemByTileNumber(draggedItem.element.dataset.tileNumber);
            let item = draggedItem.item;
            if (id in equipSlots && !player.equipped[equipSlots[id]] && event.target.id == id && equipableInSlot(item.equippedType, equipSlots[id])) {
                event.target.classList.remove("dragHover");
            }
        })
        elem.addEventListener("drop", (event) => {
            event.preventDefault();
            if (!draggedItem || !(event.target instanceof HTMLElement)) {
                return;
            }
            // let item = mapCurrent.getItemByTileNumber(draggedItem.element.dataset.tileNumber);
            let item = draggedItem.item;
            if (id in equipSlots && !player.equipped[equipSlots[id]] && event.target.id == id && equipableInSlot(item.equippedType, equipSlots[id])) {
                // draggedItem.parentNode.removeChild( draggedItem );

                if (draggedItem.source == "inventory") {
                    let inventory = []
                    let removed = false
                    for (let i in player.inventory) {
                        if (!removed && player.inventory[i].tileNumber == item.tileNumber) {
                            removed = true;
                        } else {
                            inventory.push(player.inventory[i]);
                        }
                    }
                    player.inventory = inventory;
                } else {
                    delete player.equipped[equipSlots[draggedItem.source]];
                }
                player.equipped[equipSlots[id]] = item;
                // event.target.appendChild( draggedItem.element );
                event.target.classList.remove("dragHover");
                updateInventory()
            }
        })
    }

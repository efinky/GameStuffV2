/** @typedef {import("../tileset/tiledLoader.js").EquipType} EquipType */
/** @typedef {"head" | "leftHand" | "rightHand" | "torso" | "legs" | "leftFoot" | "rightFoot"} EquippableSlot */

/** @typedef {{ id: number, image: HTMLImageElement, item: Item }} InventoryItem */
/** @typedef {Record<EquippableSlot, InventoryItem|null>} EquippedItems */

import { Player } from "../game-state/player.js";
import { Item } from "../game-state/item.js";
import { dispatch } from "../events.js";

/** @typedef  { CustomEvent<{ inventoryItem: InventoryItem, slot: EquippableSlot }>} InventoryEvent */

const template = document.createElement("template");
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
//<button type="button" onclick="test()">Click Me!</button>
// const UnEquip = (source) => (state) => {
//   let equippedItem = state.player.equipped[equipSlots[source]];
//   if (equippedItem) {
//     delete state.player.equipped[equipSlots[source]];
//     state.inventory.push(equippedItem);
//   }
// };

/** @param {string} id */
// function getElement(id) {
//     let elem = document.getElementById(id);
//     if (!elem) {
//         throw Error(`Failed to find element with id: ${id}`);
//     }
//     return elem;
// }

/** @type {{[key: string]: EquippableSlot}} */
let equipSlots = {
  personHead: "head",
  personLeftHand: "leftHand",
  personRightHand: "rightHand",
  personTorso: "torso",
  personLegs: "legs",
  personLeftFoot: "leftFoot",
  personRightFoot: "rightFoot",
};

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
function test () {
  console.log("test");
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
 * @property {InventoryItem} inventoryItem
 * @property {EquippableSlot|"inventory"} source
 */

export class Inventory extends HTMLElement {
  constructor() {
    super();

    

    /** @type {InventoryItem[]} */
    this.inventory = [];
    /** @type {EquippedItems} */
    this.playerEquipped = {
      head: null,
      leftHand: null,
      rightHand: null,
      torso: null,
      legs: null,
      leftFoot: null,
      rightFoot: null,
    };

    /** @type {DraggedItem | null} */
    this.draggedItem = null;

    this.attachShadow({ mode: "open" }).appendChild(
      template.content.cloneNode(true)
    );
    let inventoryBox = this.shadowRoot?.getElementById("inventoryBox");
    if (!(inventoryBox instanceof HTMLElement)) {
      throw Error("Failed to find inventoryBox");
    }
    let dialog = this.shadowRoot?.getElementById("inventoryDialog");
    if (!(dialog instanceof HTMLDialogElement)) {
      throw Error("Failed to find inventoryDialog");
    }
    this.dialog = dialog;
    this.inventoryBox = inventoryBox;
  }

  connectedCallback() {
    this.init();
  }
  get open() {
    return this.dialog.open;
    // return this.hasAttribute('open');
  }
  close() {
    this.dialog.close();
    // this.removeAttribute('open');
  }
  showModal() {
    this.dialog.showModal();
  }
  toggle() {
    if (this.dialog.open) {
      this.dialog.close();
    } else {
      this.dialog.showModal();
      // this.dialog.show();
    }
  }

  init() {
    this.inventoryBox.addEventListener("dragover", (event) => {
      if (
        this.inventoryBox != event.target ||
        !this.draggedItem ||
        this.draggedItem.source == "inventory"
      ) {
        return;
      }
      event.preventDefault();
    });
    this.inventoryBox.addEventListener("dragenter", (event) => {
      if (
        this.inventoryBox != event.target ||
        !this.draggedItem ||
        this.draggedItem.source == "inventory"
      ) {
        return;
      }
      this.inventoryBox.classList.add("dragHover");
      
      event.preventDefault();
    });
    this.inventoryBox.addEventListener("dragleave", (event) => {
      if (
        this.inventoryBox != event.target ||
        !this.draggedItem ||
        this.draggedItem.source == "inventory"
      ) {
        return;
      }
      this.inventoryBox.classList.remove("dragHover");
      event.preventDefault();
    });
    this.inventoryBox.addEventListener("drop", (event) => {
      this.inventoryBox.classList.remove("dragHover");
      //if the item came from inventory don't update.
      if (
        this.inventoryBox != event.target ||
        !this.draggedItem ||
        this.draggedItem.source == "inventory"
      ) {
        return;
      }
      //if source came from an equpped slot then move from equippped slot to inventoryBox
      const sourceId = this.draggedItem.source;
      const item = this.draggedItem.inventoryItem;
      this.draggedItem = null;
      
      this.unEquip(item, sourceId);
      event.preventDefault();
    });

    for (let slot in equipSlots) {
      this.addDropListener(slot);
    }

  }

  /**
   * 
   * @param {InventoryItem} inventoryItem 
   * @param {EquippableSlot} slot 
   */
  equipFromInventory(inventoryItem, slot) {

    if (!equipableInSlot(inventoryItem.item.equippedType, slot)) {
      console.log("Item not equipable in slot", inventoryItem, slot);
      return;
    }
    // Source of item is player's inventory
    let itemId = inventoryItem.id;
    // remove item from inventory by Id
    let itemIndex = this.inventory.findIndex((item) => item.id == itemId);
    if (itemIndex == -1) {
      console.log("Item not found in inventory", itemId, this.inventory);
      return;
    }
    this.inventory.splice(itemIndex, 1);

    const existingItem = this.playerEquipped[slot];
    if (existingItem) {
      this.inventory.push(existingItem);
    }

    this.playerEquipped[slot] = inventoryItem;
    this.draggedItem = null;
    this.#update();

    const event = new CustomEvent("equip-from-inventory", { detail: { inventoryItem, slot } });
    this.dispatchEvent(event);
  }

  /**
   *
   * @param {InventoryItem} inventoryItem
   * @param {EquippableSlot} oldSlot
   * @param {EquippableSlot} newSlot
   */
  equipFromSlot(inventoryItem, oldSlot, newSlot) {

    if (!equipableInSlot(inventoryItem.item.equippedType, newSlot) || oldSlot == newSlot) {
      console.log("Item not equipable in slot", inventoryItem, newSlot);
      return;
    }
    // verify this is the item we think it is
    if (this.playerEquipped[oldSlot]?.id !== inventoryItem.id) {
      return;
    }
    const existingItem = this.playerEquipped[newSlot];
    if (existingItem) {
      // if there is already an item in the slot, move it to the inventory
      this.inventory.push(existingItem);
    }
    // move the item from the old slot to the new slot
    this.playerEquipped[newSlot] = this.playerEquipped[oldSlot];
    this.playerEquipped[oldSlot] = null;

    this.draggedItem = null;
    this.#update();
    this.dispatchEvent(new CustomEvent("equip-from-slot", { detail: { inventoryItem, newSlot, oldSlot } }));
  }

  /**
   * @param {InventoryItem} inventoryItem
   * @param {EquippableSlot} slot
   */
  unEquip(inventoryItem, slot) {
    const item = this.playerEquipped[slot];
    if (!item || item.id !== inventoryItem.id) {
      return;
    }
    this.playerEquipped[slot] = null;
    this.inventory.push(item);
    this.draggedItem = null;
    this.#update();
    this.dispatchEvent(new CustomEvent("unequip", { detail: { inventoryItem, slot } }));
  }


  /**
   *
   * @param {InventoryItem[]} inventory
   * @param {EquippedItems} playerEquipped
   * @returns
   */

  update(inventory, playerEquipped) {
    this.inventory = inventory;
    this.playerEquipped = playerEquipped;
    this.#update();
  }

  #update() {
    while (this.inventoryBox.lastChild) {
      this.inventoryBox.removeChild(this.inventoryBox.lastChild);
    }
    //this.player = serializer.clone(worldState.players[clientId]);
    //this.worldState = worldState;

    //Display items
    console.log("pe", this.playerEquipped)


    // Create all the elements for the inventory items
    this.inventory.forEach((inventoryItem) => {
      let image = inventoryItem.image;
      let item = inventoryItem.item;
      if (!(image instanceof HTMLElement)) {
        console.log("Not an element: ", image);
        return;
      }
      image.draggable = true;
      image.addEventListener("dragstart", (event) => {
        if (!(event.target instanceof HTMLElement)) {
          console.log("empty target", event);
          return;
        }
        this.draggedItem = {
          element: event.target,
          inventoryItem: inventoryItem,
          source: "inventory",
        };
        // This is called for inventory items only
        // event.preventDefault()
      });
      this.inventoryBox.appendChild(image);
    });

    // Create all the elements for the equipped items
    for (let slot in equipSlots) {
      const elem = this.getElement(slot);

      // Remove all children of the inventory slot element (at time of writing
      // there should only be one child)
      while (elem.lastChild) {
        elem.removeChild(elem.lastChild);
      }

      // Create the element for the equipped item
      let inventoryItem = this.playerEquipped[equipSlots[slot]];
      if (inventoryItem) {
        let item = inventoryItem.item;
        let image = inventoryItem.image;
        if (!(image instanceof HTMLElement)) {
          console.log("Not an element: ", image);
          return;
        }

        image.draggable = true;
        image.addEventListener("dragstart", (event) => {
          if (!(event.target instanceof HTMLElement)) {
            console.log("empty target", event);
            return;
          }
          if (!inventoryItem) {
            console.log("Empty Item", this.playerEquipped, equipSlots[slot]);
            return;
          }
          this.draggedItem = {
            element: event.target,
            inventoryItem: inventoryItem,
            source: "inventory",
          };
          // This is called for inventory items only
          // event.preventDefault()
        });
        elem.appendChild(image);
      }
    }
  }

  /**
   * @param {string} id
   */
  getElement(id) {
    let elem = this.shadowRoot?.getElementById(id);
    if (!elem) {
      throw Error(`Failed to find element with id: ${id}`);
    }
    return elem;
  }

  /**
   * Add a drop listener for an equipment slot
   * @param {string} id
   */
  addDropListener(id) {
    
    const elem = this.getElement(id);
    elem.addEventListener("dragstart", (event) => {
      if (!(event.target instanceof HTMLElement)) {
        console.log("Target not an element: ", event);
        return;
      }
        let item = this.playerEquipped[equipSlots[id]];
      
        if (!item) {
          console.log("item is null", this.playerEquipped, equipSlots, id);
          return;
        }
        if (id in equipSlots) {
          this.draggedItem = { element: event.target, inventoryItem: item, source: equipSlots[id] };
        }
        //delete this.player.equipped[equipSlots[id]];
        // This is called for equip slots only
        // event.preventDefault();
    });
    elem.addEventListener("dragover", (event) => {
      event.preventDefault();
    });
    elem.addEventListener("dragenter", (event) => {
      event.preventDefault();
      // let item = mapCurrent.getItemByTileNumber(this.draggedItem.element.dataset.tileNumber);
      if (!this.draggedItem || !(event.target instanceof HTMLElement)) {
        return;
      }
      let item = this.draggedItem.inventoryItem.item;
      if (
        id in equipSlots &&
        !this.playerEquipped[equipSlots[id]] &&
        event.target.id == id &&
        equipableInSlot(item.equippedType, equipSlots[id])
      ) {
        event.target.classList.add("dragHover");
      }
    });
    elem.addEventListener("dragleave", (event) => {
      event.preventDefault();
      if (!this.draggedItem || !(event.target instanceof HTMLElement)) {
        return;
      }
      event.target?.classList?.remove("dragHover");
    });
    //Player is equipping an item from their inventory.  Item is type ItemInventory
    elem.addEventListener("drop", (event) => {
      event.preventDefault();
      if (!this.draggedItem || !(event.target instanceof HTMLElement)) {
        return;
      }
      event.target?.classList?.remove("dragHover");
      const item = this.draggedItem.inventoryItem;
      const source = this.draggedItem.source;
      this.draggedItem = null;

      if (source == "inventory") {
        // if the source of the item is the player's inventory
        this.equipFromInventory(item, equipSlots[id]);
      } else {
        // otherwise the source of the item is another player's equipped items
        this.equipFromSlot(item, source, equipSlots[id]);
      }
    });
  }
}

customElements.define("player-inventory", Inventory);

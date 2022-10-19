// @ts-check

import { Vector2d } from "./vector2d.js"
import { Rect } from "./rect.js"
import { convertSpriteSheetTileset, convertTileset, isCharacterTile } from "./tiledLoader.js";
import * as Tiled from "./tiledTypes.js";
import { loadImage } from "./utils.js";
import { Map } from "./map.js";
import { TileSet } from "./tileSet.js";
import { PlayerSet } from "./playerSet.js";
import { Item } from "./item.js";
/** @typedef {import("./tiledLoader.js").ItemProperty} ItemProperty */
/** @typedef {import("./tiledLoader.js").EquipType} EquipType */
/** @typedef {"head" | "leftHand" | "rightHand" | "torso" | "legs" | "leftFoot" | "rightFoot"} EquippableSlot */
// import someData from "./test.json" assert { type: "json" };

/*
    DONE
    click to walk

    Rename most "Player" class/things to "Character"
    Make monsters move
    NEXT UP
    Monsters
    Monster AI
    
    TODO


    touchscreen vs pc?
        create a button for long range attack
        melle is just walk into stuff?

        create a button for inventory (as well as keyboard key)


    [monsters
    fighting
    monster AI
    health
    damage]

    sound effects (damage, stuff)

    improve iventory
    item weight (max inventory weight)
    
    [state storage
    networking]

    drag to eat option
    inventory vs equip box?
*/








// const tilesets = {
//     "TileSetSheet.tsx": new TileSet(grass),
//     "Items.tsx": new TileSet(items)
// };


/*


 * ItemTypes
Consumable
Small
Hand
Chest
Head
Feet
 */

/** @param {string} id */
function getElement(id) {
    let elem = document.getElementById(id);
    if (!elem) {
        throw Error(`Failed to find element with id: ${id}`);
    }
    return elem;
}

/** @typedef {import("./tiledLoader.js").PlayerClass} PlayerClass*/


class Person {
    /**
     *
     * @param {string} name
     * @param {PlayerClass} pClass
     */
    constructor(name, pClass) {
        this.name = name;
        this.class = pClass;
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
        this.direction = 1;
        this.images = []
        this.lastStepPos = new Vector2d(0, 0);
    }
    //up is 1, right is 2, down is 3 and left is 4
    /**
     *
     * @param {number} direction
     * @param {Vector2d} pos
     */
    move(direction, pos) {
        if (this.direction != direction || this.lastStepPos.distance(pos) > 20.0) {
            this.step = this.step == 0 ? 1 : 0;
            this.lastStepPos = pos;
        }

        this.direction = direction;
    }
}
class Monster {
    /**
     *
     * @param {string} name
     * @param {PlayerClass} pClass
     * @param {Vector2d} monsterPos_w
     */
    constructor(name, pClass, monsterPos_w) {
        this.name = name;
        this.class = pClass;
        this.monsterPos_w = monsterPos_w;
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
        this.direction = 1;
        this.images = []
        this.lastStepPos = new Vector2d(0, 0);
        this.changeDirection = Math.floor(Math.random() * 40)
    }
    //up is 1, right is 2, down is 3 and left is 4
    move() {
        let direction = this.direction;
        if (this.changeDirection === 0) {
            direction = Math.floor(Math.random() * 4) + 1;
        }
        else {  
            this.changeDirection = Math.floor(Math.random() * 40)
        }
        if (this.direction != direction || this.lastStepPos.distance(this.monsterPos_w) > 20.0) {
            this.step = this.step == 0 ? 1 : 0;
            this.lastStepPos = this.monsterPos_w;
        }
        this.changeDirection--;
        this.direction = direction;
    }
}

/** @param {MouseEvent} mouseEvent */
function getCanvasMousePos(mouseEvent) {
    if (!mouseEvent.target || !(mouseEvent.target instanceof HTMLCanvasElement)) {
        return null;
    }

    const rect = mouseEvent.target.getBoundingClientRect();
    return new Vector2d(
        mouseEvent.clientX - rect.left,
        mouseEvent.clientY - rect.top
    );
}

/**
 * @typedef {Object} DraggedItem
 * @property {HTMLElement} element
 * @property {Item} item
 * @property {string} source
 */
//{ element: event.target, item: i, source: "inventory" }

export async function run() {
    let mapCurrent = await Map.load("BasicMap.json");
    let playerSet = await PlayerSet.load("Player.json");
    let monsterSet = await PlayerSet.load("Monsters.json");
    /** @type {{[key: number]: boolean}} */
    let keystate = [];
    let playerPos_w = new Vector2d(128, 128); //in world coordinates
    let timestamp = performance.now();
    let player = new Person("Bob", "Warrior");
    /** @type {Monster[]} */
    let monsters = [];
    monsters.push(new Monster("bob", "Goblin", new Vector2d(130, 130)));
    /** @type {DraggedItem | null} */
    let draggedItem = null;
    /** @type {Vector2d | null} */
    let moveTarget = null;

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
    /* ItemTypes
Consumable
Small
Hand
Chest
Head
Feet
 */



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

    function updateInventory() {
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
    let canvas = document.getElementById('canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
        return;
    }

    const inventoryBox = getElement('inventoryBox');
    inventoryBox.addEventListener("dragover", (event) => {
        if (inventoryBox != event.target || !draggedItem || draggedItem.source == "inventory") { return; }
        event.preventDefault();
    })
    inventoryBox.addEventListener("dragenter", (event) => {
        if (inventoryBox != event.target || !draggedItem || draggedItem.source == "inventory") { return; }
        inventoryBox.classList.add("dragHover");
        event.preventDefault();
    })
    inventoryBox.addEventListener("dragleave", (event) => {
        if (inventoryBox != event.target || !draggedItem || draggedItem.source == "inventory") { return; }
        inventoryBox.classList.remove("dragHover");
        event.preventDefault();
    })
    inventoryBox.addEventListener("drop", (event) => {
        if (inventoryBox != event.target || !draggedItem || draggedItem.source == "inventory") { return; }

        let equippedItem = player.equipped[equipSlots[draggedItem.source]];
        if (equippedItem) {
            delete player.equipped[equipSlots[draggedItem.source]];
            player.inventory.push(equippedItem);
        }
        inventoryBox.classList.remove("dragHover");
        updateInventory()
        event.preventDefault();
    })



    updateCanvasSize(document, canvas);
    document.addEventListener("keydown", (event) => {
        keystate[event.keyCode] = true;
        if (event.key == "i") {
            const inventoryUI = getElement('box');
            if (inventoryUI.style.visibility != "hidden") {
                inventoryUI.style.visibility = "hidden"
            } else {
                updateInventory()
                inventoryUI.style.visibility = "visible"
            }
            event.preventDefault();

        } else if (event.key == "g") {

            let item = mapCurrent.getItem(playerPos_w);
            console.log("test", item);
            if (item) {
                player.inventory.push(item);
            }
            event.preventDefault();
        }
    });
    document.addEventListener("keyup", (event) => {
        keystate[event.keyCode] = false;
    });
    canvas.addEventListener("mousedown", (event) => {

        if (event.button == 0) {

            const cPos = getCanvasMousePos(event);
            if (!cPos) {
                return;
            }
            moveTarget = cPos;
            event.stopPropagation();
            console.log(moveTarget);
        }
    })
    canvas.addEventListener("mouseup", (event) => {

        if (event.button == 0) {

            moveTarget = null;

            console.log(moveTarget);
        }
    })
    canvas.addEventListener("mousemove", (event) => {
        if (moveTarget != null) {
            const cPos = getCanvasMousePos(event);
            if (!cPos) {
                return;
            }
            moveTarget = cPos;
            event.stopPropagation();
            console.log(moveTarget);
        }
    })

    window.addEventListener('resize', () => {
        if (!(canvas instanceof HTMLCanvasElement)) {
            console.log("Canvas is null... there is no hope");
            return;
        }
        updateCanvasSize(document, canvas);
    }, false);
    window.requestAnimationFrame(draw);


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


    for (let slot in equipSlots) {
        addDropListener(slot);
    }





    //haha I am in your codes!

    //TODO only draw map in viewportOrigin_w
    //add mountains
    //get a better person/add animation as well.
    /**
     *
     * @param {number} now
     */
    function draw(now) {

        let dt = (now - timestamp) / 1000;
        timestamp = now;
        let canvas = document.getElementById('canvas');
        if (!(canvas instanceof HTMLCanvasElement)) {
            return;
        }
        let ctx = canvas.getContext('2d');
        if (!ctx) {
            return null;
        }
        let tileSize = mapCurrent.tileSize();

        let mapSize = mapCurrent.size().mul(tileSize);
        let canvasSize = new Vector2d(canvas.width, canvas.height);
        let mapRect = new Rect(new Vector2d(0, 0), mapSize.sub(canvasSize));

        // Top left corner of the viewable area, in world coordinates
        let viewportOrigin_w = playerPos_w.sub(canvasSize.scale(0.5)).clamp(mapRect);

        //convert rect and vector2djs to classes.

        //make map tile class that contains tiles, speed and such (or terrain type)
        //let maptileSize = new Vector2d(map[0].length, map.length);
        /*Vector2d.fromScalar(0).eachGridPoint(maptileSize, (p) => {
            ctx.drawImage(document.getElementById(imageArray[p.mapLookup(map)]), ...p.scale(32).sub(viewportOrigin_w).arr());
        });*/

        mapCurrent.draw(ctx, viewportOrigin_w, canvasSize);
        let playerImageId = playerSet.getPlayerImageId(player.class, player.direction, player.step);
        playerSet.draw(playerImageId, ctx, playerPos_w.sub(viewportOrigin_w));

        for (const monster of monsters) {
            let monsterImageId = monsterSet.getPlayerImageId(monster.class, monster.direction, monster.step);
            monsterSet.draw(monsterImageId, ctx, monster.monsterPos_w.sub(viewportOrigin_w));
            monster.move();
        }

        let speed = mapCurrent.getTileSpeed(playerPos_w, 0);
        // Draw Person
        //ctx.drawImage(playerImage, ...playerPos_w.sub(viewportOrigin_w).arr());

        //left arrow
        let mySpeed = speed; ///currentSpeed(playerPos_w, speed);
        let myVelocity = new Vector2d(0, 0);
        if (keystate[37]) {
            myVelocity = myVelocity.add(new Vector2d(-1, 0))
            player.move(4, playerPos_w)
        }
        //right arrow
        if (keystate[39]) {
            myVelocity = myVelocity.add(new Vector2d(1, 0))
            player.move(2, playerPos_w)
        }
        //up arrow
        if (keystate[38]) {
            myVelocity = myVelocity.add(new Vector2d(0, -1))
            player.move(1, playerPos_w)
        }
        //down arrow
        if (keystate[40]) {
            myVelocity = myVelocity.add(new Vector2d(0, 1))
            player.move(3, playerPos_w)
        }

        if (moveTarget) {
            let wTarget = mapCurrent.viewportToWorld(moveTarget, viewportOrigin_w);
            myVelocity = wTarget.sub(playerPos_w).normalize();
            let moveAnimation = myVelocity.lookupByDir([
                { key: new Vector2d(-1, 0), value: 4 },
                { key: new Vector2d(1, 0), value: 2 },
                { key: new Vector2d(0, -1), value: 1 },
                { key: new Vector2d(0, 1), value: 3 }]);
            player.move(moveAnimation, playerPos_w);
        }

        let newplayerPos_w = playerPos_w.add(myVelocity.scale(mySpeed * dt * 32));
        if (!!mapCurrent.getTileSpeed(newplayerPos_w, 0)) {
            playerPos_w = newplayerPos_w;
        }

        window.requestAnimationFrame(draw);
    }

    /**
     *
     * @param {Document} doc
     * @param {HTMLCanvasElement} canvas
     */
    function updateCanvasSize(doc, canvas) {
        canvas.width = doc.body.clientWidth;
        canvas.height = doc.body.clientHeight;
    }
}

// @ts-check

import { Vector2d } from "./vector2d.js"
import { Rect } from "./rect.js"
import { Map } from "./map.js";
import { PlayerSet as CharacterSet } from "./playerSet.js";
import { Item } from "./item.js";
import { Player } from "./player.js"
import { Monster } from "./monster.js"
import { Inventory } from "./inventory.js"
import { WorldState } from "./worldState.js"

/** @typedef {import("./tiledLoader.js").ItemProperty} ItemProperty */
/** @typedef {import("./tiledLoader.js").EquipType} EquipType */
/** @typedef {import("./character.js").EquippableSlot}  EquippableSlot */
// import someData from "./test.json" assert { type: "json" };

/*

    - finish moving inventory into its own file


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

/** @param {WorldState} state */
const PickupItem = (state) => {
    let item = state.mapCurrent.getItem(state.player.characterPos_w);
    if (item) {
        state.player.inventory.push(item);
    }
}




/** @type {WorldState} */
let worldState;

/** @param {(state: WorldState) => void} f */
export function dispatch(f) {
    f(worldState);
}

export async function run() {
    let mapCurrent = await Map.load("BasicMap.json");
    let playerSet = await CharacterSet.load("Player.json");
    let monsterSet = await CharacterSet.load("Monsters.json");
    worldState = new WorldState(mapCurrent, playerSet, monsterSet);
    /** @type {{[key: number]: boolean}} */
    let keystate = [];
    let timestamp = performance.now();
    /** @type {Vector2d | null} */
    let moveTarget = null;

    let inventory = new Inventory(getElement("inventoryBox"), worldState.player);

    let canvas = document.getElementById('canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
        return;
    }


    updateCanvasSize(document, canvas);
    document.addEventListener("keydown", (event) => {
        keystate[event.keyCode] = true;
        if (event.key == "i") {
            inventory.toggleVisibility();
            event.preventDefault();

        } else if (event.key == "g") {
            dispatch(PickupItem);
            event.preventDefault();
        }else if (event.key == "a") {
            //find direction player is facing
            //get bounding box for where character is facing
            //search character list for any character in that bounding box.
            console.log("dir",worldState.player.direction);
            console.log("position", worldState.player.characterPos_w);
            console.log("lastVel", worldState.player.lastVelocity);
            worldState.player.attack(worldState.monsters);
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
        let viewportOrigin_w = worldState.player.characterPos_w.sub(canvasSize.scale(0.5)).clamp(mapRect);

        //convert rect and vector2djs to classes.

        //make map tile class that contains tiles, speed and such (or terrain type)
        //let maptileSize = new Vector2d(map[0].length, map.length);
        /*Vector2d.fromScalar(0).eachGridPoint(maptileSize, (p) => {
            ctx.drawImage(document.getElementById(imageArray[p.mapLookup(map)]), ...p.scale(32).sub(viewportOrigin_w).arr());
        });*/



        const characters = worldState.characters();

        for (const monster of worldState.monsters) {

            monster.timeToMove(worldState.player.characterPos_w);
            monster.updatePosition(mapCurrent.moveCharacter(dt, monster, characters))
        }

        let speed = mapCurrent.getTileSpeed(worldState.player.characterPos_w, 0);
        // Draw Person
        //ctx.drawImage(playerImage, ...player.characterPos_w.sub(viewportOrigin_w).arr());

        //left arrow
        let mySpeed = speed; ///currentSpeed(player.characterPos_w, speed);
        let myVelocity = new Vector2d(0, 0);
        if (keystate[37]) {
            myVelocity = myVelocity.add(new Vector2d(-1, 0))
        }
        //right arrow
        if (keystate[39]) {
            myVelocity = myVelocity.add(new Vector2d(1, 0))
        }
        //up arrow
        if (keystate[38]) {
            myVelocity = myVelocity.add(new Vector2d(0, -1))
        }
        //down arrow
        if (keystate[40]) {
            myVelocity = myVelocity.add(new Vector2d(0, 1))
        }
        

        if (moveTarget) {
            let wTarget = mapCurrent.viewportToWorld(moveTarget, viewportOrigin_w);
            myVelocity = wTarget.sub(worldState.player.characterPos_w).normalize();
        }

        worldState.player.updateDirection(myVelocity);
        worldState.player.updatePosition(mapCurrent.moveCharacter(dt, worldState.player, characters))

        mapCurrent.draw(ctx, viewportOrigin_w, canvasSize);
        let playerImageId = playerSet.getPlayerImageId(worldState.player.class, worldState.player.direction, worldState.player.step);
        playerSet.draw(playerImageId, ctx, worldState.player.characterPos_w.sub(viewportOrigin_w));
        for (const monster of worldState.monsters) {
            let monsterImageId = monsterSet.getPlayerImageId(monster.class, monster.direction, monster.step);
            monsterSet.draw(monsterImageId, ctx, monster.characterPos_w.sub(viewportOrigin_w));
        }

        for (const character of characters) {
            const {x, y} = character.characterPos_w.sub(viewportOrigin_w);

            if (character.hp !== character.maxHp){
                const health_percent = (character.hp / character.maxHp);
                const w = health_percent * 32;
                ctx.fillStyle = "#00FF00";
                if (health_percent < 0.7) {
                    ctx.fillStyle = "#FFFF00";
                }
                if (health_percent < 0.4) {
                    ctx.fillStyle = "#FF0000";
                }
                ctx.fillRect(x, y-3, w, 2);
            }
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

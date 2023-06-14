// @ts-check

import { Vector2d } from "./vector2d.js"
import { Rect } from "./rect.js"
import { WorldMap } from "./worldMap.js";
import { PlayerSet as CharacterSet } from "./playerSet.js";
import { Inventory } from "./inventory.js"
import { WorldState } from "./worldState.js"
import * as Events from "./events.js"; 
import { drawCharacterHealthBars } from "./drawAttack.js";
import { moveMonsters, movePlayer } from "./movement.js";
import { Player } from "./player.js";


/** @typedef {import("./tiledLoader.js").ItemProperty} ItemProperty */
/** @typedef {import("./tiledLoader.js").EquipType} EquipType */
/** @typedef {import("./character.js").EquippableSlot}  EquippableSlot */
// import someData from "./test.json" assert { type: "json" };


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





export async function run() {
    let mapCurrent = await WorldMap.load("BasicMap.json");
    let playerSet = await CharacterSet.load("Player.json");
    let monsterSet = await CharacterSet.load("Monsters.json");
    let worldState = new WorldState();
    Events.setWorldState(worldState);
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
        } else if (event.key == "g") {
            Events.dispatch(Events.PickupItem(mapCurrent));
        }else if (event.key == "a") {
            //find direction player is facing
            //get bounding box for where character is facing
            //search character list for any character in that bounding box.
            console.log("dir",worldState.player.direction);
            console.log("position", worldState.player.characterPos_w);
            console.log("lastVel", worldState.player.lastVelocity);
            Events.dispatch(Events.PlayerAttack);
        }
        event.preventDefault();
    });
    document.addEventListener("keyup", (event) => {
        keystate[event.keyCode] = false;
    });
    canvas.addEventListener("contextmenu", (event) => {
        event.preventDefault();
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
        } else if (event.button == 2) {
            const cPos = getCanvasMousePos(event);
            if (cPos && canvas instanceof HTMLCanvasElement) {
                let tileSize = mapCurrent.tileSize();
                let mapSize = mapCurrent.size().mul(tileSize);
                let canvasSize = new Vector2d(canvas.width, canvas.height);
                let mapRect = new Rect(new Vector2d(0, 0), mapSize.sub(canvasSize));
                let viewportOrigin_w = worldState.player.characterPos_w.sub(canvasSize.scale(0.5)).clamp(mapRect);
                worldState.player.setDebugPathTarget(cPos.add(viewportOrigin_w));
                // const debugPath = mapCurrent.findPath(worldState.player.characterPos_w, cPos.add(viewportOrigin_w), 0);
                // worldState.player.debugPath = debugPath;
            }
            event.stopPropagation();
            event.preventDefault();
        }
    })
    canvas.addEventListener("mouseup", (event) => {

        if (event.button == 0) {

            moveTarget = null;

            console.log(moveTarget);
        }
        if (event.button == 2) {
            event.stopPropagation();
            event.preventDefault();
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
        if (dt > 0.1) {
            window.requestAnimationFrame(draw);
            return;
        }
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


        const characters = worldState.characters();

        moveMonsters(dt, worldState.time, worldState.monsters, worldState.player, characters, mapCurrent);

        movePlayer(dt, worldState.player, myVelocity, characters, mapCurrent);
        
        characters.sort((a, b) => {
            return a.characterPos_w.y - b.characterPos_w.y;
        });
        

        mapCurrent.draw(ctx, viewportOrigin_w, canvasSize);
        for (const character of characters) {
            if (character instanceof Player) {
                let playerImageId = playerSet.getPlayerImageId(worldState.player.class, worldState.player.direction, worldState.player.step);
                playerSet.draw(playerImageId, ctx, worldState.player.characterPos_w.sub(viewportOrigin_w));
        
            }
            else {
                let monsterImageId = monsterSet.getPlayerImageId(character.class, character.direction, character.step);
                monsterSet.draw(monsterImageId, ctx, character.characterPos_w.sub(viewportOrigin_w));
                //draw monster path:
                if (character.path) {
                    ctx.strokeStyle = "red";
                    ctx.beginPath();
                    ctx.moveTo(...character.characterPos_w.sub(viewportOrigin_w).arr());
                    for (const p of character.path) {
                        ctx.lineTo(...p.sub(viewportOrigin_w).arr());
                    }
                    ctx.stroke();
                }
                // draw cicle at character position
                ctx.strokeStyle = "red";
                ctx.beginPath();
                ctx.arc(...character.characterPos_w.sub(viewportOrigin_w).arr(), 5, 0, 2 * Math.PI);
                ctx.stroke();
            }
        }

        // draw player debug path
        if (worldState.player.debugPath && worldState.player.debugPath.path) {
            ctx.strokeStyle = "red";
            ctx.beginPath();
            ctx.moveTo(...worldState.player.characterPos_w.sub(viewportOrigin_w).arr());
            for (const p of worldState.player.debugPath.path) {
                ctx.lineTo(...p.sub(viewportOrigin_w).arr());
            }
            ctx.stroke();
        }

        drawCharacterHealthBars(characters, viewportOrigin_w, ctx);


        worldState.time += dt;

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

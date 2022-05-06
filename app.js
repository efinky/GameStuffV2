// @ts-check

import {Vector2d} from "./vector2d.js"
import {Rect} from "./rect.js"
// import someData from "./test.json" assert { type: "json" };

//03/28/22
//fix inventory (move items from inventory to wearing)
//make inventory display prettier

//03/18/22
//fix it so that getItem doesn't fail it 0

//03/01/22
//add player animation
//add item collection
//fix wangsets[0] to be something nicer

//02/25/22
//add player animation 
//add item collection
//speed/iswalkable

//02/11/22
//coordfromtilenumber - works really well for terrain (spritesheet) but how do we handle 
//items (not a sprite sheet)


//2/02/22
//dynamically load map as a .json
//dynamically load image from tileset
//dynamically load tileset
//note - in items.json their offset is 417


//1/7/22
//todo:
//add images to map - allow for image collection
//remove fireballs
//create ability to use tile attributes.
//do awesome!
//fix tileset... its offset by a few pixels.
//01/24/22
// Todo:
//sprite sheet generator?
//figure out how to load items
//animations?
//pick up items!!!! (draw items to map first)

async function loadJSON(url) {
    let resp = await fetch(url);
    let json = await resp.json();
    return json;
}

async function loadImage(url) {
    let resp = await fetch(url);
    let blob = await resp.blob();
    const imageUrl = URL.createObjectURL(blob)
    let image = new Image();
    image.src = imageUrl;
    return image;
}


async function loadTileset(path) {
    let data = await (await fetch(path)).json();
//////////////////////////////////////////////////////////
    if (data.wangsets) {
        for (let i in data.wangsets[0].colors) {
            if (data.wangsets[0].colors[i].properties) {
                let properties = {}
                for (let j in data.wangsets[0].colors[i].properties) {
                    properties[data.wangsets[0].colors[i].properties[j].name] = data.wangsets[0].colors[i].properties[j].value;
                }
                data.wangsets[0].colors[i].properties = properties;
                //console.log(properties);
            }
        }
        let wangtiles = {};
        for (let i in data.wangsets[0].wangtiles) {
            if (data.wangsets[0].wangtiles[i].tileid) {
                wangtiles[data.wangsets[0].wangtiles[i].tileid] = data.wangsets[0].wangtiles[i].wangid
            } 
        }
        data.wangsets[0].wangtiles = wangtiles;
    }

                
    if (data.tiles) {
        let imagePromises = []
        for (let i in data.tiles) {
            if (data.tiles[i].image) {
                imagePromises.push(loadImage(data.tiles[i].image).then((image) => {data.tiles[i].image = image}));
            }
            if (data.tiles[i].properties) {
                let properties = {}
                for (let j in data.tiles[i].properties) {
                    properties[data.tiles[i].properties[j].name] = data.tiles[i].properties[j].value;
                }
                data.tiles[i].properties = properties;
            }

        }
        await Promise.all(imagePromises);
    }

    if (data.columns != 0) {
        // this is a spritesheet
        let image = await loadImage(data.image);
        data.image = image;
    }

    return new TileSet(data);
}
async function loadPlayerImages(path) {
   
    let data = await (await fetch(path)).json();
    let playerImages = {};
    let image = await loadImage(data.image);
    //data.image = image;
      
    if (data.tiles) {
        for (let i in data.tiles) {
            if (data.tiles[i].properties) {
                let properties = {}
                for (let j in data.tiles[i].properties) {
                    properties[data.tiles[i].properties[j].name] = data.tiles[i].properties[j].value;
                }
                data.tiles[i].properties = properties;
            }

        }
    }
    for(let i in data.tiles) {
        //let classList = []
        let pClass = data.tiles[i].properties["Class"];
        let pDir = data.tiles[i].properties["AnimationFrame"];
        let pStep = data.tiles[i].properties["Step"];
        if (!playerImages[pClass]) {
            playerImages[pClass] = {};
        }
        if (!playerImages[pClass][pDir]) {
            playerImages[pClass][pDir] = {};
        }
        playerImages[pClass][pDir][pStep] = data.tiles[i].id;
        
    }
    playerImages["image"] = image;
    return new PlayerSet(playerImages, data);
}

async function loadMap(path) {
    let data = await (await fetch(path)).json();
    let tilesets = {}
    for (let i in data.tilesets) {
        tilesets[data.tilesets[i].source] = await loadTileset(data.tilesets[i].source);
        // let tileset = loadTileset(data.tilesets[i].source);
        // console.log("sadf", data.tilesets[i].source);
        // console.log("TileSet", v);
    }
    data.loadedTilesets = tilesets;
    return new Map(data);
}
class PlayerSet {
    constructor(playerImageIds, data) {
        this.image = playerImageIds["image"];
        this.playerImageIds = playerImageIds;
        this.data = data;
    }

    getPlayerImageId(pClass, dir, step) {
        //console.log("step", step);
        return this.playerImageIds[pClass][dir][step];
    }
    draw(id, ctx, dest) {

       
        const x = id % this.data.columns;
        const y = Math.floor(id / this.data.columns);
        const src = new Vector2d(x, y);

        let tileSize = new Vector2d(this.data.tilewidth, this.data.tileheight);

        ctx.drawImage(this.image, ...src.mul(tileSize).arr(), ...tileSize.arr(), ...dest.arr(), ...tileSize.arr());
        
    }

}
class TileSet {
    constructor(tileset) {
        Object.assign(this, tileset);
    }
    imageElement(tileNumber) {
        if (this.columns == 0) {
            return this.tiles[tileNumber].image;
        } else {
            throw Error("tilset is a sprite sheet")
        }
    }
    drawTile(tileNumber, ctx, dest) {

        if (this.columns == 0) {
            ctx.drawImage(this.tiles[tileNumber].image, ...dest.arr());
        } else {
            const x = tileNumber % this.columns;
            const y = Math.floor(tileNumber / this.columns);
            const src = new Vector2d(x, y);

            let tileSize = new Vector2d(this.tilewidth, this.tileheight);

            ctx.drawImage(this.image, ...src.mul(tileSize).arr(), ...tileSize.arr(), ...dest.arr(), ...tileSize.arr());
        }
    }

    // tileSize() {
    //     return new Vector2d(32, 32);
    //     // return new Vector2d(this.tilewidth, this.tileheight);
    // }
}



// const tilesets = {
//     "TileSetSheet.tsx": new TileSet(grass),
//     "Items.tsx": new TileSet(items)
// };

class Map {
    constructor(map) {
        Object.assign(this, map);
        // let grassTiles = new TileSet(grass);
        this.count = 0;

    }
    getWangProperties(pos_w, layer, i) {
        let wang = this.getWangTiles(pos_w, layer, i);
        if (!wang) {
            return null;
        }
        let [tileset, number] = wang;
        return tileset.wangsets[0].colors[tileset.wangsets[0].wangtiles[number][i] - 1].properties;
    }
    getTileSpeed(pos_w, layer) {
        let speed = 0;
        let top_right = 1;
        let bottom_right = 3;
        let bottom_left = 5;
        let top_left = 7;
        let tileSize = new Vector2d(this.tilewidth, this.tileheight);
        
        let properties = null;

        let pTopLeft = pos_w;
        properties = this.getWangProperties(pTopLeft, layer, bottom_right);
        if (!properties) { return 0; }
        speed += properties.SpeedTileSet;

        let pTopRight = pos_w.add(new Vector2d(tileSize.x, 0));
        properties = this.getWangProperties(pTopRight, layer, bottom_left);
        if (!properties) { return 0; }
        speed += properties.SpeedTileSet;


        let pBottomLeft = pos_w.add(new Vector2d(0, tileSize.y));
        properties = this.getWangProperties(pBottomLeft, layer, top_right);
        if (!properties) { return 0; }
        speed += properties.SpeedTileSet;

        let pBottomRight = pos_w.add(tileSize);
        properties = this.getWangProperties(pBottomRight, layer, top_left);
        if (!properties) { return 0; }
        speed += properties.SpeedTileSet;
        
        return speed / 4;
    }

    //[0, top-right, 0, bottom-right, 0, bottom-left, 0, top-left]

    getWangTiles(pos_w, layer, index) {
        const pos_t = this.worldToTile(pos_w).floor();
        const tileNumber = this.tileNumber(pos_t, layer);
        if (tileNumber === null) {
            return null
        }
        let [tileset, number] = this.getTilesetAndNumber(tileNumber);
        return [tileset, number];
        // return tileset.wangtiles[number][index]
    }

    
    getTileProperties(pos_w, layer) {
        const pos_t = this.worldToTile(pos_w).floor();
        const tileNumber = this.tileNumber(pos_t, layer);
        if (!tileNumber) {
            return null
        }
        let [tileset, number] = this.getTilesetAndNumber(tileNumber);
        if (tileset.tiles[number].properties) {
            return tileset.tiles[number].properties;
        } else {
            return {};
        }
    }
    tileNumber(pos_t, layer) {
        let bounds = new Rect(new Vector2d(0,0), new Vector2d(this.width, this.height));
        if (!pos_t.insideOf(bounds)) {
            return null;
        }
        const linearCoord = pos_t.x + pos_t.y * this.width;
        return this.layers[layer].data[linearCoord];
    }

    getItem(pos_w) {
        const pos_t = this.worldToTile(pos_w).add(new Vector2d(0.5, 0.5)).floor();
        const layer = 1;
        // TODO JDV need a better way to update map tiles
        let bounds = new Rect(new Vector2d(0,0), new Vector2d(this.width, this.height));
        if (!pos_t.insideOf(bounds)) {
            return null;
        }
        const linearCoord = pos_t.x + pos_t.y * this.width;
        let tileNumber = 0;
        if (this.layers[layer].data[linearCoord]) {
            tileNumber = this.layers[layer].data[linearCoord];
            this.layers[layer].data[linearCoord] = 0;
            return this.getItemByTileNumber(tileNumber);
        }
        return null;
    }

    getItemByTileNumber(tileNumber) {
        let [tileset, number] = this.getTilesetAndNumber(tileNumber);
        let name = tileset.tiles[number].properties.Name;
        let properties = tileset.tiles[number].properties;
        
        let image = tileset.imageElement(number);

        return new Item(name, image, tileNumber, properties);
    }

    tileSize() {
        return new Vector2d(this.tilewidth, this.tileheight);
    }
    getTilesetAndNumber(tileNumber) {
        for (const {firstgid, source} of this.tilesets.slice().reverse()) {
            if (tileNumber >= firstgid) {
                let tileset = this.loadedTilesets[source];
                return [tileset, tileNumber - firstgid]
            }
        }
        throw new Error("Failed to parse map");
    }
    //we are offseting the tile numbers by firstGID
    drawTile(tileNumber, ctx, dest) {
        if (tileNumber == 0) {
            // empty tile
            return;
        }
        let [tileset, number] = this.getTilesetAndNumber(tileNumber);
        tileset.drawTile(number, ctx, dest);
    }

    //returns vector of tile coordinate.
    viewportToTile(coord_v, viewportOrigin_w) {
        return this.worldToTile(this.viewportToWorld(coord_v, viewportOrigin_w))
    }
    viewportToWorld(coord_v, viewportOrigin_w) {
        return viewportOrigin_w.add(coord_v)
    }
    worldToTile(pos_w) {
        return pos_w.div(this.tileSize());
    }

    // rect() {
    //     let mapSize = new Vector2d(this.width, this.height);
    //     let tileSize = new Vector2d(this.tileWidth, this.tileHeight);
    //     let mapSizePixels = mapSize.mul(tileSize);
    //     let canvasSize = new Vector2d(canvas.width, canvas.height);
    //     let mapRect = new Rect(new Vector2d(0,0), mapSize.sub(canvasSize));
        
    // }
//    tilesets(name) {

//        this.
//    } 

    draw(ctx, viewportOrigin_w, canvasSize) {
        
        let mapSize = new Vector2d(this.width, this.height);
        let tileSize = new Vector2d(this.tilewidth, this.tileheight);
        let mapTileRect = new Rect(new Vector2d(0,0), mapSize);
        // image to draw from
        {
            const topLeftTile = this.viewportToTile(Vector2d.fromScalar(0), viewportOrigin_w).sub(Vector2d.fromScalar(1)).floor().clamp(mapTileRect);
            const bottomRightTile = this.viewportToTile(canvasSize, viewportOrigin_w)
                .add(Vector2d.fromScalar(1))
                .floor()
                .clamp(mapTileRect);
            //tileCoord.mul(tileSize).sub(viewportOrigin_w) < 0 no draw 
            //tileCoord.mul(tileSize).sub(viewportOrigin_w) > canvasSize no draw 
            topLeftTile.eachGridPoint(bottomRightTile, (tileCoord) => {
                
                // TODO JDV foreach layer?
                // size of tile
                const dest = tileCoord.mul(tileSize).sub(viewportOrigin_w);
                // loop once for each layer
                for (let i = 0; i < this.layers.length; i++) {
                    const tileNumber = this.tileNumber(tileCoord, i);
                    this.drawTile(tileNumber, ctx, dest);
                }

                // /// source coordinates to pull image from
                // const [tileset, src] = this.coordFromTileNumber(tileNumber);
                // /// desitation coodinates to put the image at
                // const dest = tileCoord.mul(tileSize).sub(viewportOrigin_w);
                // //ctx.drawImage(image, 0,0);
                // const image = tileset.imageElement();
            
                // ctx.drawImage(image, ...src.mul(tileSize).arr(), ...tileSize.arr(), ...dest.arr(), ...tileSize.arr());
            
            });

        }
        // {
        //     const tileset = tilesets["assets\/mountains.tsx"];
        //     const image = tileset.imageElement();
        //     const topLeftTile = this.viewportToTile(tileset, Vector2d.fromScalar(0), viewportOrigin_w).sub(Vector2d.fromScalar(1)).floor().clamp(mapTileRect);
        //     const bottomRightTile = this.viewportToTile(tileset, canvasSize, viewportOrigin_w)
        //         .add(Vector2d.fromScalar(1))
        //         .floor()
        //         .clamp(mapTileRect);
        //     //tileCoord.mul(tileSize).sub(viewportOrigin_w) < 0 no draw 
        //     //tileCoord.mul(tileSize).sub(viewportOrigin_w) > canvasSize no draw 
        //     topLeftTile.eachGridPoint(bottomRightTile, (tileCoord) => {
                
                
        //         // size of tile
        //         const tileNumber = this.layers[1].data[this.linearCoord(tileCoord)];
        //         /// source coordinates to pull image from
        //         const src = this.coordFromTileNumber(tileNumber);
        //         /// desitation coodinates to put the image at
        //         const dest = tileCoord.mul(tileSize).sub(viewportOrigin_w);
        //         //ctx.drawImage(image, 0,0);

        //         ctx.drawImage(image, ...src.mul(tileSize).arr(), ...tileSize.arr(), ...tileCoord.mul(tileSize).sub(viewportOrigin_w).arr(), ...tileSize.arr());
            
        //     });
        // }
    }
}

class Item {
    constructor(name, image, tileNumber, properties) {
        this.name = name;
        this.image = image;
        this.tileNumber = tileNumber;
        this.equippedType = properties.EquippedType;
        this.type = properties.Type;
        this.value = properties.Value;
        this.weight = parseInt(properties.Weight);
    }
}

/*


 * ItemTypes
Consumable
Small
Hand
Chest
Head
Feet
 */


class Person {
    constructor(name, pClass) {
        this.name = name;
        this.class = pClass;
        this.inventory = [];
        this.equipped = {
            "head" : null,
            "leftHand" : null,
            "rightHand" : null,
            "torso" : null,
            "legs" : null,
            "leftFoot" : null,
            "rightFoot" : null
        }
        //used to animate step
        this.step = 0;
        //used to control direction facing
        this.direction = 1;
        this.images = []
        this.lastStepPos = new Vector2d(0, 0);
    }
    //up is 1, right is 2, down is 3 and left is 4
    move(direction, pos) {
        if (this.direction != direction || this.lastStepPos.distance(pos) > 20.0) {
            this.step = this.step == 0 ? 1 : 0;
            this.lastStepPos = pos;
        }
        
        this.direction = direction;
    }
}
class Player extends Person {
    
}



export const run = async () => {
    let mapCurrent = await loadMap("BasicMap.json");
    let playerImage = await loadImage("Pictures/Person.png");
    let playerSet = await loadPlayerImages("Player.json");
    let keystate = [];
    let playerPos_w = new Vector2d(128, 128); //in world coordinates
    let timestamp = performance.now();
    let player = new Person("Bob", "Warrior")
    
    let draggedItem = null;

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
    function equipableSlots(equipType) {
        switch(equipType) {
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

    function equipableInSlot(equipType, slot) {
        return equipableSlots(equipType).includes(slot);
    }

    function updateInventory() {
        const inventoryBox = document.getElementById('inventoryBox');
        while (inventoryBox.firstChild) {
            inventoryBox.removeChild(inventoryBox.lastChild);
        }
        player.inventory.forEach(i => {
            let x = i.image.cloneNode(false);
            x.dataset.tileNumber = i.tileNumber;
            x.dataset.name = i.name;
            x.draggable = true;
            x.addEventListener("dragstart", (event) => {
                draggedItem = {element: event.target, item: i, source: "inventory"};
                // This is called for inventory items only
                // event.preventDefault()
            })
            inventoryBox.appendChild(x);
        });

        for (let slot in equipSlots) {
            const elem = document.getElementById(slot);
            // There is a loop here, but it should only be one
            while (elem.firstChild) {
                elem.removeChild(elem.lastChild);
            }
            let i = player.equipped[equipSlots[slot]];
            if (i) {
                let x = i.image.cloneNode(false);
                x.dataset.tileNumber = i.tileNumber;
                x.dataset.name = i.name;
                x.draggable = true;
                x.addEventListener("dragstart", (event) => {
                    draggedItem = {element: event.target, item: i, source: "inventory"};
                    // This is called for inventory items only
                    // event.preventDefault()
                })
                elem.appendChild(x)
            }
        }
    }

    const inventoryBox = document.getElementById('inventoryBox');
    inventoryBox.addEventListener("dragover", (event) => {
        if (inventoryBox != event.target || draggedItem.source == "inventory") { return; }
        event.preventDefault();
    })
    inventoryBox.addEventListener("dragenter", (event) => {
        if (inventoryBox != event.target || draggedItem.source == "inventory") { return; }
        inventoryBox.classList.add("dragHover");
        event.preventDefault();
    })
    inventoryBox.addEventListener("dragleave", (event) => {
        if (inventoryBox != event.target || draggedItem.source == "inventory") { return; }
        inventoryBox.classList.remove("dragHover");
        event.preventDefault();
    })
    inventoryBox.addEventListener("drop", (event) => {
        if (inventoryBox != event.target || draggedItem.source == "inventory") { return; }

        let equippedItem = player.equipped[equipSlots[draggedItem.source]];
        if (equippedItem) {
            delete player.equipped[equipSlots[draggedItem.source]];
            player.inventory.push(equippedItem);
        }
        inventoryBox.classList.remove("dragHover");
        updateInventory()
        event.preventDefault();
    })



    updateCanvasSize(document, document.getElementById('canvas'));
    document.addEventListener("keydown", (event) => {
        keystate[event.keyCode] = true;
        if (event.key == "i") {
            const inventoryUI = document.getElementById('box');
            if (inventoryUI.style.visibility != "hidden") {
                inventoryUI.style.visibility = "hidden"
            } else {
                updateInventory()
                inventoryUI.style.visibility = "visible"
            }
            event.preventDefault();
            
        } else if (event.key == "g") {
            
            let item = mapCurrent.getItem(playerPos_w);
            console.log("test",item);
            if (item) {
                player.inventory.push(item);
            }
            event.preventDefault();
        }
    });
    document.addEventListener("keyup", (event) => {
        keystate[event.keyCode] = false;
    });
    window.addEventListener('resize', () => {
        updateCanvasSize(document, document.getElementById('canvas'));
    }, false);
    window.requestAnimationFrame(draw);



    function addDropListener(id) {
        const elem = document.getElementById(id);
        elem.addEventListener("dragstart", (event) => {
            
            draggedItem = {element: event.target, item: player.equipped[equipSlots[id]], source: id}
            //delete player.equipped[equipSlots[id]];
            // This is called for equip slots only
            // event.preventDefault();
        })
        elem.addEventListener("dragover", (event) => {
            event.preventDefault();
        })
        elem.addEventListener("dragenter", (event) => {
            event.preventDefault();
            let item = mapCurrent.getItemByTileNumber(draggedItem.element.dataset.tileNumber);
            if (id in equipSlots && !player.equipped[equipSlots[id]] && event.target.id == id && equipableInSlot(item.equippedType, equipSlots[id])) {
                event.target.classList.add("dragHover");
            }
        })
        elem.addEventListener("dragleave", (event) => {
            event.preventDefault();
            let item = mapCurrent.getItemByTileNumber(draggedItem.element.dataset.tileNumber);
            if (id in equipSlots && !player.equipped[equipSlots[id]] && event.target.id == id && equipableInSlot(item.equippedType, equipSlots[id])) {
                event.target.classList.remove("dragHover");
            }
        })
        elem.addEventListener("drop", (event) => {
            event.preventDefault();
            let item = mapCurrent.getItemByTileNumber(draggedItem.element.dataset.tileNumber);
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
    function draw(now) {
        
        let dt = (now - timestamp)/1000;
        timestamp = now;
        let canvas = document.getElementById('canvas');
        let ctx = canvas.getContext('2d');
        let tileSize = new Vector2d(mapCurrent.tilewidth, mapCurrent.tileheight);
        
        let mapSize = new Vector2d(mapCurrent.width, mapCurrent.height).mul(tileSize);
        let canvasSize = new Vector2d(canvas.width, canvas.height);
        let mapRect = new Rect(new Vector2d(0,0), mapSize.sub(canvasSize));
        
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

        
        let speed = mapCurrent.getTileSpeed(playerPos_w, 0);

        // Draw Person
        //ctx.drawImage(playerImage, ...playerPos_w.sub(viewportOrigin_w).arr());

        //left arrow
        let mySpeed = speed; ///currentSpeed(playerPos_w, speed);
        let myVelocity = new Vector2d(0,0);
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
        if(keystate[38]) {
            myVelocity = myVelocity.add(new Vector2d(0, -1))
            player.move(1, playerPos_w)
        }
        //down arrow
        if (keystate[40]) {
            myVelocity = myVelocity.add(new Vector2d(0, 1))
            player.move(3, playerPos_w)
        }

        let newplayerPos_w = playerPos_w.add(myVelocity.scale(mySpeed*dt*32));
        if (!!mapCurrent.getTileSpeed(newplayerPos_w, 0)) {
            playerPos_w = newplayerPos_w;
        }        

        window.requestAnimationFrame(draw);
    }


    function updateCanvasSize(doc, canvas) {
        canvas.width = doc.body.clientWidth;
        canvas.height = doc.body.clientHeight;
    }
}
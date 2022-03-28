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
                console.log(properties);
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
            let [tileset, number] = this.getTilesetAndNumber(tileNumber);
            console.log("stuff", tileset.tiles[number].properties, number, tileset);
            let name = tileset.tiles[number].properties.Name;
            let image = tileset.imageElement(number);

            return new Item(name, image);
        }
            return null;
        
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
    constructor(name, image) {
        this.name = name;
        this.image = image;
    }
}


class Person {

}
class Player {
    
}

export const run = async () => {
    let mapCurrent = await loadMap("BasicMap.json");
    let playerImage = await loadImage("Pictures/Person.png");
    let keystate = [];
    let playerPos_w = new Vector2d(128, 128); //in world coordinates
    let timestamp = performance.now();

    let playerInventory = [];
    let draggedItem = null;


    // document.body.onload = () => {
        updateCanvasSize(document, document.getElementById('canvas'));
        document.addEventListener("keydown", (event) => {
            keystate[event.keyCode] = true;
            if (event.key == "i") {
                const inventoryUI = document.getElementById('box');
                const inventoryBox = document.getElementById('inventoryBox');
                if (inventoryUI.style.visibility != "hidden") {
                    inventoryUI.style.visibility = "hidden"
                } else {
                    while (inventoryBox.firstChild) {
                        inventoryBox.removeChild(inventoryBox.lastChild);
                      }
                    playerInventory.forEach(i => {
                        let x = i.image.cloneNode(false);
                        x.draggable = true;                        
                        x.addEventListener("dragstart", (event) => {
                            draggedItem = event.target;
                            // event.preventDefault()
                        })
                        inventoryBox.appendChild(x);
                        
                    });
                    inventoryUI.style.visibility = "visible"
                }
                event.preventDefault();
                
            } else if (event.key == "g") {
                
                let item = mapCurrent.getItem(playerPos_w);
                console.log("test",item);
                if (item) {
                    playerInventory.push(item);
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
    // }
    
    const head = document.getElementById('personHead');
    head.addEventListener("dragstart", (event) => {
        draggedItem = event.target;
        // event.preventDefault();
    })
    head.addEventListener("dragover", (event) => {
        event.preventDefault();
    })
    head.addEventListener("dragenter", (event) => {
        event.target.classList.add("dragHover");
        event.preventDefault();
    })
    head.addEventListener("dragleave", (event) => {
        event.target.classList.remove("dragHover");
        event.preventDefault();
    })
    head.addEventListener("drop", (event) => {
        draggedItem.parentNode.removeChild( draggedItem );
        event.target.appendChild( draggedItem );
        event.preventDefault();
    })



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

        
        let speed = mapCurrent.getTileSpeed(playerPos_w, 0);

        // Draw Person
        ctx.drawImage(playerImage, ...playerPos_w.sub(viewportOrigin_w).arr());

        //left arrow
        let mySpeed = speed; ///currentSpeed(playerPos_w, speed);
        let myVelocity = new Vector2d(0,0);
        if (keystate[37]) {
            myVelocity = myVelocity.add(new Vector2d(-1, 0))
        }
        //right arrow
        if (keystate[39]) {
            myVelocity = myVelocity.add(new Vector2d(1, 0))
        }
        //up arrow
        if(keystate[38]) {
            myVelocity = myVelocity.add(new Vector2d(0, -1))
        }
        //down arrow
        if (keystate[40]) {
            myVelocity = myVelocity.add(new Vector2d(0, 1))
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
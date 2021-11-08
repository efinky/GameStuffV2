import grass from "./grassV2.js";
import mountains from "./mountains.js";
import mapTile from "./mapTile.js";
import {Vector2d} from "./vector2d.js"
import {Rect} from "./rect.js"


//Last completed - fixed speed so that it is dynamic and balanced(ish)

//last completed 11/04/21 - made an inventory!  press 'i' to toggle and added some
// "items"

//last completed 11/08/21
//Add Div's left to right (grid auto columns and pick a size?)
//add ability to scroll

//TODO NOTES
//Next up 

//add shadows to items
//make item box grey instead of black
//add border radius and text for items
//tooltip for text (hover over text)
//make person box look better.
//add ability to pickup items and add them to inventory

//find better icons.


//inventory
// weapons 
// gold
// health (on the play in the map)
//minimap
//items, and item pickups
//use items
//monsters, fight dynamics

//average speed equations.  (2*centerTile + corner1Tile + corner2Tile + corner3Tile + corner4Tile)/6


//auto generating map chunks.


//we need to get tile number from the position that the player is standing on.  And use that to get
//tile properties from grassV2.js

//canvas to tile to get tile coordinates
//copy what is on line 107(ish)  linearcoords
//  make a function to do this: const tileNumber = this.layers[0].data[this.linearCoord(tileCoord)]
// then subtract based on layer? (or return tile for each layer?)
// then lookup the tile properties in their layer data,
class TileSet {
    constructor(tileset) {
        Object.assign(this, tileset);
    }
    imageElement() {
        return document.getElementById(this.image);
    }
    coordFromTileNumber(tileNumber) {
        const x = tileNumber % this.columns;
        const y = Math.floor(tileNumber / this.columns);
        return new Vector2d(x, y);
    }
    // tileSize() {
    //     return new Vector2d(32, 32);
    //     // return new Vector2d(this.tilewidth, this.tileheight);
    // }
}

const tilesets = {
    "assets\/mountains.tsx": new TileSet(mountains),
    "assets\/grass.tsx": new TileSet(grass)
};

class Map {
    constructor(map) {
        Object.assign(this, map);
        // let grassTiles = new TileSet(grass);
        this.count = 0;

    }
    
    //fix this (t should change.... LOTS... eventually... on stone?)
    getTile(pos_w) {
        const pos_t = this.worldToTile(pos_w).floor();
        const tileNumber = this.tileNumber(pos_t, 0);
        // console.log("tileNumber ", tileNumber);
        for (const t in grass.tiles) {
            //console.log(t + " - " tileNumber);
            if (grass.tiles[t].tileid == tileNumber - 51) {
                // console.log("getTile",  grass.tiles[t])
                return grass.tiles[t];
            }
        }
        return null;
    }
    tileNumber(pos_t, layer) {
        let bounds = new Rect(new Vector2d(0,0), new Vector2d(this.width, this.height));
        if (!pos_t.insideOf(bounds)) {
            return undefined;
        }
        const linearCoord = pos_t.x + pos_t.y * this.width;
        return this.layers[layer].data[linearCoord];
    }

    tileSize() {
        return new Vector2d(this.tilewidth, this.tileheight);
    }
    //we are offseting the tile numbers by firstGID
    coordFromTileNumber(tileNumber) {
        for (const {firstgid, source} of this.tilesets.slice().reverse()) {
            if (tileNumber >= firstgid) {
                return tilesets[source].coordFromTileNumber(tileNumber - firstgid)
            }
        }
        console.log("asdf", tileNumber);
        throw new Error("Failed to parse map");
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
            const tileset = tilesets["assets\/grass.tsx"];
            const image = tileset.imageElement();
            const topLeftTile = this.viewportToTile(Vector2d.fromScalar(0), viewportOrigin_w).sub(Vector2d.fromScalar(1)).floor().clamp(mapTileRect);
            const bottomRightTile = this.viewportToTile(canvasSize, viewportOrigin_w)
                .add(Vector2d.fromScalar(1))
                .floor()
                .clamp(mapTileRect);
            //tileCoord.mul(tileSize).sub(viewportOrigin_w) < 0 no draw 
            //tileCoord.mul(tileSize).sub(viewportOrigin_w) > canvasSize no draw 
            topLeftTile.eachGridPoint(bottomRightTile, (tileCoord) => {
                
                
                // size of tile
                const tileNumber = this.tileNumber(tileCoord, 0);
                /// source coordinates to pull image from
                const src = this.coordFromTileNumber(tileNumber);
                /// desitation coodinates to put the image at
                const dest = tileCoord.mul(tileSize).sub(viewportOrigin_w);
                //ctx.drawImage(image, 0,0);

                ctx.drawImage(image, ...src.mul(tileSize).arr(), ...tileSize.arr(), ...tileCoord.mul(tileSize).sub(viewportOrigin_w).arr(), ...tileSize.arr());
            
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

export const run = () => {
    document.body.onload = () => {
        updateCanvasSize(document, document.getElementById('canvas'));
        document.addEventListener("keydown", (event) => {
            keystate[event.keyCode] = true;
            if (event.key == "i") {
                const inventoryUI = document.getElementById('box');
                if (inventoryUI.style.visibility != "hidden") {
                    inventoryUI.style.visibility = "hidden"
                } else {
                    inventoryUI.style.visibility = "visible"
                }
                
            }
        });
        document.addEventListener("keyup", (event) => {
            keystate[event.keyCode] = false;
        });
        window.addEventListener('resize', () => {
            updateCanvasSize(document, document.getElementById('canvas'));
        }, false);
        window.requestAnimationFrame(draw);
    }

    let mapCurrent = new Map(mapTile)
    let keystate = [];
    let playerPos_w = new Vector2d(128, 128); //in world coordinates
    let timestamp = performance.now();
    let imageArray = ['wall', 'grass', 'path', 'water'];

    //haha I am in your codes!

    //TODO only draw map in viewportOrigin_w
    //add mountains
    //get a better person/add animation as well.
    function draw(now) {
        
        let dt = (now - timestamp)/1000;
        timestamp = now;
        let defaultSpeed = 3*32*dt;
        let canvas = document.getElementById('canvas');
        let ctx = canvas.getContext('2d');
        let tileSize = new Vector2d(32, 32);
        
        let mapSize = new Vector2d(mapCurrent.width*32, mapCurrent.height*32);
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
        // TODO put this into a separate function:
        let pCenter = playerPos_w.add(tileSize.scale(0.5));
        let pTopLeft = playerPos_w;
        let pTopRight = playerPos_w.add(new Vector2d(tileSize.x, 0));
        let pBottomLeft = playerPos_w.add(new Vector2d(0, tileSize.y));
        let pBottomRight = playerPos_w.add(tileSize);
        let speedPositions = [pCenter, pTopLeft, pTopRight, pBottomLeft, pBottomRight];
        let speed = 0;
        for (let i in speedPositions) {
            let t = mapCurrent.getTile(speedPositions[i]);
            if (t) {
                speed += t.speed;
            }
        }
        speed = speed / speedPositions.length;
        console.log("Speed", speed);

        // Draw Person
        ctx.drawImage(document.getElementById('person'), ...playerPos_w.sub(viewportOrigin_w).arr());

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
        let isWalkable = true;
        let newplayerPos_w = playerPos_w.add(myVelocity.scale(mySpeed));
        {
            let pTopLeft = newplayerPos_w;
            let pTopRight = newplayerPos_w.add(new Vector2d(tileSize.x, 0));
            let pBottomLeft = newplayerPos_w.add(new Vector2d(0, tileSize.y));
            let pBottomRight = newplayerPos_w.add(tileSize);
            let speedPositions = [pTopLeft, pTopRight, pBottomLeft, pBottomRight];
            for (let i in speedPositions) {
                let t = mapCurrent.getTile(speedPositions[i]);
                if (!t || t.isWalkable == false) {
                    isWalkable = false;
                }
            }
        }
        // if (isWalkable(newplayerPos_w) && isWalkable(newplayerPos_w.add(Vector2d.fromScalar(32))))
        // {
        if (isWalkable) {
            playerPos_w = newplayerPos_w;
        }
        window.requestAnimationFrame(draw);
    }

    function isWalkable(pos) {
        let tile = imageArray[pos.scale(1/32).mapLookup(map)];
        return (tile == "grass" || tile == "path" || tile == "water")
    }
    function currentSpeed(pos, speed) {
        let tile = imageArray[pos.scale(1/32).add(Vector2d.fromScalar(0.25)).mapLookup(map)];
        if (tile == "grass") {
            speed -= speed*.4;
        }
        else if (tile == "water") {
            speed -= speed*.9;
        }
        return speed;
    }
    function updateCanvasSize(doc, canvas) {
        canvas.width = doc.body.clientWidth;
        canvas.height = doc.body.clientHeight;
    }
}
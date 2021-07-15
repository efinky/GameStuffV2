import grass from "./grass.js";
import mountains from "./mountains.js";
import mapTile from "./mapTile.js";
import {Vector2d} from "./vector2d.js"
import {Rect} from "./rect.js"

//TODO NOTES
//change speeds based on tiles
//inventory
//items, and item pickups
//use items
//monsters, fight dynamics


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
    linearCoord(pos) {
        return pos.x + pos.y * this.width;
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
    canvasToTile(canvasCoord, viewport) {
        return viewport.add(canvasCoord).div(this.tileSize());
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

    draw(ctx, viewport, canvasSize) {
        
        let mapSize = new Vector2d(this.width, this.height);
        let tileSize = new Vector2d(this.tilewidth, this.tileheight);
        let mapTileRect = new Rect(new Vector2d(0,0), mapSize);
        // image to draw from
        {
            const tileset = tilesets["assets\/grass.tsx"];
            const image = tileset.imageElement();
            const topLeftTile = this.canvasToTile(Vector2d.fromScalar(0), viewport).sub(Vector2d.fromScalar(1)).floor().clamp(mapTileRect);
            const bottomRightTile = this.canvasToTile(canvasSize, viewport)
                .add(Vector2d.fromScalar(1))
                .floor()
                .clamp(mapTileRect);
            //tileCoord.mul(tileSize).sub(viewport) < 0 no draw 
            //tileCoord.mul(tileSize).sub(viewport) > canvasSize no draw 
            topLeftTile.eachGridPoint(bottomRightTile, (tileCoord) => {
                
                
                // size of tile
                const tileNumber = this.layers[0].data[this.linearCoord(tileCoord)];
                /// source coordinates to pull image from
                const src = this.coordFromTileNumber(tileNumber);
                /// desitation coodinates to put the image at
                const dest = tileCoord.mul(tileSize).sub(viewport);
                //ctx.drawImage(image, 0,0);

                ctx.drawImage(image, ...src.mul(tileSize).arr(), ...tileSize.arr(), ...tileCoord.mul(tileSize).sub(viewport).arr(), ...tileSize.arr());
            
            });

        }
        // {
        //     const tileset = tilesets["assets\/mountains.tsx"];
        //     const image = tileset.imageElement();
        //     const topLeftTile = this.canvasToTile(tileset, Vector2d.fromScalar(0), viewport).sub(Vector2d.fromScalar(1)).floor().clamp(mapTileRect);
        //     const bottomRightTile = this.canvasToTile(tileset, canvasSize, viewport)
        //         .add(Vector2d.fromScalar(1))
        //         .floor()
        //         .clamp(mapTileRect);
        //     //tileCoord.mul(tileSize).sub(viewport) < 0 no draw 
        //     //tileCoord.mul(tileSize).sub(viewport) > canvasSize no draw 
        //     topLeftTile.eachGridPoint(bottomRightTile, (tileCoord) => {
                
                
        //         // size of tile
        //         const tileNumber = this.layers[1].data[this.linearCoord(tileCoord)];
        //         /// source coordinates to pull image from
        //         const src = this.coordFromTileNumber(tileNumber);
        //         /// desitation coodinates to put the image at
        //         const dest = tileCoord.mul(tileSize).sub(viewport);
        //         //ctx.drawImage(image, 0,0);

        //         ctx.drawImage(image, ...src.mul(tileSize).arr(), ...tileSize.arr(), ...tileCoord.mul(tileSize).sub(viewport).arr(), ...tileSize.arr());
            
        //     });
        // }
    }
}

export const run = () => {
    document.body.onload = () => {
        updateCanvasSize(document, document.getElementById('canvas'));
        document.addEventListener("keydown", (event) => {
            keystate[event.keyCode] = true;
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
    let pos = new Vector2d(128, 128);
    let timestamp = performance.now();
    let imageArray = ['wall', 'grass', 'path', 'water'];

    //haha I am in your codes!

    //TODO only draw map in viewport
    //add mountains
    //get a better person/add animation as well.
    function draw(now) {
        
        let dt = (now - timestamp)/1000;
        timestamp = now;
        let speed = 3*32*dt;
        let canvas = document.getElementById('canvas');
        let ctx = canvas.getContext('2d');
        
        let mapSize = new Vector2d(mapCurrent.width*32, mapCurrent.height*32);
        let canvasSize = new Vector2d(canvas.width, canvas.height);
        let mapRect = new Rect(new Vector2d(0,0), mapSize.sub(canvasSize));
        
        let viewport = pos.sub(canvasSize.scale(0.5)).clamp(mapRect);

        //convert rect and vector2djs to classes.
        
        //make map tile class that contains tiles, speed and such (or terrain type)
        //let maptileSize = new Vector2d(map[0].length, map.length);
        /*Vector2d.fromScalar(0).eachGridPoint(maptileSize, (p) => {
            ctx.drawImage(document.getElementById(imageArray[p.mapLookup(map)]), ...p.scale(32).sub(viewport).arr());
        });*/
        mapCurrent.draw(ctx, viewport, canvasSize);

        // Draw Person
        ctx.drawImage(document.getElementById('person'), ...pos.sub(viewport).arr());

        //left arrow
        let mySpeed = speed; ///currentSpeed(pos, speed);
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
        let newPos = pos.add(myVelocity.scale(mySpeed));
        // if (isWalkable(newPos) && isWalkable(newPos.add(Vector2d.fromScalar(32))))
        // {
            pos = newPos;
        // }
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
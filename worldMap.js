import { Vector2d } from "./vector2d.js";
import { Rect } from "./rect.js"
import { TileSet } from "./tileSet.js"
import * as Tiled from "./tiledTypes.js";
import { Item } from "./item.js";
import { Character } from "./character.js";
import { aStar } from "./a-star.js";

export class WorldMap {
    /**
  * @param {string} path
  */
    static async load(path) {
        /** @type {Tiled.Map} */
        let data = await (await fetch(path)).json();
        /** @type {{[key: string]: TileSet }} */
        let loadedTilesets = {}
        for (let i in data.tilesets) {
            loadedTilesets[data.tilesets[i].source] = await TileSet.load(data.tilesets[i].source);
            // let tileset = loadTileset(data.tilesets[i].source);
            // console.log("sadf", data.tilesets[i].source);
            // console.log("TileSet", v);
        }

        // { [key: string]: TileSet}

        return new WorldMap(data, loadedTilesets);

    }
    /**
     *
     * @param {Tiled.Map} map
     * @param {{[key: string]: TileSet}} tilesets
     */
    constructor(map, tilesets) {
        this.map = map;
        this.loadedTilesets = tilesets;
        // let grassTiles = new TileSet(grass);
        this.count = 0;

    }
    /**
    *
    * @param {Vector2d} pos_w
    * @param {number} layer
    * @param {number} i
    * @returns
    */
    getWangProperties(pos_w, layer, i) {
        let wang = this.getWangTiles(pos_w, layer, i);
        if (!wang) {
            return null;
        }
        let [tileset, number] = wang;
        if (tileset.tileset.tilesetType == "spriteSheet" && tileset.tileset.wangSet?.wangtiles) {
            let wangTile = tileset.tileset.wangSet.wangtiles.find((s) => s.tileid === number)
            if (!wangTile) {
                return null;
            }
            return tileset.tileset.wangSet.colors[wangTile.wangid[i] - 1]
        } else {
            return null;
        }
    }
    /**
     *
     * @param {Vector2d} pos_w
     * @param {number} layer
     * @returns {number}
     */
    getTileSpeed(pos_w, layer) {
        let speed = 0;
        let top_right = 1;
        let bottom_right = 3;
        let bottom_left = 5;
        let top_left = 7;
        let tileSize = new Vector2d(this.map.tilewidth, this.map.tileheight);

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

    /**
    * @param {number} dt
    * @param {Character} myCharacter
    * @param {Character[]} characters
    * @return {(pos_w: Vector2d, direction: Vector2d, speedMultiplier: number) => Vector2d}
    */
    moveCharacter(dt, myCharacter, characters) {
        return (pos_w, direction, speedMultiplier) => {
            let speed = this.getTileSpeed(pos_w, 0);
            let newcharacterPos_w = pos_w.add(direction.scale(speed * speedMultiplier * dt).mul(this.tileSize()));
            let collides = false;
            for (let character of characters) {
                if (myCharacter === character) {
                    continue;
                }
                if (character.collidesWith(newcharacterPos_w)) {
                    collides = true;
                }
            }
            if (!!this.getTileSpeed(newcharacterPos_w, 0) && !collides) {
                return newcharacterPos_w;
            }
            return pos_w;
        }
    }

    //[0, top-right, 0, bottom-right, 0, bottom-left, 0, top-left]

    /**
     *
     * @param {Vector2d} pos_w
     * @param {number} layer
     * @param {number} index
     * @returns {[TileSet, number] | null}
     */
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

    /**
     *
     * @param {Vector2d} pos_w
     * @param {number} layer
     * @returns
     */
    getTileProperties(pos_w, layer) {
        const pos_t = this.worldToTile(pos_w).floor();
        const tileNumber = this.tileNumber(pos_t, layer);
        if (!tileNumber) {
            return null
        }
        let [tileset, number] = this.getTilesetAndNumber(tileNumber);
        let tile = tileset.tileset.tiles[number];
        if (tile.type == "Item") {
            return tile.properties;
        } else {
            return {};
        }
    }
    /**
     *
     * @param {Vector2d} pos_t
     * @param {number} layer
     * @returns
     */
    tileNumber(pos_t, layer) {
        let bounds = new Rect(new Vector2d(0, 0), new Vector2d(this.map.width, this.map.height));
        if (!pos_t.insideOf(bounds)) {
            return null;
        }
        const linearCoord = pos_t.x + pos_t.y * this.map.width;
        return this.map.layers[layer].data[linearCoord];
    }
    /**
     *
     * @param {Vector2d} pos_w
     * @returns
     */
    getItem(pos_w) {
        const pos_t = this.worldToTile(pos_w).add(new Vector2d(0.5, 0.5)).floor();
        const layer = 1;
        // TODO JDV need a better way to update map tiles
        let bounds = new Rect(new Vector2d(0, 0), new Vector2d(this.map.width, this.map.height));
        if (!pos_t.insideOf(bounds)) {
            return null;
        }
        const linearCoord = pos_t.x + pos_t.y * this.map.width;
        let tileNumber = 0;
        if (this.map.layers[layer].data[linearCoord]) {
            tileNumber = this.map.layers[layer].data[linearCoord];
            this.map.layers[layer].data[linearCoord] = 0;
            return this.getItemByTileNumber(tileNumber);
        }
        return null;
    }

    getAllItems() {
        /** @type {{pos: Vector2d, item: Item}[]} */
        let items = [];
        let layer = 1;
        for (let y = 0; y < this.map.height; y++) {
            for (let x = 0; x < this.map.width; x++) {
                const linearCoord = x + y * this.map.width;
                let tileNumber = 0;
                if (this.map.layers[layer].data[linearCoord]) {
                    tileNumber = this.map.layers[layer].data[linearCoord];
                    this.map.layers[layer].data[linearCoord] = 0;
                    let item = this.getItemByTileNumber(tileNumber);
                    if (item) {
                        const tileCoord = this.tileCoordFromLinearCoord(linearCoord);
                        items.push({pos: tileCoord, item});
                    }
                }
            }
        }
        return items;
    }

    /**
     * 
     * @param {Vector2d} pos_w 
     * @returns {number}
     */
    getLinearCoord(pos_w) {
        // definitely need to use round here instead of floor or ceil
        const pos_t = this.worldToTile(pos_w).round();
        return pos_t.x + pos_t.y * this.map.width;
    }

    /**
     * @param {number} linearCoord
     */
    tileCoordFromLinearCoord(linearCoord) {
        let x = linearCoord % this.map.width;
        let y = Math.floor(linearCoord / this.map.width);
        return new Vector2d(x, y);
    }

    /**
     * @param {number} tileNumber
     */
    itemImageFromTileNumber(tileNumber) {
        let [tileset, number] = this.getTilesetAndNumber(tileNumber);
        let itemTile = tileset.tileset.tiles[number];
        if (itemTile.type != "Item") {
            return null;
        }
        let image = tileset.imageElement(number);
        return image;
    }

    /**
     *
     * @param {number} tileNumber
     * @returns
     */
    getItemByTileNumber(tileNumber) {

        let [tileset, number] = this.getTilesetAndNumber(tileNumber);
        let itemTile = tileset.tileset.tiles[number];
        if (itemTile.type != "Item") {
            return null;
        }
        let name = itemTile.properties.name;
        let properties = itemTile.properties;

        return new Item(name, tileNumber, properties);
    }
    /**
     *
     * @returns
     */
    tileSize() {
        return new Vector2d(this.map.tilewidth, this.map.tileheight);
    }


    size() {
        return new Vector2d(this.map.width, this.map.height);
    }
    /**
     *
     * @param {number} tileNumber
     * @returns {[TileSet, number]}
     */
    getTilesetAndNumber(tileNumber) {
        for (const { firstgid, source } of this.map.tilesets.slice().reverse()) {
            if (tileNumber >= firstgid) {
                let tileset = this.loadedTilesets[source];
                return [tileset, tileNumber - firstgid]
            }
        }
        throw new Error("Failed to parse map");
    }
    //we are offseting the tile numbers by firstGID
    /**
     *
     * @param {number} tileNumber
     * @param {CanvasRenderingContext2D} ctx
     * @param {Vector2d} tileCoord
     * @param {Vector2d} viewportOrigin_w
     * @returns
     */
    drawTile(tileNumber, ctx, tileCoord, viewportOrigin_w) {
        if (tileNumber == 0) {
            // empty tile
            return;
        }
        let tileSize = new Vector2d(this.map.tilewidth, this.map.tileheight);
        const dest = tileCoord.mul(tileSize).sub(viewportOrigin_w);
        let [tileset, number] = this.getTilesetAndNumber(tileNumber);
        tileset.drawTile(number, ctx, dest);
    }

    //returns vector of tile coordinate.
    /**
     *
     * @param {Vector2d} coord_v
     * @param {Vector2d} viewportOrigin_w
     * @returns
     */
    viewportToTile(coord_v, viewportOrigin_w) {
        return this.worldToTile(this.viewportToWorld(coord_v, viewportOrigin_w))
    }
    /**
     *
     * @param {Vector2d} coord_v
     * @param {Vector2d} viewportOrigin_w
     * @returns
     */
    viewportToWorld(coord_v, viewportOrigin_w) {
        return viewportOrigin_w.add(coord_v)
    }
    /**
     *
     * @param {Vector2d} pos_w
     * @returns
     */
    worldToTile(pos_w) {
        return pos_w.div(this.tileSize());
    }

    /**
     * @param {Vector2d} pos_t
     */
    tileToWorld(pos_t) {
        return pos_t.mul(this.tileSize());
    }

    /**
     * 
     * @param {Vector2d} pos_t 
     * @param {number} layer
     * @returns 
     */
    neighbors(pos_t, layer) {
        let neighbors = [];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (x == 0 && y == 0) {
                    continue;
                }
                //diaganols are more expensive
                const costFactor = (x == pos_t.x || y == pos_t.y) ? 1 : 1.4;
                const speed = this.getTileSpeed(this.tileToWorld(pos_t).add(new Vector2d(x, y)), layer);
                if (speed == 0) {
                    continue;
                }

                // if diagonal movement is blocked by the two non-diagonal tiles
                if (x != 0 && y != 0) {
                    const speed1 = this.getTileSpeed(this.tileToWorld(pos_t.add(new Vector2d(x, 0))), layer);
                    const speed2 = this.getTileSpeed(this.tileToWorld(pos_t.add(new Vector2d(0, y))), layer);
                    if (speed1 == 0 || speed2 == 0) {
                        continue;
                    }
                }

                const cost = costFactor / speed;
                const coord = pos_t.add(new Vector2d(x, y));

                neighbors.push({ cost, coord });
            }
        }
        return neighbors;
    }

    /**
     * @param {Vector2d} pos
     * @param {number} layer
     * @param {Vector2d[]} [obstacles]
     */
    visitableNeighbors(pos, layer, obstacles = []) {
        const startTile = this.worldToTile(pos).floor();
        const obstacleTiles = obstacles.map((pos) => this.worldToTile(pos).floor());
        const neighbors = this.neighbors(startTile, layer)
            .filter((neighbor) => 
                !obstacleTiles.some((obstacle) => {
                    let match = obstacle.equal(neighbor.coord);
                    // if (match) {
                    //     console.log("obstacle", obstacle, neighbor.coord);
                    // }
                    return match;
                })).map((neighbor) => this.tileToWorld(neighbor.coord));

        return neighbors;
    }

    /**
     * 
     * @param {Vector2d} start 
     * @param {Vector2d} end 
     * @param {number} layer
     * @param {Vector2d[]} [obstacles]
     */
    findPath(start, end, layer, obstacles = []) {
        const startTile = this.worldToTile(start).floor();
        const endTile = this.worldToTile(end).floor();
        const obstacleTiles = obstacles.map((pos) => this.worldToTile(pos).floor());
        const path = aStar(startTile, endTile, (pos) => this.neighbors(pos, layer)
            .filter((neighbor) => 
                !obstacleTiles.some((obstacle) => {
                    let match = obstacle.equal(neighbor.coord);
                    // if (match) {
                    //     console.log("obstacle", obstacle, neighbor.coord);
                    // }
                    return match;
                })));
        if (path.length > 0) {
            path.shift();
        }
        return path.map((pos) => this.tileToWorld(pos)); //.add(new Vector2d(16,16)));
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
    /**
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {Vector2d} viewportOrigin_w
     * @param {Vector2d} canvasSize
     */
    draw(ctx, viewportOrigin_w, canvasSize) {

        let mapSize = new Vector2d(this.map.width, this.map.height);
        
        let mapTileRect = new Rect(new Vector2d(0, 0), mapSize);
        // image to draw from
        {
            const topLeftTile = this.viewportToTile(Vector2d.fromScalar(0), viewportOrigin_w).sub(Vector2d.fromScalar(1)).floor().clamp(mapTileRect);
            const bottomRightTile = this.viewportToTile(canvasSize, viewportOrigin_w)
                .add(Vector2d.fromScalar(1))
                .floor()
                .clamp(mapTileRect);
            //tileCoord.mul(tileSize).sub(viewportOrigin_w) < 0 no draw
            //tileCoord.mul(tileSize).sub(viewportOrigin_w) > canvasSize no draw
            topLeftTile.eachGridPoint(bottomRightTile, (/** @type {Vector2d} */ tileCoord) => {

                // TODO JDV foreach layer?
                // size of tile
                
                // loop once for each layer
                for (let i = 0; i < this.map.layers.length; i++) {
                    const tileNumber = this.tileNumber(tileCoord, i);
                    if (tileNumber != null) {
                        this.drawTile(tileNumber, ctx, tileCoord, viewportOrigin_w);
                    }
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



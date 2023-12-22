import { Vector2d } from "../lib/vector2d/vector2d.js";
import { convertSpriteSheetTileset, convertTileset, isCharacterTile } from "./tiledLoader.js";
import * as Tiled from "./tiledTypes.js";

export class TileSet {

    /**
    * @param {string} path
    */
    static async load(path) {
        /** @type {Tiled.Tileset} */
        let data = await (await fetch("assets/" + path)).json();
        return new TileSet(await convertTileset(data));
    }

    /**
     *
     * @param {import("./tiledLoader.js").SpriteSheetTileset | import("./tiledLoader.js").ImageListTileset} tileset
     */
    constructor(tileset) {
        this.tileset = tileset;
    }

    /**
     * @param {number} tileNumber
    */
    imageElement(tileNumber) {
        if (this.tileset.tilesetType == "imageList") {
            return this.tileset.tiles[tileNumber].image;
        } else {
            throw Error("tilset is a sprite sheet")
        }
    }

    /**
     *
     * @param {number} tileNumber
     * @param {CanvasRenderingContext2D} ctx
     * @param {Vector2d} dest
     */
    drawTile(tileNumber, ctx, dest) {
        if (this.tileset.tilesetType == "imageList") {
            ctx.drawImage(this.tileset.tiles[tileNumber].image, ...dest.arr());
        } else {
            const x = tileNumber % this.tileset.columns;
            const y = Math.floor(tileNumber / this.tileset.columns);
            const src = new Vector2d(x, y);

            let tileSize = new Vector2d(this.tileset.tileWidth, this.tileset.tileHeight);

            ctx.drawImage(this.tileset.image, ...src.mul(tileSize).arr(), ...tileSize.arr(), ...dest.arr(), ...tileSize.arr());
        }
    }
}

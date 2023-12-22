import { Vector2d } from "../lib/vector2d/vector2d.js";

import { convertSpriteSheetTileset, convertTileset, isCharacterTile } from "./tiledLoader.js";
import * as Tiled from "./tiledTypes.js";

export class PlayerSet {
    /**
    * @param {string} path
    */
    static async load(path) {
        /** @type {Tiled.Tileset} */
        let tiled_data = await (await fetch(path)).json();
        let data = await convertSpriteSheetTileset(tiled_data);

        /** @type { { [key: string]: {[key: number]: {[key: number]: number} } } } */
        let playerImages = {};
        for (let tile of data.tiles) {
            if (!isCharacterTile(tile)) {
                continue;
            }
            let pClass = tile.properties["Class"];
            let pDir = tile.properties["AnimationFrame"];
            let pStep = tile.properties["Step"];
            if (!playerImages[pClass]) {
                playerImages[pClass] = {};
            }
            if (!playerImages[pClass][pDir]) {
                playerImages[pClass][pDir] = {};
            }
            playerImages[pClass][pDir][pStep] = tile.id;
        }
        return new PlayerSet(data.image, playerImages, data);
    }
    /**
     * @param {HTMLImageElement} image
     * @param {{ [key: string]: {[key: number]: {[key: number]: number} } }} playerImageIds
     * @param { import("./tiledLoader.js").SpriteSheetTileset } data
     */
    constructor(image, playerImageIds, data) {
        this.image = image;
        this.playerImageIds = playerImageIds;
        this.data = data;
    }

    /**
     * @param {string} pClass
     * @param {number} dir
     * @param {number} step
     */
    getPlayerImageId(pClass, dir, step) {
        // console.log("pClass", this.playerImageIds);
        return this.playerImageIds[pClass][dir][step];
    }

    /**
     * @param {number} id
     * @param {CanvasRenderingContext2D} ctx
     * @param {Vector2d} dest
     */
    draw(id, ctx, dest) {
        const x = id % this.data.columns;
        const y = Math.floor(id / this.data.columns);
        const src = new Vector2d(x, y);

        let tileSize = new Vector2d(this.data.tileWidth, this.data.tileHeight);

        ctx.drawImage(this.image, ...src.mul(tileSize).arr(), ...tileSize.arr(), ...dest.arr(), ...tileSize.arr());
    }

}


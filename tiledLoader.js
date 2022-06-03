import * as Tiled from "./tiledTypes.js";
import {loadImage, loadJSON} from "./utils.js";
/**
 * @typedef {"spriteSheet"|"imageList"} TilesetType
 */

/**
 * @typedef Tile
 * @property {TileNumber} tileid
 * @property {TilesetProperty} property
 */
/**
 * @typedef {number} TileNumber
 */

//image ? if spritesheet
//columns
//tiles[]
//  tileid
//  image ? if imagelist
//  properties
//wangsets[]
//  colors[]
//      properties
//  wangtiles[]
//      tileid
//      wangid[]
/**
 * @typedef {Object} SpriteSheetTileset
 * @property {"spriteSheet"} tilesetType
 * @property {string} image
 * @property {Tile[]} tiles
 * @property {WangSet} wangSet
 */


/**
 * @typedef {Object} PlayerProperty
 * @property {number} AnimationFrame
 * @property {number} Step
 * @property {string} Class
 */

/** @typedef {"Food" | "Jewel" | "Currency" | "Weapon" | "Armour" | "Clothing"} ItemType*/


/** @typedef {"Consumable" | "Small" | "Hand" | "Chest" | "Head" | "Feet"} EquipType*/

/**
 * @typedef {Object} ItemProperty
 * @property {EquipType} equipType
 * @property {string} name
 * @property {number} value
 * @property {number} weight
 * @property {ItemType} type
 */

/**
 * @typedef {Object} MonsterProperty
 * @property {string} image
 */


/**
 * @typedef { Object } PlayerTile
 * @property { number } id
 * @property { HTMLImageElement } image
 * @property { number } imageWidth
 * @property { number } imageHeight
 * @property { "Player" } type
 * @property { PlayerProperty } properties
*/

/**
 * @typedef { Object } ItemTile
 * @property { number } id
 * @property { HTMLImageElement } image
 * @property { number } imageWidth
 * @property { number } imageHeight
 * @property { "Item" } type
 * @property { ItemProperty } properties
*/

/**
 * @typedef { Object } MonsterTile
 * @property { number } id
 * @property { HTMLImageElement } image
 * @property { number } imageWidth
 * @property { number } imageHeight
 * @property { "Monster" } type
 * @property { MonsterProperty } properties
*/

/** @typedef { PlayerTile | ItemTile | MonsterTile }  ImageTile */

/**
 * @typedef {Object} ImageListTileset
 * @property {"imageList"} tilesetType
 * @property {string} name
 * @property {number} tileCount
 * @property {number} tileHeight
 * @property {number} tileWidth
 * @property {ImageTile[]} tiles
 */


/**
 * @typedef {Object} TileSetBetter
 * @property {TilesetType} 
 */


/**
 * @typedef {Object} NumberProperty
 * @property {string} name
 * @property {"int"} type
 * @property {number} value
*/

/**
 * @typedef {Object} StringProperty
 * @property {string} name
 * @property {"string"} type
 * @property {string} value
*/

/**
 * @typedef {NumberProperty | StringProperty } TilesetProperty
*/

/**
 * @typedef {Object} TilesetColors
 * @property {TilesetProperty[]} properties
*/

/**
 * @typedef {Object} WangSet
 * @property {TilesetColors[]} colors
 * @property {WangTile[]} wangtiles
 */

/**
 * { 
 *   "tileid":192,
 *   "wangid":[0, 3, 0, 3, 0, 3, 0, 3]
 * }
 * @typedef {Object} WangTile
 * @property {number} tileid
 * @property {number[]} wangid
 */

/**
 * @typedef {Object} TilesetData
 * @property {WangSet[]} wangsets
 */

/**
 * @typedef { { [name: string]: number | string } } Property
 */


/**
 * @typedef {Object} Tileset
 * @property { number } columns
 * @property {WangSet[]} wangsets
 */

/**
 * @param {any} tileset
 * @return { SpriteSheetTileset }
*/
function convertSpriteSheetTileset(tileset) {

}

/*

{
        equippedType: "Consumable",
        name: "Apple",
        weight: 3,
        value: 5,
        type: "food",
}


*/


/**
 * @param {any} value
 * @return {value is EquipType}
 */
function isEquipType(value) {
       if (
              value === "Food" ||
              value === "Jewel" ||
              value === "Currency" ||
              value === "Weapon" ||
              value === "Armour" ||
              value === "Clothing"
       ) {
              return true;
       } else {
              return false;
       }
}

/**
 *
 * @param {*} value
 * @return {value is ItemType}
 */
function isItemType(value) {
       if (
              value === "Consumable" ||
              value === "Small" ||
              value === "Hand" ||
              value === "Chest" ||
              value === "Head" ||
              value === "Feet"
       ) {
              return true;
       } else {
              return false;
       }
}




/**
 * @param {Tiled.Tile} tile
 * @return { Promise<ImageTile> }
 */
async function convertImageTile(tile) {
       if (tile.type === "Item") {
              if (tile.imageheight === undefined || tile.imagewidth === undefined) {
                     throw Error(
                            "Item tile was missing `imageheight` or `imagewidth` property"
                     );
              }
              if (tile.properties === undefined) {
                     throw Error("Item tile was missing `properties` property");
              }
              if (tile.image === undefined) {
                     throw Error("Item tile was missing `image` property");
              }
              let equipType = tile.properties.find(
                     (p) => p.name === "EquippedType"
              )?.value;
              let name = tile.properties.find((p) => p.name === "Name")?.value;
              let value = tile.properties.find((p) => p.name === "Value")?.value;
              let weight = tile.properties.find((p) => p.name === "Weight")?.value;
              let type = tile.properties.find((p) => p.name === "Type")?.value;

              if (typeof weight !== "number") {
                     throw Error("Item tile was missing `weight` property");
              }
              if (typeof value !== "number") {
                     throw Error("Item tile was missing `value` property");
              }
              if (typeof name !== "string") {
                     throw Error("Item tile was missing `name` property");
              }

              if (!isEquipType(equipType)) {
                     throw Error("Item tile's `equipType` property wasn't a valid `EquipType`");
              }
              if (!isItemType(type)) {
                     throw Error("Item tile's `itemType` property wasn't a valid `ItemType`");
              }

              return {
                     type: "Item",
                     id: tile.id,
                     image: await loadImage(tile.image),
                     imageHeight: tile.imageheight,
                     imageWidth: tile.imagewidth,
                     properties: {
                            equipType,
                            name,
                            value,
                            weight,
                            type,
                     },
              };
       }
       throw Error("Unknown tile type");
}


/**
 * @param {any} tileset
 * @return { ImageListTileset }
*/
function convertImageListTileset(tileset) {

       return {
              tilesetType: "imageList",
              name: tileset.name,
              tileCount: tileset.tilecount,
              tileWidth: tileset.tilewidth,
              tileHeight: tileset.tileheight,
              tiles: tileset.tiles.map()


       }
}


/**
  * @param {any} tileset
  * @return {SpriteSheetTileset | ImageListTileset}  */
function convertTileset(tileset) {
       if (tileset.columns === 0) {
              return convertImageListTileset(tileset);
       } else {
              return convertSpriteSheetTileset(tileset);
       }
}





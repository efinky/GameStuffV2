import * as Tiled from "./tiledTypes.js";
import { loadImage, loadJSON } from "./utils.js";
/**
 * @typedef {"spriteSheet"|"imageList"} TilesetType
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
 * @export
 * @typedef {Object} SpriteSheetTileset
 * @property {"spriteSheet"} tilesetType
 * @property {HTMLImageElement} image
 * @property {number} columns
 * @property {number} imageHeight
 * @property {number} imageWidth
 * @property {number} tileHeight
 * @property {number} tileWidth
 * @property {Tile[]} tiles
 * @property {WangSet | undefined} wangSet
 */

/** @typedef {"Wizard" | "Sorcerer" | "Pirate" | "Warrior"} PlayerClass */

/** @typedef {"Food" | "Drink" | "Jewel" | "Currency" | "Weapon" | "Armour" | "Clothing"} ItemType*/

/** @typedef {"Consumable" | "Small" | "Hand" | "Chest" | "Head" | "Legs" | "Feet"} EquipType*/

/**
 * @typedef {Object} MonsterProperty
 * @property {string} image
 */

/**
 * @typedef { Object } MonsterTile
 * @property { number } id
 * @property { "Monster" } type
 * @property { MonsterProperty } properties
 */

/**
 * @typedef {Object} PlayerProperty
 * @property {number} AnimationFrame
 * @property {number} Step
 * @property {string} Class
 */

/**
 * @typedef { Object } PlayerTile
 * @property { number } id
 * @property { "Player" } type
 * @property { PlayerProperty } properties
 */

/**
 * @typedef { Object } TerrainTile
 * @property { number } id
 * @property { "Terrain" } type
 */

/** @typedef { PlayerTile | MonsterTile | TerrainTile } Tile */

/**
 * @param {Tile} value
 * @return {value is PlayerTile}
 */
export function isPlayerTile(value) {
       if (value.type === "Player") {
              return true;
       } else {
              return false;
       }
}


/**
 * @typedef {Object} ItemProperty
 * @property {EquipType} equipType
 * @property {string} name
 * @property {number} value
 * @property {number} weight
 * @property {ItemType} type
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

/** @typedef { ItemTile }  ImageTile */

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
 * @property {TilesetType} stuff
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
 * @property {number} SpeedTileSet
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
 * @param {Tiled.Wangset} wangset
 * @returns {WangSet}
 */
function convertWangSets(wangset) {
  // let wangset = foo.wangsets.find((s) => s.name === "TerrainSet");
  let result = {
    colors: wangset.colors.map((color) => {
      let speed = color.properties?.find(
        (p) => p.name === "SpeedTileSet"
      )?.value;
      if (typeof speed !== "number") {
        throw new Error("Wangset color doesn't have a speed property");
      }
      return { SpeedTileSet: speed };
    }),
    wangtiles: wangset.wangtiles,
  };
  return result;
}

/**
 * @param {Tiled.Tileset} tileset
 * @return { Promise<SpriteSheetTileset> }
*/
export async function convertSpriteSheetTileset(tileset) {
       if (tileset.image === undefined) {
              throw Error("Tileset was missing `image` property");
       }
       if (tileset.imageheight === undefined) {
              throw Error("Tileset was missing `imageheight` property");

       }
       if (tileset.imagewidth === undefined) {
              throw Error("Tileset was missing `imagewidth` property");
       }
       let tiles = await Promise.all(tileset.tiles.map(convertSpriteSheetTile));

       return {
              tilesetType: "spriteSheet",
              columns: tileset.columns,
              image: await loadImage(tileset.image),
              imageHeight: tileset.imageheight,
              imageWidth: tileset.imagewidth,
              tileHeight: tileset.tileheight,
              tileWidth: tileset.tilewidth,
              tiles: tiles,
              wangSet: undefined,
       };
}

/**
 * @param {any} value
 * @return {value is PlayerClass}
 */
function isPlayerClass(value) {
  if (
    value === "Wizard" ||
    value === "Sorcerer" ||
    value === "Pirate" ||
    value === "Warrior"
  ) {
    return true;
  } else {
    return false;
  }
}

/**
 * @param {Tiled.Tile} tile
 * @return { Promise<Tile> }
 */
async function convertSpriteSheetTile(tile) {
  if (tile.type === "Player") {
    if (tile.properties === undefined) {
      throw Error("Item tile was missing `properties` property");
    }
    let playerClass = tile.properties.find((p) => p.name === "Class")?.value;
    let frame = tile.properties.find((p) => p.name === "AnimationFrame")?.value;
    let step = tile.properties.find((p) => p.name === "Step")?.value;

    if (typeof frame !== "number") {
      throw Error("Player tile was missing `AnimationFrame` property");
    }
    if (typeof step !== "number") {
      throw Error("Player tile was missing `Step` property");
    }
    if (typeof playerClass !== "string") {
      throw Error("Player tile was missing `Class` property");
    }
    if (!isPlayerClass(playerClass)) {
      throw Error(
        "Player tile's `playerClass` property wasn't a valid `PlayerClass`"
      );
    }
    return {
      type: tile.type,
      id: tile.id,
      properties: {
        Class: playerClass,
        Step: step,
        AnimationFrame: frame,
      },
    };
    // } else if (tile.type === "Monster") {
  } else if (tile.type === "Terrain") {
    return {
      type: tile.type,
      id: tile.id,
    };
  } else {
    throw Error("Unknown tile type");
  }
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
 * @return {value is ItemType}
 */
function isItemType(value) {
  if (
    value === "Food" ||
    value === "Drink" ||
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
 * @return {value is EquipType}
 */
function isEquipType(value) {
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
  if (tile.type === "Items") {
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
    let value = parseInt(tile.properties.find((p) => p.name === "Value")?.value);
    let weight = parseInt(tile.properties.find((p) => p.name === "Weight")?.value);
    let type = tile.properties.find((p) => p.name === "Type")?.value;

    if (typeof weight !== "number") {
      console.log(tile)
      throw Error("Item tile was missing `weight` property");
    }
    if (typeof value !== "number") {
      throw Error("Item tile was missing `value` property");
    }
    if (typeof name !== "string") {
      throw Error("Item tile was missing `name` property");
    }

    if (!isEquipType(equipType)) {
      throw Error(
        `Item tile's 'equipType' property (${equipType}) wasn't a valid 'EquipType'`
      );
    }
    if (!isItemType(type)) {
      throw Error(`Item tile's 'itemType' property (${type}) wasn't a valid 'ItemType'`);
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
  throw Error(`Unknown tile type ${tile.type}`);
}

/**
 * @param {Tiled.Tileset} tileset
 * @return { Promise<ImageListTileset> }
 */
async function convertImageListTileset(tileset) {
  let tiles = await Promise.all(tileset.tiles.map(convertImageTile));

  return {
    tilesetType: "imageList",
    name: tileset.name,
    tileCount: tileset.tilecount,
    tileWidth: tileset.tilewidth,
    tileHeight: tileset.tileheight,
    tiles: tiles,
  };
}

/**
  * @param {Tiled.Tileset} tileset
  * @return {Promise<SpriteSheetTileset | ImageListTileset>}  */
export async function convertTileset(tileset) {
       if (tileset.columns === 0) {
              return convertImageListTileset(tileset);
       } else {
              return convertSpriteSheetTileset(tileset);
       }
}


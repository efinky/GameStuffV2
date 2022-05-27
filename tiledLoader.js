

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
 * @property { number } image
 * @property { number } imageWidth
 * @property { number } imageHeight
 * @property { "Player" } type
 * @property { PlayerProperty } properties
*/

/**
 * @typedef { Object } ItemTile
 * @property { number } id
 * @property { number } image
 * @property { number } imageWidth
 * @property { number } imageHeight
 * @property { "Item" } type
 * @property { ItemProperty } properties
*/

/**
 * @typedef { Object } MonsterTile
 * @property { number } id
 * @property { number } image
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
 * @param {any} tile
 * @return { ImageTile }
*/
function convertImageTile(tile) {
        if (tile.type == "Item") {
                return {
                        type: "Item",
                        id: tile.id,
                        image: 3,
                        imageHeight: tile.imageheight,
                        imageWidth: tile.imagewidth,
                        properties: {
                                equipType: tile.properties.find((/** @type {any} */ p) => p.name === "EquippedType").value,
                                name: tile.properties.find((/** @type {any} */ p) => p.name === "Name").value,
                                value: tile.properties.find((/** @type {any} */ p) => p.name === "Value").value,
                                weight: tile.properties.find((/** @type {any} */ p) => p.name === "Weight").value,
                                type: tile.properties.find((/** @type {any} */ p) => p.name === "Type").value,
                        }
                };
        } 
        
}

/**
 * @param {any} tileset
 * @return { ImageListTileset }
*/
function convertImageListTileset(tileset) {

        return{
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






/** @type {ImageListTileset} */
let itemTileset = { 
"tilecount":38,
"tiledversion":"1.5.0",
"tileheight":32,
"tiles":[
       {
        "id":0,
        "image":"Pictures\/food\/apple.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Consumable"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Apple"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Food"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":5
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":1,
        "image":"Pictures\/valuables\/amethyst_exceptional.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Small"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Amethyst Large"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Jewel"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":5
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":2,
        "image":"Pictures\/valuables\/blue_crystal.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Small"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Blue Crystal"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Jewel"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":25
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":3,
        "image":"Pictures\/valuables\/diamond_exceptional.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Small"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Diamond"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Jewel"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":20
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":4,
        "image":"Pictures\/valuables\/emerald.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Small"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Emerald"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Jewel"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":5
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":5,
        "image":"Pictures\/valuables\/gem.clsc.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Small"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Gem"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Jewel"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":5
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":6,
        "image":"Pictures\/valuables\/goldcoin.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Small"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Gold Coin"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Currency"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":2
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":7,
        "image":"Pictures\/valuables\/amethyst.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Small"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Amethyst"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Jewel"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":5
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":8,
        "image":"Pictures\/weapons\/dagger.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Hand"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Dagger"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Weapon"
               }, 
               {
                "name":"Value",
                "type":"string",
                "value":"10"
               }, 
               {
                "name":"Weight",
                "type":"string",
                "value":"10"
               }],
        "type":"Items"
       }, 
       {
        "id":9,
        "image":"Pictures\/weapons\/b_bsword_1.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Hand"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Sword"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Weapon"
               }, 
               {
                "name":"Value",
                "type":"string",
                "value":"10"
               }, 
               {
                "name":"Weight",
                "type":"string",
                "value":"10"
               }],
        "type":"Items"
       }, 
       {
        "id":10,
        "image":"Pictures\/armour\/b_shield.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Hand"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Shield"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Armour"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":20
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":11,
        "image":"Pictures\/armour\/b_small_shie.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Hand"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Round Shield"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Armour"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":20
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":12,
        "image":"Pictures\/armour\/bluedragonmail.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Chest"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Dragon Plate"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Armour"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":20
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":13,
        "image":"Pictures\/armour\/chainmail.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Chest"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Chainmail"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Armour"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":20
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":14,
        "image":"Pictures\/armour\/cloak_lblue.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Chest"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Blue Cloak"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Clothing"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":20
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":5
               }],
        "type":"Items"
       }, 
       {
        "id":15,
        "image":"Pictures\/armour\/cloak_purple.clsc.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Chest"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Purple Cloak"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Clothing"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":20
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":5
               }],
        "type":"Items"
       }, 
       {
        "id":16,
        "image":"Pictures\/armour\/crown.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Head"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Gold Crown"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Clothing"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":20
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":5
               }],
        "type":"Items"
       }, 
       {
        "id":17,
        "image":"Pictures\/armour\/crown_gray.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Head"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Silver Crown"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Clothing"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":20
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":5
               }],
        "type":"Items"
       }, 
       {
        "id":18,
        "image":"Pictures\/armour\/girdle_dam.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Chest"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Belt"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Armour"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":20
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":19,
        "image":"Pictures\/armour\/girdle_str.clsc.113.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Chest"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Girdle"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Armour"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":20
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":20,
        "image":"Pictures\/armour\/gloves.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Hand"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Gloves"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Clothing"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":20
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":5
               }],
        "type":"Items"
       }, 
       {
        "id":21,
        "image":"Pictures\/armour\/high_boots.clsc.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Feet"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Boots"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Clothing"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":20
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":5
               }],
        "type":"Items"
       }, 
       {
        "id":22,
        "image":"Pictures\/armour\/b_fullhelmet.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Head"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Full Helmet"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Armour"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":20
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":23,
        "image":"Pictures\/armour\/b_hornhelmet.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Head"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Horn Helmet"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Armour"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":20
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":24,
        "image":"Pictures\/armour\/b_plate_mail.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Chest"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Plate"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Armour"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":20
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":25,
        "image":"Pictures\/food\/fishfood.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Consumable"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Blue Fish"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Food"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":23
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":26,
        "image":"Pictures\/food\/food.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Consumable"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Meat"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Food"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":23
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":27,
        "image":"Pictures\/food\/loaf.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Consumable"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Bread"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Food"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":23
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":28,
        "image":"Pictures\/food\/booze.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Consumable"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Booze"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Food"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":23
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":29,
        "image":"Pictures\/food\/cake.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Consumable"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Cake"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Food"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":23
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":30,
        "image":"Pictures\/food\/coffee.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Consumable"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Coffee"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Food"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":23
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":31,
        "image":"Pictures\/food\/fish_1.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Consumable"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"White Fish"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Food"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":23
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":32,
        "image":"Pictures\/food\/fish_4.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Consumable"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Fish"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Food"
               }, 
               {
                "name":"Value",
                "type":"int",
                "value":23
               }, 
               {
                "name":"Weight",
                "type":"int",
                "value":10
               }],
        "type":"Items"
       }, 
       {
        "id":33,
        "image":"Pictures\/weapons\/axe_1.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Hand"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Double Axe"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Weapon"
               }, 
               {
                "name":"Value",
                "type":"string",
                "value":"10"
               }, 
               {
                "name":"Weight",
                "type":"string",
                "value":"10"
               }],
        "type":"Items"
       }, 
       {
        "id":34,
        "image":"Pictures\/weapons\/axe_2.clsc.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Hand"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Axe"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Weapon"
               }, 
               {
                "name":"Value",
                "type":"string",
                "value":"10"
               }, 
               {
                "name":"Weight",
                "type":"string",
                "value":"10"
               }],
        "type":"Items"
       }, 
       {
        "id":35,
        "image":"Pictures\/weapons\/battle_axe.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Hand"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Battle Axe"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Weapon"
               }, 
               {
                "name":"Value",
                "type":"string",
                "value":"10"
               }, 
               {
                "name":"Weight",
                "type":"string",
                "value":"10"
               }],
        "type":"Items"
       }, 
       {
        "id":36,
        "image":"Pictures\/weapons\/bow.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Hand"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Bow"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Weapon"
               }, 
               {
                "name":"Value",
                "type":"string",
                "value":"10"
               }, 
               {
                "name":"Weight",
                "type":"string",
                "value":"10"
               }],
        "type":"Items"
       }, 
       {
        "id":37,
        "image":"Pictures\/weapons\/elven_bow.base.111.png",
        "imageheight":32,
        "imagewidth":32,
        "properties":[
               {
                "name":"EquippedType",
                "type":"string",
                "value":"Hand"
               }, 
               {
                "name":"Name",
                "type":"string",
                "value":"Elven Bow"
               }, 
               {
                "name":"Type",
                "type":"string",
                "value":"Weapon"
               }, 
               {
                "name":"Value",
                "type":"string",
                "value":"10"
               }, 
               {
                "name":"Weight",
                "type":"string",
                "value":"10"
               }],
        "type":"Items"
       }],
"tilewidth":32,
"type":"tileset",
"version":1.5
};


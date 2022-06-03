// Types for reading the tiled map and tileset in json output format"

/**
 * @export
 * @typedef Layer
 * @property {number[]} data
 * @property {number} height
 * @property {number} id
 * @property {string} name
 * @property {number} opacity
 * @property {"map"} type
 * @property {boolean} visible
 * @property {number} width
 * @property {number} x
 * @property {number} y
 */

/**
 *
 * @export
 * @typedef TilesetReference
 * @property {number} firstgid
 * @property {string} source
 */

/**
 * @export
 * @typedef Map
 * @property {number} compressionlevel
 * @property {number} height
 * @property {boolean} infinite
 * @property {Layer[]} layers
 * @property {number} nextlayerid
 * @property {number} nextobjectid
 * @property {string} orientation
 * @property {string} renderorder
 * @property {string} tiledversion
 * @property {number} tileheight
 * @property {TilesetReference[]} tilesets
 * @property {number} tilewidth
 * @property {string} type
 * @property {number} version
 * @property {number} width
 */

/**
 * @export
 * @typedef NumberProperty
 * @property {string} name
 * @property {"int"} type
 * @property {number} value
 */

/**
 * @export
 * @typedef StringProperty
 * @property {string} name
 * @property {"string"} type
 * @property {string} value
 */

/**
 * @export
 * @typedef {NumberProperty | StringProperty } Property
 */

/**
 * @export
 * @typedef  Tile
 * @property {number} id
 * @property {string} type
 * @property {string=} image
 * @property {number=} imagewidth
 * @property {number=} imageheight
 * @property {Property[]=} properties;
 */

/**
 * @export
 * @typedef  Wangtile
 * @property {number} tileid
 * @property {number[]} wangid
 */

/**
 * @export
 * @typedef  Wangset
 * @property {WangsetColor[]} colors
 * @property {string} name
 * @property {number} tile
 * @property {string} type
 * @property {Wangtile[]} wangtiles
 */

/**
 * @export
 * @typedef  WangsetColor
 * @property {string} color
 * @property {string} name
 * @property {number} probability
 * @property {Property[]?} properties
 * @property {number} tile
 */

/**
 * @export
 * @typedef  Grid
 * @property {string} orientation
 * @property {number} height
 * @property {number} width
 */

/**
 * @export
 * @typedef Tileset
 * @property { number } columns;
 * @property { Grid= } grid;
 * @property { string } name;
 * @property { string= } image;
 * @property { number= } imageheight;
 * @property { number= } imagewidth;
 * @property { number } margin;
 * @property { "tileset" } type;
 * @property { number } spacing;
 * @property { number } tilecount;
 * @property { string } tiledversion;
 * @property { number } tileheight;
 * @property { Tile[] } tiles;
 * @property { number } tilewidth;
 * @property { string } type;
 * @property { number } version;
 * @property { Wangset[]= } wangsets;
 */

// Javascript needs _some_ export to consider this a module even though we're
// justing using this one for the typescript types
export default {}

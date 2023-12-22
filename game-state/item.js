

export class Item {
    /**
     *
     * @param {string} name
     * @param {number} tileNumber
     * @param {import("../tileset/tiledLoader").ItemProperty} properties
     */
    constructor(name, tileNumber, properties) {
        this.name = name;
        this.tileNumber = tileNumber;
        this.equippedType = properties.equipType;
        this.type = properties.type;
        this.value = properties.value;
        this.weight = properties.weight;
    }
}

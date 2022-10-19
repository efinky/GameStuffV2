

export class Item {
    /**
     *
     * @param {string} name
     * @param {HTMLImageElement} image
     * @param {number} tileNumber
     * @param {ItemProperty} properties
     */
    constructor(name, image, tileNumber, properties) {
        this.name = name;
        this.image = image;
        this.tileNumber = tileNumber;
        this.equippedType = properties.equipType;
        this.type = properties.type;
        this.value = properties.value;
        this.weight = properties.weight;
    }
}

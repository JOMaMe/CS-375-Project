class Player extends Entity {
    constructor(hp, sp, init, abilities, items) {
        super(hp, sp, init);
        this.abilitiesList = abilities;
        this.itemsList = items;
    }
}
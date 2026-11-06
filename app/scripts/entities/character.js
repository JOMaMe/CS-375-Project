class Character extends Entity {
    constructor(hp, sp, init, playerId) {
        super(hp, sp, init);
        this.playerId = playerId;
        this.abilitiesList = [];
        this.itemsList = [];
    }
}
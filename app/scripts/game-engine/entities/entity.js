class Entity {
    constructor(hp, sp, init) {
        this.hitPoints = hp;
        this.specialPoints = sp;
        this.initiative = init;
    }

    rollInitiative() {
        return Math.random() * 100 + this.initiative;
    }
}
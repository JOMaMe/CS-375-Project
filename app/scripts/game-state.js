class GameState {
    constructor() {
        this.public = {
            characters: [],
            enemies: {
                front: [],
                back: []
            },
            map: {}
        };
        this.private = {
            dungeon: {}
        }
    }

    addCharacter(character) {
        this.public.characters.push(character);
    }

    addEnemy(enemy) {
        this.public.enemies.push(enemy);
    }
}
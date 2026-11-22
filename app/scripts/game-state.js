class GameState {
    constructor() {
        this.public = {
            characters: [],
            enemies: {
                front: [],
                back: []
            },
            map: {
                dimensions: { height: 0, width: 0 },
                discovered: [],
                frontier: []
            }
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

module.exports = { GameState };
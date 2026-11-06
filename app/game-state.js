class GameState {
    constructor() {
        this.public = {
            characters: [],
            enemies: {
                front: [],
                back: []
            }
        };
        this.private = {
            map: {}
        }
    }

    addCharacter(character) {
        this.public.characters.push(character);
    }

    addEnemy(enemy) {
        this.public.enemies.push(enemy);
    }
}
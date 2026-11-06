const dungeonSize = 10;

function startGame(roomState) {
    assignCharacters(roomState);
    let dungeon = generateDungeon(roomState);
}

function assignCharacters(roomState) {
    return;
}

function generateDungeon(roomState) {
    let grid = Array.from({ length: dungeonSize }, () => Array(dungeonSize).fill(null));
    return;
}
const dungeonWidth = 5;
const dungeonHeight = 10;

function startGame(roomState) {
    assignCharacters(roomState);
    let dungeon = generateDungeon(roomState);
}

function assignCharacters(roomState) {
    return;
}

function generateDungeon(roomState) {
    let grid = Array.from({ length: dungeonHeight }, () => Array(dungeonWidth).fill(null));
    return;
}
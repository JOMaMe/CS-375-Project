const { createDungeon, printDungeon } = require("./dungeon");
const { GameState } = require("../game-state");
const RoomState = require("../room-state");

function initializeGame(roomState) {
    roomState.gameState = new GameState();
    assignCharacters(roomState);
    generateDungeon(roomState);
    
}

function assignCharacters(roomState) {
    return;
}

function generateDungeon(roomState) {
    let dungeon = null;
    while (dungeon === null) {
        dungeon = createDungeon();
    }
    printDungeon(dungeon);
    roomState.gameState.private.dungeon = dungeon;
    roomState.gameState.public.map.dimensions = { height: dungeon.grid.length, width: dungeon.grid[0].length };
    roomState.gameState.public.map.discovered.push(dungeon.startRoom.position);
    roomState.gameState.public.map.frontier.push(...dungeon.startRoom.neighbors.map(neighbor => neighbor.position));
}



if (require.main === module) {
    initializeGame(new RoomState());
}

module.exports = { initializeGame };
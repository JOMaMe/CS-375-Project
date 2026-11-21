const { createDungeon, printDungeon } = require("./dungeon");
const { GameState } = require("../game-state");
const RoomState = require("../room-state");

function startGame(roomState) {
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
    roomState.gameState.public.map.coords = [dungeon.startRoom.position];
}



if (require.main === module) {
    startGame(new RoomState());
}

module.exports = { startGame };
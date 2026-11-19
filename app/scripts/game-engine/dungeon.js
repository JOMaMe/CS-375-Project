class DungeonRoom {
    constructor(roomId, coords, parent) {
        this.id = roomId;
        this.position = coords;
        this.neighbors = (parent == null) ? [] : [parent];
        this.monsters = [];
        this.rewards = [];
    }

    addAdjacentRoom(room) {
        this.neighbors.push(room);
    }

    addMonsters(newMonsters) {
        this.monsters.push(...newMonsters);
    }

    addRewards(items) {
        this.rewards.push(...items);
    }

}

module.exports = DungeonRoom;
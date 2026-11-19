const dungeonWidth = 5;
const dungeonHeight = 10;

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

function createDungeon(roomState) {
    let grid = Array.from({ length: dungeonHeight }, () => Array(dungeonWidth).fill(null));
    let partOneRooms = [];
    let partTwoRooms = [];

    const bottomRow = dungeonHeight - 1;
    let startColumn = Math.floor(dungeonWidth/2) //Math.floor(Math.random() * dungeonWidth);
    grid[bottomRow][startColumn] = new DungeonRoom("start", { row: bottomRow, column: startColumn }, null);
    const startRoom = grid[bottomRow][startColumn];

    const topRow = 0;
    const endColumn = Math.floor(Math.random() * dungeonWidth);
    grid[topRow][endColumn] = new DungeonRoom("end", { row: topRow, column: endColumn }, null);
    const endRoom = grid[topRow][endColumn];

    const middleRow = Math.floor(dungeonHeight / 2);
    const keyColumn = Math.floor(Math.random() * dungeonWidth);
    grid[middleRow][keyColumn] = new DungeonRoom("key", { row: middleRow, column: keyColumn }, null);
    const keyRoom = grid[middleRow][keyColumn];



    const reservedPositions = new Set([positionKey(endRoom.position)]);
    const minColumn = Math.min(startRoom.position.column, keyRoom.position.column);
    const maxColumn = Math.max(startRoom.position.column, keyRoom.position.column);
    const waypoints = [];

    for (let row = keyRoom.position.row; row < grid.length; row++) {
        for (let column = 0; column < grid[row].length; column++) {
            const outsideDirectRoute = column < minColumn || column > maxColumn;
            if (outsideDirectRoute && grid[row][column] === null) {
                waypoints.push({ row, column });
            }
        }
    }
    shuffle(waypoints);

    let paths = null;
    for (const firstWaypoint of waypoints) {
        const firstPath = findPathThroughWaypoint(
            grid,
            startRoom.position,
            keyRoom.position,
            firstWaypoint,
            reservedPositions,
            keyRoom.position.row
        );
        if (firstPath === null) {
            continue;
        }

        const blockedPositions = new Set([
            ...reservedPositions,
            ...firstPath.slice(1, -1).map(positionKey),
        ]);
        for (const secondWaypoint of waypoints) {
            if (positionKey(secondWaypoint) === positionKey(firstWaypoint)) {
                continue;
            }

            const secondPath = findPathThroughWaypoint(
                grid,
                startRoom.position,
                keyRoom.position,
                secondWaypoint,
                blockedPositions,
                keyRoom.position.row
            );
            if (secondPath !== null) {
                paths = [firstPath, secondPath];
                break;
            }
        }
        if (paths !== null) {
            break;
        }
    }

    if (paths === null) {
        return null;
    }

    let nextRoomId = 0;
    const partOneRoomSet = new Set();
    for (const path of paths) {
        const pathRooms = path.map(position => {
            let room = grid[position.row][position.column];
            if (room === null) {
                room = new DungeonRoom(`part-one-${nextRoomId++}`, position, null);
                grid[position.row][position.column] = room;
            }

            if (!partOneRoomSet.has(room)) {
                partOneRoomSet.add(room);
                partOneRooms.push(room);
            }

            return room;
        });

        for (let index = 1; index < pathRooms.length; index++) {
            connectRooms(pathRooms[index - 1], pathRooms[index]);
        }
    }

    return { grid, partOneRooms, partTwoRooms, startRoom, keyRoom, endRoom };
}

function getNeighbors(position, map, minRow) {
    const { row, column } = position;
    const adjacentPositions = [
        { row: row - 1, column },
        { row: row + 1, column },
        { row, column: column - 1 },
        { row, column: column + 1 },
    ];

    return adjacentPositions
        .filter(position =>
            position.row >= minRow &&
            position.row < map.length &&
            position.column >= 0 &&
            position.column < map[position.row].length
        );
}

function findPath(map, startPosition, endPosition, blockedPositions, minRow) {
    const endKey = positionKey(endPosition);
    const queue = [startPosition];
    const previousPositions = new Map([[positionKey(startPosition), null]]);

    for (let index = 0; index < queue.length; index++) {
        const position = queue[index];
        if (positionKey(position) === endKey) {
            break;
        }

        const neighbors = getNeighbors(position, map, minRow);
        shuffle(neighbors);
        for (const neighbor of neighbors) {
            const neighborKey = positionKey(neighbor);
            if (previousPositions.has(neighborKey) || blockedPositions.has(neighborKey)) {
                continue;
            }

            previousPositions.set(neighborKey, position);
            queue.push(neighbor);
        }
    }

    if (!previousPositions.has(endKey)) {
        return null;
    }

    const path = [];
    for (let position = endPosition; position !== null; position = previousPositions.get(positionKey(position))) {
        path.unshift(position);
    }
    return path;
}

function findPathThroughWaypoint(map, startPosition, endPosition, waypoint, blockedPositions, minRow) {
    const waypointKey = positionKey(waypoint);
    if (blockedPositions.has(waypointKey)) {
        return null;
    }

    const firstLegBlocked = new Set([...blockedPositions, positionKey(endPosition)]);
    const firstLeg = findPath(map, startPosition, waypoint, firstLegBlocked, minRow);
    if (firstLeg === null) {
        return null;
    }

    const secondLegBlocked = new Set([
        ...blockedPositions,
        positionKey(startPosition),
        ...firstLeg.slice(1, -1).map(positionKey),
    ]);
    const secondLeg = findPath(map, waypoint, endPosition, secondLegBlocked, minRow);
    if (secondLeg === null) {
        return null;
    }

    return [...firstLeg, ...secondLeg.slice(1)];
}

function shuffle(items) {
    for (let index = items.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
    }
}

function positionKey({ row, column }) {
    return `${row},${column}`;
}

function connectRooms(firstRoom, secondRoom) {
    if (!firstRoom.neighbors.includes(secondRoom)) {
        firstRoom.addAdjacentRoom(secondRoom);
    }
    if (!secondRoom.neighbors.includes(firstRoom)) {
        secondRoom.addAdjacentRoom(firstRoom);
    }
}

function printDungeon(dungeon) {
    for (let row = 0; row < dungeon.grid.length; row++) {
        const tileValues = [];
        for (let column = 0; column < dungeon.grid[row].length; column++) {
            const room = dungeon.grid[row][column];
            if (room === null) tileValues.push("0");
            else if (room.id === "start") tileValues.push("s");
            else if (room.id === "key") tileValues.push("k");
            else if (room.id === "end") tileValues.push("e");
            else tileValues.push("1")
        }
        console.log(tileValues.join(" "));
    }
}

module.exports = {
    DungeonRoom,
    createDungeon,
    printDungeon
};
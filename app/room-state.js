class RoomState {
    constructor() {
      this.status = 0;
      this.players = new Map();
      this.gameState = {};
    }
  }
  
  module.exports = RoomState;
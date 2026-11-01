class RoomState {
    constructor() {
      this.status = 0;
      this.players = new Set();
      this.gameState = {};
    }
  }
  
  module.exports = RoomState;
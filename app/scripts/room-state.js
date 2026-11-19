class RoomState {
    constructor() {
      this.status = 0;
      this.players = new Map();
      this.host = "";
      this.gameState = {};
    }
  }
  
module.exports = RoomState;
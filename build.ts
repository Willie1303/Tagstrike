
//player
export interface Player {
  name: string;
  id: string;
  health: number;      
  isAlive: boolean;
  isHost: boolean;
  weapon: string;
  damage: number;
  shieldOn: number;
  shotId: string;
}

//Arsenal
export const Weapons: { [key: string]: number } = {
  "Pistol": 10,
  "AK47": 20,
  "Shotgun": 30,
  "Rocket launcher": 45
};

//rooms
export interface Room {
  host: Player;          // the player who created the room
  roomID: string;        // unique identifier for the room
  players: Player[];     // all players in the room, including the host
}

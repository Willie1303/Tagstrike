
//player
export interface Player {
  name: string;
  id: string;
  health: number;      
  isAlive: boolean;
  weapon: [ string, number ];
  //damage: number;
  shieldOn: boolean;
  shotId: string;
  score: number;
  isHost?: boolean
  isSpectator?: boolean
  respawnScheduled?: boolean
}

//Arsenal
export const Arsenal: [string, number][] = [
  ["AK47", 20],
  ["Basic Pistol", 10],
  ["Shotgun", 30],
  ["Rocket Launcher", 45]
];

//rooms
export interface Room {
  host: Player;          // the player who created the room
  roomID: string;        // unique identifier for the room
  players: Player[];     // all players in the room, including the host
}

/**
 * Creates a new player object with default values and overrides if provided.
 * @param {string} id - The unique identifier for the player.
 * @param {string} name - The name of the player.
 * @param {string} shootId - The shoot ID associated with the player.
 * @param {Partial<Omit<Player, 'id' | 'name'>>} options - Optional overrides for the player properties.
 * @returns {Player} - The newly created player object.
 */
export function createPlayer(
  id: string,
  name: string,
  shootId: string,
  options?: Partial<Omit<Player, 'id' | 'name'>>
): Player {
  return {
    id,
    name,
    shotId: shootId,
    health: 100,
    score: 0,
    weapon: Arsenal[1],
    isAlive: true,
    shieldOn: false,
    ...options, // override defaults if provided
  };
}

export function makeid(length:number, whitelist:string|null=null) {
    var result           = '';
    var characters       = !whitelist ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' : whitelist;
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result.toUpperCase();
}

//#region Needed data types

export type JoinRoomResponse = {
  success: boolean;
  message?: string;
};


//#endregion
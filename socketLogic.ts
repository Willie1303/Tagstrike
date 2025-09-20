
import { Server } from "socket.io";
import { Server as HTTPServer } from "http";
import { Player, JoinRoomResponse} from "./build";

interface ServerToClientEvents{
    noArg: () => void;
    basicEmit: (a: number, b: string, c: Buffer) => void;
    withAck: (d: string, callback: (e: number) => void) => void;

    //room logic
    sendRoom: (room:string,players:Array<string>)=>void;
    updateRoom : (players:Array<Player>)=>void;
}

interface ClientToServerEvents{
    //send game state
    //create a game
    //join a game

    hello: () => void;

    //room logic
    create: (data:{playerName:string, shirtColor: string}) => void;
    getRoomInfo : (roomID:string,  callback?: (response: any) => void)=>void;
    join : (data:{ gameID: string; playerName: string, shirtColor: string},callback:(res:JoinRoomResponse)=>void)=>void;
    /*join : (data:{ gameID: string; playerName: string, shirtColor: string},callback:(res:JoinRoomResponse)=>void)=>void;
    
    spectate:(data:{ gameID: string; playerName?: string},callback:(res:JoinRoomResponse)=>void)=>void;

    //start game logic
    startGame: (gameID:string)=>void;
    startGameMessageRecievied: (gameID:string,playerID:string)=>void;
    endGame : (gameID:string)=>void;

    //game logic
    triggerEvent:(data:{gameID:string,eventType:number,eventData:JSON})=>void
    //disconnect
    erasePlayer:(data:{playerId: string})=>void;*/
}

// createNewServer function to initialize a new Socket.IO server
export function createNewServer(httpServer:HTTPServer){
    const io = new Server<
        ClientToServerEvents,
        ServerToClientEvents
    >(httpServer, {
      cors:{
        origin:["http://localhost:5500","http://localhost:3000",
        "https://lasertag.vercel..game"],
        methods: ["GET", "POST"]
      }
    });

    return io;
}

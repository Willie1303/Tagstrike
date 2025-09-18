
import { Server } from "socket.io";
import { Server as HTTPServer } from "http";

interface ServerToClientEvents{
    noArg: () => void;
    basicEmit: (a: number, b: string, c: Buffer) => void;
    withAck: (d: string, callback: (e: number) => void) => void;
}

interface ClientToServerEvents{
    //send game state
    //create a game
    //join a game
}


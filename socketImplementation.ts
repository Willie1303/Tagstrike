
import express, { Request, Response } from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import {createNewServer} from "./socketLogic";
import { Player, createPlayer, makeid } from "./build";
import cors from "cors";

// constants
const app = express();
const port = process.env.PORT || 3001;
const httpServer = createServer(app);
const io = createNewServer(httpServer);

//Tracking some information
let roomsPlayers: { [key: string]: Array<Player> } = {}
let roomTimers: {[key:string] : number} = {};
let roomIntervals: { [key: string]: NodeJS.Timeout } = {};
let defaultTime = 300;

//#region middleware
// Middleware
app.use(cors());
app.use(express.json());
//#endregion

//Functions 
function getRooms(){
    const rooms = io.sockets.adapter.rooms;
    const filteredRooms = [];

    //for loop to seperate private room from multiplayer rooms
    for (const [roomID, socketsSet] of rooms) {
        if (!io.sockets.sockets.has(roomID)) {
            filteredRooms.push(roomID);
        }
    }

    //array of multiplayer rooms
    return filteredRooms
}

//#region Routes
//Routes
app.get('/', (req: Request, res: Response) => {
    res.send('Hello from Express with TypeScript!');
});


app.get("/getLobbies",(req,res)=>{
    res.json(getRooms());
})

/*app.get("/getRooms",(req,res)=>{
    res.json(roomsPlayers);
})*/

app.get("/version",(req,res)=>{
    res.json({version: "1.1.2"});
})

//#endregion

io.on("connection", (socket) => {
  console.log("A client connected with id:", socket.id);

  // Example: listen to a client event
  socket.on("hello", () => {
    console.log("Client said hello");
  });

  // Example: emit back to the client
  socket.emit("noArg");

  let maxPlayers = 8;

  socket.on("create",(data)=>{
        let newPlayer = createPlayer(socket.id,data.playerName,data.shirtColor,{isHost:true,isSpectator:false});
        console.log(`Created player with id: ${data.playerName}`)

        const roomID = makeid(6);
        socket.join(roomID)
        roomsPlayers[roomID]=[newPlayer];
        roomTimers[roomID] = defaultTime;

        socket.emit("sendRoom", roomID,[]);
    })

  socket.on("getRoomInfo",(roomID, callback)=>{
        // Assuming that initRoom is only called after rendering the lobby page
        if (roomID==null){
            return;
        } //room doesn't exist

        const availRooms = getRooms();
        if (!availRooms.includes(roomID)){
            return;
        }

        const activePlayers= roomsPlayers[roomID].filter((p) => !p.isSpectator)

        activePlayers.forEach((player:Player, index:number) => {
            console.log("Player in room:", player.shotId, "isAlive:", player.isAlive, "respawnScheduled:",
                player.respawnScheduled, "health:", player.health);

            if (player.health <=0) {
                console.log(`Scheduling respawn for player ${player.shotId} in room ${roomID}`);
                player.respawnScheduled = true; // Prevent multiple timers
                setTimeout(() => {
                    player.isAlive = true;
                    player.respawnScheduled = false;
                    player.health = 100; // Reset health on respawn
                    console.log(`Player ${player.shotId} respawned in room ${roomID}`);

                    // Optional: emit update to all clients after respawn
                    const activePlayers = roomsPlayers[roomID].filter((p) => !p.isSpectator);
                    io.to(roomID).emit("updateRoom", activePlayers);
                }, 5000); // 3 seconds
                }
            });
        
            if (callback) {
                callback({ success: true, activePlayers }); // only call if it exists
            }

            io.to(roomID).emit("updateRoom", activePlayers)
        })

    socket.on("join",async (data,callback)=>{
        const availRooms = getRooms();
        
        //check to see if the game room is available
        if (!availRooms.includes(data.gameID)){ //wrong game ID
             if (typeof callback === "function") {
                callback({ success: false, message: "Invalid room ID" });
            }
            return
        }

        // allows player to join room
        socket.join(data.gameID);

        let playerExists = false;

        //check to see if the room already exists
        if (!roomsPlayers[data.gameID]) {
            roomsPlayers[data.gameID] = [];
        }
        
        //uses the player's socket id to see if they are already in the room. True if they are, false if not
        playerExists = roomsPlayers[data.gameID].some((p) => p.id === socket.id);

        // let playerIdWhitelist = 'APURM0123456789';
        // let playerId = makeid(2,playerIdWhitelist);

        //check to see the above flag and then adds player if they don't exist
        if (!playerExists) {
            const players = roomsPlayers[data.gameID];
            // if (players.length >= numberWhitelist.length * letterWhitelist.length){

            //check to ensure limit isn't surpassed
            if (players.length >= maxPlayers){
                console.warn(`Max players for game ${data.gameID} reached`);
                //if callback is a function, we send the message becuase room is full
                if (typeof callback === "function") {
                    callback({ success: false, message: "Room is full." });
                }
                return;
            }

            //create player to add them to the room
            const newPlayer = createPlayer(socket.id, data.playerName,data.shirtColor,{ isHost: false, isSpectator: false });
            roomsPlayers[data.gameID].push(newPlayer);
            console.log(`New player joined with name: ${data.playerName}`)
        }

        //if callback is a function, we send the message becuase the player can enter
        if (typeof callback === "function") {
            callback({ success: true });
        }

        //filter out spectators to pass the activeplayers as a parameter
        const activePlayers= roomsPlayers[data.gameID].filter((p) => !p.isSpectator)
        io.to(data.gameID).emit("updateRoom", activePlayers)

    })

});

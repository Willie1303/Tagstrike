//Libraries
import express from "express"; //Runs application and creates api calls
import cors from "cors"; //Allows for the frontend and backend to be seperated
import bodyParser from "body-parser"; //Allows for body to be sent with a POST request 
import dotenv from "dotenv" //Configuration of database environment
import { Pool } from "pg"; //Postgresql for storing and retrieving data
import bcrypt from "bcrypt";//Encrypting and storing user passwords
import path from 'path'; //For the directory


dotenv.config() //Configure environment variables

const app = express(); // create express() object
const PORT = process.env.PORT || 3000; //Server runs on port 3000
const saltRounds = 10; //Number of rounds to salt password

async function hashPassword(plainPassword: string) { //Function to create a salted hash value of a user's password to store in the database instead of storing their password to avoid major problems
  const salt = await bcrypt.genSalt(saltRounds); // generate a unique salt
  const hashedPassword = await bcrypt.hash(plainPassword, salt); //Create hashed password
  return hashedPassword; //return hashed password
}

const pool = new Pool({ //Create pool to communicate with postgresql database on render
  connectionString: process.env.DATABASE_URL, //connection string
  ssl: { rejectUnauthorized: false } //Makes sure that ssl does not reject unauthorised users (Players)
});

const allowedOrigins  = [
  "https://tagstrike.onrender.com",
  "http://localhost:5173"
];

app.use(cors({
  origin: allowedOrigins, // Local and website
  credentials: true
})); //Frontend and backend are seperated
app.use(express.json()) //app uses json

const __dirname = path.resolve(); // Needed for ES modules



app.use(bodyParser.json({ limit: "10mb" })) //Limit of body data size is change to 10 mb for more data to be sent over

app.use(bodyParser.urlencoded({ extended: true })); //Makes data be accessible in javascript

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`); //The server is live on port 3000
});

  app.post("/api/register",async (req,res)=>{ //POST request to register a user
    const { userEmail, userUsername,userPassword,profilePhoto } = req.body; //elements of body
    
    try { //try catch to insert new user
            var results = await pool.query('SELECT "UserUsername" FROM "User" where "UserEmail" = $1',[userEmail]); //Check if user with that email already exists
            if (results.rows.length != 0) {
              return res.status(401).json({ error: "There is already a account with that address" });
            }
            else
              {
                const hashedUserPassword = await hashPassword(userPassword) //Hash user password

                results = await pool.query('INSERT INTO "User"("UserEmail","UserUsername","UserPassword","UserProfilePhoto") VALUES($1,$2,$3,$4) RETURNING "UserID"',[userEmail,userUsername,hashedUserPassword,profilePhoto]); //Store details of user
              }

    } catch (error) {
     console.log(error) //Log error
    }
  })
  app.post("/api/login", async (req,res)=> //POST request to login a user
  {
    const { userEmail, userPassword } = req.body; //elements of body

    try {
      const result = await pool.query('SELECT "UserPassword","UserID" FROM "User" where "UserEmail" = $1',[userEmail]); //Check if user with that email already exists
      if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }
    
      const hashedPassword = result.rows[0].UserPassword; //Hash logged in user password
      const isMatch = await bcrypt.compare(userPassword, hashedPassword); //Compare logged in user password with the password stored in database
      const user = result.rows[0]; //Get user
      if (isMatch) { //If the user typed in the correct password
      res.json({ message: "Login successful!",userId: user.UserID }); //The user is logged in
      //return true;

    } else {
      res.status(401).json({ error: "Invalid password" });//The user incorrectly typed their password
      //return false
    }

    } catch (err) {
      console.error(err); //catch error
      res.status(500).json({ error: "Database query failed:" });
    }
  });

  app.get("/api/getUserID",async (req,res) =>{ //GET request to get userid using their email
      const { userEmail } = req.query; //Get email from the query parameter
  try { //Try catch
    const result = await pool.query(
      'SELECT "UserID" FROM "User" WHERE "UserEmail" = $1', //Check if user with that email exists
      [userEmail]
    );

    if (result.rows.length === 0) { //If result yields 0 users
      return res.status(404).json({ error: "User not found" }); //User with that email does not exist
    }

    // Send back just the user ID
    const data_user_id = result.rows[0].UserID; 
    res.json({ userId: data_user_id });//Returns user id to frontend
  } catch (err) {
    console.error(err); //catch error
    res.status(500).json({ error: "Database query failed" });
  }
});


    app.get("/api/getUsername/:id", async (req,res)=> //GET request to get user's username using their id
  {
    const userID = req.params.id; //Get UserID from the parameter

    try {
      const result = await pool.query('SELECT "UserUsername" FROM "User" where "UserID" = $1',[userID]); //query to get Username
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err); //catch error
      res.status(500).json({ error: "Database query failed" });
    }
  });

// Matches

app.post("/api/createMatch",async(req,res)=> //POST request to create match
  {
    try {
      const {matchLobbyID, matchTimeLimit, matchCreationDate} = req.body //variables from body

      var result = await pool.query('SELECT match_id from "Match" where match_lobby_id = $1 AND match_end_time IS NOT NULL',[matchLobbyID]) //Check if there is an ongoing match with that match id
      if (result.rows.length > 0) {
              return res.status(401).json({ error: "There is already a ongoing match with that lobbyid" }); //There is already a match ongoing
            }
            else
              {
                result = await pool.query('INSERT INTO "Match"(match_lobby_id,match_creation_date,match_time_limit) VALUES($1,$2,$3) RETURNING match_id',[matchLobbyID,matchCreationDate,matchTimeLimit])
                const match = result.rows[0];
                res.json({ message: "Match Creation successful",match_id: match.match_id }); //Return match id
              }
    } catch (err) {
      console.log(err)
    }
  });

app.get("/api/getMatchID/:matchLobbyID",async (req,res)=> //GET request to obtain match id from LobbyID
  {
    const {matchLobbyID} = req.params //obtain lobby id from parameters
    var result = await pool.query('SELECT match_id from "Match" where match_lobby_id = $1',[matchLobbyID]) //Get match id from lobby id

      if(result.rows.length===0)
      {
        return res.status(401).json({ error: "No match with that lobby id" }); //No match with that lobby id was found
      }
      else
        {
          const match_id = result.rows[0].match_id; //Get match id from response
          res.json({ match_id:match_id }); //Return match_id

        }
  })

app.get("/api/getPlayerColour",async (req,res)=> //GET request to obtain player colour from player id
  {
    const { matchID, userID } = req.query as { matchID?: string; userID?: string };
 //variables from query

    var result = await pool.query('SELECT player_colour from "Player" where user_id = $1 AND match_id = $2',[Number(userID), Number(matchID)]) //Get player colour for a certain match and player

    if(result.rows.length===0)
      {
        return res.status(401).json({ error: "No player with that matchid and userid" }); //No user was found
      }
      else
        {
          const player_colour = result.rows[0].player_colour; //Obtain player colour
          res.json({ player_colour:player_colour }); //Return player colour

        }
  })

  app.get("/api/getPlayerbyColour",async (req,res)=> //GET request to obtain player colour from player id
  {
    const { matchID, detected_player_colour } = req.query as { matchID?: string; detected_player_colour?: string };
 //variables from query

    var result = await pool.query('SELECT user_id from "Player" where player_colour = $1 AND match_id = $2',[detected_player_colour, Number(matchID)]) //Get player colour for a certain match and player

    if(result.rows.length===0)
      {
        return res.status(401).json({ error: "No player with that matchid and player_colour" }); //No user was found
      }
      else
        {
          const player_id = result.rows[0].user_id; //Obtain player id
          res.json({ player_id:player_id }); //Return player id

        }
  })

app.put("/api/setPlayerColour", async (req, res) => { //PUT request to update player colour for a specific player
  try {
    const { matchID, userID, player_colour } = req.body; //variables from body

    if (!matchID || !userID || !player_colour) {
      return res.status(400).json({ error: "Missing required fields" }); // null values for variables
    }

    const result = await pool.query(
      'UPDATE "Player" SET player_colour = $3 WHERE user_id = $1 AND match_id = $2', //Update player colour based on their match id and user id
      [userID, matchID, player_colour]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ set_player_colour: false, message: "Player not found" }); //Player was not found
    }

    res.json({ set_player_colour: true }); //Successful update of player colour
  } catch (err) {
    console.error("Error updating player colour:", err);
    res.status(500).json({ error: "Internal server error" }); //Console errors
  }
});


app.post("/api/joinMatch",async(req,res)=> //POST request to join a player to a match
  {
    const {matchID, userID} = req.body //variables from body

    var result = await pool.query('SELECT match_id,user_id from "Player" where user_id = $1 AND match_id = $2',[userID,matchID]) //See if there is existing player for the match

    if(result.rows.length>0)
      {
        res.json({ message: "User already in match",match_joined: true }); //User already in match
      }
      else
        {
          result = await pool.query('INSERT INTO "Player"(user_id,match_id) VALUES($1,$2)',[userID,matchID]) //Insert player details
          res.json({ message: "Match joining successful!",match_joined: true }); //Return successful results
        }
  })
//Match Status
app.get("/api/getMatchStatus/:matchID",async(req,res)=> //GET request for match status of all player for a certain match
  {
    const {matchID} = req.params //obtain match id from parameters
    //Join on for Username, player_ready from "User" and "Player" tables
    var result = await pool.query('SELECT "UserUsername",player_ready from "Player" join "User" on "Player".user_id = "User"."UserID" where match_id = $1',[matchID]) 
    const players = result.rows //Obtain all players
    res.json({ match_status_players: players }); //Return players
  })

  app.post("/api/updatePlayerStatus",async (req,res)=> //POST request to change player status
    {
      const {playerID,playerStatus,matchID} = req.body //variables from body
        try {
        const result = await pool.query(
          'UPDATE "Player" SET player_ready = $2 WHERE user_id = $1 AND  match_id = $3 RETURNING player_ready',[playerID,playerStatus,matchID]) //Get player_ready for a specific player
        if (result.rows.length === 0) {
          // No matching row found
          return res.status(404).json({ error: "Player not found for this match" });
        }
        res.json({ newStatus: result.rows[0].player_ready }); //Return player status
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to toggle player ready" });
      }
    })
//Match Actions

app.post("/api/StartMatch",async (req,res) => //POST request for starting a match
  {
    const {matchID} = req.body //variable from body

    var result = await pool.query('SELECT match_time_limit FROM "Match" where match_id = $1',[matchID]) //Get selected time limit when match was created
    const minutesToAdd = result.rows[0].match_time_limit //Obtain time limit of match from query

    result = await pool.query(
    `UPDATE "Match"
    SET match_start_time = date_trunc('second', NOW()),
        match_end_time   = date_trunc('second', NOW() + ($1 || ' minutes')::interval)
    WHERE match_id = $2`,
    [minutesToAdd, matchID]); //Update the specific match details for match start : 13:00 -> 13:05 for a 5 minute game

  res.json({ match_started: true }); //Return match started
  })

  app.get("/api/getMatchFinished", async (req, res)=>
    {
      const matchID = req.query.matchID; //obtain match id from query parameters
      const result = await pool.query(
        `SELECT * FROM "Match" WHERE match_id = $1 AND NOW() >= match_end_time`, //Return whether the match finished
        [matchID]
      );

      if (result.rows.length > 0) {
        res.json({ match_finished: true }); //If there is a match that is finished, return true
      }
      else
        {
          res.json({ match_finished: false }); //If there is no match that is finished, return false
        }
    });
app.get("/api/getMatchEndTime", async (req, res) => { //GET request to get MATCHend time
  const matchID = req.query.matchID; //obtain match id from query parameters
  const result = await pool.query(
    `SELECT match_end_time FROM "Match" WHERE match_id = $1`, //query match_end_time for a specific match
    [matchID]
  );

  if (result.rows.length > 0) {
    res.json({ match_end_time: result.rows[0].match_end_time });// return match end time to frontend
  } else {
    res.status(404).json({ error: "Match not found" });
  }
});
app.post("/api/hitplayer", async (req, res) => {
  // Extract variables from request body
  const { playerID, matchID, playershotid } = req.body; 

  if (!playerID || !matchID || !playershotid) {
    return res.status(400).json({ error: "Missing required fields" }); // Ensure all required fields are provided
  }

  const damage = 10; // Damage value for a hit

  const client = await pool.connect(); // Connect to the database
  try {
    await client.query('BEGIN'); // Start a transaction

    // Select health for player that is shot
    const result = await client.query(
      'SELECT player_health FROM "Player" WHERE user_id = $1 AND match_id = $2',
      [playershotid, matchID]
    );

    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Player shot not found" }); // No player found with the given ID
    }

    const playerShotHealth = result.rows[0].player_health; // Keep health for player that is shot
    const newHealth = Math.max(0, playerShotHealth - damage); // Calculate new health
    const isKill = newHealth === 0; // Determine if the player was killed

    // Update shot player's health
    await client.query(
      'UPDATE "Player" SET player_health = $3 WHERE user_id = $1 AND match_id = $2',
      [playershotid, matchID, newHealth]
    );

    // Add hit to MatchAction table
    await client.query(
      'INSERT INTO "MatchAction"(match_id, user_id, action_type, action_2nd_player, action_type_value) VALUES ($1, $2, $5, $3, $4)',
      [matchID, playerID, playershotid, damage, "hit"]
    );

    if (isKill) { // Player shot 'killed'
      // Add kill action to MatchAction table
      await client.query(
        'INSERT INTO "MatchAction"(match_id, user_id, action_type, action_2nd_player, action_type_value) VALUES ($1, $2, $5, $3, $4)',
        [matchID, playerID, playershotid, null, "kill"]
      );
    }

    // Select score for player that shot
    const resScore = await client.query(
      'SELECT player_score FROM "Player" WHERE user_id = $1 AND match_id = $2',
      [playerID, matchID]
    );
    const playerScore = resScore.rows[0]?.player_score ?? 0; // Keep score for player that shot

    // Increase player score by damage value
    await client.query(
      'UPDATE "Player" SET player_score = $3 WHERE user_id = $1 AND match_id = $2',
      [playerID, matchID, playerScore + damage]
    );

    await client.query('COMMIT'); // Commit transaction
    res.json({ success: true, isKill }); // Return success and kill status

  } catch (err) {
    await client.query('ROLLBACK'); // Rollback transaction on error
    console.error(err); // Log error
    res.status(500).json({ error: "Internal server error" }); // Return error to client
  } finally {
    client.release(); // Release database client
  }
});


app.get("/api/getStatistics", async (req, res) => { //GET request to obtain all player statistics for a match
  const matchID = req.query.matchID; //obtain match id from query parameters

  try {
    const result = await pool.query(
      'SELECT user_id FROM "Player" WHERE match_id = $1',
      [matchID]
    ); //select all user ids

    const Players = await Promise.all(
      result.rows.map(async (row) => {
        const player: { username:string;kills: number; score: number, alive:boolean } = {
          username :"",
          kills: 0,
          score: 0,
          alive:true
        };//Instantiate a array of values which has username, kills,score and alive status for each player

      const resUsername = await pool.query('SELECT "UserUsername" FROM "User" where "UserID" = $1',[row.user_id]); //Get username for current player
      player.username = resUsername.rows[0].UserUsername; //Set username for current player

        const resKills = await pool.query(
          'SELECT COUNT(*) AS "Kills" FROM "MatchAction" WHERE match_id = $1 AND user_id = $2 AND action_type = $3', //Get kills for current player
          [matchID, row.user_id, "kill"] 
        );
        player.kills = Number(resKills.rows[0].Kills); //Set kills for current player
 
        const resScore = await pool.query(
          'SELECT player_score FROM "Player" WHERE match_id = $1 AND user_id = $2', //Get score for current player
          [matchID, row.user_id]
        );
        player.score = Number(resScore.rows[0].player_score); //Set score for current player

        const resAlive = await pool.query(
          'SELECT (COUNT(*)=0) AS "Alive" FROM "MatchAction" WHERE match_id = $1 AND action_2nd_player = $2 AND action_type = $3', //Get alive status for current player
          [matchID, row.user_id,"kill"]
        );
        player.alive = resAlive.rows[0].Alive; //Set alive status for current player

        return player; //Return this player to players
      })
    );

    res.json(Players); //Return all players to frontend
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});


//End 


// Serve frontend static files
app.use(express.static(path.join(__dirname, 'dist')));

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

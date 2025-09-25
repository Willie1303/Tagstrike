//Libraries
import express from "express"; //Runs application and creates api calls
import cors from "cors"; //Allows for the frontend and backend to be seperated
import bodyParser from "body-parser"; //Allows for body to be sent with a POST request 
import dotenv from "dotenv" //Configuration of database environment
import { Pool } from "pg"; //Postgresql for storing and retrieving data
import bcrypt from "bcrypt";//Encrypting and storing user passwords


dotenv.config() //Configure environment variables

const app = express(); // create express() object
const PORT = 3000; //Server runs on port 3000
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

app.use(cors()) //Frontend and backend are seperated
app.use(express.json()) //app uses json

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

                results = await pool.query('INSERT INTO "User"("UserEmail","UserUsername","UserPassword","UserProfilePhoto") VALUES($1,$2,$3,$5) RETURNING "UserID"',[userEmail,userUsername,hashedUserPassword,profilePhoto]); //Store details of user
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

app.post("/api/createMatch",async(req,res)=>
  {
    try {
      const {matchLobbyID, matchTimeLimit, matchCreationDate, matchCreatorID} = req.body

      var result = await pool.query('SELECT match_id from "Match" where match_lobby_id = $1 AND match_end_time IS NOT NULL',[matchLobbyID])
      if (result.rows.length > 0) {
              return res.status(401).json({ error: "There is already a ongoing match with that lobbyid" });
            }
            else
              {
                result = await pool.query('INSERT INTO "Match"(match_lobby_id,match_creation_date,match_time_limit) VALUES($1,$2,$3) RETURNING match_id',[matchLobbyID,matchCreationDate,matchTimeLimit])
                const match = result.rows[0];
                res.json({ message: "Match Creation successful",match_id: match.match_id });
              }
    } catch (err) {
      console.log(err)
    }
  });

app.get("/api/getMatchID/:matchLobbyID",async (req,res)=>
  {
    const {matchLobbyID} = req.params
    var result = await pool.query('SELECT match_id from "Match" where match_lobby_id = $1',[matchLobbyID])

      if(result.rows.length===0)
      {
        return res.status(401).json({ error: "No match with that lobby id" });
      }
      else
        {
          const match_id = result.rows[0].match_id;
          res.json({ match_id:match_id });

        }
  })

app.get("/api/getPlayerColour",async (req,res)=>
  {
    const {matchID, userID} = req.body

    var result = await pool.query('SELECT player_colour from "Player" where user_id = $1 AND match_id = $2',[userID,matchID])

    if(result.rows.length===0)
      {
        return res.status(401).json({ error: "No player with that matchid and userid" });
      }
      else
        {
          const player_colour = result.rows[0].player_colour;
          res.json({ player_colour:player_colour });

        }
  })

app.put("/api/setPlayerColour", async (req, res) => {
  try {
    const { matchID, userID, player_colour } = req.body;

    if (!matchID || !userID || !player_colour) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      'UPDATE "Player" SET player_colour = $3 WHERE user_id = $1 AND match_id = $2',
      [userID, matchID, player_colour]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ set_player_colour: false, message: "Player not found" });
    }

    res.json({ set_player_colour: true });
  } catch (err) {
    console.error("Error updating player colour:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/api/joinMatch",async(req,res)=>
  {
    const {matchID, userID} = req.body

    var result = await pool.query('SELECT match_id,user_id from "Player" where user_id = $1 AND match_id = $2',[userID,matchID])

    if(result.rows.length>0)
      {
        res.json({ message: "User already in match",match_joined: true }); //Join match
      }
      else
        {
          result = await pool.query('INSERT INTO "Player"(user_id,match_id) VALUES($1,$2)',[userID,matchID])
          const player = result.rows[0];
          res.json({ message: "Match joining successful!",match_joined: true });
        }
  })
//Match Status
app.get("/api/getMatchStatus/:matchID",async(req,res)=>
  {
    const {matchID} = req.params
    var result = await pool.query('SELECT "UserUsername",player_ready from "Player" join "User" on "Player".user_id = "User"."UserID" where match_id = $1',[matchID])
    const players = result.rows
    res.json({ match_status_players: players });
  })

  app.post("/api/updatePlayerStatus",async (req,res)=>
    {
      const {playerID,playerStatus,matchID} = req.body
        try {
    const result = await pool.query(
      'UPDATE "Player" SET player_ready = $2 WHERE user_id = $1 AND  match_id = $3 RETURNING player_ready',[playerID,playerStatus,matchID])
    if (result.rows.length === 0) {
      // No matching row found
      return res.status(404).json({ error: "Player not found for this match" });
    }
    res.json({ newStatus: result.rows[0].player_ready });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to toggle player ready" });
  }
    })
//Match Actions

app.post("/api/StartMatch",async (req,res) =>
  {
    const {matchID} = req.body

    var result = await pool.query('SELECT match_time_limit FROM "Match" where match_id = $1',[matchID])
    const minutesToAdd = result.rows[0].match_time_limit

    result = await pool.query(
    `UPDATE "Match"
    SET match_start_time = date_trunc('second', NOW()),
        match_end_time   = date_trunc('second', NOW() + ($1 || ' minutes')::interval)
    WHERE match_id = $2`,
    [minutesToAdd, matchID]);

  res.json({ match_started: true });
  })

  app.get("/api/getMatchFinished", async (req, res)=>
    {
      const matchID = req.query.matchID;
      const result = await pool.query(
        `SELECT * FROM "Match" WHERE match_id = $1 AND NOW() >= match_end_time`,
        [matchID]
      );

      if (result.rows.length > 0) {
        res.json({ match_finished: true });
      }
      else
        {
          res.json({ match_finished: false });
        }
    });
app.get("/api/getMatchEndTime", async (req, res) => {
  const matchID = req.query.matchID;
  const result = await pool.query(
    `SELECT match_end_time FROM "Match" WHERE match_id = $1`,
    [matchID]
  );

  if (result.rows.length > 0) {
    res.json({ match_end_time: result.rows[0].match_end_time });
  } else {
    res.status(404).json({ error: "Match not found" });
  }
});
app.post("/api/hitplayer", async (req, res)=>
  {
    const {playerID,matchID,playershotid} = req.body
    try
    {
      var result = await pool.query('SELECT player_health FROM "Player" WHERE user_id = $1 AND match_id = $2',[playershotid,matchID]);
      const playerShotHealth = result.rows[0].player_health;
      result = await pool.query('SELECT player_score FROM "Player" WHERE user_id = $1 AND match_id = $2',[playerID,matchID]);
      const playerScore = result.rows[0].player_health;
      const value = 10;
      if( playerShotHealth >10)
      {
        //Player shot
        result = await pool.query('UPDATE "Player" SET player_health = $3 WHERE user_id = $1 AND  match_id = $2',[playershotid,matchID,playerShotHealth-value])
        
        result = await pool.query('INSERT INTO "MatchAction"(match_id,user_id,action_type,action_2nd_player,action_type_value) VALUES ($1,$2,"hit",$3,$4)',[matchID,playerID,playershotid,value])
        result = await pool.query('UPDATE "Player" SET player_score = $3 WHERE user_id = $1 AND  match_id = $2',[playerID,matchID,playerScore+value])


      }else
      { //Player 'killed'
        //Add hit to playeractions
        result = await pool.query('UPDATE "Player" SET player_health = $3 WHERE user_id = $1 AND  match_id = $2',[playershotid,matchID,0])
        result = await pool.query('INSERT INTO "MatchAction"(match_id,user_id,action_type,action_2nd_player,action_type_value) VALUES ($1,$2,"hit",$3,$4)',[matchID,playerID,playershotid,value])
        result = await pool.query('INSERT INTO "MatchAction"(match_id,user_id,action_type,action_2nd_player,action_type_value) VALUES ($1,$2,"kill",$3,$4)',[matchID,playerID,playershotid,null])
        result = await pool.query('UPDATE "Player" SET player_score = $3 WHERE user_id = $1 AND  match_id = $2',[playerID,matchID,playerScore+value])
      }
    } 
    catch(err)
    {

    }
  })

app.get("/api/getStatistics", async (req, res) => {
  const matchID = req.query.matchID;

  try {
    const result = await pool.query(
      'SELECT user_id FROM "Player" WHERE match_id = $1',
      [matchID]
    );

    const Players = await Promise.all(
      result.rows.map(async (row) => {
        const player: { username:string;kills: number; score: number, alive:boolean } = {
          username :"",
          kills: 0,
          score: 0,
          alive:true
        };

      const resUsername = await pool.query('SELECT "UserUsername" FROM "User" where "UserID" = $1',[row.user_id]);
      player.username = resUsername.rows[0].UserUsername;

        const resKills = await pool.query(
          'SELECT COUNT(*) AS "Kills" FROM "MatchAction" WHERE match_id = $1 AND user_id = $2 AND action_type = $3',
          [matchID, row.user_id, "kill"]
        );
        player.kills = Number(resKills.rows[0].Kills);

        const resScore = await pool.query(
          'SELECT player_score FROM "Player" WHERE match_id = $1 AND user_id = $2',
          [matchID, row.user_id]
        );
        player.score = Number(resScore.rows[0].player_score);

        const resAlive = await pool.query(
          'SELECT (COUNT(*)=0) AS "Alive" FROM "MatchAction" WHERE match_id = $1 AND action_2nd_player = $2 AND action_type = $3',
          [matchID, row.user_id,"kill"]
        );
        player.alive = resAlive.rows[0].Alive;

        return player;
      })
    );

    res.json(Players);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

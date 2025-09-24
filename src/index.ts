import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv"
import { Pool } from "pg";
import bcrypt from "bcrypt";

dotenv.config()

const app = express();
const PORT = 3000;
const saltRounds = 10;

async function hashPassword(plainPassword: string) {
  const salt = await bcrypt.genSalt(saltRounds); // generate a unique salt
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  return hashedPassword;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors())
app.use(express.json())

app.use(bodyParser.json({ limit: "10mb" }))

app.use(bodyParser.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

//test
app.get("/", (req, res) => {
  res.send("Test");
  //console.log("LOL")
});

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query('SELECT "UserID" FROM "User"');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

  app.post("/api/register",async (req,res)=>{
    const { userEmail, userUsername,userPassword,imageFace,profilePhoto } = req.body;
    
    try {
            var results = await pool.query('SELECT "UserUsername" FROM "User" where "UserEmail" = $1',[userEmail]);
            if (results.rows.length != 0) {
              return res.status(401).json({ error: "There is already a account with that address" });
            }
            else
              {
                //Facescan part lol
                const imageFaceDescriptor  = imageFace
                //
                results = await pool.query('INSERT INTO "Facescan"(face_scan_descriptor) VALUES($1) RETURNING "face_scan_id"',[imageFaceDescriptor]);
                const newUserFaceID = results.rows[0].face_scan_id
                const hashedUserPassword = await hashPassword(userPassword)

                results = await pool.query('INSERT INTO "User"("UserEmail","UserUsername","UserPassword","UserFaceScanID","UserProfilePhoto") VALUES($1,$2,$3,$4,$5) RETURNING "UserID"',[userEmail,userUsername,hashedUserPassword,newUserFaceID,profilePhoto]);
                //const newUserID = results.rows[0].UserID;
              }

    } catch (error) {
     console.log(error) 
    }
  })
  app.post("/api/login", async (req,res)=>
  {
    const { userEmail, userPassword } = req.body;

    try {
      const result = await pool.query('SELECT "UserPassword","UserID" FROM "User" where "UserEmail" = $1',[userEmail]);
      if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }
    
      const hashedPassword = result.rows[0].UserPassword;
      const isMatch = await bcrypt.compare(userPassword, hashedPassword);
      const user = result.rows[0];
      if (isMatch) {
      res.json({ message: "Login successful!",userId: user.UserID });
      //return true;

    } else {
      res.status(401).json({ error: "Invalid password" });
      //return false
    }

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Database query failed:" });
    }
  });

  app.get("/api/getUserID",async (req,res) =>{
      const { userEmail} = req.query;
  try {
    const result = await pool.query(
      'SELECT "UserID" FROM "User" WHERE "UserEmail" = $1',
      [userEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Send back just the user ID
    const data_user_id = result.rows[0].UserID;
    res.json({ userId: data_user_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});


    app.get("/api/getUsername/:id", async (req,res)=>
  {
    const userID = req.params.id;

    try {
      const result = await pool.query('SELECT "UserUsername" FROM "User" where "UserID" = $1',[userID]);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
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

app.post("/api/joinMatch",async(req,res)=>
  {
    const {matchID, userID} = req.body

    var result = await pool.query('SELECT match_id,user_id from "Player" where user_id = $1 AND match_id = $2',[userID,matchID])

    if(result.rows.length>0)
      {
        return res.status(401).json({ error: "User is already in that match" });
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
      //select "UserUsername",player_ready from "Player" join "User" on "Player".user_id = "User"."UserID" where match_id = 33
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

import { useEffect, useState } from 'react' //useEffect to make changes on loading page //useState for react hooks for dynamic changes to variables
import { useNavigate, useLocation } from "react-router-dom" //useNavigate is used to navigate between pages //useLocation for keep current stat of page
import { Table, Container } from "react-bootstrap"; //Import "Table" and "Container" component from react-boostrap
import CameraFeed from '../components/CameraFeed'; //Import "CameraFeed" component
import MatchStatistics from '../components/MatchStatistics'; //Import "MatchStatistics" component

type MatchProps = { //Props for match id and match lobby id and current player id
  matchId: number | null
  matchLobbyID: string | null
  currentPlayerId: number | null
}

type PlayerStats = { //Type to enforce PlayerStats for Players for a get request
  username: string;
  kills: number;
  score: number;
  alive: boolean;
};

function Match() {
  const location = useLocation(); //Creation of useLocation() object
  const navigate = useNavigate(); //Creation of useNavigate() object
  const { matchId, matchLobbyID, currentPlayerId } = location.state ?? {};   //Get values of matchid, matchlobbyid and currentplayerid form location objects

  const [PlayerUsername, setPlayerUsername] = useState("Default") //react hook for player username
  const [PlayerScore, setPlayerScore] = useState<number>(0) //react hook for player score
  const [PlayerHealth, setPlayerHealth] = useState<number>(100) //react hook for player health
  const [players, setPlayers] = useState<PlayerStats[]>([]); //react hook for array of players for player statistics
  const [timeLeft, setTimeLeft] = useState<number>(0) //react hook for time left
  const [isLoading, setIsLoading] = useState(true); //react hook for loading state

  //Loading page (fetch username on mount)
  useEffect(() => {
    const OnLoadMatchPage = async (matchProp: MatchProps) => {
      try {
        document.title = "Tagstrike - Match - " + matchProp.matchLobbyID; //set page title dynamically

        const res = await fetch(`http://localhost:3000/api/getUsername/${currentPlayerId}`); //fetch username from backend
        const data = await res.json();
        const username = data[0]?.UserUsername ?? "Unknown"; //fallback if username is missing
        setPlayerUsername(username);
      } finally {
        setIsLoading(false); //always stop loading, even on error
      }
    };

    if (matchId !== null) { //only call API if matchID is valid
      OnLoadMatchPage({ matchId, matchLobbyID, currentPlayerId });
    }
  }, [matchId]);

  //Update match periodically (stats, players, time left)
  useEffect(() => { 
    if (!matchId || isLoading) return; //do not start until username is loaded

    let intervalId: number;

    const updateMatch = async () => {
      try {
        const resStats = await fetch(`http://localhost:3000/api/getStatistics?matchID=${matchId}`); //fetch statistics of all players
        const playersData: PlayerStats[] = await resStats.json();
        setPlayers(playersData); //update player statistics

        const alivePlayers = playersData.filter(p => p.alive); //filter alive players

        if (alivePlayers.length === 1) { //check if only one player survives
          clearInterval(intervalId);
          navigate("/winner", { state: { winner: alivePlayers[0].username, user: currentPlayerId } }); //Navigate to winner screen
          return;
        }

        const resEnd = await fetch(`http://localhost:3000/api/getMatchEndTime?matchID=${matchId}`); //Get end match time
        const { match_end_time } = await resEnd.json();
        const endTime = new Date(match_end_time).getTime();
        const now = Date.now();
        const secondsLeft = Math.max(0, Math.floor((endTime - now) / 1000)); 
        setTimeLeft(secondsLeft); //Set how many seconds left

        if (secondsLeft === 0) { //if time has run out
          clearInterval(intervalId);
          const winner = alivePlayers.length === 1 ? alivePlayers[0].username : "No one (draw)";
          navigate("/winner", { state: { winner, user: currentPlayerId  } }); //Navigate to winner screen if time has run out
        }

      } catch (err) {
        console.error(err); //catch and log errors
      }
    };

    updateMatch(); //run immediately on load
    intervalId = window.setInterval(updateMatch, 500); //then run every 0.5 seconds

    return () => clearInterval(intervalId); //cleanup on unmount
  }, [matchId, navigate, isLoading]) //depend on matchId, navigation, and loading state

  //Render UI
  return (
    <div className="container mt-3">
      {isLoading ? ( //show loading until username is fetched
        <div>Loading match...</div>
      ) : (
        <>
          <span className="brand-color-matrix">
            {PlayerUsername} Health: {PlayerHealth} Score: {PlayerScore}
          </span> {/* Details of user such as username, current health and score */}
          <div>
            Time left: {Math.floor(timeLeft / 60)}:
            {String(timeLeft % 60).padStart(2, "0")}
          </div> {/* Show time remaining in match */}
          <CameraFeed /> {/* Show camera feed */}
          <MatchStatistics players={players} /> {/* Show match statistics of all players */}
        </>
      )}
    </div>
  );
}

export default Match //Export "Match" component
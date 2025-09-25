import { useEffect,useState } from 'react' //useEffect to make changes on loading page //useState for react hooks for dynamic changes to variables
import { useNavigate,useLocation  } from "react-router-dom" //useNavigate is used to navigate between pages //useLocation for keep current stat of page
import { Table, Container } from "react-bootstrap"; //Import "Table" and "Container" component from react-boostrap
import CameraFeed from '../components/CameraFeed'; //Import "CameraFeed" component
import MatchStatistics from '../components/MatchStatistics'; //Import "MatchStatistics" component

type MatchProps = { //Props for match id and match lobby id and current player id
  matchId: number | null
  matchLobbyID :string |null
  currentPlayerId: number | null
}

type PlayerStats = { //Type to enforce PlayerStats for Players for a get request
  username:string;
  kills: number;
  score: number;
  alive: boolean;
};

function Match(){
  const location = useLocation(); //Creation of useLocation() object
  const navigate = useNavigate(); //Creation of useNavigate() object
  const { matchId, matchLobbyID, currentPlayerId } = location.state ?? {};   //Get values of matchid, matchlobbyid and currentplayerid form lcation objects
    const [PlayerUsername, setPlayerUsername] = useState("Default") //react hook for player username
    const [PlayerScore, setPlayerScore] = useState<number>(0) //react hook for player score
    const [PlayerHealth, setPlayerHealth] = useState<number>(100) //react hook for player health
    const [players, setPlayers] = useState<PlayerStats[]>([]); //react hook for array of players for player statistics
    const [timeLeft, setTimeLeft] = useState<number>(0) //react hook for time left

    //Loading page
      useEffect(() => {
        const OnLoadMatchPage = async (matchProp: MatchProps) => {

          document.title = "Tagstrike - Match - "+matchProp.matchLobbyID;
          const res = await fetch(`http://localhost:3000/api/getUsername/${currentPlayerId}`);
          const data = await res.json();
          const username = data[0]?.UserUsername;
          setPlayerUsername(username)
        };
        
      if (matchId !== null) { // <-- only call if matchID is valid
        OnLoadMatchPage({
            matchId,
            matchLobbyID,
            currentPlayerId
        });
      }
      }, [matchId]);

useEffect(() => { //Obtain all statistics of all players and set it to the correponding react hook and check if only onpe player is surviving
  if (!matchId) return;

  let intervalId: number;

  const updateMatch = async () => {
    try {
      const resStats = await fetch(`http://localhost:3000/api/getStatistics?matchID=${matchId}`);
      const playersData: PlayerStats[] = await resStats.json();
      setPlayers(playersData);

      const alivePlayers = playersData.filter(p => p.alive);

      if (alivePlayers.length === 1) {
        clearInterval(intervalId);
        navigate("/winner", { state: { winner: alivePlayers[0].username, user:currentPlayerId } }); //Navigate to winner screen if only one player is surving
        return;
      }

      const resEnd = await fetch(`http://localhost:3000/api/getMatchEndTime?matchID=${matchId}`); //Get end match time
      const { match_end_time } = await resEnd.json();
      const endTime = new Date(match_end_time).getTime();
      const now = Date.now();
      const secondsLeft = Math.max(0, Math.floor((endTime - now) / 1000)); 
      setTimeLeft(secondsLeft); //Set how many seconds left

      if (secondsLeft === 0) {
        clearInterval(intervalId);
        const winner = alivePlayers.length === 1 ? alivePlayers[0].username : "No one (draw)";
        navigate("/winner", { state: { winner } }); //Navigate to winner screen if time has run out
      }

    } catch (err) {
      console.error(err);
    }
  };

  updateMatch();
  intervalId = window.setInterval(updateMatch, 1000);

  return () => clearInterval(intervalId);
}, [matchId, navigate])



    return(
        <>
        <div className="container mt-3">
          <div className="mb-2">
            
          <span className='brand-color-matrix'>{PlayerUsername} Health: {PlayerHealth.toString()} Score: {PlayerScore.toString()}</span> {/* Details of user such as username, curretn health and score */}
          <div>Time left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}</div> {/* Show time remaining in match */}
          <CameraFeed /> {/* Show camera feed */}

          <MatchStatistics players={players}/> {/* Show match statitics of all players */}
          </div>
        </div>
        </>
    )
}

export default Match //Export "Match" component
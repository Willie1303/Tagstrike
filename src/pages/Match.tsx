import { useEffect,useState } from 'react'
import { useNavigate,useLocation  } from "react-router-dom"
import { Table, Container } from "react-bootstrap";
import CameraFeed from '../components/CameraFeed';
import MatchStatistics from '../components/MatchStatistics';

type MatchProps = {
  matchId: number | null
  matchLobbyID :string |null
  currentPlayerId: number | null
}

type PlayerStats = {
  username:string;
  kills: number;
  score: number;
  alive: boolean;
};

function Match(){
  const location = useLocation();
  const { matchId, matchLobbyID, currentPlayerId } = location.state ?? {};  
  const [PlayerReady,setPlayerReady] = useState(false)
    const [PlayerReadyText,setPlayerReadyText] = useState("Not ready")
    const [MatchLobbyID, setMatchLobbyID] = useState(matchLobbyID)
    const [CurrentPlayerID, setCurrentPlayerId] = useState(currentPlayerId)
    const [PlayerUsername, setPlayerUsername] = useState("Default")
    const [PlayerScore, setPlayerScore] = useState<number>(0)
    const [PlayerHealth, setPlayerHealth] = useState<number>(100)
    const [players, setPlayers] = useState<PlayerStats[]>([]);
    const [timeLeft, setTimeLeft] = useState<number>(0)
    const navigate = useNavigate();

        //Match start

    //Match Lobby ID


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

useEffect(() => {
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
        navigate("/winner", { state: { winner: alivePlayers[0].username, user:currentPlayerId } });
        return;
      }

      const resEnd = await fetch(`http://localhost:3000/api/getMatchEndTime?matchID=${matchId}`);
      const { match_end_time } = await resEnd.json();
      const endTime = new Date(match_end_time).getTime();
      const now = Date.now();
      const secondsLeft = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(secondsLeft);

      if (secondsLeft === 0) {
        clearInterval(intervalId);
        const winner = alivePlayers.length === 1 ? alivePlayers[0].username : "No one (draw)";
        navigate("/winner", { state: { winner } });
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
            
          <span className='brand-color-matrix'>{PlayerUsername} Health: {PlayerHealth.toString()} Score: {PlayerScore.toString()}</span>
          <div>Time left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}</div>
          <CameraFeed />

          <MatchStatistics players={players}/>
          </div>
        </div>
        </>
    )
}

export default Match
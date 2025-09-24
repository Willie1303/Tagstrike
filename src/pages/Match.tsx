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
      if (matchId === null) return;

      const fetchMatchStats = async () => {
        try {
          // GET request with query param
          const res = await fetch(`http://localhost:3000/api/getStatistics?matchID=${matchId}`);

          if (!res.ok) throw new Error("Failed to fetch match statistics");

          const data: PlayerStats[] = await res.json();
          setPlayers(data); // updates your players state
        } catch (err) {
          console.error(err);
        }
      };

      fetchMatchStats();

      const interval = setInterval(fetchMatchStats, 200);

      return () => clearInterval(interval); // cleanup on unmount
    }, [matchId]);

    return(
        <>
        <div className="container mt-3">
          <div className="mb-2">
          <span className='brand-color-matrix'>{PlayerUsername} Health: {PlayerHealth.toString()} Score: {PlayerScore.toString()}</span>
          <CameraFeed />

          <MatchStatistics players={players}/>
          </div>
        </div>
        </>
    )
}

export default Match
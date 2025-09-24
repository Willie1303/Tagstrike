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

    const players = [
  { id: 1, username: "PlayerOne", health: 75, score: 1200, status: "Alive" },
  { id: 2, username: "PlayerTwo", health: 40, score: 850, status: "Alive" },
  { id: 3, username: "PlayerThree", health: 0, score: 600, status: "Eliminated" },
];  

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
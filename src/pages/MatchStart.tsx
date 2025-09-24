import { useEffect,useState } from 'react'
import { useNavigate,useLocation  } from "react-router-dom"
import { Table, Container } from "react-bootstrap";

type MatchProps = {
  matchId: number | null
  matchLobbyID :string |null
  currentPlayerId: number | null
}

interface PlayerStatus {
  UserUsername: string;
  player_ready: boolean;
}

function MatchStart(){
  const location = useLocation();
  const navigate = useNavigate();
  const { matchId, matchLobbyID, currentPlayerId } = location.state ?? {};  
  const [PlayerReady,setPlayerReady] = useState(false)
    const [PlayerReadyText,setPlayerReadyText] = useState("Not ready")
    const [MatchLobbyID, setMatchLobbyID] = useState(matchLobbyID)
    const [CurrentPlayerID, setCurrentPlayerId] = useState(currentPlayerId)
    const [MatchBegin, setMatchBegin] = useState(false)
    const [MatchBeginStartingTime, setMatchBeginStartingTime] = useState<number>(5)
    const [AllPlayerStatuses,setAllPlayerStatuses]= useState<PlayerStatus[]>([])
    //Match Voting Ready

const HandleToggleReady = async () => {
  const newStatus = !PlayerReady; // compute opposite of current state

  setPlayerReady(newStatus);
  setPlayerReadyText(newStatus ? "Ready" : "Not ready");
  try {
    const result = await fetch(`http://localhost:3000/api/updatePlayerStatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        playerID: CurrentPlayerID,
        playerStatus: newStatus, 
        matchID:matchId }), // 
    });
   if (!result.ok) {
      const text = await result.text(); // debug raw response
      console.error("Server error:", result.status, text);
      return;
    }
    const data = await result.json();
  } catch (err) {
    console.error("Failed to update player status:", err);
  }
};

        //Match start

    //Match Lobby ID



useEffect(() => {
  if (!matchId || MatchBegin) return; // Only poll if match hasn't begun

  const interval = setInterval(async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/getMatchStatus/${matchId}`);
      const data = await response.json();
      setAllPlayerStatuses(data.match_status_players);

      // Count how many players are ready
      const readyCount = data.match_status_players.filter(
        (player: PlayerStatus) => player.player_ready
      ).length;

      if (readyCount >= 2) {
        setMatchBegin(true); // Trigger countdown
      }
    } catch (error) {
      console.error("Error fetching match status:", error);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [matchId, MatchBegin]);


useEffect(() => {
  if (!MatchBegin) return;

  const interval = setInterval(() => {
    setMatchBeginStartingTime(prev => {
      if (prev > 0) {
        return prev - 1;
      } else {
        clearInterval(interval);

        (async () => {
          try {
            await fetch(`http://localhost:3000/api/StartMatch`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ matchID: matchId }),
            });

            navigate('/match', {
              state: {
                matchId,
                matchLobbyID,
                currentPlayerId,
              },
            });
          } catch (err) {
            console.error("Failed to start match:", err);
          }
        })();

        return 0; // Timer stops at 0
      }
    });
  }, 1000);

  return () => clearInterval(interval);
}, [MatchBegin, matchId, matchLobbyID, currentPlayerId]);



    return(
        <>
        <div>
            <h3>Match Lobby: {MatchLobbyID ? MatchLobbyID : "Not Assigned"}</h3>

            <hr/>

            <p>{PlayerReadyText}</p><button onClick={HandleToggleReady}>Toggle Ready</button>

            <hr />
            <Container fluid>
            <Table bordered variant="dark">
              <thead>
                <tr className='row'>
                  <th className="col">Player</th>
                  <th className="col">Player Status</th>
                </tr>
              </thead>
              <tbody>
                {AllPlayerStatuses.sort((a, b) => a.UserUsername.localeCompare(b.UserUsername)).map((player, index) => (
                  <tr key={index} className='row'>
                    <td className="col">{player.UserUsername}</td>
                    <td className="col">{player.player_ready? "Ready" : "Not Ready"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            </Container>
            {MatchBegin?
            <div>
              <span>Match starting in {MatchBeginStartingTime} {MatchBeginStartingTime === 1?"second":"seconds"}</span>
            </div>
            : <div></div>
            }
        </div>
        </>
    )
}

export default MatchStart
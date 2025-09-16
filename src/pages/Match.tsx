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

function Match(){
  const location = useLocation();
  const { matchId, matchLobbyID, currentPlayerId } = location.state ?? {};  
  const [PlayerReady,setPlayerReady] = useState(false)
    const [PlayerReadyText,setPlayerReadyText] = useState("Not ready")
    const [MatchLobbyID, setMatchLobbyID] = useState(matchLobbyID)
    const [CurrentPlayerID, setCurrentPlayerId] = useState(currentPlayerId)

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


    //Loading page
        const players = ["Alice", "Bob", "Charlie"];
      useEffect(() => {
        const OnLoadMatchPage = async (matchProp: MatchProps) => {

          document.title = "Tagstrike - Match - "+matchProp.matchLobbyID;
          setCurrentPlayerId(matchProp.currentPlayerId)
        };
        
        const CheckMatchVoting = setInterval(async () => {
              const response = await fetch(`http://localhost:3000/api/getMatchStatus/${matchId}`)
              const data = await response.json()
              setAllPlayerStatuses(data.match_status_players)
        },250)

    
      if (matchId !== null) { // <-- only call if matchID is valid
        OnLoadMatchPage({
            matchId,
            matchLobbyID,
            currentPlayerId
        });
      }
      return () => clearInterval(CheckMatchVoting);
      }, [matchId]);

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
        </div>
        </>
    )
}

export default Match
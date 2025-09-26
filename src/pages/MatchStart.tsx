import { useEffect, useState,useRef } from 'react'; //useEffect to make changes on loading page //useState for react hooks for dynamic changes to variables
import { useNavigate, useLocation } from "react-router-dom"; //useNavigate is used to navigate between pages //useLocation for keep current stat of page
import { Table, Container } from "react-bootstrap"; //Import "Table" and "Container" component from react-boostrap

type MatchProps = { //Props for match id, match lobby id and currentPlayerID
  matchId: number | null;
  matchLobbyID: string | null;
  currentPlayerId: number | null;
};

interface PlayerStatus { //Inteface for current username and player readiness
  UserUsername: string;
  player_ready: boolean;
}

function MatchStart() {
  const location = useLocation(); //Creation of useLocation() object
  const navigate = useNavigate();//Creation of useNavigate() object
  const { matchId, matchLobbyID, currentPlayerId } = location.state ?? {}; //Get values of matchid, matchlobbyid and currentplayerid form lcation object

  const [PlayerReady, setPlayerReady] = useState(false); //react hook for player ready
  const [PlayerReadyText, setPlayerReadyText] = useState("Not ready"); //react hook for player ready text
  const [MatchLobbyID, setMatchLobbyID] = useState(matchLobbyID); //react hook for match lobbyid
  const [CurrentPlayerID, setCurrentPlayerId] = useState(currentPlayerId); //react hook for current player id
  const [MatchBegin, setMatchBegin] = useState(false); //react hook for Match begin
  const [MatchBeginStartingTime, setMatchBeginStartingTime] = useState<number>(5); //react hook for match starting time
  const [AllPlayerStatuses, setAllPlayerStatuses] = useState<PlayerStatus[]>([]); //react hook for player readyness

  // Toggle ready
  const HandleToggleReady = async () => {
    const newStatus = !PlayerReady;
    setPlayerReady(newStatus);
    setPlayerReadyText(newStatus ? "Ready" : "Not ready");

    try {
      const result = await fetch(`http://localhost:3000/api/updatePlayerStatus`, { //POST request to change player status
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          playerID: CurrentPlayerID,
          playerStatus: newStatus,
          matchID: matchId
        }),
      });
      if (!result.ok) {
        const text = await result.text();
        console.error("Server error:", result.status, text);
      }
    } catch (err) {
      console.error("Failed to update player status:", err);
    }
  };

  // Poll for player readiness
  useEffect(() => {
    if (!matchId || MatchBegin) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/getMatchStatus/${matchId}`); //GET request to fetch all player statuses for a specific match
        const data = await response.json();
        setAllPlayerStatuses(data.match_status_players); //Set all player statuses to data from request

        const readyCount = data.match_status_players.filter(
          (player: PlayerStatus) => player.player_ready
        ).length;

        if (readyCount >= 2 && readyCount == data.match_status_players.length) { //If at least 2 players are ready and everyone is ready
          setMatchBegin(true); // Start countdown
        }
      } catch (error) {
        console.error("Error fetching match status:", error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [matchId, MatchBegin]);
const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // Countdown timer
useEffect(() => {
  if (!MatchBegin) return;

  if (intervalRef.current) return; // prevent duplicate interval

  intervalRef.current = setInterval(() => {
    setMatchBeginStartingTime(prev => {
      if (prev > 0) return prev - 1;
      clearInterval(intervalRef.current!);
      intervalRef.current = null;
      return 0;
    });
  }, 1000);

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
}, [MatchBegin]);

  // Trigger match start when countdown reaches 0
  useEffect(() => {
    if (MatchBeginStartingTime !== 0 || !matchId) return;

    const startMatchAndNavigate = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/StartMatch`, { //POST request to start match
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchID: matchId }), //Pass that match id
        });
        const data = await res.json();

        navigate('/match', { 
          state: { matchId, matchLobbyID, currentPlayerId } 
        });
      } catch (err) {
        console.error("Failed to start match:", err);
      }
    };

    startMatchAndNavigate();
  }, [MatchBeginStartingTime, matchId, matchLobbyID, currentPlayerId, navigate]);

  return (
    <div>
      <h3>Match Lobby: {MatchLobbyID ?? "Not Assigned"}</h3> {/* Display lobby id */}
      <hr />
      <p>{PlayerReadyText}</p>
      <button onClick={HandleToggleReady}>Toggle Ready</button> {/* Button to toggle readyness */}
      <hr />
      <Container fluid>
        <Table bordered variant="dark">
          <thead>
            <tr>
              <th>Player</th>
              <th>Player Status</th>
            </tr>
          </thead>
          <tbody>
            {AllPlayerStatuses
              .sort((a, b) => a.UserUsername.localeCompare(b.UserUsername))
              .map((player, index) => (
                <tr key={index}>
                  <td>{player.UserUsername}</td>
                  <td>{player.player_ready ? "Ready" : "Not Ready"}</td>
                </tr>
              ))
            }
          </tbody>
        </Table>

      </Container>
      {MatchBegin && (
        <div>
          <span>Match starting in {MatchBeginStartingTime} {MatchBeginStartingTime === 1 ? "second" : "seconds"}</span> {/* Element that shows countdown to 0 */}
        </div>
      )}
    </div>
  );
}

export default MatchStart; //Export "MatchStart" component

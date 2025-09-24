import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { Table, Container } from "react-bootstrap";

type MatchProps = {
  matchId: number | null;
  matchLobbyID: string | null;
  currentPlayerId: number | null;
};

interface PlayerStatus {
  UserUsername: string;
  player_ready: boolean;
}

function MatchStart() {
  const location = useLocation();
  const navigate = useNavigate();
  const { matchId, matchLobbyID, currentPlayerId } = location.state ?? {};

  const [PlayerReady, setPlayerReady] = useState(false);
  const [PlayerReadyText, setPlayerReadyText] = useState("Not ready");
  const [MatchLobbyID, setMatchLobbyID] = useState(matchLobbyID);
  const [CurrentPlayerID, setCurrentPlayerId] = useState(currentPlayerId);
  const [MatchBegin, setMatchBegin] = useState(false);
  const [MatchBeginStartingTime, setMatchBeginStartingTime] = useState<number>(5);
  const [AllPlayerStatuses, setAllPlayerStatuses] = useState<PlayerStatus[]>([]);

  // Toggle ready
  const HandleToggleReady = async () => {
    const newStatus = !PlayerReady;
    setPlayerReady(newStatus);
    setPlayerReadyText(newStatus ? "Ready" : "Not ready");

    try {
      const result = await fetch(`http://localhost:3000/api/updatePlayerStatus`, {
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
        const response = await fetch(`http://localhost:3000/api/getMatchStatus/${matchId}`);
        const data = await response.json();
        setAllPlayerStatuses(data.match_status_players);

        const readyCount = data.match_status_players.filter(
          (player: PlayerStatus) => player.player_ready
        ).length;

        if (readyCount >= 2) {
          setMatchBegin(true); // Start countdown
        }
      } catch (error) {
        console.error("Error fetching match status:", error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [matchId, MatchBegin]);

  // Countdown timer
  useEffect(() => {
    if (!MatchBegin) return;

    const interval = setInterval(() => {
      setMatchBeginStartingTime(prev => {
        if (prev > 0) return prev - 1;
        clearInterval(interval); // stop countdown at 0
        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [MatchBegin]);

  // Trigger match start when countdown reaches 0
  useEffect(() => {
    if (MatchBeginStartingTime !== 0 || !matchId) return;

    const startMatchAndNavigate = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/StartMatch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchID: matchId }),
        });
        const data = await res.json();
        console.log("Match started:", data.match_started);

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
      <h3>Match Lobby: {MatchLobbyID ?? "Not Assigned"}</h3>
      <hr />
      <p>{PlayerReadyText}</p>
      <button onClick={HandleToggleReady}>Toggle Ready</button>
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
            {AllPlayerStatuses
              .sort((a, b) => a.UserUsername.localeCompare(b.UserUsername))
              .map((player, index) => (
                <tr key={index} className='row'>
                  <td className="col">{player.UserUsername}</td>
                  <td className="col">{player.player_ready ? "Ready" : "Not Ready"}</td>
                </tr>
              ))
            }
          </tbody>
        </Table>
      </Container>
      {MatchBegin && (
        <div>
          <span>Match starting in {MatchBeginStartingTime} {MatchBeginStartingTime === 1 ? "second" : "seconds"}</span>
        </div>
      )}
    </div>
  );
}

export default MatchStart;

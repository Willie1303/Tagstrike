import { useEffect, useState, useRef } from 'react' // React hooks
import { useNavigate, useLocation } from "react-router-dom" // navigation
import { Table, Container } from "react-bootstrap"; // Bootstrap components
import CameraFeed from '../components/CameraFeed'; // Camera feed component
import MatchStatistics from '../components/MatchStatistics'; // Match stats component

type MatchProps = { // Props for match id, lobby id, and current player id
  matchId: number | null
  matchLobbyID: string | null
  currentPlayerId: number | null
}

type PlayerStats = { // Player statistics type
  username: string;
  kills: number;
  score: number;
  alive: boolean;
}

function Match() {
  const location = useLocation(); 
  const navigate = useNavigate(); 
  const { matchId, matchLobbyID, currentPlayerId } = location.state ?? {};

  const [PlayerUsername, setPlayerUsername] = useState("Default") // Player username
  const [PlayerScore, setPlayerScore] = useState<number>(0) // Player score
  const [PlayerHealth, setPlayerHealth] = useState<number>(100) // Player health
  const [players, setPlayers] = useState<PlayerStats[]>([]); // All players
  const [timeLeft, setTimeLeft] = useState<number>(0) // Time left in match
  const [isLoading, setIsLoading] = useState(true); // Loading state

  const lastShotRef = useRef<number>(0); // For shooting cooldown
  const SHOOT_COOLDOWN = 500; // milliseconds

  // Fetch username on load
  useEffect(() => {
    const OnLoadMatchPage = async (matchProp: MatchProps) => {
      try {
        document.title = "Tagstrike - Match - " + matchProp.matchLobbyID;

        const res = await fetch(`https://tagstrike.onrender.com/api/getUsername/${currentPlayerId}`);
        const data = await res.json();
        const username = data[0]?.UserUsername ?? "Unknown";
        setPlayerUsername(username);
      } finally {
        setIsLoading(false);
      }
    };

    if (matchId !== null) {
      OnLoadMatchPage({ matchId, matchLobbyID, currentPlayerId });
    }
  }, [matchId]);

  // Periodic match updates (stats, players, time left)
  useEffect(() => { 
    if (!matchId || isLoading) return;

    let intervalId: number;

    const updateMatch = async () => {
      try {
        const resStats = await fetch(`https://tagstrike.onrender.com/api/getStatistics?matchID=${matchId}`);
        const playersData: PlayerStats[] = await resStats.json();
        setPlayers(playersData);

        // Update own score and health from server
        const me = playersData.find(p => p.username === PlayerUsername);
        if (me) {
          setPlayerScore(me.score);
          setPlayerHealth(me.alive ? PlayerHealth : 0);
        }

        const alivePlayers = playersData.filter(p => p.alive);

        if (alivePlayers.length === 1) { // Only one survivor
          clearInterval(intervalId);
          navigate("/winner", { state: { winner: alivePlayers[0].username, user: currentPlayerId } });
          return;
        }

        const resEnd = await fetch(`https://tagstrike.onrender.com/api/getMatchEndTime?matchID=${matchId}`);
        const { match_end_time } = await resEnd.json();
        const endTime = new Date(match_end_time).getTime();
        const now = Date.now();
        const secondsLeft = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeLeft(secondsLeft);

        if (secondsLeft === 0) { // Time ran out
          clearInterval(intervalId);
          const winner = alivePlayers.length === 1 ? alivePlayers[0].username : "No one (draw)";
          navigate("/winner", { state: { winner, user: currentPlayerId } });
        }

      } catch (err) {
        console.error(err);
      }
    };

    updateMatch();
    intervalId = window.setInterval(updateMatch, 500);

    return () => clearInterval(intervalId);
  }, [matchId, navigate, isLoading, PlayerUsername, PlayerHealth]);

  // Auto-shoot when a player is detected
  const handlePlayerDetected = async (color: { r: number; g: number; b: number }) => {
    if (!matchId || !currentPlayerId) return;

    const now = Date.now();
    if (now - lastShotRef.current < SHOOT_COOLDOWN) return;
    lastShotRef.current = now;
    const colour_string = `#${color.r.toString(16).padStart(2,'0')}${color.g.toString(16).padStart(2,'0')}${color.b.toString(16).padStart(2,'0')}`;
    try {
      // Map detected color to a player ID
    const resPlayer = await fetch(
      `https://tagstrike.onrender.com/api/getPlayerbyColour?matchID=${matchId}&detected_player_colour=${encodeURIComponent(colour_string)}`
    );
    const { player_id } = await resPlayer.json();

          if (!player_id || player_id === currentPlayerId) return;

      // Hit the player
      await fetch("https://tagstrike.onrender.com/api/hitplayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchID: matchId, playerID: currentPlayerId, playershotid: player_id })
      });

      console.log(`Shot player ${player_id}`);
    } catch (err) {
      console.error("Error shooting player:", err);
    }
  };

  // Render UI
  return (
    <div className="container mt-3">
      {isLoading ? (
        <div>Loading match...</div>
      ) : (
        <>
          <span className="brand-color-matrix">
            {PlayerUsername} Health: {PlayerHealth} Score: {PlayerScore}
          </span>
          <div>
            Time left: {Math.floor(timeLeft / 60)}:
            {String(timeLeft % 60).padStart(2, "0")}
          </div>
          <CameraFeed onPlayerDetected={handlePlayerDetected} /> {/* auto-shoot */}
          <MatchStatistics players={players} />
        </>
      )}
    </div>
  );
}

export default Match;

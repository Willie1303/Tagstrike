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

  const videoRef = useRef<HTMLVideoElement>(null);
const canvasRef = useRef<HTMLCanvasElement>(null); // For shirt colours

const [playerColor, setPlayerColor] = useState<string | null>(null); //react hook for player colour
const [colorConfirmed, setColorConfirmed] = useState(false); //react hook for player colour confirmed

  const [PlayerReady, setPlayerReady] = useState(false); //react hook for player ready
  const [PlayerReadyText, setPlayerReadyText] = useState("Not ready"); //react hook for player ready text
  const [MatchLobbyID, setMatchLobbyID] = useState(matchLobbyID); //react hook for match lobbyid
  const [CurrentPlayerID, setCurrentPlayerId] = useState(currentPlayerId); //react hook for current player id
  const [MatchBegin, setMatchBegin] = useState(false); //react hook for Match begin
  const [MatchBeginStartingTime, setMatchBeginStartingTime] = useState<number>(5); //react hook for match starting time
  const [AllPlayerStatuses, setAllPlayerStatuses] = useState<PlayerStatus[]>([]); //react hook for player readyness

  // Toggle ready
  const HandleToggleReady = async () => {
          if (!colorConfirmed) {
    alert("Please detect your shirt color first!");
    return;
  }
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

  //Check player colour
const handleTakeSnapshot = async () => {
  const video = videoRef.current;
  const canvas = canvasRef.current;
  if (!video || !canvas) return;

  // Wait until the video has loaded metadata and has valid width/height
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    console.log("Video not ready yet. Try again in a moment.");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Compute average color
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }

  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);

  const hexColor = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  setPlayerColor(hexColor);
  setColorConfirmed(true);

  try {
    await fetch(`http://localhost:3000/api/setPlayerColour`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        userID: CurrentPlayerID,
        matchID: matchId,
        player_colour: hexColor
      }),
    });
    console.log("Player colour set successfully:", hexColor);
  } catch (err) {
    console.error("Error sending player colour:", err);
  }
};


  //Player colour
useEffect(() => {
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Unable to access camera:", err);
    }
  };
  startCamera();

  return () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  };
}, []);


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
      <h3 className='brand-color-matrix'>Match Lobby: {MatchLobbyID ?? "Not Assigned"}</h3> {/* Display lobby id */}
      <hr />
      <p className='brand-color-matrix'>{PlayerReadyText}</p>
      <button className='brand-color-matrix' onClick={HandleToggleReady}>Toggle Ready</button> {/* Button to toggle readyness */}
      <hr />
      <div>
      <video ref={videoRef} autoPlay muted playsInline className="w-100 rounded" />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {!colorConfirmed && (
        <button className="brand-color-matrix" onClick={handleTakeSnapshot}>
          Take Snapshot & Detect Shirt Color
        </button>
      )}
      {colorConfirmed && (
        <div className="brand-color-matrix">
          Shirt color detected: <span>{playerColor}</span>
        </div>
      )}
    </div>

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
          <span className='brand-color-matrix'>Match starting in {MatchBeginStartingTime} {MatchBeginStartingTime === 1 ? "second" : "seconds"}</span> {/* Element that shows countdown to 0 */}
        </div>
      )}
    </div>
  );
}

export default MatchStart; //Export "MatchStart" component

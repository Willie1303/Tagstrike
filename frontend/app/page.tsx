/*
  Jan-Willem Greyvenstein: 2023256304
  Tumelo Kasumba: 2023738970
*/

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Eye, Plus, Search, Sun, Moon } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { getWebSocket } from "@/lib/websocket"
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LandingPage() {
  const router = useRouter();
  const webSocket = getWebSocket();
  
  // --- Start of Integrated Color Capture States and Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Player & game state ---
  const [playerName, setPlayerName] = useState("");
  const [gameMode, setGameMode] = useState<"play" | "spectate" | null>(null);
  const [gameId, setGameId] = useState(""); // For joining/spectating
  const [shirtColor, setShirtColor] = useState("---");
  // --- UI state ---
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error">("info");
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [rgbValues, setRgbValues] = useState<string>('---');
  const [hexValue, setHexValue] = useState<string>('---');
  const [colorSwatchColor, setColorSwatchColor] = useState<string>('transparent');
  const [currentStatusMessage, setCurrentStatusMessage] = useState<string>(''); // Initial message for webcam
  const [statusMessageType, setStatusMessageType] = useState<'info' | 'success' | 'error'>('info');
  const [hasCapturedColor, setHasCapturedColor] = useState(false); // State to track if color has been captured by THIS player
  const [hasCaptured, setHasCaptured] = useState(false);


  const updateStatusMessage = useCallback((msg: string, type: "info" | "success" | "error" = "info") => {
    setStatusMessage(msg);
    setStatusType(type);
  }, []);

  const rgbToHex = useCallback((r: number, g: number, b: number): string => {
    const toHex = (c: number): string => {
      const hex = Math.round(c).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }, []);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!video || !canvas || !ctx || !video.srcObject) {
      updateStatusMessage('Webcam not active. Please allow camera access.', 'error');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const centerX = Math.floor(canvas.width / 2);
    const centerY = Math.floor(canvas.height / 2);
    const size = 10;

    const imageData = ctx.getImageData(centerX - size / 2, centerY - size / 2, size, size);
    const data = imageData.data;
    let r = 0, g = 0, b = 0;
    const pixelCount = size * size;

    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }

    r = Math.round(r / pixelCount);
    g = Math.round(g / pixelCount);
    b = Math.round(b / pixelCount);

    const hexColor = rgbToHex(r, g, b);

    setRgbValues(`(${r}, ${g}, ${b})`);
    setHexValue(hexColor);
    setColorSwatchColor(hexColor);
    setHasCapturedColor(true); // Mark that color has been captured
    setHasCaptured(true);
    updateStatusMessage('Color captured! You can now create or join a game.', 'success');
    debugger;
    console.log("Color captured! You can now create or join a game.");
  }, [updateStatusMessage, rgbToHex]);
  // --- End of Integrated Color Capture Functions ---

  const handleReset = useCallback(() => {
  // Reset all color capture states
  setHasCapturedColor(false);
  setHasCaptured(false);
  setRgbValues('---');
  setHexValue('---');
  setColorSwatchColor('transparent');
  
  // Reset status message
  updateStatusMessage('Ready to scan again. Position your shirt in the center and click \'Take Photo\'.', 'info');

  // Stop current video stream
  if (videoRef.current?.srcObject) {
    const stream = videoRef.current.srcObject as MediaStream;
    const tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());
    videoRef.current.srcObject = null;
  }

    // Restart webcam after a brief delay to ensure cleanup is complete
    setTimeout(async () => {
      if (videoRef.current && playerName.trim()) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoRef.current.srcObject = stream;
          updateStatusMessage('Webcam restarted. Position your shirt in the center and click \'Take Photo\'.', 'info');
        } catch (err) {
          console.error('Could not restart webcam:', err);
          updateStatusMessage('Could not restart webcam. Please refresh the page.', 'error');
        }
      }
    }, 100);
  }, [updateStatusMessage, playerName]);

  // Effect to start and clean up the webcam stream
  useEffect(() => {
    const startWebcam = async () => {
      if (videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoRef.current.srcObject = stream;
          updateStatusMessage('Webcam started. Position your shirt in the center and click \'Take Photo\'.', 'info');
        } catch (err) {
          console.error('Could not access webcam:', err);
          updateStatusMessage('Could not access webcam. Please ensure it\'s connected and permissions are granted.', 'error');
        }
      }
    };

    // Only start webcam if player name is entered and color hasn't been captured yet
    if (playerName.trim() && !hasCapturedColor) {
      startWebcam();
    } else if (!playerName.trim()) {
      updateStatusMessage('Enter your name to enable webcam and capture your shirt color.', 'info');
    }


    // Cleanup function: stop the webcam stream when the component unmounts or player name is cleared
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [playerName, hasCapturedColor, updateStatusMessage]); // Dependencies: playerName, hasCapturedColor

  // --- Theme management ---
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    setIsDarkMode(saved === "dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  const canProceed = playerName.trim() && (gameMode !== null);

  // --- Create game ---
  const createGame = async () => {
    if (!playerName.trim() || !hasCapturedColor || hexValue === "---") {
      console.log(playerName);
      console.log(hasCapturedColor);
      console.log(shirtColor);
      updateStatusMessage("Enter your name and capture your shirt color.", "info");
      debugger;
      return;
    }
    try {
      webSocket.emit("create", { playerName, shirtColor: hexValue });
      const roomID = await new Promise<string>((resolve) =>
        webSocket.once("sendRoom", resolve)
      );
      router.push(`/lobby/${roomID}?name=${encodeURIComponent(playerName)}&host=true`);
    } catch (err: any) {
      console.error(err);
      updateStatusMessage(`Failed to create game: ${err.message || "Unknown error"}`, "error");
    }
  };

  // --- Join game by ID ---
  const joinGame = () => {
    if (!playerName.trim() || !gameId.trim() || !hasCapturedColor || hexValue === '---') {
      updateStatusMessage("Please enter your name, game ID, and capture your shirt color first.", 'info');
      return; // Ensure color is captured
    }
  
    try {
      console.log("Attempting to emit 'join' with payload:", { gameID: gameId, playerName, shirtColor: hexValue });
      void webSocket.emit( // Explicitly void the emit call
        "join",
        { gameID: gameId, playerName, shirtColor: hexValue }, // Send shirtColor with join event
        (response: { success: boolean; message?: string }) => { // Explicitly type response
          if (!response.success) {
            updateStatusMessage(response.message || "Failed to join game.", 'error'); // Use updateStatusMessage
            console.log("Join failed:", response.message);
            return;
          }
          console.log("Successfully joined game, navigating to lobby.");
          router.push(`/lobby/${gameId}?name=${encodeURIComponent(playerName)}`);
        }
      );
    } catch (error: any) {
      console.error("Error joining game:", error);
      updateStatusMessage(`Failed to join game: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  // --- Spectate game ---
  const spectateGame = () => {
    if (!gameId.trim()) {
      updateStatusMessage("Please enter a Game ID to spectate.", 'info');
      return;
    }

    try {
      void webSocket.emit("spectate",{"gameID":gameId},(response: { success: boolean; message?: string })=>{ // Explicitly void the emit call
          if (!response.success) {
            updateStatusMessage(response.message || "Failed to spectate game.", 'error'); // Use updateStatusMessage
            return;
        }
        console.log("Successfully spectating game, navigating to spectate page.");
        router.push(`/spectator/${gameId}`)
      });
    } catch (error: any) {
      console.error("Error spectating game:", error);
      updateStatusMessage(`Failed to spectate game: ${error.message || 'Unknown error'}`, 'error');
    }
  }

   // Determine message box styling based on statusMessageType for the color capture section
  const messageBoxClasses = `mt-6 p-3 rounded-lg text-sm ${
    currentStatusMessage ? '' : 'hidden'
  } ${
    statusMessageType === 'error' ? 'bg-red-100 text-red-800' :
    statusMessageType === 'success' ? 'bg-green-100 text-green-800' :
    'bg-blue-100 text-blue-800'
  }`;
  
  return (
    <div className="min-h-screen flex flex-col cyber-grid">
      {/* Header */}
      <header className="text-center py-8 px-4 scan-line relative">
        <Button
          onClick={toggleTheme}
          variant="outline"
          size="sm"
          className="absolute top-4 right-4 w-10 h-10 p-0 neon-border border-primary/30 hover:border-primary/60 bg-transparent"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4 text-primary" />}
        </Button>
        <ThemeToggle />

        <div className="flex items-center justify-center gap-3 mb-4">
          <Zap className="w-12 h-12 text-primary neon-glow pulse-neon flicker" />
          <h1 className="text-5xl font-bold text-primary neon-glow glitch">TagStrike</h1>
        </div>
        <p className="text-xl text-[color:var(--neon-cyan)] neon-glow hologram">Enter the Cyber Arena</p>
        <div className="mt-2 text-sm text-muted-foreground data-stream">Neural interface initialized...</div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-md space-y-6">
        {/* Player name & color */}
        <Card className="p-6 bg-card neon-border border-primary/30 hologram">
          <h2 className="text-2xl text-primary neon-glow mb-2 glitch text-center">NEURAL LINK</h2>
          <Input
            placeholder="Enter neural ID..."
            className="text-center text-lg font-bold text-primary placeholder:text-muted-foreground scan-line mb-3"
            
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              // Reset color capture status if name changes
              setHasCapturedColor(false);
              setHexValue('---');
              setRgbValues('---');
              setColorSwatchColor('transparent');
            }}
            />
        </Card>
      {/* Color Capture Section - Only visible if player name is entered */}
        {playerName.trim() && (
          <Card className="mb-6 bg-black/20 border-gray-700">
            <CardContent className="pt-6 text-center">
              <h3 className="text-xl font-bold mb-4 text-white">Scan Your Shirt Color</h3>
              <p className="text-gray-300 text-sm mb-4">
                Position your shirt in front of the camera and click "Take Photo".
              </p>
              {/* Video element to display webcam feed */}
              <video ref={videoRef} autoPlay playsInline className="border-2 border-gray-300 rounded-lg w-full mb-4"></video>

              {/* Button to capture the photo */}
              <Button
                onClick={handleCapture}
                disabled={!playerName.trim()} // Disable if no player name
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
              >
                Take Photo & Confirm Color
              </Button>

              {hasCaptured && (
                  <Button
                    onClick={handleReset}
                    className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75"
                  >
                    Retake Photo
                  </Button>
                )}

              {/* Canvas (hidden) for image processing */}
              <canvas ref={canvasRef} className="hidden"></canvas>

              {/* Display area for RGB and Hex values */}
              <div className="mt-6 text-lg text-gray-700">
                <p className="mb-2 text-white">Captured RGB: <span id="rgbValues" className="font-bold text-gray-200">{rgbValues}</span></p>
                <p className="mb-2 text-white">Captured Hex: <span id="hexValue" className="font-bold text-gray-200">{hexValue}</span></p>
                <div
                  id="colorSwatch"
                  className="w-16 h-16 border-2 border-gray-400 rounded-full mx-auto shadow-inner"
                  style={{ backgroundColor: colorSwatchColor }}
                ></div>
              </div>

              {/* Message display area for color capture */}
              <div id="messageBox" className={messageBoxClasses} role="alert">
                {currentStatusMessage}
              </div>
            </CardContent>
          </Card>
        )}
      
        {/* Game Mode Selection */}
        <Card className="p-6 bg-card neon-border border-secondary/30 data-stream">
          <h2 className="text-2xl text-secondary neon-glow mb-2 text-center flicker">ACCESS PROTOCOL</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={gameMode === "play" ? "default" : "outline"}
              onClick={() => setGameMode("play")}
              className={`h-20 flex flex-col gap-2 hologram ${gameMode === "play" ? "bg-primary text-primary-foreground neon-glow" : "border-primary/30 hover:border-primary/60"}`}
            >
              <Zap className="w-6 h-6" /> COMBAT
            </Button>
            <Button
              variant={gameMode === "spectate" ? "default" : "outline"}
              onClick={() => setGameMode("spectate")}
              className={`h-20 flex flex-col gap-2 hologram ${gameMode === "spectate" ? "bg-accent text-accent-foreground neon-glow" : "border-accent/30 hover:border-accent/60"}`}
            >
              <Eye className="w-6 h-6" /> OBSERVE
            </Button>
          </div>
        </Card>

        {/* Join/Create/Spectate Actions */}
        {gameMode === "play" && (
          <Card className="p-6 bg-card neon-border border-[color:var(--neon-pink)]/30 scan-line space-y-3">
            <Button onClick={createGame} disabled={!playerName.trim() || !hasCapturedColor} className="w-full h-14 bg-primary text-primary-foreground neon-glow flex items-center gap-3">
              <Plus className="w-5 h-5" /> CREATE ARENA
            </Button>
            <Input
              placeholder="Enter Game ID to join"
              value={gameId}
              onChange={(e) => setGameId(e.target.value.toUpperCase())}
              className="text-center text-lg font-bold text-primary placeholder:text-muted-foreground scan-line"
            />
            <Button onClick={joinGame} disabled={!playerName.trim() || !gameId.trim() || !hasCapturedColor} variant="secondary" className="w-full h-14 neon-glow flex items-center gap-3 hologram">
              <Search className="w-5 h-5" /> JOIN BATTLE
            </Button>
          </Card>
        )}

        {gameMode === "spectate" && (
          <Card className="p-6 bg-card neon-border border-accent/30 flicker space-y-3">
            <Input
              placeholder="Enter Game ID to spectate"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className="text-center text-lg font-bold text-accent placeholder:text-muted-foreground scan-line"
            />
            <Button onClick={spectateGame} disabled={!gameId.trim()} className="w-full h-14 bg-accent text-accent-foreground neon-glow flex items-center gap-3 scan-line">
              <Eye className="w-5 h-5" /> ENTER SURVEILLANCE
            </Button>
          </Card>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div className={`text-center text-sm font-bold ${statusType === "info" ? "text-cyan-400" : statusType === "success" ? "text-green-400" : "text-red-500"} neon-glow`}>
            {statusMessage}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 px-4">
        <div className="text-xs text-muted-foreground data-stream">
          SYSTEM STATUS: <span className="text-primary neon-glow font-bold flicker">ONLINE</span>
        </div>
      </footer>
    </div>
  );
}

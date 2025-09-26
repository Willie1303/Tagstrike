/*
  Jan-Willem Greyvenstein: 2023256304
  Tumelo Kasumba: 2023738970
*/

"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getWebSocket } from "@/lib/websocket";
import { useGameStore } from "@/lib/store";
import { Copy } from "lucide-react";

export default function LobbyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameId = params.id as string;
  const playerName = searchParams.get("name") || "Anonymous";
  const websocket = getWebSocket();

  const [shootId, setShootId] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);

  const { players, setCurrentPlayer, setGameId } = useGameStore();

  useEffect(() => {
    websocket.emit("getRoomInfo", gameId);

    const handleUpdateRoom = (playersFromServer: typeof players) => {
      useGameStore.getState().setPlayers(playersFromServer);

      for (const player of playersFromServer) {
        if (player.id === websocket.getId() && player.isHost !== undefined) {
          setIsHost(player.isHost);
          setCurrentPlayer(player);
          setGameId(gameId);
          setShootId(player.shotId);
        }
      }
    };

    const readyUp = (gameId: string) => {
      setTimeout(() => {
        router.push(`/game/${gameId}`);
      }, 3000);
    };

    websocket.on("readyUp", readyUp);
    websocket.on("updateRoom", handleUpdateRoom);

    return () => {
      websocket.off("updateRoom", handleUpdateRoom);
      websocket.off("readyUp", readyUp);
    };
  }, [gameId, playerName]);

  const copyGameId = async () => {
    try {
      await navigator.clipboard.writeText(gameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy game ID");
    }
  };

  const startGame = () => {
    if (isHost && players.length >= 1) {
      websocket.emit("startGame", gameId);
    }
  };

  const canStart = isHost && players.length >= 1;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-primary neon-glow">GAME LOBBY</h1>
            <p className="text-xs text-muted-foreground">Mode: Free For All Deathmatch</p>
          </div>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-md space-y-6">
        {/* Game Info */}
        <Card className="p-4 bg-card neon-border border-primary/30">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-bold text-primary neon-glow">NEON ARENA ALPHA</h2>
            <div className="flex justify-center gap-4 text-sm">
              <span className="text-[color:var(--neon-cyan)]">Mode: Free For All Deathmatch</span>
              <span className="text-[color:var(--neon-lime)]">Duration: 10 min</span>
            </div>
            {/* Game ID Display */}
            <div className="mt-2 flex justify-center items-center gap-2 text-sm">
              <span className="text-[color:var(--neon-orange)] font-bold neon-glow">
                Game ID: {gameId}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={copyGameId}
                className="h-6 w-6 p-0 flex items-center justify-center"
              >
                <Copy className="w-4 h-4 text-primary" />
              </Button>
              {copied && (
                <span className="text-[color:var(--neon-cyan)] text-xs neon-glow">
                  Copied!
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Players List */}
        <Card className="p-4 bg-card">
          <h3 className="font-bold text-secondary neon-glow mb-4">
            PLAYERS ({players.length}/8)
          </h3>
          <div className="space-y-3">
            {players.map((player, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      player.name ? "bg-primary neon-glow" : "bg-muted-foreground"
                    }`}
                  />
                  <span
                    className={`font-medium ${
                      player.isHost
                        ? "text-[color:var(--neon-orange)] neon-glow"
                        : "text-foreground"
                    }`}
                  >
                    {player.name}
                    {player.isHost && " (HOST)"}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold ${
                    player.name ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {player.name ? "READY" : "NOT READY"}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center text-gray-400 text-xs">
          <p>Game Rules:</p>
          <p>• Click "Fire" targets to shoot</p>
          <p>• Randomly assigned power-ups increase damage, restore health or aquire shields</p>
        </div>
        </Card>

        {/* Ready Button */}
        {canStart && (
        <Button
          onClick= {startGame}
          className="w-full h-14 bg-primary hover:bg-primary/80 text-primary-foreground neon-glow"
        >
          <span className="font-bold text-lg">READY UP</span>
        </Button>
        )}

        {!canStart && !isHost && (
            <div className="w-full h-14 bg-primary hover:bg-primary/80 text-primary-foreground neon-glow">
              <span className="font-bold text-lg">WAITING FOR HOST TO START GAME...</span>
            </div>
          )}

          {!canStart && isHost && players.length < 2 && (
            <div className="w-full h-14 bg-primary hover:bg-primary/80 text-primary-foreground neon-glow">Need at least 2 players to start</div>
          )}
      </main>
    </div>
  );
}

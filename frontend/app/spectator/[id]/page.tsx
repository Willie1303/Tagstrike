/*
  Jan-Willem Greyvenstein: 2023256304
  Tumelo Kasumba: 2023738970
*/

"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Users, Eye, Clock, Heart } from "lucide-react"
import { getWebSocket } from "@/lib/websocket"
import { useParams, useRouter } from "next/navigation"
import { useGameStore } from "@/lib/store"

export default function SpectatorPage() {
  const params = useParams()
  const gameId = params.id as string
  const router = useRouter();
  const webSocket = getWebSocket();

  const { players, gameTime, setPlayers, setGameTime } = useGameStore();
  const [socket, setSocket] = useState<ReturnType<typeof getWebSocket> | null>(null)
  const [playerStreams, setPlayerStreams] = useState<Record<string, MediaStream>>({})
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({})
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const processingOffers = useRef<Set<string>>(new Set())
  const streamAssigned = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!gameId) return;

    const ws = getWebSocket();
    setSocket(ws);

    console.log("Spectator connecting to game:", gameId);

    ws.emit("spectate", { gameID: gameId }, (res) => {
      if (!res.success) {
        console.error("Failed to join as spectator:", res.message);
        return;
      }

      console.log("Joined as spectator");
      ws.emit("spectatorJoin", { gameId });
    });

    const peerConnectionsRef = peerConnections.current;

    const handleOfferFromPlayer = async ({ offer, from: playerId }: { offer: RTCSessionDescriptionInit; from: string }) => {
      console.log("📨 Offer received from:", playerId, "Offer type:", offer.type)

      if (processingOffers.current.has(playerId)) {
        console.log("⏳ Already processing offer for", playerId)
        return
      }
      processingOffers.current.add(playerId)

      try {
        let pc = peerConnectionsRef[playerId] || createPeerConnection(playerId)

        console.log("🔄 Peer connection state:", pc.signalingState)

        if (pc.signalingState !== "stable" && pc.signalingState !== "have-local-offer") {
          console.log("🔄 Resetting peer connection due to state:", pc.signalingState)
          pc.close()
          delete peerConnectionsRef[playerId]
          pc = createPeerConnection(playerId)
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        console.log("✅ Remote description set for", playerId)

        if (pc.signalingState === "have-remote-offer") {
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          console.log("📤 Sending answer to", playerId)

          ws.emit("webrtcAnswer", {
            to: playerId,
            sdp: answer,
          })
        } else {
          console.log("⚠️ Unexpected signaling state after setting remote description:", pc.signalingState)
        }
      } catch (err) {
        console.error("❌ Error handling offer from", playerId, err)
      } finally {
        processingOffers.current.delete(playerId)
      }
    }

    const createPeerConnection = (playerId: string) => {
      if (peerConnectionsRef[playerId]) {
        console.log("🔄 Closing existing peer connection for", playerId)
        peerConnectionsRef[playerId].close()
        delete peerConnectionsRef[playerId]
      }

      console.log("🆕 Creating new peer connection for", playerId)
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      })

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("🧊 Sending ICE candidate to", playerId)
          ws.emit("webrtcCandidate", {
            to: playerId,
            candidate: event.candidate,
          })
        } else {
          console.log("🧊 ICE gathering complete for", playerId)
        }
      }

      pc.ontrack = (event) => {
        console.log(`📡 Received track from ${playerId}:`, {
          kind: event.track.kind,
          enabled: event.track.enabled,
          readyState: event.track.readyState,
          streamsCount: event.streams?.length || 0
        })

        const stream = event.streams?.[0]
        if (!stream) {
          console.warn(`⚠️ No stream received from ${playerId}`)
          return
        }

        const videoTracks = stream.getVideoTracks()
        
        console.log(`📹 Stream details for ${playerId}:`, {
          videoTracks: videoTracks.length,
          videoEnabled: videoTracks.map(t => t.enabled),
          videoReadyState: videoTracks.map(t => t.readyState),
          streamId: stream.id
        })

        if (videoTracks.length === 0) {
          console.warn(`⚠️ No video tracks in stream from ${playerId}`)
          return
        }

        setPlayerStreams((prev) => {
          if (prev[playerId] === stream) {
            return prev;
          }
          console.log(`🎬 Adding stream for ${playerId}`)
          return {
            ...prev,
            [playerId]: stream,
          }
        })

        const videoEl = videoRefs.current[playerId]
        if (videoEl) {
          console.log(`🎥 Setting srcObject directly for ${playerId}`)
          videoEl.srcObject = stream
          videoEl.play().catch(err => console.error('Direct play failed:', err))
        }
      }

      pc.onconnectionstatechange = () => {
        console.log(`🔌 Connection state (${playerId}):`, pc.connectionState)
        if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
          console.log(`🔌 Removing stream for disconnected player ${playerId}`)
          setPlayerStreams((prev) => {
            const newStreams = { ...prev }
            delete newStreams[playerId]
            streamAssigned.current.delete(playerId)
            return newStreams
          })
        }
      }

      pc.oniceconnectionstatechange = () => {
        console.log(`🧊 ICE connection state (${playerId}):`, pc.iceConnectionState)
      }

      peerConnectionsRef[playerId] = pc
      return pc
    }

    const handleWebRTCCandidate = async ({ candidate, from: playerId }: { candidate: RTCIceCandidateInit; from: string }) => {
      const pc = peerConnectionsRef[playerId]
      if (pc?.remoteDescription && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (err) {
          console.error("Failed to add ICE candidate from", playerId, err)
        }
      } else {
        console.log("no Candidate")
      }
    }

    const handlePlayerDisconnected = ({ playerId }: { playerId: string }) => {
      const pc = peerConnectionsRef[playerId]
      if (pc) pc.close()
      delete peerConnectionsRef[playerId]
      setPlayerStreams((prev) => {
        const copy = { ...prev }
        delete copy[playerId]
        return copy
      })
    }

    ws.on("offerFromPlayer", handleOfferFromPlayer)
    ws.on("webrtcCandidate", handleWebRTCCandidate)
    ws.on("playerDisconnected", handlePlayerDisconnected)

    return () => {
      Object.values(peerConnectionsRef).forEach((pc) => pc?.close())
      Object.keys(peerConnectionsRef).forEach((k) => delete peerConnectionsRef[k])
      processingOffers.current.clear()
      setPlayerStreams({})
      ws.off("offerFromPlayer", handleOfferFromPlayer)
      ws.off("webrtcCandidate", handleWebRTCCandidate)
      ws.off("playerDisconnected", handlePlayerDisconnected)
    }
  }, [gameId])

  // Fetch player data every two seconds
  useEffect(() => {
    if (!gameId) return

    const interval = setInterval(() => {
      webSocket.emit(
        'getRoomInfo',
        gameId,
        (res: { success?: boolean; activePlayers?: any[]; error?: string }) => {
          if (res.error) {
            console.error('Failed to fetch room info:', res.error)
            return
          }
          if (res.success && Array.isArray(res.activePlayers)) {
            setPlayers(res.activePlayers)
          }
        }
      )
    }, 2_000)

    return () => clearInterval(interval)
  }, [gameId, webSocket, setPlayers])
  
  webSocket.on('updateTimer', (timerVal) => {
    setGameTime(timerVal);
  });
  
  webSocket.on('endSession', () => router.push(`/stats`));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const alivePlayers = players.filter((p) => p.isAlive)
  const deadPlayers = players.filter((p) => !p.isAlive)

  // If we have player streams, show the appropriate view
  if (Object.keys(playerStreams).length > 0) {
    // Single player fullscreen view
    if (selectedPlayer) {
      const stream = playerStreams[selectedPlayer];
      const player = players.find(p => p.id === selectedPlayer);
      
      if (stream && player) {
        return (
          <div className="min-h-screen flex flex-col bg-black">
            {/* Fullscreen Header */}
            <header className="bg-black/80 backdrop-blur-md border-b border-gray-600 p-2 z-10 absolute top-0 left-0 right-0">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={()=> window.location.reload()}
                  className="text-white hover:text-gray-300 text-sm"
                >
                  ← Back to Multi-View
                </Button>
                <div className="text-center">
                  <h1 className="text-sm font-bold text-white">{player.name}</h1>
                  <p className="text-xs text-gray-300">Player View</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-white">
                  <Heart className="w-3 h-3 text-red-500" />
                  <span>{player.health}</span>
                  <span className="ml-2 text-[color:var(--neon-lime)]">{player.score} pts</span>
                </div>
              </div>
            </header>

            {/* Fullscreen Video */}
            <main className="flex-1 relative">
              <video 
                ref={el => {
                  if (el && stream && el.srcObject !== stream) {
                    el.srcObject = stream
                    el.muted = true
                    el.playsInline = true
                    el.autoplay = true
                    el.controls = false
                    el.play().catch(err => console.error('Fullscreen play failed:', err))
                  }
                }}
                className="w-full h-full object-cover"
                onError={(e) => console.error(`🚫 Fullscreen video error for ${selectedPlayer}:`, e)}
              />

              {/* Fullscreen HUD Overlay */}
              <div className="absolute inset-0 pointer-events-none z-10">
                {/* Crosshair */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-2 border-[color:var(--neon-cyan)]/70">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-[color:var(--neon-cyan)] rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Corner brackets */}
                <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[color:var(--neon-cyan)] opacity-70"></div>
                <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[color:var(--neon-cyan)] opacity-70"></div>
                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[color:var(--neon-cyan)] opacity-70"></div>
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[color:var(--neon-cyan)] opacity-70"></div>

                {/* Status text */}
                <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
                  <div className="text-sm font-bold text-[color:var(--neon-lime)] bg-black/70 px-3 py-2 rounded">
                    SPECTATING: {player.name.toUpperCase()}
                  </div>
                </div>

                {/* Player Stats - Bottom Left */}
                <div className="absolute bottom-4 left-4">
                  <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center gap-4 text-white text-sm">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className={player.isAlive ? "text-green-400" : "text-red-400"}>{player.health}</span>
                        <span className="text-gray-400">HP</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-[color:var(--neon-lime)]">{player.score}</span>
                        <span className="text-gray-400">PTS</span>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-bold ${
                        player.isAlive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}>
                        {player.isAlive ? "ALIVE" : "ELIMINATED"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time - Bottom Right */}
                <div className="absolute bottom-4 right-4">
                  <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center gap-2 text-white text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(gameTime)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Eliminated Overlay */}
              {!player.isAlive && (
                <div className="absolute inset-0 bg-red-900/30 flex items-center justify-center z-20">
                  <div className="bg-black/80 p-6 rounded-lg text-center">
                    <div className="text-red-400 font-bold text-2xl mb-2">PLAYER ELIMINATED</div>
                    <div className="text-white text-sm">This player is no longer active in the game</div>
                  </div>
                </div>
              )}
            </main>
          </div>
        );
      }
    }

    // Multi-camera grid view
    return (
      
      <div className="min-h-screen flex flex-col bg-background">
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
              <h1 className="text-lg font-bold text-accent neon-glow">OBSERVATION</h1>
              <p className="text-xs text-muted-foreground">Live Spectator View - Click any player to focus</p>
            </div>
            <Badge variant="outline" className="text-yellow-400 border-yellow-400">{gameId}</Badge>
          </div>
        </header>

        {/* Multi-Camera Grid */}
        <main className="flex-1 p-2 overflow-auto">
          <div className="grid grid-cols-2 gap-2 h-full">
            {Object.entries(playerStreams).map(([playerId, stream]) => {
              const player = players.find(p => p.id === playerId);
              return (
                <div 
                  key={playerId} 
                  className="relative bg-card rounded-lg overflow-hidden border border-border cursor-pointer hover:border-accent transition-colors"
                  onClick={() => setSelectedPlayer(playerId)}
                >
                  {/* Camera Feed */}
                  <video 
                    ref={el => {
                      videoRefs.current[playerId] = el
                      if (el && stream && !streamAssigned.current.has(playerId)) {
                        el.srcObject = stream
                        streamAssigned.current.add(playerId)
                        el.muted = true
                        el.playsInline = true
                        el.autoplay = true
                        el.controls = false
                        el.style.backgroundColor = '#1f2937'
                      }
                    }}
                    className="w-full h-full object-cover"
                    onError={(e) => console.error(`🚫 Video error for ${playerId}:`, e)}
                  />

                  {/* Click to expand indicator */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
                    Click to expand
                  </div>

                  {/* Player Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                    {/* Status Indicator */}
                    <div className="absolute top-2 right-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          player?.isAlive ? "bg-[color:var(--neon-lime)]" : "bg-red-500"
                        } animate-pulse`}
                      ></div>
                    </div>

                    {/* Crosshair Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative">
                        <div className="w-8 h-8 border border-[color:var(--neon-cyan)]/50">
                          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-[color:var(--neon-cyan)] transform -translate-x-1/2 -translate-y-1/2"></div>
                        </div>
                      </div>
                    </div>

                    {/* Player Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white">{player?.name || 'Unknown'}</div>
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-500" />
                            <span className="text-red-400">{player?.health || 0}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[color:var(--neon-lime)]">{player?.score || 0}</div>
                          <div className="text-white/70">pts</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Eliminated Overlay */}
                  {!player?.isAlive && (
                    <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
                      <div className="text-red-400 font-bold text-sm">ELIMINATED</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Live Stats Bar */}
          <div className="mt-4 bg-card/80 backdrop-blur-md rounded-lg p-3 border border-border">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[color:var(--neon-lime)] rounded-full animate-pulse"></div>
                  <span className="text-[color:var(--neon-lime)]">Alive: {alivePlayers.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-400">Eliminated: {deadPlayers.length}</span>
                </div>
              </div>
              <div className="text-muted-foreground">Match Time: {formatTime(gameTime)}</div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Default view when no streams are available
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/80">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-md border-b border-border p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-accent neon-glow">SPECTATOR MODE</h1>
            <p className="text-xs text-muted-foreground">Waiting for streams...</p>
          </div>
          <Badge variant="outline" className="text-[color:var(--neon-orange)] border-[color:var(--neon-orange)]">{gameId}</Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-md">
        <div className="space-y-6">
          {/* Game Status */}
          <Card className="p-4 bg-card/80 backdrop-blur-sm border border-border neon-border">
            <div className="text-center mb-4">
              <h3 className="font-bold text-primary neon-glow">GAME STATUS</h3>
              <div className="flex items-center justify-center gap-4 mt-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[color:var(--neon-cyan)]" />
                  <span className="text-foreground">{formatTime(gameTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[color:var(--neon-lime)]" />
                  <span className="text-foreground">{alivePlayers.length} alive</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Leaderboard */}
          <Card className="p-4 bg-card/80 backdrop-blur-sm border border-border neon-border">
            <h3 className="font-bold text-secondary neon-glow mb-4">LEADERBOARD</h3>
            <div className="space-y-3">
              {[...players].sort((a, b) => b.score - a.score).map((player, index) => (
                <div key={player.id} className={`p-3 bg-muted rounded-lg border ${player.isAlive ? "border-[color:var(--neon-lime)]/30" : "border-red-500/30"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-primary font-bold text-lg neon-glow">#{index + 1}</div>
                      <div>
                        <div className="font-medium text-foreground">{player.name}</div>
                        <div className="flex gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-500" />
                            <span className={player.isAlive ? "text-[color:var(--neon-lime)]" : "text-red-400"}>{player.health}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-[color:var(--neon-orange)]" />
                            <span className="text-[color:var(--neon-orange)]">{player.score}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={player.isAlive ? "default" : "destructive"} 
                      className={`text-xs ${player.isAlive ? "bg-[color:var(--neon-lime)]/20 text-[color:var(--neon-lime)] border-[color:var(--neon-lime)]" : "bg-red-500/20 text-red-400 border-red-500"}`}
                    >
                      {player.isAlive ? "ALIVE" : "ELIMINATED"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Game Stats */}
          <Card className="p-4 bg-card/80 backdrop-blur-sm border border-border neon-border">
            <h3 className="font-bold text-accent neon-glow mb-4">GAME STATS</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg border border-[color:var(--neon-lime)]/30">
                <div className="text-2xl font-bold text-[color:var(--neon-lime)] neon-glow">{alivePlayers.length}</div>
                <div className="text-muted-foreground text-sm">Players Alive</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg border border-red-500/30">
                <div className="text-2xl font-bold text-red-400">{deadPlayers.length}</div>
                <div className="text-muted-foreground text-sm">Eliminated</div>
              </div>
            </div>
          </Card>

          {/* Waiting Status */}
          <div className="text-center p-4 bg-card/50 rounded-lg border border-[color:var(--neon-cyan)]/30">
            <Eye className="w-8 h-8 text-[color:var(--neon-cyan)] mx-auto mb-2 animate-pulse" />
            <p className="text-foreground font-medium">Waiting for player streams...</p>
            <p className="text-muted-foreground text-sm mt-1">Camera feeds will appear here when available</p>
          </div>
        </div>
      </main>
    </div>
  )
}
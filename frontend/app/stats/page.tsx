/*
  Jan-Willem Greyvenstein: 2023256304
  Tumelo Kasumba: 2023738970
*/

"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useGameStore } from "@/lib/store"
import { Trophy, Medal, Zap, Heart, Home, RotateCcw } from "lucide-react"
import { getWebSocket } from "@/lib/websocket"

export default function ResultsPage() {
  
  const params = useParams()
  const router = useRouter()
  const gameId = params.id as string
  const webSocket = getWebSocket();
  const { players, setPlayers, resetGame } = useGameStore()
  
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


  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
  const winner = players.length > 0
  ? [...players].sort((a, b) => b.score - a.score)[0]
  : { name: "No one", score: 0, health: 0 }


  const playAgain = () => {
    resetGame()
    router.push("/")
  }


  const goHome = () => {
    resetGame()
    router.push("/")
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary neon-glow">BATTLE COMPLETE</h1>
          <p className="text-sm text-muted-foreground">Match Statistics</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-md">
        <div className="space-y-6">
          {/* Victory Banner */}
          <Card className="p-6 bg-card neon-border border-primary/30 text-center">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-primary neon-glow pulse-neon">VICTORY!</h2>
              <p className="text-lg text-[color:var(--neon-cyan)] neon-glow">
                    {winner?.name ?? "No one"} WINS
              </p>
              <div className="flex justify-center gap-6 mt-4">
                <div className="text-center">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>{winner.score}</span>
                  <div className="text-xs text-[color:var(--neon-cyan)]">Points</div>
                </div>
                <div className="text-center">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span>{winner.health}</span>
                  <div className="text-xs text-[color:var(--neon-magenta)]">HP</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Match Statistics */}
          <Card className="p-6 bg-card">
            <h3 className="font-bold text-secondary neon-glow mb-4">MATCH SUMMARY</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-bold text-primary neon-glow">{players.length}</div>
                <div className="text-xs text-muted-foreground">TOTAL PLAYERS</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-bold text-accent neon-glow">{players.filter((p) => p.isAlive).length}</div>
                <div className="text-xs text-muted-foreground">SURVIVORS</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-bold text-secondary neon-glow">{Math.max(...players.map((p) => p.score), 0)}</div>
                <div className="text-xs text-muted-foreground">HIGH SCORE</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-bold text-[color:var(--neon-orange)] neon-glow">
                  {gameId}
                </div>
                <div className="text-xs text-muted-foreground">ARENA ID</div>
              </div>
            </div>
          </Card>

          {/* Final Leaderboard */}
        <Card className="mb-6 bg-black/20 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Final Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index === 0
                      ? "bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-600/50"
                      : index === 1
                        ? "bg-gradient-to-r from-gray-700/30 to-gray-600/30 border border-gray-500/50"
                        : index === 2
                          ? "bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-600/50"
                          : "bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700">
                      {index === 0 && <Trophy className="w-4 h-4 text-yellow-400" />}
                      {index === 1 && <Medal className="w-4 h-4 text-gray-400" />}
                      {index === 2 && <Medal className="w-4 h-4 text-orange-400" />}
                      {index > 2 && <span className="text-white text-sm font-bold">#{index + 1}</span>}
                    </div>
                    <div>
                      <div className="text-white font-medium">{player.name}</div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-yellow-500" />
                          <span className="text-yellow-400">{player.score}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-red-500" />
                          <span className={player.isAlive ? "text-green-400" : "text-red-400"}>{player.health}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge variant={player.isAlive ? "default" : "destructive"} className="text-xs">
                    {player.isAlive ? "Survived" : "Eliminated"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

          {/* Match Info */}
          <Card className="p-4 bg-card">
            <h3 className="font-bold text-[color:var(--neon-lime)] neon-glow mb-3">MATCH DETAILS</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="text-foreground font-medium">5 Minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode:</span>
                <span className="text-foreground font-medium">Free For All Deathmatch</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Arena:</span>
                <span className="text-foreground font-medium">Neon Facility Alpha</span>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={playAgain}
              className="w-full h-12 bg-primary hover:bg-primary/80 text-primary-foreground neon-glow"
            >
              PLAY AGAIN
            </Button>
            <Button onClick={resetGame} variant="secondary" className="w-full h-12 neon-glow">
              RETURN TO MENU
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

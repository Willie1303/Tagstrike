import { useEffect,useState } from 'react'
import { useNavigate } from "react-router-dom"
import { getWebSocket } from "@/../../frontend/"

type UserProps = {
  userId: number
}

function User({ userId }: UserProps)
{
    //Picture of colour for Computer Vision
    //generate shootId too
    //Join a match
        //As a player
        //As a spectator
    //Create a match
    const handleJoinGame = () => {
        console.log("Join Game button clicked");

        // TODO: Add join game logic (e.g., open modal or call API)
    }

    const handleCreateGame = () => {
        console.log("Create Game button clicked")
        const createGame = async () => {
    if (!playerName.trim() || !hasCapturedColor || hexValue === '---') {
      updateStatusMessage("Please enter your name and capture your shirt color first.", 'info');
      return; // Ensure color is captured
    }

    try {
      console.log("Attempting to emit 'create' with payload:", { playerName, shirtColor: hexValue });
      void webSocket.emit("create", { playerName: playerName, shirtColor: hexValue }); // Explicitly void the emit call

      const roomID = await new Promise<string>((resolve) => {
          webSocket.once("sendRoom", (room:string) => {
            console.log("Received room from server:", room);
            resolve(room);
          });
      });

      console.log("Navigating to lobby with roomID:", roomID);
      router.push(`/lobby/${roomID}?name=${encodeURIComponent(playerName)}&host=true`)
    } catch (error: any) {
      console.error("Error creating game:", error);
      updateStatusMessage(`Failed to create game: ${error.message || 'Unknown error'}`, 'error');
    }
  }
        // TODO: Add create game logic (e.g., redirect or call API)
    }
    //History

    //Friend groups

        useEffect(() => {
    document.title = "Tagstrike - Home"
  }, [])
    return(
        <div>
            <h1>Hello {userId //Username instead
             }</h1> 
            
            <div>
                <button className="btn btn-success me-2" onClick={handleJoinGame}>
                Join Game
                </button>
                <button className="btn btn-info" onClick={handleCreateGame}>
                Create Game
                </button>
            </div>
        </div>
    )
}

export default User
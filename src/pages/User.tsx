import { useEffect,useState } from 'react'
import { useNavigate } from "react-router-dom"

type UserProps = {
  userId: number
}

function User({ userId }: UserProps)
{
    //instatiation of socket
    
    //Picture of colour for Computer Vision
    //generate shootId too
    //Join a match
        //As a player
        //As a spectator
    //Create a match
    const handleCreateGame = () => {
        console.log("Create Game button clicked");

        // TODO: Add join game logic (e.g., open modal or call API)
    }

    const handleJoinGame = () => {
        console.log("Join Game button clicked");

        // TODO: Add join game logic (e.g., open modal or call API)
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
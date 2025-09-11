import { useEffect,useState } from 'react'
import { useNavigate } from "react-router-dom"

type UserProps = {
  userId: number
}

function User({ userId }: UserProps)
{
    //Join a match
        //As a player
        //As a spectator
    //Create a match

    //History

    //Friend groups

        useEffect(() => {
    document.title = "Tagstrike - Home"
  }, [])
    return(
        <div>
            <h1>Hello {userId //Username instead
             }</h1> 
            
        </div>
    )
}

export default User
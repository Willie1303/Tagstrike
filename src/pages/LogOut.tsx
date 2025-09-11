import { useEffect,useState } from 'react'
import { useNavigate } from "react-router-dom"

type LogoutProps = {
  userId: number
  setLoggedIn: (value: boolean) => void
  setUserID: (id: number) => void
}

function LogOut({ userId,setLoggedIn,setUserID }: LogoutProps)
{
     const navigate = useNavigate()
        useEffect(() => {
    document.title = "Tagstrike - Logout"
    setLoggedIn(false)
    setUserID(0)
    navigate("/")
  }, [])
    return(

        <div>
            <h1>Logout {userId}</h1>
        </div>
    )
}

export default LogOut
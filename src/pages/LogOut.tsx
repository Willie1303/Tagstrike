import { useEffect,useState } from 'react'
import { useNavigate } from "react-router-dom"

type LogoutProps = {
  userId: number | null;
  setLoggedIn: (value: boolean) => void
  setUserID: (id: number | null) => void
}

function LogOut({ userId,setLoggedIn,setUserID }: LogoutProps)
{
     const navigate = useNavigate()
        useEffect(() => {
    document.title = "Tagstrike - Logout"
    setLoggedIn(false)
    setUserID(null)
    localStorage.removeItem("userID");
    navigate("/")
  }, [])
    return(

        <div>
            <h1>Logout {userId}</h1>
        </div>
    )
}

export default LogOut
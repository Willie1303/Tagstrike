import { useEffect } from 'react' //useEffect to make changes on loading page
import { useNavigate } from "react-router-dom" //useNavigate is used to navigate between page

type LogoutProps = { //Logout props to logout user in App.tsx
  userId: number | null; //UserID
  setLoggedIn: (value: boolean) => void //Set whether user is logged in or not
  setUserID: (id: number | null) => void //Set UserID in App.tsx
}

function LogOut({ userId,setLoggedIn,setUserID }: LogoutProps)
{
     const navigate = useNavigate() //Creation of useNavigate() object
        useEffect(() => { //useEffect to immediatelty logout user
    document.title = "Tagstrike - Logout" //Title of page
    setLoggedIn(false) //Sets user to not loggged in
    setUserID(null) //Sets current user id to null
    localStorage.removeItem("userID"); //Remove the userid stored in local storage
    navigate("/") //Navigate to guest spectate
  }, []) 
    return(

        <div>
            <h1>Logout {userId}</h1> {/* Show which user is being logged out */}
        </div>
    )
}

export default LogOut
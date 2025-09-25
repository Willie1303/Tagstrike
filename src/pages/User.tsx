import { useEffect,useState } from 'react' //useEffect to make changes on loading page //useState for react hooks for dynamic changes to variables
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; //Import FontAwesome library to use icons
import { faHammer,faPlus } from '@fortawesome/free-solid-svg-icons'; // Import selected icons
import { useNavigate } from "react-router-dom" //useNavigate is used to navigate between pages

//UserProps to enfforce input of user id
type UserProps = {
  userId: number | null //UserID is either a value or noting
}




function User({ userId }: UserProps)
{
    const [Username,setUsername] = useState("") //React hook for setting username
    const [LobbyID,setLobbyID] = useState("") //React hook for setting Lobby ID
    const navigate = useNavigate() //Creation of useNavigate object
    //Create a match
    const HandleCreateMatchSubmit = async (e:React.FormEvent)=> //HandleCreateMatchSubmit to handle creating a match for the user to join
    {
        e.preventDefault() //Prevents default of form event
        navigate("/createMatch",{ state: { userId: userId } }) //Navigate to CreateMatch component with state of user id
    }

    //Join a match
    const HandleJoinMatchSubmit = async (e:React.FormEvent)=> //HandleJoinMatchSubmit to handle creating a match for the user to join
    {
        e.preventDefault() //Prevents default of form event
        const res = await fetch(`http://localhost:3000/api/getMatchID/${LobbyID}`); //GET request for obtaining match id from lobby id
        var data = await res.json() //Make json out of response
        const Match_ID = data.match_id //Get match_id from data
    const result = await fetch("http://localhost:3000/api/joinMatch", { //POST request to join a user to a selected match
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ //body of match id and user id
        matchID: Match_ID, 
        userID: userId,
     }),
    });
    data = await result.json() //Make json out of response

    const joined_match = data.match_joined //get boolean value whether user joined match or not

    if(joined_match) //User is now in the match
        {
            navigate("/matchstart",{ state: { matchId: Match_ID, matchLobbyID:LobbyID,currentPlayerId: userId} }) //Navigate to starting lobby for match
        }
    }

  useEffect(() => { //UseEffect for loading lobby
    const OnLoadUserPage = async (userId: UserProps) => {  
      const res = await fetch(`http://localhost:3000/api/getUsername/${userId.userId}`); //GET request for obtaining user's username from user id
      const data = await res.json();
      const username = data[0]?.UserUsername;
      setUsername(username);
    };

    document.title = "Tagstrike - Home"; //Set title of page to home

  if (userId !== null) { // If there is a user id
    OnLoadUserPage({ userId }); //Load page details for that specific user
  }
  }, [userId]);
    return(
        <div>
            <p className='brand-color-matrix'>Welcome {Username
             }</p>  {/* Load username*/}
            <div>
                <form onSubmit={HandleCreateMatchSubmit}> {/* Button to handle creating a match*/}
                  <button className='brand-color-matrix' type='submit'>Create a Match <FontAwesomeIcon icon={faHammer} /></button>  {/* Button to handle creating a match*/}
                </form>
                <form onSubmit={HandleJoinMatchSubmit}> {/* Button to handle joining a match*/}
                    <input id='lobbyid'  type='text' className='form-control brand-color-matrix' placeholder='Enter lobby id you want to join' onChange={e=> {setLobbyID(e.target.value.toUpperCase())}}></input>  {/* Input for lobby id that user wants to join */}
                    <button className='brand-color-matrix' type='submit'>Join Match <FontAwesomeIcon icon={faPlus} /></button> {/* Button to handle joining a match*/}
                </form>
            </div>
        </div>
    )
}

export default User //Export "User" component
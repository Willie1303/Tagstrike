import { useEffect,useState } from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHammer,faPlus } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from "react-router-dom"

type UserProps = {
  userId: number | null
}




function User({ userId }: UserProps)
{
    const [Username,setUsername] = useState("")
    const [LobbyID,setLobbyID] = useState("")
    const navigate = useNavigate()
    //Create a match
    const HandleCreateMatchSubmit = async (e:React.FormEvent)=>
    {
        e.preventDefault()
        navigate("/createMatch",{ state: { userId: userId } })
    }

    //Join a match
    const HandleJoinMatchSubmit = async (e:React.FormEvent)=>
    {
        e.preventDefault()
        const res = await fetch(`http://localhost:3000/api/getMatchID/${LobbyID}`);
        var data = await res.json()
        const Match_ID = data.match_id
        console.log(Match_ID)
    const result = await fetch("http://localhost:3000/api/joinMatch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        matchID: Match_ID, 
        userID: userId,
     }),
    });
    data = await result.json()

    const joined_match = data.match_joined

    if(joined_match)
        {
            navigate("/matchstart",{ state: { matchId: Match_ID, matchLobbyID:LobbyID,currentPlayerId: userId} })
        }
    }
        //As a player
        //As a spectator
    

    //History

    //Friend groups --optional

  useEffect(() => {
    const OnLoadUserPage = async (userId: UserProps) => {
      const res = await fetch(`http://localhost:3000/api/getUsername/${userId.userId}`);
      const data = await res.json();
      const username = data[0]?.UserUsername;
      setUsername(username);
    };

    document.title = "Tagstrike - Home";

  if (userId !== null) { // <-- only call if userId is valid
    OnLoadUserPage({ userId });
  }
  }, [userId]);
    return(
        <div>
            <p className='brand-color-matrix'>Welcome {Username
             }</p> 
            <div>
                <form onSubmit={HandleCreateMatchSubmit}>
                  <button className='brand-color-matrix' type='submit'>Create a Match <FontAwesomeIcon icon={faHammer} /></button>
                </form>
                <form onSubmit={HandleJoinMatchSubmit}>
                    <input id='lobbyid'  type='text' className='form-control brand-color-matrix' placeholder='Enter lobby id you want to join' onChange={e=> {setLobbyID(e.target.value.toUpperCase())}}></input>
                    <button className='brand-color-matrix' type='submit'>Join Match <FontAwesomeIcon icon={faPlus} /></button>
                </form>
            </div>
            
            <hr className='brand-color-matrix'/>

            <div>
                <div>
                  <p className='brand-color-matrix'>Match Statistics</p>
                </div>
                <hr className='brand-color-matrix'/>
                <div>
                  <p className='brand-color-matrix'>Match History</p>
                </div>
            </div>
        </div>
    )
}

export default User
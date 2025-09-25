import { useEffect,useState } from 'react'
import { useNavigate,useLocation } from "react-router-dom"

type UserProps = {
  userId: number | null
}

function CreateMatch()
{
  const location = useLocation();
  const state = location.state as { userId?: number } | undefined;
  const userId = state?.userId ?? null;
  const MatchCreatorID = userId || 0;
    const navigate = useNavigate()
    const [LobbyID,setLobbyID] = useState(Math.random().toString(36).slice(2).toUpperCase())
    const [TimeLimit,setTimeLimit] =useState(5)

    const HandleSubmitCreateMatch = async(e: React.FormEvent) =>
    {
        e.preventDefault()
        try {
            const now = new Date()
            const Timestamp = now.toISOString().slice(0,16).replace("T", " ") + ":00"
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        var result = await fetch("http://localhost:3000/api/createMatch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        matchLobbyID: LobbyID, 
        matchTimeLimit: TimeLimit,
        matchCreationDate: Timestamp,
        matchCreatorID: userId
     }),
    });
    var data = await result.json()

    const Match_ID = data.match_id
    result = await fetch("http://localhost:3000/api/joinMatch", {
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


        } catch (error) {
            console.log(error)
        }
    }
    useEffect(() => {
    document.title = "Tagstrike - Create Match"
  }, [])
    return(
        <>
            <div>
                <form onSubmit={HandleSubmitCreateMatch} className='form'>
                    <input id="match_creator_id"  type='text' value={MatchCreatorID} hidden></input>
                    <label htmlFor='lobby_id' className='form-label brand-color-matrix'>Lobby ID:</label>
                    <input id="lobby_id" type='text' className='form-control' readOnly value={LobbyID} onChange={e => {setLobbyID(e.target.value)} }></input>
                    <label htmlFor='match_time_limit' className='form-label brand-color-matrix'>Time Limit: {TimeLimit} minutes</label>
                    <input id="match_time_limit" type='range' className='form-range' min="3" max="30" value={TimeLimit} onChange={e => {setTimeLimit(Number(e.target.value))} }></input>
                    
                    <button className='brand-color-matrix' type='submit'>Create Match</button>
                </form>
            </div> 
        </>
    )
}

export default CreateMatch
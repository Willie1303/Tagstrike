import { useEffect,useState } from 'react' //useEffect to make changes on loading page //useState for react hooks for dynamic changes to variables
import { useNavigate,useLocation } from "react-router-dom" //useNavigate is used to navigate between pages//useLocation is used to keep state of page


function CreateMatch()
{
  const location = useLocation(); //Creation of useLocation object
  const state = location.state as { userId?: number } | undefined; // Get current location state
  const userId = state?.userId ?? null; //Get user Id from state
  const MatchCreatorID = userId || 0; //Create MatchCreator ID
    const navigate = useNavigate() //Creation of useNavigate object
    const [LobbyID,setLobbyID] = useState(Math.random().toString(36).slice(2).toUpperCase()) //React hook for random lobby id
    const [TimeLimit,setTimeLimit] =useState(5) //React hook for time limit of match

    const HandleSubmitCreateMatch = async(e: React.FormEvent) =>
    {
        e.preventDefault() //Prevent default
        try {
            const now = new Date() //Get current date
            const Timestamp = now.toISOString().slice(0,16).replace("T", " ") + ":00" //Create timestamp at current moment
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        var result = await fetch("http://localhost:3000/api/createMatch", { //POST request to create match
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
    var data = await result.json() //JSON the result

    const Match_ID = data.match_id //Get returned match id from result
    result = await fetch("http://localhost:3000/api/joinMatch", { //POST request to join a match with a match id and user id
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

    const joined_match = data.match_joined //Get whether user is joined

    if(joined_match) //If joined
        {
            navigate("/matchstart",{ state: { matchId: Match_ID, matchLobbyID:LobbyID,currentPlayerId: userId} }) //Navigate to lobby/ match start screen
        }


        } catch (error) {
            console.log(error) //Log error
        }
    }
    useEffect(() => {
    document.title = "Tagstrike - Create Match" //Set document title
  }, [])
    return(
        <>
            <div>
                <form onSubmit={HandleSubmitCreateMatch} className='form'> {/* Form for creation of match */}
                    <input id="match_creator_id"  type='text' value={MatchCreatorID} hidden></input>  {/* Input for match creator id */}
                    <label htmlFor='lobby_id' className='form-label brand-color-matrix'>Lobby ID:</label> {/* Label for match lobby id */}
                    <input id="lobby_id" type='text' className='form-control' readOnly value={LobbyID} onChange={e => {setLobbyID(e.target.value)} }></input> {/* Input for match lobby id */}
                    <label htmlFor='match_time_limit' className='form-label brand-color-matrix'>Time Limit: {TimeLimit} minutes</label> {/* Label for match time limit */}
                    <input id="match_time_limit" type='range' className='form-range' min="3" max="30" value={TimeLimit} onChange={e => {setTimeLimit(Number(e.target.value))} }></input> {/* Input for match time limit */}
                    
                    <button className='brand-color-matrix' type='submit'>Create Match</button> {/* Submit button for match creation */}
                </form>
            </div> 
        </>
    )
}

export default CreateMatch //Export "CreateMatch" component
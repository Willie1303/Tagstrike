// Tumelo Kasumba : 2023738970
// Jan-Willem Greyvenstein : 2023256304

import { useLocation,useNavigate } from "react-router-dom"; //useNavigate is used to navigate between pages//useLocation is used to keep state of page

function WinnerScreen() {
  const location = useLocation(); //Creation of useLocation object
  const navigate = useNavigate(); //Creation of useNavigate object
  const { winner, currentPlayerId } = location.state ?? { winner: "Unknown" }; //Get values of location state


  const HandleGoHome = async()=>
  { 
        navigate("/user", { 
      state: { userId: currentPlayerId, fromWinner: true },
      replace: true }); //Navigate back to user Home page
  }
  return (
    <div className="container text-center mt-5">
      <h2>{winner} is the winner!</h2> {/* Display winner */}
      <button onClick={HandleGoHome}>Go home</button> {/* Button to go back to user home page */}
    </div>
  );
}

export default WinnerScreen; //Export "WinnerScreen"

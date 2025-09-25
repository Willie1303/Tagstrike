import { useLocation,useNavigate } from "react-router-dom";

function WinnerScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { winner,currentPlayerId } = location.state ?? { winner: "Unknown" };


  const HandleGoHome = async()=>
  {
    navigate("/user", { state: { userId:currentPlayerId } })
  }
  return (
    <div className="container text-center mt-5">
      <h2>{winner} is the winner!</h2>
      <button onClick={HandleGoHome}>Go home</button>
    </div>
  );
}

export default WinnerScreen;

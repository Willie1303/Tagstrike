
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom"
import { Navbar, Nav, Container } from "react-bootstrap"
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faSignIn, faSignOut, faRegistered } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom"
import Register from './pages/Register'
import Home from './pages/Home'
import Login from "./pages/Login"
import LogOut from "./pages/LogOut"
import User from "./pages/User"
import Match from "./pages/Match"

//import tsLogo from '/TS_matrix.png'
import './App.css'
import CreateMatch from "./components/CreateMatch"
import MatchStart from "./pages/MatchStart";
import WinnerScreen from "./components/WinnerScreen";

function App() {

 const [loggedin,setLoggedIn] = useState(false)

 const [UserID,setUserID] = useState<number | null>(null)
 const [MatchID,setMatchID] = useState<number | null>(null)
 //const navigate = useNavigate()

 useEffect(()=>{
    const storedID = localStorage.getItem("userID")
    if (storedID) {
      setUserID(Number(storedID));
      setLoggedIn(true);
      const photo = null
      if(photo != null){

      }
      else
        {
          const ProfilePhotoImage = document.getElementById('profile-image')
          //ProfilePhotoImage.value
        }

        //navigate("/user")
    }
 })

  return (
    <Router>
      <div className="app-wrapper">
      <Navbar bg="dark" expand="lg" className="brand-color-matrix-navbar">
        <Container fluid className="brand-color-matrix-navbar">
          <Navbar.Brand className="brand-color-matrix" as={Link} to="/">Tagstrike</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              
              {!loggedin && (
                <>
                  <Nav.Link className="brand-color-matrix" as={Link} to="/">Home <FontAwesomeIcon icon={faHome} /></Nav.Link>
                  <Nav.Link className="brand-color-matrix" as={Link} to="/register">Register <FontAwesomeIcon icon={faRegistered} /></Nav.Link>
                  <Nav.Link className="brand-color-matrix" as={Link} to="/login">Login <FontAwesomeIcon icon={faSignIn} /></Nav.Link>
                </>
              )}
              {loggedin && (
                <>
                  <input id ="user_id" type="text" hidden />
                  
                  <Nav.Link className="brand-color-matrix" as={Link} to="/user">Home <FontAwesomeIcon icon={faHome} /></Nav.Link>
                  <Nav.Link className="brand-color-matrix" as={Link} to="/logout">Log out <FontAwesomeIcon icon={faSignOut}/> </Nav.Link>
                </>
              )}
              
            </Nav>
          </Navbar.Collapse>
        </Container>
        <img id='profile-image' height={30} width={30} alt="Profile Photo" className="rounded-circle" src="./normal_image.png"></img>
      </Navbar>
    <Container className="app-content mt-4" fluid>
      <Routes>
        <Route path='/' element={<Home/>}></Route>
        <Route path='/register' element={<Register/>}></Route>
        <Route path="/login" element={<Login setUserID={setUserID} setLoggedIn={setLoggedIn} />} />
        <Route path="/logout" element={<LogOut userId = {UserID} setLoggedIn={setLoggedIn} setUserID={setUserID}/>}></Route>
        <Route path="/user" element={<User userId = {UserID}/>}></Route>
        <Route path="/createMatch" element={<CreateMatch userId = {UserID}/>}></Route>
        <Route path="/match" element={<Match/>}></Route>
        <Route path="/matchstart" element={<MatchStart/>}></Route>
        <Route path="/winner" element={<WinnerScreen />}></Route>

      </Routes>
      </Container>
      </div>
    </Router>
  )
}

export default App

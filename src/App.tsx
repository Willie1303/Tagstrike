
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom" //Allows for navigation links in the navbar and navigation between pages.
import { Navbar, Nav, Container } from "react-bootstrap" // Components imported from react-boostrap
import { useEffect, useState } from 'react' //useEffect to make changes on loading page //useState for react hooks for dynamic changes to variables
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; //Import FontAwesome library to use icons
import { faHome, faSignIn, faSignOut, faRegistered } from "@fortawesome/free-solid-svg-icons"; //Import selected icons
import { useNavigate } from "react-router-dom" //useNavigate is used to navigate between pages
import Register from './pages/Register'//Import "Register" component
import Home from './pages/Home' //Import "Home" component
import Login from "./pages/Login" //Import "Login" component
import LogOut from "./pages/LogOut" //Import "LogOut" component
import User from "./pages/User" //Import "User" component
import Match from "./pages/Match" //Import "Match" component

//import tsLogo from '/TS_matrix.png'
import './App.css' //Import App.css stylesheet
import CreateMatch from "./components/CreateMatch" //Import "CreateMatch" component
import MatchStart from "./pages/MatchStart"; //Import "MatchStart" component
import WinnerScreen from "./components/WinnerScreen"; //Import "WinnerScreen" component

function App() {

 const [loggedin,setLoggedIn] = useState(false) //React hook for logged in

 const [UserID,setUserID] = useState<number | null>(null) //React hook for UserID
 const [MatchID,setMatchID] = useState<number | null>(null) //React hook for Match ID

 useEffect(()=>{ //UseEffect to load logging in
    const storedID = localStorage.getItem("userID") //Obtain user id from storage
    if (storedID) { //If there is a stored user id
      setUserID(Number(storedID)); //SetUSerID to sotred user id
      setLoggedIn(true); //Set logged in to true
      const photo = null //Create photo object to null
      //btain phot !!MUST do
      if(photo != null){
        //
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
      <div className="app-wrapper"> {/* Div to make div full full width */}
      <Navbar bg="dark" expand="lg" className="brand-color-matrix-navbar"> {/*Navbar for different routes */}
        <Container fluid className="brand-color-matrix-navbar"> {/* Container class for navbar */}
          <Navbar.Brand className="brand-color-matrix" as={Link} to="/">Tagstrike</Navbar.Brand> {/* Link to home page */}
          <Navbar.Toggle aria-controls="basic-navbar-nav" /> {/* Navbar toggle */}
          <Navbar.Collapse id="basic-navbar-nav"> {/* Navbar collapse */}
            <Nav className="me-auto"> {/* Nav which contains links for various pages */}
              
              {/* If there is no user logged in, default links such as "Home","Register","Login" will show */}
              {!loggedin && ( 
                <>
                  <Nav.Link className="brand-color-matrix" as={Link} to="/">Home <FontAwesomeIcon icon={faHome} /></Nav.Link> {/* Nav link for general home page with a home icon */}
                  <Nav.Link className="brand-color-matrix" as={Link} to="/register">Register <FontAwesomeIcon icon={faRegistered} /></Nav.Link> {/* Nav link for register page with a registered icon */}
                  <Nav.Link className="brand-color-matrix" as={Link} to="/login">Login <FontAwesomeIcon icon={faSignIn} /></Nav.Link> {/* Nav link for login page with a sign in icon */}
                </>
              )}
              {/* If there is no user logged in, default links such as "Home" for user and "Logout" will show */}
              {loggedin && (
                <>                  
                  <Nav.Link className="brand-color-matrix" as={Link} to="/user">Home <FontAwesomeIcon icon={faHome} /></Nav.Link> {/* Nav link for user home page with a home icon */}
                  <Nav.Link className="brand-color-matrix" as={Link} to="/logout">Log out <FontAwesomeIcon icon={faSignOut}/> </Nav.Link> {/* Nav link for logout page with a sign out icon */}
                </>
              )}
              
            </Nav>
          </Navbar.Collapse>
        </Container>
        <img id='profile-image' height={30} width={30} alt="Profile Photo" className="rounded-circle" src="./normal_image.png"></img> {/* Profile image element */}
      </Navbar>
    <Container className="app-content mt-4" fluid>
      <Routes> {/* Routes that are used for navigation */}
        <Route path='/' element={<Home/>}></Route> {/* Route for general home page*/}
        <Route path='/register' element={<Register/>}></Route> {/* Route for register page*/}
        <Route path="/login" element={<Login setUserID={setUserID} setLoggedIn={setLoggedIn} />} /> {/* Route for login page*/}
        <Route path="/logout" element={<LogOut userId = {UserID} setLoggedIn={setLoggedIn} setUserID={setUserID}/>}></Route> {/* Route for logout page*/}
        <Route path="/user" element={<User/>}></Route> {/* Route for user home page*/}
        <Route path="/createMatch" element={<CreateMatch/>}></Route> {/* Route for create match page*/}
        <Route path="/match" element={<Match/>}></Route> {/* Route for match page*/}
        <Route path="/matchstart" element={<MatchStart/>}></Route> {/* Route for match start lobby page*/}
        <Route path="/winner" element={<WinnerScreen />}></Route> {/* Route for Winner screen page*/}

      </Routes>
      </Container>
      </div>
    </Router>
  )
}

export default App //Export "App" component

import { useEffect,useState } from 'react' //useEffect to make changes on loading page //useState for react hooks for dynamic changes to variables
import { useNavigate,useLocation } from "react-router-dom" //useNavigate is used to navigate between pages //useLocation is used to keep state of page


//type LoginProps ensures when Login component is used that certain parameters are used
type LoginProps = {
  setUserID: (id: number) => void  //Set UserID
    setLoggedIn: (value: boolean) => void // SetLoggedIn
}

function Login({ setUserID,setLoggedIn }: LoginProps){
const location = useLocation();

 const [email,setEmail] = useState("") //React hook for setting email
 const [password, setPassword] = useState("") //React hook for setting password
 const navigate = useNavigate() //Creation of useNavigate() object

const HandleSubmit = async (e:React.FormEvent)=>
  {
    e.preventDefault() //Prevents default of form event
    var Successful = true //start some boolean variable set to true
    if(email != "" && password!=""){    //If email and password are not empty values 
        try { //try catch to login a user with their email and pass word
            const result = await fetch("https://tagstrike.onrender.com/api/login", { //POST request to /api/login to login user with a body of email and password and return result
                method: "POST", //Method type
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ userEmail: email, userPassword: password }), //Body
              });

            const data = await result.json(); //Create json of result
            const User = data.userId //Extract userId from data
            if(User == null) //If there is no userid, login was not successful
              {
                Successful = false
              }
        } catch (error) {
          console.error("Error logging in:", error); //Log the error
        }
        const res = await fetch(`https://tagstrike.onrender.com/api/getUserID?userEmail=${encodeURIComponent(email)}`); //GET request to /api/getUserID to get the user's id using their email
        const data = await res.json() //Create json of result
        const userid = Number(data.userId); //Extract userId from data


        if(Successful) //If login was successful
          {
            setUserID(userid) //UserID to userid
            setLoggedIn(true) //The user is logged in
            localStorage.setItem("userID", userid.toString()); //Store the user id in local
            navigate("/user",{ state: { userId: userid} }) //Navigate to user home page
          }
    }
  }

    useEffect(() => {
    document.title = "Tagstrike - Login" //Change title in tab to "Tagstrike - Home"
  }, [])
  return(
    <div>
      <h1>Login Page</h1> {/* Login heading */}
      <p className='brand-color-matrix'>Please fill in your details.</p> {/* User must fill in their details */}
      <hr className='brand-color-matrix'/> {/* Line break */}

      <form onSubmit={HandleSubmit}> {/* Form where the user submits their login details */}
        <div className="form-group">
          <label htmlFor="email" className='form-label brand-color-matrix'>Email Address</label>  {/* Label for email address */}
          <input id='email' value = {email} type='email' className='form-control' placeholder='Enter your email address' onChange={e => {setEmail(e.target.value)}}/> {/* Input for email address */}
          
          <label htmlFor="password" className='form-label brand-color-matrix'>Password</label> {/* Label for password */}
          <input id='password' value = {password} type='password' className='form-control' placeholder='Enter your password' onChange={e => {setPassword(e.target.value)}}/> {/* Input for password */}
        </div>


        <button className='btn btn-primary' type='submit'>Submit</button> {/* Button for submitting login details */}
      </form>
    </div>
  )
}

export default Login //Export component as "Login"
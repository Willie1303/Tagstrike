
import { useEffect,useState } from 'react'
import { useNavigate } from "react-router-dom"
import { Alert } from 'react-bootstrap'

function Register() {

  useEffect(() => {
    document.title = "Tagstrike - Register" //Assign title of home page
  }, [])

  const navigate = useNavigate()
  // Hooks for Email,Username, Password and Face Scan details
  const [email,setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rtpassword, setRetypePassword] = useState("")

  const [message,setMessage] = useState("")
  //var message = "";

  //HandleSubmit

  const HandleSubmit = async (e:React.FormEvent)=>
  {
    e.preventDefault()

    if(email != "" && username !="" && password!=""&& rtpassword!="")
      {
        if(password == rtpassword)
          {
            const data = {email,username,password} //Salt password here
            console.log(data)
            setMessage("Registration successful!")
            setTimeout(() => {
              navigate("/login") //Navigate to login after successful registration
            }, 1000)
          }
          else{
            setMessage("Passwords do not match")
            console.log(message)
          }
      }
      else{
        setMessage("There are empty fields")

        console.log(message)
    }

  }
    return (
    <div>
      <h1>Register Page</h1>
      <p>Please fill in your details.</p>
      {message && (
        <Alert
          variant="info"
          dismissible
          onClose={() => setMessage("")}
          className="mt-3"
        >
          {message}
        </Alert>
      )}
      <hr/>

      <form onSubmit={HandleSubmit}>
        <div>
          <label htmlFor="email">Email Address</label> 
          <input id='email' value = {email} type='email' placeholder='Enter your email address' onChange={e => {setEmail(e.target.value)}}/>
        </div>
        <div>
          <label htmlFor="username">Username</label> 
          <input id='username' value = {username} type='text' placeholder='Enter your username' onChange={e => {setUsername(e.target.value)}}/>
        </div>
        <div>
          <label htmlFor="password">Password</label> 
          <input id='password' value = {password} type='password' placeholder='Type a new password' onChange={e => {setPassword(e.target.value)}}/>
        </div>
        <div>
          <label htmlFor="retypepassword">Retype Password</label> 
          <input id='retypepassword' value={rtpassword} type='password' placeholder='Retype password' onChange={e => {setRetypePassword(e.target.value)}}/>
        </div>
        <div>
          <label htmlFor="facescan">Scan your face</label> 
          <input id='facescan' type='file' accept="image/*"/>
        </div>

        <button className='btn btn-primary' type='submit'>Submit</button>
      </form>

    </div>
  )
}

export default Register

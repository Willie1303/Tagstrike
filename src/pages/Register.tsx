
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
  const [faceScanBytes, setFaceScanBytes] = useState<File | null>(null);
  const [profilePhotoBytes, setProfilePhotoBytes] = useState<File | null>(null);

  const [message,setMessage] = useState("")
  //var message = "";


const handleFileChange = (
  event: React.ChangeEvent<HTMLInputElement>,
  setFile: React.Dispatch<React.SetStateAction<File | null>>
) => {
  const file = event.target.files?.[0];
  if (file) setFile(file);
};

  //HandleSubmit

  const HandleSubmit = async (e:React.FormEvent)=>
  {
    e.preventDefault()

    if(email != "" && username !="" && password!=""&& rtpassword!="")
      {
        if(password == rtpassword)
          {
           await fetch("http://localhost:3000/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail: email,
              userUsername:username,
              userPassword:password,
              imageFace: faceScanBytes, 
              profilePhoto: profilePhotoBytes,
            }),
    });
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
          <label htmlFor="facescan">Upload Photo of Face</label> 
          <input id='facescan' type='file' accept="image/*" onChange={(e) => handleFileChange(e, setFaceScanBytes)}/>
        </div>
        <div>
          <label htmlFor="profilephoto">Upload Profile Photo</label> 
          <input id='profilephoto' type='file' accept="image/*" onChange={(e) => handleFileChange(e, setProfilePhotoBytes)}/>
        </div>

        <button className='btn btn-primary' type='submit'>Submit</button>
      </form>

    </div>
  )
}

export default Register

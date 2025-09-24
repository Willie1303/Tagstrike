
import { useEffect,useState } from 'react'
import { useNavigate } from "react-router-dom"
import { Alert } from 'react-bootstrap'

function Register() {

  useEffect(() => {
    document.title = "Tagstrike - Register" //Assign title of home page
  }, [])

  const navigate = useNavigate()
  // Hooks for Email,Username, Password and profile photo details
  const [email,setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rtpassword, setRetypePassword] = useState("")

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
      <p className="brand-color-matrix">Please fill in your details.</p>
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
        <div className="form-group">
          <label htmlFor="email" className="brand-color-matrix form-label">Email Address</label> 
          <input id='email' className='form-control' value = {email} type='email' placeholder='Enter your email address' onChange={e => {setEmail(e.target.value)}}/>

          <label htmlFor="username" className="brand-color-matrix form-label">Username</label> 
          <input id='username' className='form-control' value = {username} type='text' placeholder='Enter your username' onChange={e => {setUsername(e.target.value)}}/>

          <label htmlFor="password" className="brand-color-matrix form-label">Password</label> 
          <input id='password' className='form-control' value = {password} type='password' placeholder='Type a new password' onChange={e => {setPassword(e.target.value)}}/>

          <label htmlFor="retypepassword" className="brand-color-matrix form-label">Retype Password</label> 
          <input id='retypepassword' className='form-control' value={rtpassword} type='password' placeholder='Retype password' onChange={e => {setRetypePassword(e.target.value)}}/>

          <label htmlFor="profilephoto" className="brand-color-matrix form-label">Upload Profile Photo</label> 
          <input id='profilephoto' className='form-control' type='file' accept="image/*" onChange={(e) => handleFileChange(e, setProfilePhotoBytes)}/>
        </div>

        <button className='btn btn-primary' type='submit'>Submit</button>
      </form>

    </div>
  )
}

export default Register

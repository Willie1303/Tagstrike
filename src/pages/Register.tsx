
// Tumelo Kasumba : 2023738970
// Jan-Willem Greyvenstein : 2023256304

import { useEffect,useState } from 'react' //useEffect to make changes on loading page //useState for react hooks for dynamic changes to variables
import { useNavigate } from "react-router-dom" //useNavigate is used to navigate between pages
import { Alert } from 'react-bootstrap' //Using alert component from react-boostrap

function Register() {

  useEffect(() => {
    document.title = "Tagstrike - Register" //Assign title of home page
  }, [])

  const navigate = useNavigate() //Creation of useNavigate() object

  const [email,setEmail] = useState("") //React hook for setting email
  const [username, setUsername] = useState("") //React hook for setting username
  const [password, setPassword] = useState("") //React hook for setting password
  const [rtpassword, setRetypePassword] = useState("") //React hook for setting retpying password to check if user typed in their password correctly

  const [profilePhotoBytes, setProfilePhotoBytes] = useState<File | null>(null);//React hook for setting email

  const [message,setMessage] = useState("") //React hook for setting email


const handleFileChange = ( // Anonymous function to handle profile photo changes
  event: React.ChangeEvent<HTMLInputElement>,
  setFile: React.Dispatch<React.SetStateAction<File | null>>
) => {
  const file = event.target.files?.[0];
  if (file) setFile(file); //Sets file to new file
};

  //HandleSubmit

  const HandleSubmit = async (e:React.FormEvent)=> //Function that handles submit of the register form
  {
    e.preventDefault() //prevents default

    if(email != "" && username !="" && password!=""&& rtpassword!="") // if all entries are non empty
      {
        if(password == rtpassword) //If password and retyped password are a match
          {
           const response = await fetch("https://tagstrike.onrender.com/api/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userEmail: email,
                userUsername: username,
                userPassword: password,
              }),
            });

            const data = await response.json();
            const UserID = data.userId;
            if (response.ok) {
              setMessage("Registration successful!");
              setTimeout(() => {
                navigate("/login",{ 
          state: { UserID} 
        });
              }, 1000);
            } else {
              setMessage(data.error || "Registration failed");
            }
          }
          else{
            setMessage("Passwords do not match") //Use alert to show the user that passwords do not match
            console.log(message)
          }
      }
      else{
        setMessage("There are empty fields") //Use alert to show the user that there are empty fields

        console.log(message)
    }

  }
    return (
    <div>
      <h1>Register Page</h1> {/* Register page heading */}
      <p className="brand-color-matrix">Please fill in your details.</p> {/* User must fill in their details */}
      {/* Alert component that is used when a message needs to be sent to the user */}
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
      <hr/>{/* Linebreak */}

      <form onSubmit={HandleSubmit}> {/* Form where the user submits their registration details */}
        <div className="form-group">
          <label htmlFor="email" className="brand-color-matrix form-label">Email Address</label>  {/* Label for email address */}
          <input id='email' className='form-control' value = {email} type='email' placeholder='Enter your email address' onChange={e => {setEmail(e.target.value)}}/> {/* Label for email address */}

          <label htmlFor="username" className="brand-color-matrix form-label">Username</label>  {/* Label for username */}
          <input id='username' className='form-control' value = {username} type='text' placeholder='Enter your username' onChange={e => {setUsername(e.target.value)}}/> {/* Label for username */}

          <label htmlFor="password" className="brand-color-matrix form-label">Password</label> {/* Label for password */}
          <input id='password' className='form-control' value = {password} type='password' placeholder='Type a new password' onChange={e => {setPassword(e.target.value)}}/> {/* Label for password */}

          <label htmlFor="retypepassword" className="brand-color-matrix form-label">Retype Password</label> {/* Label for retype password */}
          <input id='retypepassword' className='form-control' value={rtpassword} type='password' placeholder='Retype password' onChange={e => {setRetypePassword(e.target.value)}}/> {/* Label for retype password */}

          <label htmlFor="profilephoto" className="brand-color-matrix form-label">Upload Profile Photo</label> {/* Label for profile photo */}
          <input id='profilephoto' className='form-control' type='file' accept="image/*" onChange={(e) => handleFileChange(e, setProfilePhotoBytes)}/>{/* Label for profile photo */}
        </div>

        <button className='btn btn-primary' type='submit'>Submit</button> {/* Button for submitting registration details */}
      </form>

    </div>
  )
}

export default Register //Export component as "Registration"

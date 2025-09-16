import { useEffect,useState } from 'react'
import { useNavigate } from "react-router-dom"

type LoginProps = {
  setUserID: (id: number) => void 
    setLoggedIn: (value: boolean) => void
}

function Login({ setUserID,setLoggedIn }: LoginProps){

 const [email,setEmail] = useState("")
 const [password, setPassword] = useState("")
 const navigate = useNavigate()

const HandleSubmit = async (e:React.FormEvent)=>
  {
    e.preventDefault()

    if(email != "" && password!=""){    
        //console.log(email)
        try {
            const result = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userEmail: email, userPassword: password }),
    });

        const data = await result.json();
        console.log("Login response:", data);
        } catch (error) {
          console.error("Error logging in:", error);
        }
        const res = await fetch(`http://localhost:3000/api/getUserID?userEmail=${encodeURIComponent(email)}`);
        const data = await res.json()
        const userid = Number(data.userId);


        setUserID(userid)
        setLoggedIn(true)
        localStorage.setItem("userID", userid.toString());
        navigate("/user")
    }
  }

    useEffect(() => {
    document.title = "Tagstrike - Login"
  }, [])
  return(
    <div>
      <h1>Login Page</h1>
      <p>Please fill in your details.</p>
      <hr/>

      <form onSubmit={HandleSubmit}>
        <div className="form-group">
          <label htmlFor="email" className='form-label'>Email Address</label> 
          <input id='email' value = {email} type='email' className='form-control' placeholder='Enter your email address' onChange={e => {setEmail(e.target.value)}}/>
          
          <label htmlFor="password" className='form-label'>Password</label> 
          <input id='password' value = {password} type='password' className='form-control' placeholder='Enter your password' onChange={e => {setPassword(e.target.value)}}/>
        </div>


        <button className='btn btn-primary' type='submit'>Submit</button>
      </form>
    </div>
  )
}

export default Login
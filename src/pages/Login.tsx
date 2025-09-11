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
        const data = {email,password}     
        console.log(data)
        
        setUserID(24)
        setLoggedIn(true)
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
        <div>
          <label htmlFor="email">Email Address</label> 
          <input id='email' value = {email} type='email' placeholder='Enter your email address' onChange={e => {setEmail(e.target.value)}}/>
        </div>

        <div>
          <label htmlFor="password">Password</label> 
          <input id='password' value = {password} type='password' placeholder='Enter your password' onChange={e => {setPassword(e.target.value)}}/>
        </div>


        <button className='btn btn-primary' type='submit'>Submit</button>
      </form>
    </div>
  )
}

export default Login
//import { useState } from 'react'
import tsLogo from '/TS_matrix.png'
import './App.css'

function App() {
//  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <p>
          <img src={tsLogo} className="logo react" alt="TS logo" />
        </p>
      </div>
      <h1>Tagstrike</h1>
      <div>
        <p>
          <button>Register</button><button>Login</button>
        </p>
      </div>
    </>
  )
}

export default App

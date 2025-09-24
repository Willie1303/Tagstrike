import { useEffect } from 'react'

function Home(){
    useEffect(() => {
    document.title = "Tagstrike - Home"
  }, [])
    return(
        <div>
            <h1>Tagstrike</h1>
            <p className="brand-color-matrix">

            Welcome to Tagstrike!
            
            </p>
            <button className="brand-color-matrix">Watch match as a <strong>Spectator</strong></button>
      </div>
    )
}

export default Home
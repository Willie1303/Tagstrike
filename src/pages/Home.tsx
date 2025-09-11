import { useEffect } from 'react'

function Home(){
    useEffect(() => {
    document.title = "Tagstrike - Home"
  }, [])
    return(
        <div>
            <h1>Tagstrike</h1>
            <p>

            Welcome to Tagstrike!

            </p>
      </div>
    )
}

export default Home
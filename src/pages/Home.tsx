// Tumelo Kasumba : 2023738970
// Jan-Willem Greyvenstein : 2023256304

import { useEffect } from 'react' //UseEffect to make changes on loading page

function Home(){
    useEffect(() => {
    document.title = "Tagstrike - Home" //Change title in tab to "Tagstrike - Home"
  }, [])
    return(
        <div>
            <h1>Tagstrike</h1> {// Heading for tagstrike
            }
            <p className="brand-color-matrix">

            Welcome to Tagstrike!
            
            </p>
            <button className="brand-color-matrix">Watch match as a <strong>Spectator</strong></button>
      </div>
    )
}

export default Home //Export component as "Home"
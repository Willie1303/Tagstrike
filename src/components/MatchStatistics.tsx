// Tumelo Kasumba : 2023738970
// Jan-Willem Greyvenstein : 2023256304

import React, { useState } from "react"; //Use state for react hooks
import { Button, Collapse, Container } from "react-bootstrap"; //Imported react bootstrap components

interface Player {
  username:string;
  kills: number;
  score: number;
  alive: boolean;
}; //Interface of player

interface MatchStatisticsProps {
  players: Player[];
}//Interface for array of players

const MatchStatistics: React.FC<MatchStatisticsProps> = ({ players }) => {
  const [open, setOpen] = useState(false); //React hook for setting whether statistics are viewable or not

  return (
    <Container className="mt-3 matrix-container">
      <Button
        variant="success"
        onClick={() => setOpen(!open)}
        aria-controls="stats-table"
        aria-expanded={open}
        className="mb-3"
      >
        {open ? "Hide Stats" : "Show Stats"}
      </Button> {/* Button that toggles visibility */}

      <Collapse in={open}>
        <div id="stats-table">
          {players.map((player,index) => ( // Map a card for each player
            <div key={index} className="matrix-card"> {/* Card for each player */}
              <div><strong>{player.username}</strong></div> {/* Player username */}
              <div>Kills: {player.kills}</div> {/* Player kills */}
              <div>Score: {player.score}</div> {/* Player score */}
              <div>Status: {player.alive?"Alive":"Dead"}</div> {/* Player status */}
            </div>
          ))}
        </div>
      </Collapse>
    </Container>
  );
};

export default MatchStatistics; //Export "MatchStatistics"

import React, { useState } from "react";
import { Button, Collapse, Container } from "react-bootstrap";

interface Player {
  username:string;
  kills: number;
  score: number;
  alive: boolean;
};

interface MatchStatisticsProps {
  players: Player[];
}

const MatchStatistics: React.FC<MatchStatisticsProps> = ({ players }) => {
  const [open, setOpen] = useState(false);

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
      </Button>

      <Collapse in={open}>
        <div id="stats-table">
          {players.map((player,index) => (
            <div key={index} className="matrix-card">
              <div><strong>{player.username}</strong></div>
              <div>Kills: {player.kills}</div>
              <div>Score: {player.score}</div>
              <div>Status: {player.alive?"Alive":"Dead"}</div>
            </div>
          ))}
        </div>
      </Collapse>
    </Container>
  );
};

export default MatchStatistics;

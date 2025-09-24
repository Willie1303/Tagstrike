import React, { useState } from "react";
import { Button, Collapse, Container } from "react-bootstrap";

interface Player {
  id: number;
  username: string;
  health: number;
  score: number;
  status: string;
}

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
          {players.map((player) => (
            <div key={player.id} className="matrix-card">
              <div><strong>{player.username}</strong></div>
              <div>Health: {player.health}</div>
              <div>Score: {player.score}</div>
              <div>Status: {player.status}</div>
            </div>
          ))}
        </div>
      </Collapse>
    </Container>
  );
};

export default MatchStatistics;

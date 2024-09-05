import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function OptimizedLineup() {
  const location = useLocation();
  const navigate = useNavigate();
  const { optimizedLineup } = location.state || {};

  if (!optimizedLineup) {
    return <div>No optimized lineup available. Please go back and try again.</div>;
  }

  const handleGoBack = () => {
    navigate(-1);
  };

  const positionOrder = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DEF'];

  const sortedLineup = [...optimizedLineup].sort((a, b) => 
    positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position)
  );

  return (
    <div className="optimized-lineup">
      <h2>Optimized Lineup</h2>
      <table className="lineup-table">
        <thead>
          <tr>
            <th>Position</th>
            <th>Player</th>
            <th>Team</th>
            <th>Projected Points</th>
          </tr>
        </thead>
        <tbody>
          {sortedLineup.map((player, index) => (
            <tr key={index}>
              <td>{player.position}</td>
              <td>{player.playerName}</td>
              <td>{player.teamName}</td>
              <td>{player.projectedPoints.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleGoBack}>Back to Roster</button>
    </div>
  );
}

export default OptimizedLineup;
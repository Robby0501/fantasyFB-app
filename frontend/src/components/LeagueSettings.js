import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function LeagueSettings() {
  const [teamName, setTeamName] = useState("");
  const [scoringType, setScoringType] = useState("standard");
  const [numberOfTeams, setNumberOfTeams] = useState(10);
  const [starters, setStarters] = useState({
    qb: 1, rb: 2, wr: 2, te: 1, flex: 1, def: 1, k: 1
  });
  const [benchSpots, setBenchSpots] = useState(6);
  
  const navigate = useNavigate();

  const handleStartersChange = (position, value) => {
    setStarters(prev => ({ ...prev, [position]: parseInt(value) }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you can handle the form submission, e.g., send data to backend
    console.log({ teamName, scoringType, numberOfTeams, starters, benchSpots });
    // Navigate to the PlayerSearch page
    navigate('/player-search', { state: { leagueSettings: { teamName, scoringType, numberOfTeams, starters, benchSpots } } });
  };

  return (
    <div className="league-settings">
      <h2>League Settings</h2>
      <form onSubmit={handleSubmit} className="league-settings-form">
      <h2>League Settings</h2>
<form onSubmit={handleSubmit} className="league-settings-form">
  <div>
    <label htmlFor="teamName">Team Name:</label>
    <input
      type="text"
      id="teamName"
      value={teamName}
      onChange={(e) => setTeamName(e.target.value)}
      required
    />
  </div>
  <div>
    <label htmlFor="scoringType">Scoring Type:</label>
    <select
      id="scoringType"
      value={scoringType}
      onChange={(e) => setScoringType(e.target.value)}
    >
      <option value="standard">Standard</option>
      <option value="ppr">PPR</option>
      <option value="halfppr">Half PPR</option>
    </select>
  </div>
  <div>
    <label htmlFor="numberOfTeams">Number of Teams:</label>
    <input
      type="number"
      id="numberOfTeams"
      value={numberOfTeams}
      onChange={(e) => setNumberOfTeams(parseInt(e.target.value))}
      min="4"
      max="20"
      required
    />
  </div>
  <div>
    <h3>Number of Starters</h3>
    {Object.entries(starters).map(([position, count]) => (
      <div key={position}>
        <label htmlFor={position}>{position.toUpperCase()}:</label>
        <input
          type="number"
          id={position}
          value={count}
          onChange={(e) => handleStartersChange(position, e.target.value)}
          min="0"
          max={position === "qb" ? "2" : "4"}
          required
        />
      </div>
    ))}
  </div>
  <div>
    <label htmlFor="benchSpots">Bench Spots:</label>
    <input
      type="number"
      id="benchSpots"
      value={benchSpots}
      onChange={(e) => setBenchSpots(parseInt(e.target.value))}
      min="0"
      max="10"
      required
    />
  </div>
  <button type="submit">Save League Settings</button>
</form>
        <button type="submit">Save League Settings</button>
      </form>
    </div>
  );
}

export default LeagueSettings;

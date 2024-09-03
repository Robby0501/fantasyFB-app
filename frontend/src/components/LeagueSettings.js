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
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  const handleStartersChange = (position, value) => {
    setStarters(prev => ({ ...prev, [position]: parseInt(value) }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if all fields are filled
    if (!teamName.trim()) {
      setError("Please enter a team name.");
      return;
    }
    
    if (numberOfTeams < 4 || numberOfTeams > 20) {
      setError("Number of teams must be between 4 and 20.");
      return;
    }
    
    if (benchSpots < 0 || benchSpots > 10) {
      setError("Bench spots must be between 0 and 10.");
      return;
    }
    
    // Check if at least one starter is selected
    if (Object.values(starters).every(value => value === 0)) {
      setError("Please select at least one starter position.");
      return;
    }
    
    // If all validations pass, clear any existing error and proceed
    setError("");
    
    // Navigate to the PlayerSearch page
    navigate('/player-search', { 
      state: { 
        leagueSettings: { 
          teamName, 
          scoringType, 
          numberOfTeams, 
          starters, 
          benchSpots 
        } 
      } 
    });
  };

  return (
    <div className="league-settings">
      <h2>League Settings</h2>
      {error && <div className="error-message">{error}</div>}
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
          <div className="starters-grid">
            {Object.entries(starters).map(([position, count]) => (
              <div key={position}>
                <label htmlFor={position}>{position.toUpperCase()}:</label>
                <select
                  id={position}
                  value={count}
                  onChange={(e) => handleStartersChange(position, e.target.value)}
                  required
                >
                  {position === 'qb' && (
                    <>
                      <option value="1">1</option>
                      <option value="2">2</option>
                    </>
                  )}
                  {(position === 'rb' || position === 'wr') && (
                    <>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </>
                  )}
                  {position === 'te' && (
                    <>
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                    </>
                  )}
                  {position === 'flex' && (
                    <>
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </>
                  )}
                  {(position === 'def' || position === 'k') && (
                    <>
                      <option value="0">0</option>
                      <option value="1">1</option>
                    </>
                  )}
                </select>
              </div>
            ))}
          </div>
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
    </div>
  );
}

export default LeagueSettings;

import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [allPlayers, setAllPlayers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/hello')
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => console.error('Error fetching message:', error));

    // Fetch all players when the component mounts
    fetch('/api/all-players')
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setAllPlayers(data);
        }
      })
      .catch(error => {
        console.error('Error fetching players:', error);
        setError('An error occurred while fetching players.');
      });
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const results = allPlayers.filter(player => 
        player.playerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results.slice(0, 10));  // Limit to 10 results
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allPlayers]);

  const addPlayer = (player) => {
    setSelectedPlayers([...selectedPlayers, player]);
    setSearchQuery("");
  };

  const removePlayer = (playerToRemove) => {
    setSelectedPlayers(selectedPlayers.filter(player => player.espnPlayerId !== playerToRemove.espnPlayerId));
  };

  return (
    <div className="App">
      <header className="App-header">
        <p>{message}</p>
        <h2>Search and Add Players</h2>
        <input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search players"
        />
        {error && <p style={{color: 'red'}}>{error}</p>}
        <ul>
          {searchResults.map((player, index) => (
            <li key={index}>
              {player.playerName} - {player.position} - {player.teamName} - Age: {player.age}
              <button onClick={() => addPlayer(player)}>Add</button>
            </li>
          ))}
        </ul>

        <h2>Your Lineup</h2>
        <ul>
          {selectedPlayers.map((player, index) => (
            <li key={index}>
              {player.playerName} - {player.position} - {player.teamName} - Age: {player.age}
              <button onClick={() => removePlayer(player)}>Remove</button>
            </li>
          ))}
        </ul>
      </header>
    </div>
  );
}

export default App;
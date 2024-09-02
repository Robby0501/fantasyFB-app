import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function PlayerSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allPlayers, setAllPlayers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [error, setError] = useState(null);

  const location = useLocation();
  const leagueSettings = location.state?.leagueSettings;

  useEffect(() => {
    // Fetch all players from the backend
    fetch('http://127.0.0.1:5000/api/all-players')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        setAllPlayers(data);
      })
      .catch(error => {
        console.error('Error fetching players:', error);
        setError('An error occurred while fetching players. Please try again later.');
      });
  }, []);

  // Include the rest of the player search and add functionality from the original App.js
  // ...

  return (
    <div className="player-search">
      <h2>Search and Add Players</h2>
      {/* Include the search input and results display */}
      {/* ... */}
      <h2>Your Lineup</h2>
      {/* Display selected players */}
      {/* ... */}
    </div>
  );
}

export default PlayerSearch;

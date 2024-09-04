import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function PlayerSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allPlayers, setAllPlayers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [error, setError] = useState(null);

  const location = useLocation(); 
  const leagueSettings = location.state?.leagueSettings;

  useEffect(() => {
    // Initialize selectedPlayers based on leagueSettings
    if (leagueSettings) {
      const initialSelectedPlayers = {};
      Object.entries(leagueSettings.starters).forEach(([position, count]) => {
        initialSelectedPlayers[position] = Array(count).fill(null);
      });
      initialSelectedPlayers['BENCH'] = Array(leagueSettings.benchSpots).fill(null);
      setSelectedPlayers(initialSelectedPlayers);
    }
  }, [leagueSettings]);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/all-players')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('API Response:', data);
        setAllPlayers(data);
      })
      .catch(error => {
        console.error('Error fetching players:', error);
        setError('An error occurred while fetching players. Please try again later.');
      });
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const results = allPlayers.filter(player => {
        const searchableNames = [
          player.playerName,
          player.teamName,
          player.position
        ].filter(Boolean);
        return searchableNames.some(name =>
          name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
      setSearchResults(results.slice(0, 10));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allPlayers]);

  const addPlayer = (player) => {
    let position = player.position.toLowerCase();
    
    if (!position) {
      console.warn(`Position not found for player: ${player.playerName}`);
      position = 'flex';
    }
  
    setSelectedPlayers(prev => {
      const newSelectedPlayers = {...prev};
      
      // Check if the player is already in the lineup
      const isPlayerAlreadyAdded = Object.values(newSelectedPlayers).some(
        players => players.some(p => p && p.playerName === player.playerName)
      );

      if (isPlayerAlreadyAdded) {
        console.warn(`Player ${player.playerName} is already in the lineup.`);
        return prev;
      }

      // First, try to add to the exact position
      if (newSelectedPlayers[position] && newSelectedPlayers[position].includes(null)) {
        const index = newSelectedPlayers[position].indexOf(null);
        newSelectedPlayers[position][index] = player;
      } else {
        // If exact position is full or doesn't exist, try to add to a compatible position
        let added = false;
        for (const [key, players] of Object.entries(newSelectedPlayers)) {
          if (isCompatiblePosition(position, key) && players.includes(null)) {
            const index = players.indexOf(null);
            newSelectedPlayers[key][index] = player;
            added = true;
            break;
          }
        }

        // If still not added, try to add to FLEX or BENCH
        if (!added) {
          if (newSelectedPlayers['FLEX'] && newSelectedPlayers['FLEX'].includes(null)) {
            const index = newSelectedPlayers['FLEX'].indexOf(null);
            newSelectedPlayers['FLEX'][index] = player;
          } else if (newSelectedPlayers['BENCH'] && newSelectedPlayers['BENCH'].includes(null)) {
            const index = newSelectedPlayers['BENCH'].indexOf(null);
            newSelectedPlayers['BENCH'][index] = player;
          } else {
            console.warn(`No available slots for player: ${player.playerName}`);
            return prev;
          }
        }
      }

      return newSelectedPlayers;
    });

    setSearchQuery("");
    setSearchResults([]);
  };

  const isCompatiblePosition = (playerPosition, slotPosition) => {
    const positionMap = {
      'qb': ['qb'],
      'rb': ['rb', 'flex'],
      'wr': ['wr', 'flex'],
      'te': ['te', 'flex'],
      'k': ['k'],
      'def': ['def']
    };

    return positionMap[playerPosition]?.includes(slotPosition.toLowerCase()) || false;
  };

  const removePlayer = (position, index) => {
    setSelectedPlayers(prev => {
      const newSelectedPlayers = {...prev};
      newSelectedPlayers[position][index] = null;
      return newSelectedPlayers;
    });
  };

  return (
    <div className="player-search">
      <h2>Search and Add Players</h2>
      <div className="search-container">
        <input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search players"
          className="search-input"
        />
      {searchResults.length > 0 && (
  <div className="search-results">
    {searchResults.map((player, index) => (
      <div key={index} className="search-result-item" onClick={() => addPlayer(player)}>
        {player.playerName} - {player.position} - {player.teamName}
      </div>
    ))}
  </div>
)}
      </div>
      {error && <p className="error-message">{error}</p>}
      <h2>Your Lineup</h2>
      <div className="lineup">
        {Object.entries(selectedPlayers).map(([position, players]) => (
          <div key={position} className="position-group">
            <h3>{position}</h3>
            {players.map((player, index) => (
              <div key={`${position}-${index}`} className="player-slot">
                {player ? (
                  <>
                    <span>{player.playerName} - {player.position} - {player.teamName}</span>
                    <button onClick={() => removePlayer(position, index)}>Remove</button>
                  </>
                ) : (
                  <span>Empty Slot</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlayerSearch;

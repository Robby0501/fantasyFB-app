import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function PlayerSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allPlayers, setAllPlayers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [error, setError] = useState(null);

  const teamColors = {
    ARI: '#97233F', ATL: '#A71930', BAL: '#241773', BUF: '#00338D',
    CAR: '#0085CA', CHI: '#C83803', CIN: '#FB4F14', CLE: '#311D00',
    DAL: '#003594', DEN: '#FB4F14', DET: '#0076B6', GB: '#203731',
    HOU: '#03202F', IND: '#002C5F', JAX: '#006778', KC: '#E31837',
    LAC: '#0080C6', LAR: '#003594', LV: '#000000', MIA: '#008E97',
    MIN: '#4F2683', NE: '#002244', NO: '#D3BC8D', NYG: '#0B2265',
    NYJ: '#125740', PHI: '#004C54', PIT: '#FFB612', SEA: '#002244',
    SF: '#AA0000', TB: '#D50A0A', TEN: '#0C2340', WAS: '#773141'
  };

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
        const isValidPosition = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].includes(player.position.toUpperCase());
        return isValidPosition && searchableNames.some(name =>
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
  
        // If still not added, try to add to BENCH
        if (!added && newSelectedPlayers['BENCH'] && newSelectedPlayers['BENCH'].includes(null)) {
          const index = newSelectedPlayers['BENCH'].indexOf(null);
          newSelectedPlayers['BENCH'][index] = player;
        } else if (!added) {
          console.warn(`No available slots for player: ${player.playerName}`);
          return prev;
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
    <div className="roster">
      <h2 className="roster-header">ROSTER</h2>
      <p>Add your 9 starters & all bench players, in any order.</p>
      <div className="search-container">
        <input
          type="text"
          className="player-search-input"
          placeholder="Player search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
      {Object.entries(selectedPlayers).map(([position, players]) =>
        players.map((player, index) => (
          player && (
            <div 
              key={`${position}-${index}`} 
              className="player-item"
              style={{ backgroundColor: teamColors[player.teamName] || '#808080' }}
            >
              <div>
                <div className="player-name">{player.playerName}</div>
                <div className="player-details">{player.position} • {player.teamName}</div>
              </div>
              <button className="remove-player" onClick={() => removePlayer(position, index)}>×</button>
            </div>
          )
        ))
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default PlayerSearch;

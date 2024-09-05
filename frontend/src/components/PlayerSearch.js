import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function PlayerSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allPlayers, setAllPlayers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [error, setError] = useState(null);

  const teamColors = {
    ARI: { primary: '#97233F', secondary: '#000000' },
    ATL: { primary: '#A71930', secondary: '#000000' },
    BAL: { primary: '#241773', secondary: '#000000' },
    BUF: { primary: '#00338D', secondary: '#C60C30' },
    CAR: { primary: '#0085CA', secondary: '#101820' },
    CHI: { primary: '#0B162A', secondary: '#C83803' },
    CIN: { primary: '#FB4F14', secondary: '#000000' },
    CLE: { primary: '#311D00', secondary: '#FF3C00' },
    DAL: { primary: '#003594', secondary: '#869397' },
    DEN: { primary: '#FB4F14', secondary: '#002244' },
    DET: { primary: '#0076B6', secondary: '#B0B7BC' },
    GB: { primary: '#203731', secondary: '#FFB612' },
    HOU: { primary: '#03202F', secondary: '#A71930' },
    IND: { primary: '#002C5F', secondary: '#FFFFFF' },
    JAX: { primary: '#006778', secondary: '#000000' },
    KC: { primary: '#E31837', secondary: '#FFB81C' },
    LV: { primary: '#A5ACAF', secondary: '#000000' },
    LAC: { primary: '#0080C6', secondary: '#FFC20E' },
    LAR: { primary: '#003594', secondary: '#FFA300' },
    MIA: { primary: '#008E97', secondary: '#FC4C02' },
    MIN: { primary: '#4F2683', secondary: '#FFC62F' },
    NE: { primary: '#002244', secondary: '#C60C30' },
    NO: { primary: '#D3BC8D', secondary: '#101820' },
    NYG: { primary: '#0B2265', secondary: '#A71930' },
    NYJ: { primary: '#125740', secondary: '#FFFFFF' },
    PHI: { primary: '#004C54', secondary: '#A5ACAF' },
    PIT: { primary: '#000000', secondary: '#FFB612' },
    SF: { primary: '#AA0000', secondary: '#B3995D' },
    SEA: { primary: '#002244', secondary: '#69BE28' },
    TB: { primary: '#D50A0A', secondary: '#34302B' },
    TEN: { primary: '#0C2340', secondary: '#4B92DB' },
    WAS: { primary: '#5A1414', secondary: '#FFB612' }
  };

  function isLightColor(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 155;
  }

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
        const isValidPosition = ['QB', 'RB', 'WR', 'TE', 'PK', 'DEF'].includes(player.position.toUpperCase());
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
      'pk': ['pk'],
      'def': ['def']
    };
  
    return positionMap[playerPosition.toLowerCase()]?.includes(slotPosition.toLowerCase()) || false;
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
      <div className="roster-grid">
        {Object.entries(selectedPlayers).flatMap(([position, players]) =>
          players.map((player, index) => (
            player && (
              <div 
                key={`${position}-${index}`} 
                className="player-item"
                style={{ backgroundColor: teamColors[player.teamName]?.primary || '#808080' }}
              >
                <div className="player-info">
                  <div className="player-name">{player.playerName}</div>
                  <div 
                    className="player-details" 
                    style={{ 
                      backgroundColor: teamColors[player.teamName]?.secondary || '#666666',
                      color: isLightColor(teamColors[player.teamName]?.secondary) 
                        ? teamColors[player.teamName]?.primary 
                        : 'white'
                    }}
                  >
                    <span>{player.position} • {player.teamName}</span>
                  </div>
                </div>
                <button className="remove-player" onClick={() => removePlayer(position, index)}>×</button>
              </div>
            )
          ))
        )}
      </div>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default PlayerSearch;

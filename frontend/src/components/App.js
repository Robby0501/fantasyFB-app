import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LeagueSettings from './LeagueSettings';
import OptimizedLineup from './OptimizedLineup';
import PlayerSearch from './PlayerSearch';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Routes>
            <Route path="/" element={<LeagueSettings />} />
            <Route path="/player-search" element={<PlayerSearch />} />
            <Route path="/optimized-lineup" element={<OptimizedLineup />} />
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LeagueSettings from './LeagueSettings';
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
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;
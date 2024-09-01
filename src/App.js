import React, { useEffect, useState } from 'react';

console.log('App.js is running');

const styles = {
  app: {
    textAlign: 'center',
    backgroundColor: '#0000FF',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: '50px',
    fontSize: 'calc(10px + 2vmin)',
    color: 'white'
  },
  searchContainer: {
    position: 'relative',
    width: '95%',
    maxWidth: '1000px',
    marginBottom: '20px'
  },
  searchInput: {
    width: '100%',
    padding: '25px',
    fontSize: '28px',
    border: '5px solid #4a4a4a',
    borderRadius: '15px',
    boxSizing: 'border-box'
  },
  selectedPlayers: {
    listStyleType: 'none',
    padding: 0
  }
};

function App() {
  console.log('App component is rendering');
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    fetch('/api/hello')
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => setMessage('Error: ' + error.message));
  }, []);

  return (
    <div style={styles.app}>
      <h1>{message}</h1>
      <div style={styles.searchContainer}>
        <input type="text" style={styles.searchInput} placeholder="Search players..." />
      </div>
      <h2>Your Lineup</h2>
      <ul style={styles.selectedPlayers}>
        {/* Your lineup items would go here */}
      </ul>
    </div>
  );
}

export default App;
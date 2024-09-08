from flask import Flask, jsonify, send_from_directory, request, session
from flask_cors import CORS
import os
from flask_session import Session
import http.client
import json
from dotenv import load_dotenv
import requests
from datetime import datetime, timedelta
import logging


load_dotenv()  # This loads the variables from .env

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}}, supports_credentials=True)

app.config['SESSION_TYPE'] = 'filesystem'
app.config['SECRET_KEY'] = 'your_secret_key_here'  # Replace with a real secret key
Session(app)

# RapidAPI configuration
RAPIDAPI_KEY = os.getenv('RAPIDAPI_KEY')
RAPIDAPI_HOST = "tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com"

def fetch_player_list():
    conn = http.client.HTTPSConnection(RAPIDAPI_HOST)
    headers = {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
    }
    try:
        conn.request("GET", "/getNFLPlayerList", headers=headers)
        res = conn.getresponse()
        data = res.read()
        return json.loads(data.decode("utf-8"))
    except Exception as e:
        print(f"Error fetching player list: {str(e)}")
        return None

@app.route('/api/all-players', methods=['GET'])
def get_all_players():
    try:
        all_players = fetch_player_list()
        if all_players is None:
            raise ValueError("Failed to fetch player list from API")
        
        if isinstance(all_players, dict) and 'body' in all_players:
            player_list = all_players['body']
        elif isinstance(all_players, list):
            player_list = all_players
        else:
            raise ValueError("Unexpected data structure from API")
        
        processed_players = [
            {
                'playerName': player.get('longName', ''),
                'position': player.get('pos', ''),
                'teamName': player.get('team', ''),
                'age': player.get('age', ''),
                'espnPlayerId': player.get('espnID', '')
            }
            for player in player_list
            if player.get('pos') in ['QB', 'RB', 'WR', 'TE', 'PK','DEF']  # Only include specific positions
        ]

        # Add team defenses
        team_defenses = [
            {'playerName': f'{team} D/ST', 'position': 'DEF', 'teamName': team}
            for team in ['ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LAC', 'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WAS']
        ]
        processed_players.extend(team_defenses)

        return jsonify(processed_players)
    except Exception as e:
        print("Error in get_all_players:", str(e))
        return jsonify({"error": str(e)}), 500

def get_current_nfl_week():
    # NFL season typically starts on the Tuesday after Labor Day
    season_start = datetime(2024, 9, 3)  # Adjust this date for the correct year
    current_date = datetime.now()
    week_number = ((current_date - season_start).days // 7) + 1
    return min(week_number, 18)  # Cap at week 18 (17 game season + 1)

def fetch_projections(week):
    logger.debug(f"Fetching projections for week {week}")
    url = f"https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLProjections"
    querystring = {
        "week": str(week),
        "archiveSeason": "2024",
        "twoPointConversions": "2",
        "passYards": ".04",
        "passAttempts": "-.5",
        "passTD": "4",
        "passCompletions": "1", 
        "passInterceptions": "-2",
        "pointsPerReception": "1",
        "carries": ".2",
        "rushYards": ".1",
        "rushTD": "6",
        "fumbles": "-2",
        "receivingYards": ".1",
        "receivingTD": "6",
        "targets": ".1",
        "fgMade": "3",
        "fgMissed": "-1",
        "xpMade": "1",
        "xpMissed": "-1"
    }
    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST
    }
    response = requests.get(url, headers=headers, params=querystring)
    logger.debug(f"API Response status code: {response.status_code}")
    
    try:
        projections = response.json()
    except json.JSONDecodeError:
        logger.error("Failed to decode JSON from API response")
        return {}
    
    logger.debug(f"Projections keys: {projections.keys()}")
    
    projection_dict = {}
    if 'body' in projections and isinstance(projections['body'], dict):
        player_projections = projections['body'].get('playerProjections', {})
        logger.debug(f"Number of players in projections: {len(player_projections)}")
        for player_id, player_data in player_projections.items():
            if isinstance(player_data, dict):
                name = player_data.get('longName', '').lower()
                fantasy_points = player_data.get('fantasyPoints')
                if name and fantasy_points:
                    projection_dict[name] = float(fantasy_points)
                    logger.debug(f"Added projection for {name}: {fantasy_points}")
    else:
        logger.error(f"Unexpected structure in projections: {projections}")
    
    logger.debug(f"Projection dictionary size: {len(projection_dict)}")
    logger.debug(f"Sample of projection dictionary: {dict(list(projection_dict.items())[:5])}")
    
    return projection_dict

@app.route('/api/optimize-lineup', methods=['POST'])
def optimize_lineup():
    try:
        players = request.json.get('players', [])
        logger.debug(f"Received request to optimize lineup with players: {players}")
        
        if not players:
            logger.warning("No players provided in the request")
            return jsonify({"error": "No players provided"}), 400
        
        optimized_lineup = process_and_evaluate_players(players)
        logger.info(f"Returning optimized lineup: {optimized_lineup}")
        return jsonify({"optimized_lineup": optimized_lineup})
    except Exception as e:
        logger.error(f"Error in optimize_lineup: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500
    
def process_and_evaluate_players(players):
    logger.debug(f"Processing players: {players}")
    current_week = get_current_nfl_week()
    logger.debug(f"Current week: {current_week}")
    
    projection_dict = fetch_projections(current_week)
    logger.debug(f"Projection dictionary received: {projection_dict}")
    logger.debug(f"Player names in input: {[p['playerName'] for p in players]}")
    logger.debug(f"Player names in projections: {list(projection_dict.keys())[:5]}")

    for player in players:
        player_name_lower = player['playerName'].lower()
        if player_name_lower in projection_dict:
            player['projectedPoints'] = projection_dict[player_name_lower]
        else:
            # Try to find a case-insensitive match
            matches = [name for name in projection_dict.keys() if player_name_lower == name.lower()]
            if matches:
                player['projectedPoints'] = projection_dict[matches[0]]
                logger.debug(f"Found case-insensitive match for {player['playerName']}: {matches[0]}")
            else:
                # Try to find a partial match
                partial_matches = [name for name in projection_dict.keys() if player_name_lower in name.lower()]
                if partial_matches:
                    player['projectedPoints'] = projection_dict[partial_matches[0]]
                    logger.debug(f"Found partial match for {player['playerName']}: {partial_matches[0]}")
                else:
                    player['projectedPoints'] = 0
                    logger.warning(f"No projection found for {player['playerName']}")
        logger.debug(f"Player {player['playerName']} projected points: {player['projectedPoints']}")

    sorted_players = sorted(players, key=lambda x: x['projectedPoints'], reverse=True)
    logger.debug(f"Sorted players: {sorted_players}")
    
    # Rest of the function remains the same
    optimal_lineup = {
        'QB': 1, 'RB': 2, 'WR': 2, 'TE': 1, 'FLEX': 1, 'K': 1, 'DEF': 1
    }
    
    optimized_lineup = []
    flex_candidates = []

    for position, count in optimal_lineup.items():
        position_players = [p for p in sorted_players if p['position'] == position]
        
        if position == 'FLEX':
            flex_candidates = [p for p in sorted_players if p['position'] in ['RB', 'WR', 'TE'] and p not in optimized_lineup]
            optimized_lineup.extend(flex_candidates[:count])
        else:
            optimized_lineup.extend(position_players[:count])
        
        # Remove selected players from the sorted list
        sorted_players = [p for p in sorted_players if p not in optimized_lineup]

    logger.debug(f"Optimized lineup: {optimized_lineup}")
    return optimized_lineup

@app.route('/api/check', methods=['GET'])
def check():
    return jsonify({"status": "Server is running"}), 200

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
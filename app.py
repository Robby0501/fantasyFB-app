from flask import Flask, jsonify, send_from_directory, request, session
from flask_cors import CORS
import os
from flask_session import Session
import http.client
import json
from dotenv import load_dotenv

load_dotenv()  # This loads the variables from .env

app = Flask(__name__, static_folder='static/build', template_folder='static/build')
CORS(app)
app.config['SESSION_TYPE'] = 'filesystem'
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
    conn.request("GET", "/getNFLPlayerList", headers=headers)
    res = conn.getresponse()
    data = res.read()
    return json.loads(data.decode("utf-8"))

@app.route('/api/hello', methods=['GET'])
def hello():
    print("API /hello endpoint called")
    return jsonify(message="Hello from the backend!")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    print(f"Requested path: {path}")
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        print(f"Serving static file: {path}")
        return send_from_directory(app.static_folder, path)
    else:
        print(f"Serving index.html from {app.template_folder}")
        with open(os.path.join(app.template_folder, 'index.html'), 'r') as f:
            content = f.read()
            print(f"index.html content: {content[:100]}...")  # Print first 100 characters
        return send_from_directory(app.template_folder, 'index.html')

@app.route('/api/players', methods=['GET'])
def get_players():
    try:
        players = fetch_player_list()
        return jsonify(players)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/all-players', methods=['GET'])
def get_all_players():
    try:
        all_players = fetch_player_list()
        if isinstance(all_players, dict):
            player_list = all_players.get('body', [])
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
        ]
        return jsonify(processed_players)
    except Exception as e:
        print("Error in get_all_players:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/optimize-lineup', methods=['POST'])
def optimize_lineup():
    players = request.json.get('players', [])
    
    if not players:
        return jsonify({"error": "No players provided"}), 400
    
    try:
        optimized_lineup = process_and_evaluate_players(players)
        return jsonify({"optimized_lineup": optimized_lineup})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/save-lineup', methods=['POST'])
def save_lineup():
    lineup = request.json.get('lineup', [])
    if not lineup:
        return jsonify({"error": "No lineup provided"}), 400

    session['saved_lineup'] = lineup
    return jsonify({"message": "Lineup saved successfully"})

@app.route('/api/get-saved-lineup', methods=['GET'])
def get_saved_lineup():
    saved_lineup = session.get('saved_lineup', [])
    return jsonify(saved_lineup)

def process_and_evaluate_players(players):
    # Your existing optimization logic here
    # You may need to adjust this based on the data structure from your new API
    pass

@app.route('/static/build/static/js/main.072a731b.js')
def serve_js():
    print("Serving JavaScript file")
    return send_from_directory('static/build/static/js', 'main.072a731b.js')

@app.route('/api/check', methods=['GET'])
def check():
    return jsonify({"status": "Server is running"}), 200

if __name__ == '__main__':
    app.run(debug=True)
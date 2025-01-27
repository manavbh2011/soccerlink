from flask import Flask, request, jsonify
from flask_cors import CORS
from find_connections_test import find_connections, read_into_dict, open_graph, is_teammate
import random

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for the frontend

graph = open_graph()
players_game = read_into_dict("players_game.csv").values()
players_with_nation = list(read_into_dict("players_with_nation.csv").values())
players = [[player[0],player[-1]] for player in players_with_nation] #player with nationality code

@app.route('/api/get-random-players', methods=['GET'])
def get_random_player_route():
    rand_players = random.sample(list(players_game), 2)
    return jsonify({"start": rand_players[0], "end": rand_players[1]})

@app.route('/api/suggest-players', methods=['POST'])
def suggest_players_route():
    query = request.get_json()["query"]
    if not query:
        return jsonify([])  # Empty list for no input
    try:
        matches = [names for names in players if query.lower() in names[0].lower()]
        suggestions = matches[:6] if matches else []
        return jsonify(suggestions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

@app.route('/api/find-connections', methods=['POST'])
def find_connections_route():
    print("Request received")
    data = request.get_json()
    print("Request data: ", data)

    
    # Extract inputs from the request
    input1 = data.get('input1').strip()
    input2 = data.get('input2').strip()
    
    try:
        # Call the function from your Python file
        result = find_connections(graph, input1, input2)
        print(result)
        return jsonify({"result": result})  # Return result as JSON
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/get-nationality', methods=['POST'])
def get_nationality_route():
    query = request.get_json()["playerName"]
    if not query:
        return jsonify([])  # Empty list for no input
    try:
        nationality = [player[-1] for player in players_with_nation if query==player[0]][0]
        return jsonify({"countryCode": nationality})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/validate-connection', methods=['POST'])
def validate_connection_route():
    data = request.get_json()
    input1 = data.get('input1').strip()
    input2 = data.get('input2').strip()
    try:
        result = is_teammate(graph, input1, input2)
        print(result)
        return jsonify({"valid": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True, port=3001)
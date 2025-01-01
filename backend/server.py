from flask import Flask, request, jsonify
from flask_cors import CORS
from find_connections_test import find_connections, read_into_dict, open_graph

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for the frontend

graph = open_graph()
players = read_into_dict("players_large.csv").values()

@app.route('/api/suggest-players', methods=['POST'])
def suggest_players_route():
    query = request.get_json()["query"]
    if not query:
        return jsonify([])  # Empty list for no input
    try:
        matches = [names for names in players if query.lower() in names.lower()]
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

if __name__ == '__main__':
    app.run(debug=True, port=3001)
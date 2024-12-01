import networkx as nx, csv, pickle, os, unicodedata
from datetime import datetime

def remove_accents(input_string):
    # Normalize the strings to remove accents
    nfkd_form = unicodedata.normalize('NFKD', input_string)
    return ''.join([c for c in nfkd_form if not unicodedata.category(c).startswith('M')])

def read_into_dict(file):
    res = {}
    with open(file, 'r') as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            res[row[0]] = row[1:] if len(row)>2 else row[1]
    return res

def process_data_into_graph(players, teams, players_and_teams):
    G = nx.MultiGraph()
    for id, row in players_and_teams.items():
        player_id = row[0]
        team_name = teams[row[1]]
        startDate = datetime.strptime(row[2], '%m/%d/%Y').date()
        endDate = datetime.strptime(row[3], '%m/%d/%Y').date() if row[3] else None
        team_dict = {"TeamName": team_name, "StartDate": startDate, "EndDate": endDate}
        if player_id not in G.nodes:
            player_name = players[player_id]
            G.add_node(player_id, name=player_name, teams=[team_dict])
        else: 
            G.nodes[player_id]["teams"].append(team_dict)
    return add_connections(G)

def add_connections(graph):
    for node1 in graph.nodes:
        for node2 in graph.nodes:
            if node1==node2: continue
            teams = common_teams(graph, node1, node2)
            for team in teams:
                graph.add_edge(node1, node2, key=team)
                graph.add_edge(node2, node1, key=team)
    return graph

def common_teams(graph, node1, node2):
    teams1 = graph.nodes[node1]['teams']
    teams2 = graph.nodes[node2]['teams']
    teams = []
    for dict1 in teams1:
        for dict2 in teams2:
            if dict1["TeamName"]==dict2["TeamName"] and dates_overlap(dict1["StartDate"], dict1["EndDate"], dict2["StartDate"], dict2["EndDate"]):
                teams.append(dict1["TeamName"])
    return teams

def dates_overlap(start1, end1, start2, end2):
    if not end1:
        return not end2 or end2 >= start1
    elif not end2:
        return end1>=start2
    return not (start1 > end2 or start2 > end1)

def get_path(graph, path):
    edge_info = [(u, v, graph[u][v]) for u, v in zip(path[:-1], path[1:])]
    res = []
    for u, v, data in edge_info:
        teams_str = ', '.join(list(data.keys()))
        res.append(f"From {graph.nodes[u]['name']} to {graph.nodes[v]['name']}: Team = {teams_str}")
    return res

def is_valid_path(graph, players_to_id, path):
    curNode = players_to_id[path[0]]
    for player in path[1:]:
        if not graph.has_edge(players_to_id[player], curNode): return False
        curNode = players_to_id[player]
    return True

def names_to_id(graph):
    return {graph.nodes[node]["name"]:node for node in graph.nodes}

def dump_graph(folder_file_path):
    players = read_into_dict('players_medium.csv')
    teams = read_into_dict('teams_medium.csv')
    players_and_teams = read_into_dict('players_and_teams_medium.csv')
    graph = process_data_into_graph(players, teams, players_and_teams)
    file_path = f"{folder_file_path}graph_{datetime.now().timestamp()}.gpickle"
    with open(file_path, 'wb') as f:
        pickle.dump(graph, f)

def find_connections(player1, player2, newGraph=True):
    folder_file_path = os.path.dirname(os.path.abspath(__file__))+"/graphs/"
    if newGraph:
        dump_graph(folder_file_path)
    file_path = folder_file_path+os.listdir(folder_file_path)[0]
    try:
        with open(file_path, 'rb') as f:
            graph = pickle.load(f)
    except Exception as e:
        return f"Failed to load graph from '{file_path}': {e}"
    names_to_id_dict = names_to_id(graph)
    player1, player2 = remove_accents(player1), remove_accents(player2)
    if player1 not in names_to_id_dict: 
        print(f"{player1} not in database.")
        return
    if player2 not in names_to_id_dict: 
        print(f"{player2} not in database.")
        return
    try:
        path = nx.shortest_path(graph, source=names_to_id_dict[player1], target=names_to_id_dict[player2])
        return get_path(graph, path)
    except: return f"No connections exist between {player1} and {player2}."

# def play_game():
#     players = read_into_dict('players.csv')
#     teams = read_into_dict('teams.csv')
#     players_and_teams = read_into_dict('players_and_teams.csv')
#     player1 = input("Choose the first player: ")
#     if player1 not in players.values(): 
#         print(f"{player1} not in database.")
#         return
#     player2 = input("Choose the second player: ")
#     if player2 not in players.values(): 
#         print(f"{player2} not in database.")
#         return
#     players_to_id = {v: k for k, v in players.items()}
#     graph = process_data_into_graph(players, teams, players_and_teams)
#     game_mode = input("Select the mode:\n1. Print the shortest path between two players.\n2. Provide a path between the two players.\n")
#     if game_mode=='1':
#         try:
#             path = nx.shortest_path(graph, source=players_to_id[player1], target=players_to_id[player2])
#             print_path_clean(graph, path)
#         except: print(f"No connections exist between {player1} and {player2}.")
#     elif game_mode=='2':
#         input_path = input("List the players that form a path between players 1 and 2, including those two players. Separate players by a \", \": ")
#         input_path = input_path.split(", ")
#         for name in input_path:
#             if name not in players.values(): 
#                 print("1 or more players entered are not in the database")
#                 return
#         else:
#             if is_valid_path(graph, players_to_id, input_path): print("These connections are valid!")
#             else: print("These connections are invalid.")
#     else: print("Valid game mode not entered. Game restarting...")

if __name__ == "__main__":
    #play_game()
    print(find_connections("Peter Crouch", "Lionel Messi", newGraph=False))

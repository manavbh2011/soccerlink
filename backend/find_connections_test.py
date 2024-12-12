import networkx as nx, csv, pickle, os, unicodedata, random
from datetime import datetime

def remove_accents(input_string):
    # Normalize the strings to remove accents
    nfkd_form = unicodedata.normalize('NFKD', input_string)
    return ''.join([c for c in nfkd_form if not unicodedata.category(c).startswith('M')])

def read_into_dict(file):
    res = {}
    file_path = os.path.join(os.path.dirname(__file__), file)
    with open(file_path, 'r') as f:
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
    print(len(G))
    return add_connections(G)

def add_connections(graph):
    num_computations = 0
    half_graph = list(graph.nodes)[:len(graph.nodes)//2]
    for node1 in graph.nodes:
        for node2 in half_graph:
            num_computations+=1
            if num_computations%1000000==0: print(f"Computation: {num_computations}: {graph.nodes[node1]["name"]} and {graph.nodes[node2]["name"]}")
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
        res.append({"from": graph.nodes[u]['name'], "to": graph.nodes[v]['name'], "teams": teams_str})
    return res

def is_valid_path(graph, players_to_id, path):
    curNode = players_to_id[path[0]]
    for player in path[1:]:
        if not graph.has_edge(players_to_id[player], curNode): return False
        curNode = players_to_id[player]
    return True

def names_to_id(graph):
    return {graph.nodes[node]["name"]:node for node in graph.nodes}

def suggest_players(query):
    players = read_into_dict("players_large.csv").values()
    matches = [names for names in players if query.lower() in names.lower()]
    return matches[:6] if matches else []

def dump_graph(folder_file_path):
    players = read_into_dict('players_large.csv')
    teams = read_into_dict('teams_large.csv')
    players_and_teams = read_into_dict('players_and_teams_large.csv')
    graph = process_data_into_graph(players, teams, players_and_teams)
    file_path = f"{folder_file_path}graph_{datetime.now().timestamp()}.gpickle"
    with open(file_path, 'wb') as f:
        pickle.dump(graph, f)

def find_connections(player1, player2, newGraph=True):
    folder_file_path = os.path.dirname(os.path.abspath(__file__))+"/graphs/"
    if newGraph:
        dump_graph(folder_file_path)
    file_path = folder_file_path+sorted(os.listdir(folder_file_path))[-2]
    print(file_path)
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
        paths = [p for p in nx.all_shortest_paths(graph, source=names_to_id_dict[player1], target=names_to_id_dict[player2])]
        rand_path = random.choice(paths)
        return get_path(graph, rand_path)
    except: return {f"error": "No connections exist between {player1} and {player2}."}

if __name__ == "__main__":
    #play_game()
    print(find_connections("Erling Haaland", "Pele", newGraph=False))
    #print(suggest_players("Ron"))

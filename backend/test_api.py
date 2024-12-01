import requests, csv
from bs4 import BeautifulSoup

# player_name = "Lionel Messi"
# response = requests.get(f"http://localhost:8000/players/search/{player_name}")

# # Check if the request was successful
# if response.status_code == 200:
#     data = response.json()['results']
#     print(data[0])
# else:
#     print("Error:", response.status_code)

#STEPS
#Find list of most famous players -- players that have played on one of the big clubs
#Get IDs for list of players
#For each player, get teams and input information into CSV
#Input CSV into the graph and find connections
#Update to change from CSV to DB

def output_players_and_teams():
    url = "https://ainsworthsports.com/soccer_player_rankings_all_time_1_to_1000.htm"
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")
    tags = soup.find_all("td")
    with open("players_medium.csv", "w", newline='') as f1, open("players_and_teams_medium.csv", "w", newline='') as f2: 
        writer = csv.writer(f1)
        writer2 = csv.writer(f2)
        writer.writerow(["id", "player_name"])
        writer2.writerow(["id", "player_id", "team_id", "start_date", "end_date"])
        for i in range(29, len(tags), 4): #jump to first name tag, names are every 4 tags
            player_name = tags[i].text.strip()
            id = (i-24)//4
            writer.writerow([id, player_name])
            teams = get_teams_for_player(player_name)
            team_id = 1
            for team in teams:
                writer2.write
def output_teams():
    url = "https://footballdatabase.com/ranking/world/"
    team_id = 1
    f = open("teams_medium.csv", "w", newline='')
    writer = csv.writer(f)
    for i in range(1, 11):
        response = requests.get(f"{url}{i}")
        soup = BeautifulSoup(response.content, "html.parser")
        tags = soup.find_all("td", class_= "club text-left")
        for tag in tags:
            writer.writerow([team_id, tag.a.text.strip()])
            team_id+=1
def get_teams_for_player(player_name):
    id_response = requests.get(f"http://localhost:8000/players/search/{player_name}")
    if id_response.status_code == 200:
        player_id = id_response.json()['results'][0]["id"]
    else:
        print(f"Error for {player_name}: {id_response.status_code}")
    
    teams_response = requests.get(f"http://localhost:8000/players/{player_id}/transfers")
    

#output_players_and_teams()
#output_teams()
get_teams_for_player("Lionel Messi")
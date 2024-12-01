from bs4 import BeautifulSoup
import requests, random, networkx as nx, joblib

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',}
def generate_players(num_players):
    player_ids = []
    for i in range(num_players):
        rand = random.randint(1, 800000)
        if rand not in player_ids: 
            player_ids.append(rand)
            url = f"https://www.transfermarkt.us/ceapi/transferHistory/list/{rand}"
            find_teams_for_player(url)
def find_teams_for_player(url):
    response = requests.get(url, headers=headers)
    if response.status_code==404: return False
    data = response.json()
    player_name = ""
    names = data["url"].split("/")[1].split("-")
    for name in names:
        player_name+=name[0].upper() + name[1:] + " "
    print(player_name)
    for transfer in data["transfers"]:
        if transfer["to"]["clubName"]!="Retired":
            print(transfer["dateUnformatted"], transfer["from"]["clubName"], transfer["to"]["clubName"])
    print()
    return True
def find_players_for_team_and_year(url, year):
    url = f"{url}{year}"
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.content, "html.parser")
    tags = soup.find_all("td", class_ = "hauptlink")
    for tag in tags:
        if tag.a:
            name = tag.a.text.strip()
            if name[0]!="€": 
                player_id = tag.a['href'].split('/')[-1]
                url = "https://www.transfermarkt.us/ceapi/transferHistory/list/" + player_id
                if not find_teams_for_player(url): print(f"FAILED for {name}")
if __name__ == "__main__":
    teams = {"manchester-city": 281, "real-madrid": 418, "fc-barcelona": 131}
    for team in teams: 
        print(team)
        url = f"https://www.transfermarkt.com/{team}/kader/verein/{teams[team]}/saison_id/"
        find_players_for_team_and_year(url, 2015)


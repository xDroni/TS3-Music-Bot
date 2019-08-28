# TeamSpeak 3 Music Bot
TeamSpeak 3 Music Bot in NodeJS with some cool features

Features:
- Music (Youtube API)
  - adding songs to the queue
  - skipping current song, skipping last added song
  - getting title of the current song
  - counting songs in the queue
  
- League of Legends (RIOT API)
  - printing 5 best champions of the player in terms of mastery points
  - printing player's current match with all the players, theirchampions, divisions and rankeds winratio
  - printing average cs per minute in last player's game and compare that score to another player

- Other
  - sending a welcome message with some statistics to every user that joins our server
  - auto moving AFK users to specific channel
  
## Instalation
You need <a href="https://nodejs.org/en/">NodeJS</a>, <a href="https://ffmpeg.org/">ffmpeg</a> and <a href="https://docs.mongodb.com/manual/installation/">MongoDB</a> installed.

### Step 1
- Clone this repo to your local machine
```
git clone https://github.com/xDroni/TeamSpeak-3-Music-Bot-Node-JS.git
```
### Step 2
- Install packages
```
npm install
```
### Step 3 
- Run the Music Bot with parameters
```
npm start host="server_address" login="query_login" password="query_password"
```

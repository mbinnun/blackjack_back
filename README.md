## EmployeeSys Rest API

Backend API files of Blackjack Game.

## To install

- git clone https://github.com/mbinnun/blackjack-back
- cd blackjack-back
- cp .env.example .env

1. fill in all the parameters in the .env file. Tune them to your needs
2. on your mongodb server, create a db named EMPLOYEES and a collection name TblEmployees
3. paste the contents of the file "/db_restore/TblEmployees.json" into the TblEmployees collection

- npm install

## Start the API server

npm start

## The APIs collection

<br>**GET:** /api/games/
<br>**Description** Fetch the games list
<br>
<br>**GET:** /api/games/{:id}
<br>**Description** Fetch the details of a game by its id
<br>
<br>**POST:** /api/games/
<br>**Description** Register a new game
<br>
<br>**PUT:** /api/games/restart/{:id}
<br>**Params** id
<br>**Description** Restart a game to the initial state
<br>
<br>**PUT:** /api/games/bet/{:id}
<br>**Params** id, bet
<br>**Description** Place a bet in a game
<br>**Rem** Bet should be an integer number
<br>
<br>**PUT:** /api/games/take/{:id}
<br>**Params** id
<br>**Description** Player takes a card in a game
<br>
<br>**PUT:** /api/games/expose/{:id}
<br>**Params** id
<br>**Description** Expose all the cards in a game (including dealer cards)

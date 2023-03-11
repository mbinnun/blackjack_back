var express = require("express");
const GamesController = require("../controllers/GamesController");

var router = express.Router();

// Game routings
router.get   ("/"            , GamesController.gamesList);       // show games list
router.get   ("/:id"         , GamesController.gameDetail);      // get extended details of a games by id
router.post  ("/"            , GamesController.gameRegister);    // register a new game to the system.
router.put   ("/restart/:id" , GamesController.gameRestart);     // restart a game
router.put   ("/bet/:id"     , GamesController.gamePlaceBet);    // place a bet for a game
router.put   ("/take/:id"    , GamesController.gameTakeCard);    // player take a card
router.put   ("/expose/:id"  , GamesController.gameExposeCards); // expose dealer cards

module.exports = router;

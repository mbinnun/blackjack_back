const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// ==> Schema of a game on the DB
const GamesSchema = new Schema({
	dtInsert:            { type: Date   , default: new Date().toISOString() }, // games's document creation date
	dtUpdate:            { type: Date   , default: new Date().toISOString() }, // games's document last update date
	possibleCards:       { type: [ Schema.Types.Mixed ], default: [] },        // the card deck
	dealer:              { type: Schema.Types.Mixed, default: null },          // dealer's hand
	player:              { type: Schema.Types.Mixed, default: null },          // player's hand
	wallet:              { type: Number , default: 0 },                        // player's balance
	currentBet:          { type: Schema.Types.Mixed, default: null },          // player's current bet
	gameOver:            { type: Boolean, default: false },                    // flag if game is over
	message:             { type: Schema.Types.Mixed, default: null },          // last message shown
});

module.exports = mongoose.model("TblGames", GamesSchema, "TblGames");

// ==> Data model dependencies
const Game = require("../models/GameModel");
// ==> Validator dependencies
const { body,validationResult } = require("express-validator");
const { sanitizeBody }          = require("express-validator");
// ==> Response dependencies
const apiResponse = require("../helpers/apiResponse");
// ==> DB connection dependencies
const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);
// ==> Helper
const gameFunc = require("../helpers/gameFunc");

// Game structure for response objects
class GameData {
	constructor(data) {
		this.id               = data._id;
		this.dtInsert         = data.dtInsert;
		this.dtUpdate         = data.dtUpdate;
		this.possibleCards    = data.possibleCards;
		this.dealer           = data.dealer;
		this.player           = data.player;
		this.wallet           = data.wallet;
		this.currentBet       = data.currentBet;
		this.gameOver         = data.gameOver;
		this.message          = data.message;
	}
}


/**
 * Games list << [GET]: /api/games/ >>
 * 
 * @returns {Object}
 */
exports.gamesList = [

	// Fetch the game list
	(req, res) => {
		try {
			Game.find({}, "_id dtInsert wallet").then((arrGames) => {
				if (arrGames.length > 0) {
					return apiResponse.successResponseWithData(res, "Games Data Fetch Success", arrGames);
				} else {
					return apiResponse.successResponseWithData(res, "Games Data Fetch Success", []);
				}
			});
		} catch (err) {
			//throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}

];


/**
 * Game details by id << [GET]: /api/games/{:id} >>
 * 
 * GET @param {string}      id
 * 
 * @returns {Object}
 */
exports.gameDetail = [

	// Fetch the game details
	(req, res) => {
		if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
			// ID is not valid ==> error 404
			return apiResponse.notFoundResponse(res, "Game not found");
		}
		try {
			// Find the game
			Game.findOne({_id: req.params.id}, "_id dtInsert dtUpdate possibleCards dealer player wallet currentBet gameOver message").then((objGame) => {
				if (objGame !== null) {
					// Return the game data
					const objGameData = new GameData(objGame);
					return apiResponse.successResponseWithData(res, "Game Data Fetch Success", objGameData);
				} else {
					// Not found ==> error 404
					return apiResponse.notFoundResponse(res, "Game not found");
				}
			});
		} catch (err) {
			// Error ==> throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}

];


/**
 * Game registration from scratch << [POST]: /api/games/ >>
 *
 * @returns {Object}
*/
exports.gameRegister = [

	// === Process request after validation and sanitization ===
	(req, res) => {
		try {
			// Extract the validation errors from a request
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Display errors if exist
				return apiResponse.validationErrorWithData(res, "Validation Error", errors.array());
			} else {

				// Card Deal Calculation
				const possibleCards = gameFunc.generatePossibleCards();
				const { updatedPossibleCards, player, dealer } = gameFunc.dealCards(possibleCards);

				// Create User object with escaped and trimmed data
				const game = new Game({
					dtInsert:            new Date().toISOString(),  // set to now
					dtUpdate:            new Date().toISOString(),  // set to now
					possibleCards: updatedPossibleCards, // the card deck
					dealer,
					player,
					wallet: 100, // the user's wallet tells how much money left to perform bets
					currentBet: null,
					gameOver: false,
					message: null,
				});
				
				// Save game
				game.save((err) => {
					if (err) { 
						// handle save errors
						return apiResponse.ErrorResponse(res, err);
					}
					const gameData = {
						_id:              game._id,
						possibleCards:    game.possibleCards,
						dealer:           game.dealer,
						player:           game.player,
						wallet:           game.wallet,
						currentBet:       game.currentBet,
						gameOver:         game.gameOver,
						message:          game.message,
					};
					return apiResponse.successResponseWithData(res, "Game Registration Success", gameData);
				});
				
			}
		} 
		catch (err) {
			// if error has occured, show error 500
			return apiResponse.ErrorResponse(res, err);
		}
	}

];


/**
 * Game restart to the initial state by id << [PUT]: /api/games/restart/{:id} >>
 * 
 * GET @param {string}      id
 * GET @param {string}      type
 * 
 * @returns {Object}
 */
exports.gameRestart = [

	// == Perform update ==
	(req, res) => {
		try {
			// Extract the validation errors from a request
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Return errors if exist
				return apiResponse.validationErrorWithData(res, "Validation Error", errors.array());
			} else {
				// Validate that updated game id is correct
				if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
					// Game ID is invalid ==> return error
					return apiResponse.validationErrorWithData(res, "Validation Error", "Invalid Game ID");
				} else {
					// Find the record
					Game.findById(req.params.id, (err, foundGame) => {
						if (foundGame === null) {
							// Not found game ==> return error
							return apiResponse.validationErrorWithData(res, "Validation Error", "Game does not exist");
						} else {
							// Card Deal Calculation
							const type = req.query.type || "";
							let changesForUpdate = {};
							if (type === "continue") {
								// ==> Player has chosen to play another round
								if (foundGame.wallet > 0) {
									// ==> If he has enough money to play
        							// ==> Try to preseve what has been left in the deck (so that we'll use the most possible cards from the deck)
									const possibleCards = (foundGame.possibleCards.length < 10) ? this.generatePossibleCards() : foundGame.possibleCards;
									const { updatedPossibleCards, player, dealer } = gameFunc.dealCards(possibleCards);
									changesForUpdate = {
										dtUpdate:     new Date().toISOString(),  // set to now
										possibleCards: updatedPossibleCards,
										dealer,
										player,
										currentBet: null,
										gameOver: false,
										message: null,
									};
								} else {
									// ==> If player has no money left
									const possibleCards = gameFunc.generatePossibleCards();
									const { updatedPossibleCards, player, dealer } = gameFunc.dealCards(possibleCards);
									changesForUpdate = {
										message: "המשחק הסתיים! אין לך כסף, אנא אתחל את המשחק.",
									};
								}
							}
							else {
								const possibleCards = gameFunc.generatePossibleCards();
								const { updatedPossibleCards, player, dealer } = gameFunc.dealCards(possibleCards);
								changesForUpdate = {
									dtUpdate:     new Date().toISOString(),  // set to now
									possibleCards: updatedPossibleCards,
									dealer,
									player,
									wallet: 100,
									currentBet: null,
									gameOver: false,
									message: null,
								};
							}
							// Update the game
							Game.findByIdAndUpdate(req.params.id, changesForUpdate, {}, (err, game) => {
								if (err) {
									// If update failed ==> show error
									return apiResponse.ErrorResponse(res, err); 
								} else {
									// Success ==> return the data
									const gameData = {
										...{
											_id:              game._id,
											possibleCards:    game.possibleCards,
											dealer:           game.dealer,
											player:           game.player,
											wallet:           game.wallet,
											currentBet:       game.currentBet,
											gameOver:         game.gameOver,
											message:          game.message,
										},
										...changesForUpdate
									};
									return apiResponse.successResponseWithData(res, "Game Restart Success", gameData);
								}
							});
						}
					});
				}
			}
		} catch (err) {
			// Error ==> throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}

];


/**
 * Game update with new data by id << [PUT]: /api/games/bet/{:id} >>
 * 
 * GET @param {string}      id
 * PUT @param {number}      bet
 * 
 * @returns {Object}
 */
 exports.gamePlaceBet = [

	// Validate first name
	body("bet")
	  .isLength({ min: 1 }).trim().withMessage("Bet value is required")
		.isInt({ min: 1 }).withMessage("Bet value sould be an integer number"),
	
	// Sanitize data from input
	sanitizeBody("bet").trim().escape(),

	// == Perform Set Bet ==
	(req, res) => {
		try {
			// Extract the validation errors from a request
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Return errors if exist
				return apiResponse.validationErrorWithData(res, "Validation Error", errors.array());
			} else {
				// Validate that updated game id is correct
				if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
					// Game ID is invalid ==> return error
					return apiResponse.validationErrorWithData(res, "Validation Error", "Invalid Game ID");
				} else {
					// Find the record
					Game.findById(req.params.id, (err, foundGame) => {
						if (foundGame === null) {
							// Not found game ==> return error
							return apiResponse.validationErrorWithData(res, "Validation Error", "Game does not exist");
						} else {
							// Bet Calculation
							let changesForUpdate = {};
							// ==> Check what the player chosen to bet and act accordingly
							const currentBet = parseInt(req.body.bet);

							if (currentBet > foundGame.wallet) {
								// ==> Not enough money for the requested bet
								changesForUpdate = {
									dtUpdate: new Date().toISOString(),  // set to now
									message: "אין לך מספיק כסף לגודל ההימור המבוקש.",
								};
							} else if (currentBet % 1 !== 0) {
								// ==> Should be an integer bet
								changesForUpdate = {
									dtUpdate: new Date().toISOString(),  // set to now
									message: "ההימור חייב להיות מספרי בלבד.",
								};
							} else if (currentBet <= 0) {
								// ==> Should be a positive bet
								changesForUpdate = {
									dtUpdate: new Date().toISOString(),  // set to now
									message: "יש להמר על סכום כסף חיובי בלבד.",
								};
							} else {
								// ==> Valid bet ==> Reduce he sum from the wallet
								const wallet = foundGame.wallet - currentBet;
								changesForUpdate = {
									dtUpdate: new Date().toISOString(),  // set to now
									message: null,
									wallet,
									currentBet,
								};
							}
							// Update the game
							Game.findByIdAndUpdate(req.params.id, changesForUpdate, {}, (err, game) => {
								if (err) {
									// If update failed ==> show error
									return apiResponse.ErrorResponse(res, err); 
								} else {
									// Success ==> return the data
									const gameData = {
										...{
											_id:              game._id,
											possibleCards:    game.possibleCards,
											dealer:           game.dealer,
											player:           game.player,
											wallet:           game.wallet,
											currentBet:       game.currentBet,
											gameOver:         game.gameOver,
											message:          game.message,
										},
										...changesForUpdate
									};
									return apiResponse.successResponseWithData(res, "Game Restart Success", gameData);
								}
							});
						}
					});
				}
			}
		} catch (err) {
			// Error ==> throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}
	
];


/**
 * Game update with new data by id << [PUT]: /api/games/take/{:id} >>
 * 
 * GET @param {string}      id
 * 
 * @returns {Object}
 */
 exports.gameTakeCard = [

	// == Perform Set Bet ==
	(req, res) => {
		try {
			// Extract the validation errors from a request
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Return errors if exist
				return apiResponse.validationErrorWithData(res, "Validation Error", errors.array());
			} else {
				// Validate that updated game id is correct
				if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
					// Game ID is invalid ==> return error
					return apiResponse.validationErrorWithData(res, "Validation Error", "Invalid Game ID");
				} else {
					// Find the record
					Game.findById(req.params.id, (err, foundGame) => {
						if (foundGame === null) {
							// Not found game ==> return error
							return apiResponse.validationErrorWithData(res, "Validation Error", "Game does not exist");
						} else {

							// Take Card Calculation
							let changesForUpdate = {};

							// ==> Player has chosen to take another card from the deck in the current round
							if (!foundGame.gameOver) {
									if (foundGame.currentBet) {
									// ==> If game is still running and bet is valid ==> Get an additional card from the deck and save it to the player's cards
									const { randomCard, updatedPossibleCards } = gameFunc.getRandomCard(foundGame.possibleCards);
									const player = foundGame.player;
									player.cards.push(randomCard);
									player.count = gameFunc.getCount(player.cards);
							
									if (player.count > 21) {
										// ==> If after taking the additional card the player has passed sum of 21 ==> The player loses the round
										// ==> Not enough money for the requested bet
										changesForUpdate = {
											dtUpdate: new Date().toISOString(),  // set to now
											player,
											gameOver: true,
											message: "הפסדת! סכום הקלפים שברשותך הוא מעל 21.",
										};
									} else {
										changesForUpdate = {
											dtUpdate: new Date().toISOString(),  // set to now
											possibleCards: updatedPossibleCards,
											player,
										};
									}
								} else {
									// ==> If not set a bet yet, cannot take a card
									changesForUpdate = {
										dtUpdate: new Date().toISOString(),  // set to now
										message: "אנא ספר לנו על כמה תרצה להמר.",
									};
								}
							} else {
								// ==> If game is over, cannot take a card
								changesForUpdate = {
									dtUpdate: new Date().toISOString(),  // set to now
									message: "המשחק הסתיים! אנא אתחל את המשחק.",
								};
							}

							// Update the game
							Game.findByIdAndUpdate(req.params.id, changesForUpdate, {}, (err, game) => {
								if (err) {
									// If update failed ==> show error
									return apiResponse.ErrorResponse(res, err); 
								} else {
									// Success ==> return the data
									const gameData = {
										...{
											_id:              game._id,
											possibleCards:    game.possibleCards,
											dealer:           game.dealer,
											player:           game.player,
											wallet:           game.wallet,
											currentBet:       game.currentBet,
											gameOver:         game.gameOver,
											message:          game.message,
										},
										...changesForUpdate
									};
									return apiResponse.successResponseWithData(res, "Game Restart Success", gameData);
								}
							});
						}
					});
				}
			}
		} catch (err) {
			// Error ==> throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}
	
];


/**
 * Game update with new data by id << [PUT]: /api/games/expose/{:id} >>
 * 
 * GET @param {string}      id
 * 
 * @returns {Object}
 */
 exports.gameExposeCards = [

	// == Perform Set Bet ==
	(req, res) => {
		try {
			// Extract the validation errors from a request
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Return errors if exist
				return apiResponse.validationErrorWithData(res, "Validation Error", errors.array());
			} else {
				// Validate that updated game id is correct
				if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
					// Game ID is invalid ==> return error
					return apiResponse.validationErrorWithData(res, "Validation Error", "Invalid Game ID");
				} else {
					// Find the record
					Game.findById(req.params.id, (err, foundGame) => {
						if (foundGame === null) {
							// Not found game ==> return error
							return apiResponse.validationErrorWithData(res, "Validation Error", "Game does not exist");
						} else {

							// Take Card Calculation
							let changesForUpdate = {};

							if (!foundGame.gameOver) {
								// ==> Game is still running
								// ==> Take the second card of the dealer
								const randomCard = gameFunc.getRandomCard(foundGame.possibleCards);
								let possibleCards = randomCard.updatedPossibleCards;
								let dealer = foundGame.dealer;
								// ==> Remove the null card before taking any more cards
								dealer.cards.pop();
								dealer.cards.push(randomCard.randomCard);
								dealer.count = gameFunc.getCount(dealer.cards);
						  
								// ==> As long as the dealer has not get the result of 17 or above, keep taking cards from the deck
								while(dealer.count < 17) {
								    const draw = gameFunc.dealerDraw(dealer, possibleCards);
								    dealer = draw.dealer;
								    possibleCards = draw.updatedPossibleCards;
								}
						  
								// ==> Finally, calculate the game result
								if (dealer.count > 21) {
								    // ==> If the dealer got beyond 21, delaer loses!
								    changesForUpdate = {
										dtUpdate: new Date().toISOString(),  // set to now
										possibleCards,
										dealer,
										wallet: foundGame.wallet + foundGame.currentBet * 2,
										gameOver: true,
										message: "הדילר הפסיד כי סכום הקלפים שבשותו מעל 21! אתה ניצחת.",
									};
								} else {
								    // ==> Calulate the winner by the state
								    const winner = gameFunc.getWinner(dealer, foundGame.player);
								    let wallet = foundGame.wallet;
								    let message;
								  
								    if (winner === "dealer") {
										// ==> Dealer wins ==> The bet remains at the delaer and won't be return to the player since he has lost
										message = "הדילר ניצח.";
								    } else if (winner === "player") {
										// ==> Player wins ==> The bet is being returned to the player, and he gets an additional sum of the bet since he won
										wallet += foundGame.currentBet * 2;
										message = "אתה ניצחת!";
								    } else {
										// ==> If this is a dun, the bet is being returned to the player but he doesn't get an additional sum
										wallet += foundGame.currentBet;
										message = "הסיבוב הסתיים בתיקו.";
								    }
								  
								    // ==> Update the state so that round has been completed
								    changesForUpdate = {
										dtUpdate: new Date().toISOString(),  // set to now
										possibleCards, 
										dealer,
										wallet,
										gameOver: true,
										message,
								    };
								  
								} 
							} else {
								// ==> If game is over, cannot expose cards - should be restarted!
								changesForUpdate = {
									dtUpdate: new Date().toISOString(),  // set to now
									message: "המשחק הסתיים! אנא אתחל את המשחק."
								};
							}

							// Update the game
							Game.findByIdAndUpdate(req.params.id, changesForUpdate, {}, (err, game) => {
								if (err) {
									// If update failed ==> show error
									return apiResponse.ErrorResponse(res, err); 
								} else {
									// Success ==> return the data
									const gameData = {
										...{
											_id:              game._id,
											possibleCards:    game.possibleCards,
											dealer:           game.dealer,
											player:           game.player,
											wallet:           game.wallet,
											currentBet:       game.currentBet,
											gameOver:         game.gameOver,
											message:          game.message,
										},
										...changesForUpdate
									};
									return apiResponse.successResponseWithData(res, "Game Restart Success", gameData);
								}
							});
						}
					});
				}
			}
		} catch (err) {
			// Error ==> throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}
	
];


/** 
 * 
 * Game delete by id << [DELETE]: /api/games/{:id} >>
 * 
 * GET @param {string}      id
 * 
 * @returns {Object}
 */
exports.gameDelete = [
	
	// Perform game deleting
	(req, res) => {
		if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
			return apiResponse.validationErrorWithData(res, "Validation Error", "Invalid game ID");
		}
		try {
			Game.findById(req.params.id, (err, foundGame) => {
				if (foundGame === null){
					return apiResponse.validationErrorWithData(res, "Validation Error", "Game does not exist");
				} else {
					// delete game
					Game.findByIdAndRemove(req.params.id, (err) => {
							if (err) { 
								return apiResponse.ErrorResponse(res, err); 
							} else {
								return apiResponse.successResponse(res, "Game delete Success");
							}
					});
				}
			});
		} catch (err) {
			// Error: throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}

];

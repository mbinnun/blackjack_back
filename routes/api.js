const express         = require("express");
const gamesRouter = require("./games");

const app = express();

// API routings ==> Direct all to the game router
app.use("/games/", gamesRouter);

module.exports = app;

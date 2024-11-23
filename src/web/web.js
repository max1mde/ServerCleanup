const express = require("express");
const bodyParser = require("body-parser");
const { cleanupMessages } = require("../actions");

function setupWeb(app, discordClient) {
  app.use(bodyParser.urlencoded({ extended: true }));
  app.set("view engine", "ejs");
  app.set("views", __dirname + "/views");
  app.use(express.static(__dirname + "/public"));

  app.get("/", (req, res) => {
    res.render("index", { message: null });
  });

  app.post("/execute", async (req, res) => {
    const { token, userId, contentFilter, delay, limit } = req.body;
    try {
      await cleanupMessages(discordClient, {
        token,
        userId,
        contentFilter,
        delay: parseInt(delay) * 1000,
        limit: parseInt(limit),
      });
      res.render("index", { message: "Action executed successfully!" });
    } catch (err) {
      res.render("index", { message: `Error: ${err.message}` });
    }
  });
}

module.exports = { setupWeb };

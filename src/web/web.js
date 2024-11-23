const socketIo = require("socket.io");
const express = require("express");

function setupWeb(app, discordClient) {
  const server = require("http").createServer(app);
  const io = socketIo(server);

  app.use(express.urlencoded({ extended: true }));

  app.set("view engine", "ejs");
  app.set("views", __dirname + "/views");
  app.use(express.static(__dirname + "/public"));

  app.get("/", (req, res) => {
    res.render("index", { message: null });
  });

  app.post("/execute", async (req, res) => {
    const { token, userId, contentFilter, delay, limit } = req.body;

    try {
      io.emit("log", `Logging in with token...`);
      await discordClient.login(token);
      io.emit("log", `Successfully logged into Discord.`);

      await discordClient.deleteMessages({
        userId,
        contentFilter,
        delay: parseInt(delay) * 1000,
        limit: parseInt(limit),
      });

      io.emit("log", `Task completed successfully.`);
    } catch (err) {
      io.emit("log", `Error: ${err.message}`);
    } finally {
      discordClient.client.destroy();
    }
  });

  io.on("connection", (socket) => {
    console.log("Console connected");
  });

  return server;
}

module.exports = { setupWeb };

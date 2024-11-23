const socketIo = require("socket.io");
const express = require("express");
const { Client } = require("../discord");

function setupWeb(app) {
  const server = require("http").createServer(app);
  const io = socketIo(server);
  let currentClient = null;

  app.use(express.urlencoded({ extended: true }));
  app.set("view engine", "ejs");
  app.set("views", __dirname + "/views");
  app.use(express.static(__dirname + "/public"));

  app.get("/", (req, res) => {
    res.render("index", { message: null });
  });

  io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("initializeClient", async ({ token }) => {
      try {
        if (currentClient) {
          currentClient.client.destroy();
        }

        currentClient = new Client();
        socket.emit(
          "log",
          `${currentClient.formatLogTime()} [Logging in to Discord...]`
        );

        await currentClient.login(token);

        const guilds = currentClient.client.guilds.cache.map((guild) => ({
          id: guild.id,
          name: guild.name,
        }));

        socket.emit("guilds", guilds);
        socket.emit(
          "log",
          `${currentClient.formatLogTime()} [Successfully logged into Discord]`
        );
      } catch (err) {
        socket.emit(
          "log",
          `${currentClient.formatLogTime()} [Error] ${err.message}`
        );
      }
    });

    socket.on("fetchChannels", ({ guildId }) => {
      try {
        const guild = currentClient.client.guilds.cache.get(guildId);
        if (!guild) throw new Error("Guild not found");

        const channels = guild.channels.cache
          .filter((channel) => channel.type === "GUILD_TEXT")
          .map((channel) => ({
            id: channel.id,(())
            name: channel.name,
          }));

        socket.emit("channels", channels);
      } catch (err) {
        socket.emit("log", `Error: ${err.message}`);
      }
    });

    socket.on("startCleanup", async (data) => {
      try {
        if (!currentClient) throw new Error("Not logged in");

        socket.emit(
          "log",
          `${currentClient.formatLogTime()} [Starting cleanup...]`
        );

        const result = await currentClient.deleteMessages({
          userId: data.userId,
          contentFilter: data.contentFilter,
          delay: parseInt(data.delay) * 1000,
          limit: parseInt(data.limit),
          guildId: data.guild,
          channelId: data.channel,
          onDelete: (deleteResult) => {
            if (deleteResult.success) {
              socket.emit(
                "log",
                `${deleteResult.logTime} [#${deleteResult.channelName}]  [By ${deleteResult.author}] "${deleteResult.content}"`
              );
            } else {
              socket.emit(
                "log",
                `${deleteResult.logTime} [#${deleteResult.channelName}] [Error] [By ${deleteResult.author}] "${deleteResult.content}" - ${deleteResult.error}`
              );
            }
          },
        });

        if (result.type === "info") {
          socket.emit(
            "log",
            `${currentClient.formatLogTime()} [Info] ${result.message}`
          );
        } else if (result.type === "cancelled") {
          socket.emit(
            "log",
            `${currentClient.formatLogTime()} [Cleanup cancelled]`
          );
        }

        socket.emit("cleanupComplete");
        socket.emit(
          "log",
          `${currentClient.formatLogTime()} [Cleanup complete]`
        );
      } catch (err) {
        socket.emit(
          "log",
          `${currentClient.formatLogTime()} [Error] ${err.message}`
        );
        socket.emit("cleanupComplete");
      }
    });

    socket.on("cancelCleanup", () => {
      if (currentClient) {
        currentClient.stopDeleting();
      }
    });
  });

  return server;
}

module.exports = { setupWeb };

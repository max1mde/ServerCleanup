const express = require("express");
const { Client } = require("./discord");
const { setupWeb } = require("./web/web");

const app = express();
const discordClient = new Client();

const server = setupWeb(app, discordClient);
const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

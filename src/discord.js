const { Client } = require("discord.js-selfbot-v13");

class DiscordClient {
  constructor() {
    this.client = new Client();
  }

  login(token) {
    return this.client.login(token);
  }

  async deleteMessages({ userId, contentFilter, delay, limit }) {
    for (const channel of this.client.channels.cache.values()) {
      if (channel.type !== "GUILD_TEXT") continue;
      const messages = await channel.messages.fetch({ limit: 100 });
      const filtered = messages
        .filter(
          (msg) =>
            (!userId || msg.author.id === userId) &&
            (!contentFilter || msg.content.includes(contentFilter))
        )
        .slice(0, limit);

      for (const message of filtered) {
        await message.delete();
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}

module.exports = { Client: DiscordClient };

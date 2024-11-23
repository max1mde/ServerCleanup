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
        try {
          await message.delete();
          console.log(
            `Deleted message from ${message.author.tag}: "${message.content}"`
          );
          const randomizedDelay = delay + (Math.random() * 4000 - 2000); // ±2 seconds
          await new Promise((resolve) => setTimeout(resolve, randomizedDelay));
        } catch (err) {
          console.error(`Failed to delete message: ${err.message}`);
        }
      }
    }
  }
}

module.exports = { Client: DiscordClient };

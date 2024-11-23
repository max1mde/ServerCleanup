const { Client } = require("discord.js-selfbot-v13");

class DiscordClient {
  constructor() {
    this.client = new Client();
    this.isDeleting = false;
  }

  stopDeleting() {
    this.isDeleting = false;
  }

  login(token) {
    return this.client.login(token);
  }

  formatLogTime() {
    const now = new Date();
    return `[${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}]`;
  }

  formatCreationDate(timestamp) {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }

  async deleteMessages({
    userId,
    contentFilter,
    delay,
    limit,
    guildId,
    channelId,
    onDelete,
  }) {
    this.isDeleting = true;
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) throw new Error("Guild not found");

    const channel = guild.channels.cache.get(channelId);
    if (!channel || channel.type !== "GUILD_TEXT")
      throw new Error("Invalid channel");

    const messages = await channel.messages.fetch({ limit: parseInt(limit) });
    const filtered = Array.from(messages.values()).filter(
      (msg) =>
        (!userId || msg.author.id === userId) &&
        (!contentFilter ||
          msg.content.toLowerCase().includes(contentFilter.toLowerCase()))
    );

    if (filtered.length === 0) {
      return {
        type: "info",
        message: "No messages found matching the criteria",
      };
    }

    for (const message of filtered) {
      if (!this.isDeleting) {
        return { type: "cancelled" };
      }

      try {
        await message.delete();
        onDelete({
          success: true,
          channelName: channel.name,
          creationDate: this.formatCreationDate(message.createdTimestamp),
          author: message.author.tag,
          content: message.content,
          logTime: this.formatLogTime(),
        });

        const randomizedDelay = delay + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, randomizedDelay));
      } catch (err) {
        onDelete({
          success: false,
          error: err.message,
          channelName: channel.name,
          author: message.author.tag,
          content: message.content,
          logTime: this.formatLogTime(),
        });
      }
    }

    return { type: "complete" };
  }
}

module.exports = { Client: DiscordClient };

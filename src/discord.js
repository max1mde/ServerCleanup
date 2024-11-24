const { Client } = require("discord.js-selfbot-v13");

class DiscordClient {
  constructor() {
    this.client = new Client();
    this.isDeleting = false;
    this.isFetching = false;
    this.fetchedMessages = [];
  }

  stopFetching() {
    this.isFetching = false;
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

   async getAllMessages(guild, channelId, userId, contentFilter, onFetch) {
    this.isFetching = true;
    this.fetchedMessages = [];
    let allMessages = [];

    if (channelId) {
      const channel = guild.channels.cache.get(channelId);
      if (!channel || channel.type !== "GUILD_TEXT") {
        throw new Error("Invalid channel");
      }

      const searchOptions = {
        channel: [channel.id],
        offset: 0,
      };

      if (userId) searchOptions.authorId = userId;
      if (contentFilter) searchOptions.content = contentFilter;

      try {
        onFetch(`[DEBUG] Searching in channel ${channel.name}`);
        const search = await channel.messages.search(searchOptions);

        if (search && search.messages) {
          const messages = Array.from(search.messages.values());
          allMessages = [...allMessages, ...messages];
          this.fetchedMessages = allMessages;
          onFetch(`[DEBUG] Found ${messages.length} messages in initial search`);

          for (let i = 25; i < search.total; i += 25) {
            if (!this.isFetching) {
              onFetch("[DEBUG] Message fetching cancelled");
              return allMessages;
            }

            searchOptions.offset = i;
            onFetch(`[DEBUG] Fetching next batch with offset: ${i}`);
            const nextSearch = await channel.messages.search(searchOptions);
            if (nextSearch && nextSearch.messages) {
              const nextMessages = Array.from(nextSearch.messages.values());
              allMessages = [...allMessages, ...nextMessages];
              this.fetchedMessages = allMessages;
              onFetch(`[DEBUG] Added ${nextMessages.length} messages from next batch`);
            }
          }
        }
      } catch (error) {
        onFetch(`Search error in channel ${channel.name}: ${error.message}`);
      }
    
    } else {
      const textChannels = guild.channels.cache.filter(
        (channel) => channel.type === "GUILD_TEXT"
      );

      for (const channel of textChannels.values()) {
        const searchOptions = {
          channel: [channel.id],
          offset: 0,
        };

        if (userId) searchOptions.authorId = userId;
        if (contentFilter) searchOptions.content = contentFilter;

        try {
          console.log(
            `[DEBUG] Searching in channel ${channel.name} with options:`,
            searchOptions
          );
          const search = await channel.messages.search(searchOptions);

          if (search && search.messages) {
            const messages = Array.from(search.messages.values());
            allMessages = [...allMessages, ...messages];
            console.log(
              `[DEBUG] Found ${messages.length} messages in channel ${channel.name}`
            );

            for (let i = 25; i < search.total; i += 25) {
              searchOptions.offset = i;
              console.log(`[DEBUG] Fetching next batch with offset:`, i);
              const nextSearch = await channel.messages.search(searchOptions);
              if (nextSearch && nextSearch.messages) {
                const nextMessages = Array.from(nextSearch.messages.values());
                allMessages = [...allMessages, ...nextMessages];
                console.log(
                  `[DEBUG] Added ${nextMessages.length} messages from next batch`
                );
              }
            }
          }
        } catch (error) {
          console.error(`Search error in channel ${channel.name}:`, error);
          continue;
        }
      }
    }

    return allMessages;
  }

 async deleteMessages({
    messages,
    onDelete,
  }) {
    this.isDeleting = true;
    
    if (messages.length === 0) {
      return {
        type: "info",
        message: "No messages found matching the criteria",
      };
    }

    for (const message of messages) {
      if (!this.isDeleting) {
        return { type: "cancelled" };
      }

      try {
        await message.delete();
        onDelete({
          success: true,
          channelName: message.channel?.name || "Unknown Channel",
          creationDate: this.formatCreationDate(message.createdTimestamp),
          author: message.author?.tag || "Unknown Author",
          content: message.content,
          logTime: this.formatLogTime(),
        });

        const randomizedDelay = 1000 + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, randomizedDelay));
      } catch (err) {
        onDelete({
          success: false,
          error: err.message,
          channelName: message.channel?.name || "Unknown Channel",
          author: message.author?.tag || "Unknown Author",
          content: message.content,
          logTime: this.formatLogTime(),
        });

        if (err.code === 429) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }

    return { type: "complete" };
  }

}

module.exports = { Client: DiscordClient };

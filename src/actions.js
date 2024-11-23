async function cleanupMessages(
  client,
  { token, userId, contentFilter, delay, limit }
) {
  await client.login(token);
  await client.deleteMessages({ userId, contentFilter, delay, limit });
  client.client.destroy();
}

module.exports = { cleanupMessages };

import client from "./client.js";

export const cleanUpOldEntries = async (key, windowStart) => {
  // Removes all entries older than the current window from the sorted set
  return client.zremrangebyscore(key, 0, windowStart);
};

export const countActiveEntries = async (key) => {
  // Count the present entries in the sorted set (here for a particular user ip).
  return client.zcard(key);
};

export const addEntryToWindow = async (key, score, value) => {
  return client.zadd(key, score, value);
};

export const getEntriesInRange = async (key, startIndex, endIndex) => {
  return client.zrange(key, startIndex, endIndex, "WITHSCORES");
};

export const setKeyExpiry = async (key, windowSize) => {
  return client.expire(key, windowSize);
};

export const shutdownRedisClient = async () => {
  return client.quit();
};

export const resetRedisState = async () => {
  return client.flushdb();
};

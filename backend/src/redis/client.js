import dotenv from "dotenv";
import { Redis } from "ioredis";

// Load environment variables
dotenv.config();

const redisPort = Number.isInteger(parseInt(process.env.REDIS_PORT, 10))
  ? parseInt(process.env.REDIS_PORT, 10)
  : 6379;

const client = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: redisPort,
  retryStrategy(times) {
    // Redis keeps track of the count (times here)
    // Reconnect every 2 seconds, up to a limit
    if (times > 10) return null;
    return 2000;
  },
});

client.on("connect", () => {
  console.log("Connected to Redis");
});

client.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

export default client;

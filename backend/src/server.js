import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { shutdownRedisClient } from "./redis/helper.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed", err);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  try {
    await shutdownRedisClient();
    console.log('Redis client closed');
  } catch (error) {
    console.error('Error closing Redis client:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  try {
    await shutdownRedisClient();
    console.log('Redis client closed');
  } catch (error) {
    console.error('Error closing Redis client:', error);
  }
  process.exit(0);
});

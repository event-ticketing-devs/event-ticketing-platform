import {
  cleanUpOldEntries,
  countActiveEntries,
  addEntryToWindow,
  getEntriesInRange,
  setKeyExpiry,
} from "../redis/helper.js";
import crypto from "crypto";

// Contact form specific rate limiting - more restrictive
const WINDOW_SIZE = 300; // 5 minutes
const MAX_REQUESTS = 1; // Only 1 contact messages per 5 minutes per IP
const PREFIX = "contact_rate_limiter";

const contactRateLimiter = async (req, res, next) => {
  try {
    const rawIp = req.ip;
    const ip = rawIp.startsWith("::ffff:") ? rawIp.slice(7) : rawIp;
    const key = `${PREFIX}:${ip}`;

    const currentTimestamp = Math.floor(Date.now() / 1000); // in seconds

    // Remove entries older than the 5-minute window
    const cutoffTimestamp = currentTimestamp - WINDOW_SIZE;

    // Cleaning up expired entries
    await cleanUpOldEntries(key, cutoffTimestamp);

    // Counting number of requests
    const count = await countActiveEntries(key);

    if (count < MAX_REQUESTS) {
      // Create unique member for the sorted set entry
      const uniqueMember = `${currentTimestamp}:${crypto.randomUUID()}`;

      // Add entry to the sliding window
      await addEntryToWindow(key, currentTimestamp, uniqueMember);

      // Set TTL for the key
      await setKeyExpiry(key, WINDOW_SIZE);
      return next();
    } else {
      // Getting the time of the first entry that will expire soon
      const [member, firstScore] = await getEntriesInRange(key, 0, 0);
      const firstEntrySeconds = parseInt(firstScore, 10);
      const retryAfterSeconds = Math.max(
        0,
        firstEntrySeconds + WINDOW_SIZE - currentTimestamp
      );

      // Set Retry-After header
      res.setHeader("Retry-After", retryAfterSeconds);

      return res.status(429).json({
        message: `Too many contact requests. Please try again after ${Math.ceil(retryAfterSeconds / 60)} minutes.`,
        retryAfter: retryAfterSeconds
      });
    }
  } catch (err) {
    console.error("Contact Rate Limiting Error: ", err);
    // Allow the request to proceed if Redis is down to avoid blocking legitimate users
    return next();
  }
};

export default contactRateLimiter;

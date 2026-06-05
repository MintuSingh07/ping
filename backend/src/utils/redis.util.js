const Redis = require("ioredis");
const { RedisStore } = require("secure-web-token");
require("dotenv").config();

// Create Redis Client
const redisClient = new Redis(process.env.REDIS_URI || "redis://127.0.0.1:6379");

// Log connection status
redisClient.on("connect", () => {
  console.log("[+] Redis connected successfully");
});

redisClient.on("error", (err) => {
  console.error("[-] Redis connection error:", err);
});

// Create RedisStore
const redisStore = new RedisStore(redisClient, {
  prefix: "ping:session:", // Custom prefix for Ping sessions
  ttl: 7 * 24 * 60 * 60, // 7 days matching login session maxAge
});

module.exports = {
  redisClient,
  redisStore,
};

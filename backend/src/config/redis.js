const Redis = require("ioredis");
let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (t) => t > 5 ? null : Math.min(t * 500, 2000),
    });
    redisClient.on("connect",      () => console.log("✅ Redis Connected"));
    redisClient.on("ready",        () => console.log("🚀 Redis Ready"));
    redisClient.on("error",        (e) => console.error("❌ Redis:", e.message));
    redisClient.on("reconnecting", () => console.log("🔄 Redis reconnecting..."));
    await redisClient.ping();
    return redisClient;
  } catch (e) {
    console.warn("⚠️  Redis failed:", e.message);
    console.warn("⚠️  Continuing without Redis");
    return null;
  }
};

const getRedisClient  = () => redisClient;
const disconnectRedis = async () => {
  if (redisClient) { await redisClient.quit(); redisClient = null; console.log("📦 Redis disconnected"); }
};

module.exports = { connectRedis, getRedisClient, disconnectRedis };

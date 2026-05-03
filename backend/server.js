require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./src/config/db");
const { connectRedis } = require("./src/config/redis");
const { verifyEmailConfig } = require("./src/config/email");
const { startWorker }     = require("./src/queue/workers");
const { getQueue }        = require("./src/queue/jobQueue");
const { initScheduleTriggers } = require("./src/services/schedule.service");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  console.log("\n🚀 FlowBridge Backend Starting...\n");
  console.log(`📌 Brand: ${process.env.BRAND_NAME || "FlowBridge"}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}\n`);

  await connectDB();
  await connectRedis();
  await verifyEmailConfig();
  getQueue();
  startWorker();
  await initScheduleTriggers();

  const server = app.listen(PORT, () => {
    console.log(`\n✅ Server: http://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/health\n`);
  });

  const shutdown = async (signal) => {
    console.log(`\n⚠️  ${signal} — shutting down...`);
    server.close(async () => {
      const { disconnectDB } = require("./src/config/db");
      const { disconnectRedis } = require("./src/config/redis");
      await disconnectDB();
      await disconnectRedis();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));
  process.on("unhandledRejection", (r) => console.error("❌ Unhandled:", r));
  process.on("uncaughtException",  (e) => { console.error("❌ Uncaught:", e); shutdown("uncaughtException"); });
};

startServer();

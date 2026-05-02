const mongoose = require("mongoose");
let isConnected = false;

const connectDB = async () => {
  if (isConnected) { console.log("📦 MongoDB already connected"); return; }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log(`✅ MongoDB: ${conn.connection.host}`);
    mongoose.connection.on("disconnected", () => { isConnected = false; console.warn("⚠️  MongoDB disconnected"); });
    mongoose.connection.on("error", (e) => { isConnected = false; console.error("❌ MongoDB:", e.message); });
    mongoose.connection.on("reconnected", () => { isConnected = true; console.log("🔄 MongoDB reconnected"); });
  } catch (e) {
    console.error("❌ MongoDB failed:", e.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log("📦 MongoDB disconnected");
};

module.exports = { connectDB, disconnectDB };

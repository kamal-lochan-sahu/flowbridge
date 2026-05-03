const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const morgan  = require("morgan");
const { apiLimiter } = require("./src/middleware/rateLimit.middleware");
const { errorMiddleware, notFoundMiddleware } = require("./src/middleware/error.middleware");

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","x-webhook-signature"],
}));

app.use("/api/webhooks/receive", express.raw({ type: "*/*", limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));
app.use("/api", apiLimiter);

app.get("/health", (req, res) => res.json({
  status: "ok", service: "FlowBridge API", version: "1.0.0",
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV,
  brand: process.env.BRAND_NAME || "FlowBridge",
}));

// Routes - uncomment as we build each day
app.use("/api/auth",          require("./src/routes/auth.routes"));
app.use("/api/workflows",     require("./src/routes/workflow.routes"));
app.use("/api/triggers",      require("./src/routes/trigger.routes"));
app.use("/api/actions",       require("./src/routes/action.routes"));
app.use("/api/credentials",   require("./src/routes/credential.routes"));
app.use("/api/webhooks",      require("./src/routes/webhook.routes"));
app.use("/api/logs",          require("./src/routes/log.routes"));
// app.use("/api/templates",     require("./src/routes/template.routes"));
// app.use("/api/integrations",  require("./src/routes/integration.routes"));
// app.use("/api/notifications", require("./src/routes/notification.routes"));
// app.use("/api/settings",      require("./src/routes/settings.routes"));
app.use("/api/dashboard",     require("./src/routes/dashboard.routes"));

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;

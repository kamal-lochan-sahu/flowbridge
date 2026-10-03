// Signed, expiring, single-use OAuth `state` — replaces the old unsigned base64({userId}).
const jwt    = require("jsonwebtoken");
const crypto = require("crypto");
const { getRedisClient } = require("../config/redis");

const TTL_SEC = 600;
const ISSUER  = "flowbridge-oauth";
const mem     = new Map(); // fallback when Redis is down (single instance only)

// Separate key derived from JWT_SECRET so a state token can never be used as an access token
const signingKey = () => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return crypto.createHmac("sha256", process.env.JWT_SECRET).update("flowbridge:oauth-state:v1").digest();
};

const redisReady = () => {
  const c = getRedisClient();
  return c && c.status === "ready" ? c : null;
};

const purgeMem = () => {
  const now = Date.now();
  for (const [k, exp] of mem) if (exp < now) mem.delete(k);
};

const createOAuthState = async (userId, service = "gmail") => {
  const nonce = crypto.randomBytes(16).toString("hex");
  const redis = redisReady();
  if (redis) await redis.set(`oauth:nonce:${nonce}`, "1", "EX", TTL_SEC);
  else { purgeMem(); mem.set(nonce, Date.now() + TTL_SEC * 1000); }
  return jwt.sign({ uid: String(userId), svc: service, n: nonce }, signingKey(), {
    algorithm: "HS256", expiresIn: TTL_SEC, issuer: ISSUER,
  });
};

// Returns { userId, service } or throws. Nonce is consumed (cannot be replayed).
const consumeOAuthState = async (state) => {
  let p;
  try {
    p = jwt.verify(String(state || ""), signingKey(), { algorithms: ["HS256"], issuer: ISSUER });
  } catch {
    throw new Error("Invalid or expired OAuth state");
  }
  let ok = false;
  const redis = redisReady();
  if (redis) {
    const r = await redis.multi().get(`oauth:nonce:${p.n}`).del(`oauth:nonce:${p.n}`).exec();
    ok = r?.[0]?.[1] === "1";
  }
  if (!ok && mem.has(p.n)) { ok = mem.get(p.n) >= Date.now(); mem.delete(p.n); }
  if (!ok) throw new Error("OAuth state already used or expired");
  return { userId: p.uid, service: p.svc };
};

module.exports = { createOAuthState, consumeOAuthState };

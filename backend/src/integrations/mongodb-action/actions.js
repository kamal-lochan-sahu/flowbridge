const mongoose = require("mongoose");
const dns      = require("dns");
const { assertPublicHost } = require("../../utils/netGuard");

const execute = async (actionType, config, credentials) => {
  switch (actionType) {
    case "insert_document": return await withConnection(credentials, (conn) => insertDocument(conn, config));
    case "update_document": return await withConnection(credentials, (conn) => updateDocument(conn, config));
    case "find_document":   return await withConnection(credentials, (conn) => findDocument(conn, config));
    default: throw new Error(`Unknown MongoDB action: ${actionType}`);
  }
};

// ── URI parsing + validation ──────────────────────────────────
const parseMongoUri = (uri) => {
  const m = /^(mongodb(?:\+srv)?):\/\/(.+)$/i.exec(String(uri || "").trim());
  if (!m) throw new Error("MongoDB: URI must start with mongodb:// or mongodb+srv://");
  const srv  = m[1].toLowerCase() === "mongodb+srv";
  const rest = m[2];
  const authority = rest.split(/[/?]/)[0];
  const hostPart  = authority.slice(authority.lastIndexOf("@") + 1);
  const hosts = hostPart.split(",").filter(Boolean).map((h) => {
    if (h.startsWith("[")) return h.slice(1, h.indexOf("]"));          // [ipv6]:port
    return h.replace(/:\d+$/, "");
  });
  const dbMatch = /^[^/?]*\/([^?]*)/.exec(rest);
  return { srv, hosts, db: dbMatch ? dbMatch[1] : "" };
};

const assertSafeMongoUri = async (uri) => {
  const { srv, hosts } = parseMongoUri(uri);
  if (hosts.length === 0 || hosts.length > 10) throw new Error("MongoDB: invalid host list in URI");
  if (hosts.some((h) => h.includes("%") || h.includes("/"))) throw new Error("MongoDB: unix sockets are not allowed");

  let targets = hosts;
  if (srv) {
    // mongodb+srv: the real hosts live in the SRV record
    targets = [];
    for (const h of hosts) {
      const recs = await dns.promises.resolveSrv(`_mongodb._tcp.${h}`);
      targets.push(...recs.map((r) => r.name));
    }
  }
  for (const t of targets) await assertPublicHost(t);
};

const sameAsAppDb = (uri) => {
  if (!process.env.MONGODB_URI) return false;
  try {
    const a = parseMongoUri(uri), b = parseMongoUri(process.env.MONGODB_URI);
    return a.db === b.db && a.hosts.slice().sort().join() === b.hosts.slice().sort().join();
  } catch { return false; }
};

// Always a *separate* connection built from the user's own credential — never the app's DB.
const withConnection = async (credentials, fn) => {
  const uri = credentials?.uri;
  if (!uri) {
    throw new Error("MongoDB: attach a MongoDB credential that contains your own connection 'uri'");
  }
  if (sameAsAppDb(uri)) throw new Error("MongoDB: this database is not available to workflows");
  await assertSafeMongoUri(uri);

  const conn = await mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS:          30000,
    maxPoolSize:              2,
  }).asPromise();
  try {
    return await fn(conn);
  } finally {
    conn.close().catch(() => {});
  }
};

const checkCollection = (collection) => {
  if (!collection || typeof collection !== "string") throw new Error("MongoDB: 'collection' is required");
  if (collection.length > 120 || /[$\0]/.test(collection) || collection.startsWith("system.")) {
    throw new Error("MongoDB: invalid collection name");
  }
};

const insertDocument = async (conn, config) => {
  const { collection, document = {} } = config;
  checkCollection(collection);
  if (typeof document !== "object" || document === null || Array.isArray(document)) {
    throw new Error("MongoDB: 'document' must be an object");
  }

  const result = await conn.collection(collection).insertOne({ ...document, createdAt: new Date() });

  console.log(`✅ MongoDB inserted — ID: ${result.insertedId}`);
  return {
    success:    true,
    insertedId: result.insertedId.toString(),
    collection,
    message:    "Document inserted",
  };
};

const updateDocument = async (conn, config) => {
  const { collection, filter = {}, update = {}, upsert = false } = config;
  checkCollection(collection);

  const result = await conn.collection(collection).updateOne(
    filter, { $set: { ...update, updatedAt: new Date() } }, { upsert: upsert === true || upsert === "true" }
  );

  console.log(`✅ MongoDB updated — matched: ${result.matchedCount}`);
  return {
    success:      true,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    collection,
    message:      "Document updated",
  };
};

const findDocument = async (conn, config) => {
  const { collection, filter = {}, limit = 10 } = config;
  checkCollection(collection);

  const n    = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const docs = await conn.collection(collection).find(filter).limit(n).toArray();

  console.log(`✅ MongoDB found — ${docs.length} documents`);
  return {
    success:   true,
    documents: docs,
    count:     docs.length,
    collection,
    message:   `${docs.length} documents found`,
  };
};

module.exports = { execute, parseMongoUri, assertSafeMongoUri };

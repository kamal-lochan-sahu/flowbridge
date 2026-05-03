const mongoose = require("mongoose");

const execute = async (actionType, config, credentials) => {
  switch (actionType) {
    case "insert_document": return await insertDocument(config, credentials);
    case "update_document": return await updateDocument(config, credentials);
    case "find_document":   return await findDocument(config, credentials);
    default: throw new Error(`Unknown MongoDB action: ${actionType}`);
  }
};

const getConnection = async (credentials) => {
  // Use provided URI or fall back to app's MongoDB
  const uri = credentials?.uri || process.env.MONGODB_URI;
  if (!uri) throw new Error("MongoDB: connection URI required");

  // Use mongoose default connection if same DB
  if (uri === process.env.MONGODB_URI) return mongoose.connection;

  // Separate connection for external DB
  const conn = await mongoose.createConnection(uri).asPromise();
  return conn;
};

const insertDocument = async (config, credentials) => {
  const { collection, document = {} } = config;
  if (!collection) throw new Error("MongoDB: 'collection' is required");

  const conn = await getConnection(credentials);
  const col  = conn.collection(collection);
  const result = await col.insertOne({ ...document, createdAt: new Date() });

  console.log(`✅ MongoDB inserted — ID: ${result.insertedId}`);
  return {
    success:    true,
    insertedId: result.insertedId.toString(),
    collection,
    message:    "Document inserted",
  };
};

const updateDocument = async (config, credentials) => {
  const { collection, filter = {}, update = {}, upsert = false } = config;
  if (!collection) throw new Error("MongoDB: 'collection' is required");

  const conn   = await getConnection(credentials);
  const col    = conn.collection(collection);
  const result = await col.updateOne(filter, { $set: { ...update, updatedAt: new Date() } }, { upsert });

  console.log(`✅ MongoDB updated — matched: ${result.matchedCount}`);
  return {
    success:      true,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    collection,
    message:      "Document updated",
  };
};

const findDocument = async (config, credentials) => {
  const { collection, filter = {}, limit = 10 } = config;
  if (!collection) throw new Error("MongoDB: 'collection' is required");

  const conn = await getConnection(credentials);
  const col  = conn.collection(collection);
  const docs = await col.find(filter).limit(parseInt(limit)).toArray();

  console.log(`✅ MongoDB found — ${docs.length} documents`);
  return {
    success:   true,
    documents: docs,
    count:     docs.length,
    collection,
    message:   `${docs.length} documents found`,
  };
};

module.exports = { execute };

#!/usr/bin/env node
// Send a signed test webhook:  node scripts/sign-webhook.js <webhook-url> <secret> '{"name":"Test"}'
const crypto = require("crypto");
const [url, secret, json = "{}"] = process.argv.slice(2);
if (!url || !secret) { console.error("usage: node scripts/sign-webhook.js <url> <secret> [json]"); process.exit(1); }
const sig = crypto.createHmac("sha256", secret).update(json).digest("hex");
fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "x-webhook-signature": `sha256=${sig}` }, body: json })
  .then(async (r) => console.log(r.status, await r.text()))
  .catch((e) => { console.error("request failed:", e.message); process.exit(1); });

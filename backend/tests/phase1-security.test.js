// Run: npm run test:security   (no DB / Redis / network needed)
process.env.JWT_SECRET = "test_secret_test_secret_test_secret_1234";
process.env.NODE_ENV   = "test";
const test   = require("node:test");
const assert = require("node:assert");
const http   = require("node:http");
const crypto = require("node:crypto");

const { isBlockedAddress, assertPublicUrl } = require("../src/utils/netGuard");
const httpAction  = require("../src/integrations/http-request");
const gmail       = require("../src/integrations/gmail/actions");
const mongoAction = require("../src/integrations/mongodb-action/actions");
const { verifySignature, verifySharedSecret } = require("../src/controllers/webhook.controller");
const { createOAuthState, consumeOAuthState } = require("../src/utils/oauthState");

test("SSRF: private / internal IPs are blocked", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.5", "192.168.1.1", "169.254.169.254",
                    "100.64.0.1", "0.0.0.0", "::1", "::ffff:127.0.0.1", "fe80::1", "fd00::1", "64:ff9b::7f00:1"]) {
    assert.ok(isBlockedAddress(ip), `${ip} should be blocked`);
  }
  for (const ip of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"]) {
    assert.ok(!isBlockedAddress(ip), `${ip} should be allowed`);
  }
});

test("SSRF: assertPublicUrl rejects bad schemes, userinfo, literal private IPs", () => {
  assert.throws(() => assertPublicUrl("file:///etc/passwd"));
  assert.throws(() => assertPublicUrl("http://user:pw@example.com/"));
  assert.throws(() => assertPublicUrl("http://127.0.0.1:5000/x"));
  assert.throws(() => assertPublicUrl("http://169.254.169.254/latest/meta-data/"));
  assert.throws(() => assertPublicUrl("http://[::1]/"));
  assert.throws(() => assertPublicUrl("http://2130706433/")); // decimal 127.0.0.1
  assert.doesNotThrow(() => assertPublicUrl("https://example.com/hook"));
});

test("SSRF: http-request cannot reach a local server (IP literal AND hostname)", async () => {
  let hit = false;
  const srv = http.createServer((q, r) => { hit = true; r.end("secret"); });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const port = srv.address().port;
  try {
    await assert.rejects(httpAction.execute("request", { url: `http://127.0.0.1:${port}/`, method: "GET" }));
    await assert.rejects(httpAction.execute("request", { url: `http://localhost:${port}/`, method: "GET" }), /private|internal|Blocked/i);
    assert.strictEqual(hit, false, "local server must never be contacted");
  } finally { srv.close(); }
});

test("SSRF: http-request blocks disallowed methods", async () => {
  await assert.rejects(httpAction.execute("request", { url: "https://example.com", method: "TRACE" }), /not allowed/);
});

test("Gmail: header injection (CRLF) is rejected", async () => {
  const creds = { access_token: "x", refresh_token: "y", email: "me@example.com" };
  const attacks = [
    { to: "a@b.com\r\nBcc: evil@x.com", subject: "hi" },
    { to: "a@b.com", subject: "hi\r\nBcc: evil@x.com" },
    { to: "a@b.com", subject: "hi", cc: "c@d.com\nBcc: evil@x.com" },
    { to: "not-an-email", subject: "hi" },
  ];
  for (const cfg of attacks) {
    await assert.rejects(gmail.execute("send_email", cfg, creds), /invalid|Gmail/i);
  }
});

test("Gmail: parseAddressList + subject encoding", () => {
  assert.deepStrictEqual(gmail.parseAddressList("to", "A <a@b.com>, c@d.in"), ["a@b.com", "c@d.in"]);
  assert.strictEqual(gmail.encodeSubject("Hello"), "Hello");
  assert.match(gmail.encodeSubject("नमस्ते Kamal"), /^=\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=$/);
});

test("MongoDB: no credential => refuses (no fallback to app DB)", async () => {
  process.env.MONGODB_URI = "mongodb+srv://appuser:pw@cluster0.abcde.mongodb.net/flowbridge";
  await assert.rejects(mongoAction.execute("find_document", { collection: "users" }, null), /credential/i);
  await assert.rejects(mongoAction.execute("find_document", { collection: "users" }, {}), /credential/i);
});

test("MongoDB: app DB URI and private hosts are refused", async () => {
  process.env.MONGODB_URI = "mongodb+srv://appuser:pw@cluster0.abcde.mongodb.net/flowbridge";
  await assert.rejects(mongoAction.execute("find_document", { collection: "users" },
    { uri: "mongodb+srv://other:pw@cluster0.abcde.mongodb.net/flowbridge" }), /not available/i);
  await assert.rejects(mongoAction.assertSafeMongoUri("mongodb://127.0.0.1:27017/x"), /private|internal|Blocked/i);
  await assert.rejects(mongoAction.assertSafeMongoUri("mongodb://10.0.0.5,10.0.0.6/x"), /private|internal|Blocked/i);
  await assert.rejects(mongoAction.assertSafeMongoUri("http://evil.com"), /mongodb/i);
  assert.deepStrictEqual(mongoAction.parseMongoUri("mongodb://u:p%40ss@h1:27017,h2:27018/db?x=1").hosts, ["h1", "h2"]);
});

test("Webhook: HMAC verification is fail-closed (hex, sha256=, base64)", () => {
  const secret = "s3cret", body = Buffer.from('{"a":1}');
  const mk = () => crypto.createHmac("sha256", secret).update(body);
  const hex = mk().digest("hex"), b64 = mk().digest("base64");
  assert.ok(verifySignature(body, hex, secret));
  assert.ok(verifySignature(body, `sha256=${hex}`, secret));
  assert.ok(verifySignature(body, b64, secret));
  assert.ok(!verifySignature(body, hex, "wrong"));
  assert.ok(!verifySignature(Buffer.from("tampered"), hex, secret));
  assert.ok(!verifySignature(body, "", secret));          // no signature -> reject (was: accept)
  assert.ok(!verifySignature(body, hex, ""));             // no secret    -> reject (was: accept)
  assert.ok(!verifySignature(body, "garbage", secret));
  assert.ok(verifySharedSecret("s3cret", "s3cret"));
  assert.ok(!verifySharedSecret("nope", "s3cret"));
});

test("Webhook: empty body ({}) cannot bypass signature check", () => {
  const secret = "s3cret";
  const empty = Buffer.alloc(0);
  const good = crypto.createHmac("sha256", secret).update(empty).digest("hex");
  assert.ok(verifySignature(empty, good, secret));
  assert.ok(!verifySignature(empty, "", secret));
});

test("OAuth state: roundtrip, single-use, tamper and forgery rejected", async () => {
  const state = await createOAuthState("64b7f0c2a1b2c3d4e5f60718", "gmail");
  const out   = await consumeOAuthState(state);
  assert.deepStrictEqual(out, { userId: "64b7f0c2a1b2c3d4e5f60718", service: "gmail" });
  await assert.rejects(consumeOAuthState(state), /used|expired/i);       // replay
  const forged = Buffer.from(JSON.stringify({ userId: "victim", service: "gmail" })).toString("base64");
  await assert.rejects(consumeOAuthState(forged), /Invalid/i);           // old-style unsigned state
  const s2 = await createOAuthState("u1", "gmail");
  await assert.rejects(consumeOAuthState(s2.slice(0, -2) + "xx"), /Invalid/i);
});

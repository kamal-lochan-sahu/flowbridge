// End-to-end webhook check through the real Express app. No MongoDB / Redis / network needed:
// models and the queue are stubbed, so no real data is touched.
process.env.JWT_SECRET = "test_secret_test_secret_test_secret_1234";
process.env.NODE_ENV = "test";
process.env.WEBHOOK_BASE_URL = "http://localhost:5000";
const test   = require("node:test");
const assert = require("node:assert");
const crypto = require("node:crypto");

const SECRET = "whsec_test_123";
const ID     = "3f2b8c1e-9a4d-4e7b-8c55-0d1f6a2b7e90";
const URL_OK = `http://localhost:5000/api/webhooks/receive/${ID}`;
const queued = [];

// stub queue BEFORE anything destructures it
require("../src/queue/jobQueue").addWorkflowJob = async (d) => { queued.push(d); return { id: "job-1" }; };
const Trigger  = require("../src/models/Trigger");
const Workflow = require("../src/models/Workflow");
Trigger.findOne  = async (q) => q["webhook.url"] === URL_OK
  ? { workflowId: "w1", webhook: { url: URL_OK, secret: SECRET }, save: async () => {} } : null;
Workflow.findOne = async () => ({ _id: "w1", userId: "u1" });

const app = require("../app");
let server, base;
test.before(async () => { server = app.listen(0); base = `http://127.0.0.1:${server.address().port}`; });
test.after(() => server.close());

const post = (id, { headers = {}, body } = {}) =>
  fetch(`${base}/api/webhooks/receive/${id}`, { method: "POST", headers, body }).then((r) => r.status);
const sign = (b) => "sha256=" + crypto.createHmac("sha256", SECRET).update(b).digest("hex");
const J = { "Content-Type": "application/json" };

test("no signature -> 401", async () => assert.strictEqual(await post(ID, { headers: J, body: '{"a":1}' }), 401));
test("empty body, no signature -> 401", async () => assert.strictEqual(await post(ID), 401));
test("wrong signature -> 401", async () =>
  assert.strictEqual(await post(ID, { headers: { ...J, "x-webhook-signature": "sha256=" + "0".repeat(64) }, body: '{"a":1}' }), 401));
test("valid HMAC -> 200 and workflow queued", async () => {
  const body = '{"name":"Test"}';
  assert.strictEqual(await post(ID, { headers: { ...J, "x-webhook-signature": sign(body) }, body }), 200);
  await new Promise((r) => setTimeout(r, 50));
  assert.strictEqual(queued.length, 1);
  assert.deepStrictEqual(queued[0].triggerData, { name: "Test" });
});
test("valid x-webhook-secret header -> 200", async () =>
  assert.strictEqual(await post(ID, { headers: { ...J, "x-webhook-secret": SECRET }, body: '{"a":1}' }), 200));
test("valid secret as Bearer -> 200", async () =>
  assert.strictEqual(await post(ID, { headers: { ...J, Authorization: `Bearer ${SECRET}` }, body: '{"a":1}' }), 200));
test("wrong secret header -> 401", async () =>
  assert.strictEqual(await post(ID, { headers: { ...J, "x-webhook-secret": "nope" }, body: '{"a":1}' }), 401));
test("unknown uuid -> 404", async () =>
  assert.strictEqual(await post("11111111-1111-4111-8111-111111111111", { headers: J, body: "{}" }), 404));
test("non-uuid id -> 404", async () => assert.strictEqual(await post("abc123", { headers: J, body: "{}" }), 404));

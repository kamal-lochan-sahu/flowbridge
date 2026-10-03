// SSRF guard — blocks requests to private / loopback / link-local / metadata addresses.
// Checks at DNS-resolution time (safeLookup), so DNS rebinding cannot swap in a private IP later.
const dns   = require("dns");
const net   = require("net");
const http  = require("http");
const https = require("https");

const blocked = new net.BlockList();
[
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24],
  ["224.0.0.0", 4], ["240.0.0.0", 4],
].forEach(([a, p]) => blocked.addSubnet(a, p, "ipv4"));
[
  ["::", 128], ["::1", 128], ["64:ff9b::", 96], ["100::", 64], ["2001::", 32],
  ["2001:db8::", 32], ["2002::", 16], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8],
].forEach(([a, p]) => blocked.addSubnet(a, p, "ipv6"));

// Dev-only escape hatch (never honoured in production)
const allowPrivate = () =>
  process.env.NODE_ENV !== "production" && process.env.ALLOW_PRIVATE_NETWORK === "true";

const isBlockedAddress = (addr) => {
  const fam = net.isIP(addr);
  if (!fam) return true; // unknown format -> block
  return blocked.check(addr, fam === 4 ? "ipv4" : "ipv6");
};

const stripBrackets = (h) => (h.startsWith("[") && h.endsWith("]") ? h.slice(1, -1) : h);

const ssrfError = (host) => {
  const e = new Error(`Blocked: '${host}' resolves to a private or internal address`);
  e.code = "ESSRF";
  return e;
};

// Sync check for literal IPs in URLs (net.connect skips lookup for IP literals)
const assertPublicUrl = (urlStr) => {
  let u;
  try { u = new URL(urlStr); } catch { throw new Error("Invalid URL"); }
  if (!["http:", "https:"].includes(u.protocol)) throw new Error("Only http/https URLs are allowed");
  if (u.username || u.password) throw new Error("Credentials inside the URL are not allowed");
  const host = stripBrackets(u.hostname);
  if (!allowPrivate() && net.isIP(host) && isBlockedAddress(host)) throw ssrfError(host);
  return u;
};

// dns.lookup replacement that validates every resolved address
const safeLookup = (hostname, options, cb) => {
  if (typeof options === "function") { cb = options; options = {}; }
  options = options || {};
  dns.lookup(hostname, { ...options, all: true, verbatim: true }, (err, addrs) => {
    if (err) return cb(err);
    const list = Array.isArray(addrs) ? addrs : [{ address: addrs, family: net.isIP(addrs) }];
    if (!allowPrivate() && list.some((a) => isBlockedAddress(a.address))) return cb(ssrfError(hostname));
    if (options.all) return cb(null, list);
    return cb(null, list[0].address, list[0].family);
  });
};

const httpAgent  = new http.Agent({ lookup: safeLookup });
const httpsAgent = new https.Agent({ lookup: safeLookup });

// Pre-flight check for hostnames we cannot route through safeLookup (e.g. Mongo driver)
const assertPublicHost = async (host) => {
  host = stripBrackets(host);
  if (allowPrivate()) return;
  if (net.isIP(host)) { if (isBlockedAddress(host)) throw ssrfError(host); return; }
  const addrs = await dns.promises.lookup(host, { all: true, verbatim: true });
  if (addrs.some((a) => isBlockedAddress(a.address))) throw ssrfError(host);
};

module.exports = { isBlockedAddress, assertPublicUrl, assertPublicHost, safeLookup, httpAgent, httpsAgent };

const CryptoJS = require("crypto-js");
const KEY = process.env.ENCRYPTION_KEY;

if (!KEY || KEY.length < 32) {
  if (process.env.NODE_ENV === "production") throw new Error("ENCRYPTION_KEY must be 32+ chars");
  else console.warn("⚠️  ENCRYPTION_KEY should be 32 chars in production");
}

const encrypt = (data) => CryptoJS.AES.encrypt(
  typeof data === "object" ? JSON.stringify(data) : String(data), KEY
).toString();

const decrypt = (enc, parseJson = false) => {
  const dec = CryptoJS.AES.decrypt(enc, KEY).toString(CryptoJS.enc.Utf8);
  if (!dec) throw new Error("Decryption failed");
  if (parseJson) { try { return JSON.parse(dec); } catch { return dec; } }
  return dec;
};

module.exports = {
  encrypt, decrypt,
  encryptCredentials: (obj) => encrypt(obj),
  decryptCredentials: (str) => decrypt(str, true),
};

/**
 * Try to detect if a string is base64 and convert it to Buffer only if the roundtrip matches.
 * This helps avoid converting normal text accidentally.
 */

function tryBase64ToBufferIfValid(str) {
  if (typeof str !== "string") return null;

  // quick checks: base64 typically longer than 8 chars and contains only base64 chars
  const trimmed = str.replace(/\s+/g, "");
  if (trimmed.length < 8) return null;
  if (!/^[A-Za-z0-9+/=]+$/.test(trimmed)) return null;

  try {
    const buf = Buffer.from(trimmed, "base64");
    // round-trip validation
    if (buf.toString("base64") === trimmed) return buf;
  } catch {
    // not base64
  }
  return null;
}

function fixBinaryToBuffer(obj) {
  if (obj === null || obj === undefined) return obj;

  // If it's already a Buffer or Uint8Array — return as-is (but create fresh Buffer)
  if (Buffer.isBuffer(obj)) return Buffer.from(obj);
  if (obj instanceof Uint8Array) return Buffer.from(obj);

  // Mongoose/JSON serialized Buffer ({"type":"Buffer","data":[...]}))
  if (typeof obj === "object" && obj.type === "Buffer" && Array.isArray(obj.data)) {
    return Buffer.from(obj.data);
  }

  // BSON Binary -> {_bsontype: 'Binary', buffer: <Buffer ...>}
  if (typeof obj === "object" && obj._bsontype === "Binary" && obj.buffer) {
    return Buffer.from(obj.buffer);
  }

  // Strings: check if base64 -> convert safely
  if (typeof obj === "string") {
    const maybeBuf = tryBase64ToBufferIfValid(obj);
    if (maybeBuf) return maybeBuf;
    return obj; // plain string
  }

  // Arrays
  if (Array.isArray(obj)) {
    return obj.map(function (v) { return fixBinaryToBuffer(v); });
  }

  // Objects: recurse
  if (typeof obj === "object") {
    const out = {};
    for (const k in obj) {
      if (obj.hasOwnProperty(k)) {
        out[k] = fixBinaryToBuffer(obj[k]);
      }
    }
    return out;
  }

  // primitives
  return obj;
}

// CommonJS exports
module.exports = {
  tryBase64ToBufferIfValid,
  fixBinaryToBuffer
};

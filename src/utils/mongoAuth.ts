
// save base64 into mongodb and when read convert base64 to buffer
// utils/mongoAuth.ts (or same file)
export function fixBinaryToBuffer(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  // If it's already a Buffer or Uint8Array — return as-is
  if (Buffer.isBuffer(obj) || obj instanceof Uint8Array) return Buffer.from(obj);

  // Mongoose/JSON serialized Buffer ({"type":"Buffer","data":[...]})
  if (obj && typeof obj === "object" && obj.type === "Buffer" && Array.isArray(obj.data)) {
    return Buffer.from(obj.data);
  }

  // BSON Binary (from mongodb) -> {_bsontype: 'Binary', buffer: <Buffer ...>}
  if (obj && typeof obj === "object" && obj._bsontype === "Binary" && obj.buffer) {
    return Buffer.from(obj.buffer);
  }

  // If plain object, recursively convert children
  if (Array.isArray(obj)) {
    return obj.map((v) => fixBinaryToBuffer(v));
  }

  if (typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = fixBinaryToBuffer(v);
    }
    return out;
  }

  // primitives
  return obj;
}

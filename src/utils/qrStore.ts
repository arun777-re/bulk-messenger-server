// utils/mongoAuth.ts
import { AuthModel } from "../model/Auth";
import {
  AuthenticationCreds,
  SignalDataTypeMap,
} from "@whiskeysockets/baileys";
import { fixBinaryToBuffer, tryBase64ToBufferIfValid } from "./mongoAuth";

export let LATEST_QR: string | null = null;
export const setQR = (qr: string) => (LATEST_QR = qr);

export const useMongoAuthState = async () => {
  const baileys = await import("@whiskeysockets/baileys");
  const initAuthCreds = baileys.initAuthCreds;

  // load creds doc
  const credsDoc = await AuthModel.findOne({ id: "creds" }).lean();
  let creds: AuthenticationCreds;

  if (!credsDoc?.data) {
    creds = initAuthCreds();
    // Save initial creds as base64-serializable
    const serialized = JSON.parse(JSON.stringify(creds));
    await AuthModel.create({ id: "creds", data: serialized });
  } else {
    // Convert stored data back to Buffer where appropriate (including base64 strings)
    const loaded = credsDoc.data;
    creds = fixBinaryToBuffer(loaded) as AuthenticationCreds;
  }

  // Helper: convert Buffer/Uint8Array -> base64 recursively
  const bufferToBase64Serializable = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (Buffer.isBuffer(obj) || obj instanceof Uint8Array) {
      return Buffer.from(obj).toString("base64");
    }
    if (Array.isArray(obj)) return obj.map(bufferToBase64Serializable);
    if (typeof obj === "object") {
      const out: any = {};
      for (const [k, v] of Object.entries(obj))
        out[k] = bufferToBase64Serializable(v);
      return out;
    }
    return obj;
  };

  // state shape for Baileys
  const state: any = {
    creds,
    keys: {
      // type is like "pre-key", ids are [ "<wid>" ] etc.
      get: async (type: keyof SignalDataTypeMap, ids: string[]) => {
        const data: Record<string, any> = {};
        for (const id of ids) {
          const doc = await AuthModel.findOne({ id: `${type}-${id}` }).lean();
          let value = doc?.data ?? null;

          // if saved as base64 string -> convert to Buffer
          if (typeof value === "string") {
            const maybeBuf = tryBase64ToBufferIfValid(value);
            if (maybeBuf) {
              value = maybeBuf;
            }
          } else {
            // handle nested structures and BSON Binary
            value = fixBinaryToBuffer(value);
          }

          data[id] = value;
        }
        return data;
      },

      set: async (data: any) => {
        for (const category of Object.keys(data)) {
          for (const id of Object.keys(data[category])) {
            let value = data[category][id];
            // Convert Buffer / Uint8Array -> base64 string for storage
            if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
              value = Buffer.from(value).toString("base64");
            } else {
              // if object possibly containing buffers, serialize safely
              value = bufferToBase64Serializable(value);
            }
            await AuthModel.findOneAndUpdate(
              { id: `${category}-${id}` },
              { data: value },
              { upsert: true }
            );
          }
        }
      },
    },
  };

  const saveCreds = async () => {
    // Convert any Buffer fields inside creds to base64 strings
    const clean = bufferToBase64Serializable(state.creds);
    await AuthModel.findOneAndUpdate(
      { id: "creds" },
      { data: clean },
      { upsert: true }
    );
    console.log(" saved creds to mongo");
  };

  return { state, saveCreds };
};

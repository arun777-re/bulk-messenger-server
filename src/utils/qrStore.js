// import { proto, Curve, signedKeyPair, generateRegistrationId,} from "@whiskeysockets/baileys";
// import { randomBytes } from "crypto";
// import { Collection, UpdateResult } from "mongodb";
// import { QRDoc } from "../types/customReq.js";


// interface BufferJSONType {
//   replacer: (key: string, value: any) => any;
//   reciever: (key: string, value: any) => any;
// }



// // --- Auth Creds Init ---
// export const initAuthCreds = ()=> {
//   const identityKey = Curve.generateKeyPair();
//   const preKey = signedKeyPair(identityKey,1);
//   return {
//     noiseKey: Curve.generateKeyPair(),
//     signedIdentityKey: identityKey,
//     signedPreKey: preKey,
//     registrationId: generateRegistrationId(),
//     advSecretKey: randomBytes(32).toString("base64"),
//     processedHistoryMessages: [],
//     nextPreKeyId: 1,
//     firstUnuploadedPreKeyId: 1,
//     accountSettings: {
//       unarchiveChats: false,
//     },
//     pairingEphemeralKeyPair: Curve.generateKeyPair(),
//     accountSyncCounter: 0,
//     registered: false,
//     pairingCode: "",
//     me: undefined,
//     account: undefined,
//     additionalData: undefined,
//   };
// };

// // --- Buffer JSON ---
// export const BufferJSON: BufferJSONType = {
//   replacer: (k, value) => {
//     if (Buffer.isBuffer(value) || value instanceof Uint8Array || value?.type === "Buffer") {
//       return {
//         type: "Buffer",
//         data: Buffer.from(value?.data || value).toString("base64"),
//       };
//     }
//     return value;
//   },
//   reciever: (_, value) => {
//     if (typeof value === "object" && value !== null && (value.buffer === true || value.type === "Buffer")) {
//       const val = value.data || value.value;
//       return typeof val === "string" ? Buffer.from(val, "base64") : Buffer.from(val || []);
//     }
//     return value;
//   },
// };

// // --- Mongo Auth State ---
// export const useMongoAuthState = async (collection: Collection<QRDoc>) => {
//   const writeData = (data: any, id: string): Promise<UpdateResult> => {
//     const informationToStore = JSON.parse(JSON.stringify(data, BufferJSON.replacer));
//     const update = { $set: { ...informationToStore } };
//     return collection.updateOne({ _id:id }, update, { upsert: true });
//   };

//   const readData = async (id: string): Promise<any> => {
//     try {
//       const doc = await collection.findOne({ _id:id });
//       const data = JSON.stringify(doc);
//       return JSON.parse(data, BufferJSON.reciever);
//     } catch {
//       return null;
//     }
//   };

//   const removeData = async (id: string): Promise<void> => {
//     try {
//       await collection.deleteOne({ _id:id });
//     } catch {}
//   };

//   const creds = (await readData("creds")) || initAuthCreds();

//    return {
//      state: {
//       creds,
//       keys: {
//         get: async (type: string, ids: string[]) => {
//           const data: Record<string, any> = {};
//           await Promise.all(
//             ids.map(async (id) => {
//               let value = await readData(`${type}-${id}`);
//               if (type === "app-state-sync-key" && value) {
//                 value = proto.Message.AppStateSyncKeyData.fromObject(value);
//               }
//               data[id] = value;
//             })
//           );
//           return data;
//         },
//         set: async (data: Record<string, Record<string, any>>) => {
//           const tasks: Promise<any>[] = [];
//           for (const category of Object.keys(data)) {
//             for (const id of Object.keys(data[category])) {
//               const value = data[category][id];
//               const key = `${category}-${id}`;
//               tasks.push(value ? writeData(value, key) : removeData(key));
//             }
//           }
//           await Promise.all(tasks);
//         },
//       },
//     },
//     saveCreds: (): Promise<UpdateResult> => writeData(creds, "creds"),
//   };
// };

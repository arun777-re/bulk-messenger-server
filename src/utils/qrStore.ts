import { AuthModel } from "../model/Auth";

export let LATEST_QR: string | null = null;
export const setQR = (qr: string) => (LATEST_QR = qr);

export const useMongoAuthState = async () => {
  const docs = await AuthModel.find().lean();

  const state: any = {
    creds: {
      me: undefined, // Baileys will populate this after scanning QR
    },
    keys: {}, // MUST be "keys"
  };

  // load records from DB
  docs.forEach((doc) => {
    if (doc.key === "creds") {
      state.creds = doc.value;
    } else if (doc.key === "keys") {
      state.keys = doc.value;
    } else {
      state[doc.key] = doc.value;
    }
  });

  const saveCreds = async () => {
    await AuthModel.findOneAndUpdate(
      { key: "creds" },
      { value: state.creds },
      { upsert: true }
    );

    await AuthModel.findOneAndUpdate(
      { key: "keys" },
      { value: state.keys },
      { upsert: true }
    );
  };

  return { state, saveCreds };
};

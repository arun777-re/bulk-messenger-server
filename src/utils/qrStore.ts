import { AuthModel } from "../model/Auth";
import { AuthenticationCreds, SignalDataTypeMap } from "@whiskeysockets/baileys";


export let LATEST_QR:string | null = null;
export const setQR = (qr:string)=>(LATEST_QR = qr);




export const useMongoAuthState = async () => {
  const baileys = await import("@whiskeysockets/baileys");
  const initAuthCreds = baileys.initAuthCreds;
  // Load creds
  const credsDoc = await AuthModel.findOne({ id: "creds" }).lean();
  let creds: AuthenticationCreds;
  if(!credsDoc || !credsDoc?.data){
   creds = initAuthCreds();
   await AuthModel.create({
    id:"creds",
    data:creds
   })
  }else{
    creds = credsDoc.data;
  }

  const state: any = {
    creds,
    keys: {
      get: async (type: keyof SignalDataTypeMap, ids: string[]) => {
        const data: any = {};
        for (const id of ids) {
          const found = await AuthModel.findOne({ id:`${type}-${id}` }).lean();
          data[id] = found?.data || null
        }
        return data;
      },

      set: async (data: any) => {
        for (const category of Object.keys(data)) {
          for (const id of Object.keys(data[category])) {
            const value = data[category][id];
            await AuthModel.findOneAndUpdate(
              { id: `${category}-${id}` },
              { data: value },
              { upsert: true }
            );
          }
        }
      }
    }
  };

  const saveCreds = async () => {
    await AuthModel.findOneAndUpdate(
      { id: "creds" },
      { data: state.creds },
      { upsert: true }
    );
  };

  return { state, saveCreds };
};
import { AuthModel } from "../model/Auth";

export let LATEST_QR:string | null = null;
export const setQR = (qr:string)=>(LATEST_QR = qr);



export const useMongoAuthState = async()=>{
    const creds = await AuthModel.find().lean();

    let state:any = {creds:{},
       key:{},
    me:undefined};
    creds.forEach((c) => (state[c.key] = c.value));

    const saveCreds = async ()=>{
        const entries = Object.entries(state);
        for(let [key,value] of entries){
            await AuthModel.findOneAndUpdate({key},{value},{upsert:true});
        }
    };

    return {state,saveCreds};
}
export const cleanNumber = (phone:string):string | null=>{
if(!phone)return null;
const cleaned = phone.replace(/\D/g,'');
if(cleaned.length <10)return null;
return cleaned;
}


export function delay(ms:number){
    return new Promise(resolve=> setTimeout(resolve,ms))
}
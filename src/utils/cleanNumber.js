 const cleanNumber = (phone)=>{
if(!phone)return null;
const cleaned = phone.replace(/\D/g,'');
if(cleaned.length <10)return null;
return cleaned;
}

 function delay(ms){
    return new Promise(resolve=> setTimeout(resolve,ms))
}

module.exports = {
    cleanNumber,
    delay
}
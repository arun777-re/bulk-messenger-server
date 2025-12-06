export function fixBinaryToBuffer(obj:any){
    if(!obj) return;
    if(obj._bsontype === "Binary" && obj.buffer){
        return Buffer.from(obj.buffer);
    }

    if(typeof obj === "object"){
        for(const [key,value] of Object.entries(obj)){
            obj[key] = fixBinaryToBuffer(value)
        }
    }
    return obj;
}
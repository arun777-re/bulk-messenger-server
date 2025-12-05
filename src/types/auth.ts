import { Document } from "mongoose";


export interface AuthDTO {
   key:string;
   value:Record<string,any>,
}


export interface AuthSchemaDTO extends AuthDTO, Document{
    
}
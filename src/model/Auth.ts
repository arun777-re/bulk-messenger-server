import mongoose from "mongoose";
import { AuthSchemaDTO } from "../types/auth";



const authSchema = new mongoose.Schema<AuthSchemaDTO>({
    key:String,
    value:Object,
});


export const AuthModel = mongoose.model("BaileysAuth",authSchema);
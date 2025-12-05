import mongoose from "mongoose";
import { AuthSchemaDTO } from "../types/auth";



const authSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true },
    data: { type: Object }
  },
  { timestamps: true }
);



export const AuthModel = mongoose.model("BaileysAuth",authSchema);
// src/models/auth.model.js
const mongoose = require("mongoose");

const authSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true },
    data: { type: Object },
  },
  { timestamps: true }
);

const AuthModel = mongoose.model("BaileysAuth", authSchema);

module.exports = { AuthModel };

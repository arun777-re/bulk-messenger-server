import { ConnectionState } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import mongoose from "mongoose";
import { setQR, useMongoAuthState } from "../utils/qrStore";
import { connectDB } from "../middleware/mongo";
import { AuthModel } from "../model/Auth";

let sock: any = null;
let ready = false; // WhatsApp connected state
let reconnecting = false;

export class BaileysService {
  async connectWhatsApp() {
    if (mongoose.connection.readyState === 0) {
        await connectDB();
    };
    reconnecting = true;
    ready = false;

    console.log(" Connecting WhatsApp...");

    const baileys = await import("@whiskeysockets/baileys");
    const makeWASocket = baileys.default;
    const { fetchLatestBaileysVersion } = baileys;

    const { version } = await fetchLatestBaileysVersion();
    const {state,saveCreds} = await useMongoAuthState();
    console.log("state veere ",state)

    sock = makeWASocket({
      auth: state,
      version,
      printQRInTerminal:false,
      browser: ["Desktop", "Chrome", "10"],
      syncFullHistory: false,
      markOnlineOnConnect: true,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update: ConnectionState) => {
      const { connection, qr, lastDisconnect } = update;
console.log("hello logs1",connection)
console.log("hello logs2",qr)
console.log("hello logs1",lastDisconnect)
      if (qr) {
        console.log("QR Generated");
        const qrBase64 = await QRCode.toDataURL(qr);
        setQR(qrBase64);
         await AuthModel.findOneAndUpdate(
        { id: "LATEST_QR" },
        { data: qrBase64 },
        { upsert: true }
      );

      }

      if (connection === "open") {
        ready = true;
        reconnecting = false;
        console.log(" WhatsApp Connected");
        setQR('');
      }

      if (connection === "close") {
        ready = false;
        reconnecting = false;
        const reason =
          (lastDisconnect?.error as any)?.output?.statusCode ||
          (lastDisconnect?.error as any)?.output?.payload?.statusCode;
        console.log(" Disconnected:", reason);
        if(reason === 401){
          console.log("session invalid deleting creds from db")
          await AuthModel.deleteMany();
        }
        setTimeout(() => this.connectWhatsApp(), 3000);
      }
    });
  }

  async sendMessage({
    phone,
    msg,
  }: {
    phone: number;
    msg: string;
  }): Promise<boolean> {
    try {
      if (!sock || !ready) {
        console.log(" Socket not ready → Reconnecting");
        await this.connectWhatsApp();

        // Wait until connected
        let retries = 0;

        while ((!sock || !ready ) && retries < 20) {await new Promise((r) => setTimeout(r, 500));
          retries++;
        }
      }

      await sock.sendMessage(`${phone}@s.whatsapp.net`, { text: msg });
      return true;
    } catch (err) {
      console.error("Send message error:", err);
      return false;
    }
  }
}


process.on("SIGINT",() => {
  console.log("Closing WhatsApp socket...");
  try {
    sock?.ws?.close();
  } catch (err) {
    console.log("Socket close error:",err);
  }
  process.exit(0);
});
// services/baileysService.ts
import { ConnectionState } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import mongoose from "mongoose";
import { setQR, LATEST_QR } from "../utils/qrStore"; // assuming setQR exists
import { useMongoAuthState } from "../utils/qrStore";
import { connectDB } from "../middleware/mongo";
import { AuthModel } from "../model/Auth";

let sock: any = null;
let ready = false;
let reconnecting = false;
let connectLock = false; // prevents parallel connects
let reconnectAttempts = 0;

export class BaileysService {
  async connectWhatsApp() {
    // prevent parallel connects
    if (connectLock) {
      console.log("connect already in progress - skipping duplicate call");
      return;
    }
    connectLock = true;

    try {
      if (mongoose.connection.readyState === 0) {
        await connectDB();
      }

      // small guard to avoid reconnect storms
      reconnecting = true;
      ready = false;
      console.log(" Connecting WhatsApp...");

      const baileys = await import("@whiskeysockets/baileys");
      const makeWASocket = baileys.default;
      const { fetchLatestBaileysVersion } = baileys;

      const { version } = await fetchLatestBaileysVersion();
      const { state, saveCreds } = await useMongoAuthState();
      console.log("state veere ", Object.keys(state.creds || {}));

      // if existing socket, close gracefully before making a new one
      try { if (sock && sock?.ws) sock.ws.close(); } catch (e) {}

      sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: false,
        browser: ["Chrome","Desktop",  "10"],
        syncFullHistory: false,
        markOnlineOnConnect: true,
      });

      sock.ev.on("creds.update", saveCreds);

      sock.ev.on("connection.update", async (update: ConnectionState) => {
        const { connection, qr, lastDisconnect } = update;
        console.log("hello logs1", connection);
        console.log("hello logs2", !!qr);
        console.log("hello logs3 lastDisconnect", !!lastDisconnect);

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
          reconnectAttempts = 0;
          console.log(" WhatsApp Connected");
          setQR("");
        }

        if (connection === "close") {
          ready = false;
          reconnecting = false;

          // Try to get HTTP-ish status code that indicates auth issues
          const reason =
            (lastDisconnect?.error as any)?.output?.statusCode ||
            (lastDisconnect?.error as any)?.output?.payload?.statusCode ||
            (lastDisconnect?.error as any)?.statusCode ||
            (lastDisconnect?.error as any)?.message;

          console.log(" Disconnected:", reason);

          // If 401 — likely credentials invalid — clear DB so a new QR is required
          if (reason === 401 || String(reason).includes("401")) {
            console.log("session invalid -> deleting stored creds from db");
            await AuthModel.deleteMany({});
          }

          // exponential-ish backoff (capped)
          reconnectAttempts++;
          const delay = Math.min(30000, 2000 * reconnectAttempts);
          console.log(`reconnect attempt ${reconnectAttempts} in ${delay}ms`);
          setTimeout(() => {
            // reset lock so connectWhatsApp can run
            connectLock = false;
            this.connectWhatsApp();
          }, delay);
        }
      });
    } catch (err) {
      console.error("connectWhatsApp error:", err);
      // reset lock so retries can happen
      connectLock = false;
      // small delay then attempt reconnect (but don't infinite-loop instantly)
      setTimeout(() => this.connectWhatsApp(), 2000);
    } finally {
      // release only if not inside active connection; the connection.update handler may re-invoke
      connectLock = false;
    }
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

        // Wait until connected (bounded)
        let retries = 0;
        while ((!sock || !ready) && retries < 20) {
          await new Promise((r) => setTimeout(r, 500));
          retries++;
        }
      }

      if (!sock || !ready) {
        console.log("Socket still not ready after retries");
        return false;
      }

      await sock.sendMessage(`${phone}@s.whatsapp.net`, { text: msg });
      return true;
    } catch (err) {
      console.error("Send message error:", err);
      return false;
    }
  }
}

// graceful shutdown
process.on("SIGINT", () => {
  console.log("Closing WhatsApp socket...");
  try {
    sock?.ws?.close();
  } catch (err) {
    console.log("Socket close error:", err);
  }
  process.exit(0);
});

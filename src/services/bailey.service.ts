import { ConnectionState } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import { setQR } from "../utils/qrStore";

let sock: any = null;
let ready = false; // WhatsApp connected state
let reconnecting = false;

export class BaileysService {
  async connectWhatsApp() {
    if (reconnecting) return;
    reconnecting = true;
    ready = false;

    console.log(" Connecting WhatsApp...");

    const baileys = await import("@whiskeysockets/baileys");
    const makeWASocket = baileys.default;
    const { useMultiFileAuthState, fetchLatestBaileysVersion } = baileys;

    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState("auth");

    sock = makeWASocket({
      auth: state,
      version,
      printQRInTerminal: false,
      browser: ["Desktop", "Chrome", "10"],
      syncFullHistory: false,
      markOnlineOnConnect: true,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update: ConnectionState) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) {
        console.log("QR Generated");
        const qrBase64 = await QRCode.toDataURL(qr);
        setQR(qrBase64);
      }

      if (connection === "open") {
        ready = true;
        reconnecting = false;
        console.log(" WhatsApp Connected");
      }

      if (connection === "close") {
        ready = false;
        const reason =
          (lastDisconnect?.error as any)?.output?.statusCode ||
          (lastDisconnect?.error as any)?.output?.payload?.statusCode;
        console.log(" Disconnected:", reason);
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
        while (!ready) await new Promise((r) => setTimeout(r, 1000));
      }

      await sock.sendMessage(`${phone}@s.whatsapp.net`, { text: msg });
      return true;
    } catch (err) {
      console.error("Send message error:", err);
      return false;
    }
  }
}

// src/services/bailey.service.js
const useMongoAuthState = require('../utils/qrStore');
const connectDB = require('../middleware/mongo');
const QRCode = require('qrcode');
const mongoose = require('mongoose');
const WAWebJS = require('whatsapp-web.js');
const { Client, LocalAuth } = require('whatsapp-web.js');

let sock;
// --- QR Placeholder ---
let LATEST_QR = null;
let qrCodePromise = null;
let qrResolve = null;

const getQR = () => {
  if (!qrCodePromise) {
    qrCodePromise = new Promise((resolve) => {
      qrResolve = resolve;
    });
  }
  return qrCodePromise;
};

const setQR = (qr) => {
  LATEST_QR = qr;
  if (qr && qrResolve) {
    qrResolve(qr);
    qrCodePromise = null;
    qrResolve = null;
  }
};

class BaileysService {
  async connectWhatsApp() {
    // Ensure MongoDB is connected
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    const collection = mongoose.connection.collection('baileysauths');
    console.log(collection);

    const options = {
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox'],
      },
    };

    const client = new Client(options);

    client.on('qr', (qr) => {
      console.log('QR received', qr);
      const base64QR = QRCode.toDataURL(qr);
      setQR(base64QR);
    });

    client.on('ready', () => {
      console.log('Client is ready!');
    });

    client.on('message', (msg) => {
      if (msg.body === '!ping') {
        msg.reply('pong');
      }
    });

    client.initialize();
    sock = client;

    // wait untill ready
    await new Promise((resolve)=>{
      client.on('ready',resolve)
    });
    return sock;
  }

  async sendMessage({ phone, msg }) {
    try {
      if (!sock) {
        console.log('Socket not ready → Reconnecting');
        await this.connectWhatsApp();

        // Wait until connected
        let retries = 0;
        while (!sock && retries < 20) {
          await new Promise((r) => setTimeout(r, 500));
          retries++;
        }
      }

      if (!sock) {
        console.log('Socket still not ready after retries');
        return false;
      }

      await sock.sendMessage(`${phone}@c.us`, msg);
      return true;
    } catch (err) {
      console.error('Send message error:', err);
      return false;
    }
  }
}

// graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing WhatsApp socket...');
  try {
    sock?.ws?.close();
  } catch (err) {
    console.log('Socket close error:', err);
  }
  process.exit(0);
});

module.exports = { BaileysService, getQR, setQR, LATEST_QR };

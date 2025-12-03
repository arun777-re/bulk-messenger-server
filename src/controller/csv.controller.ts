import { CSVService } from "../services/csv.services";
import fs from "fs";
import { customResponse, errorResponse } from "../middleware/response";
import { BaileysService } from "../services/bailey.service";
import { Request, Response } from "express";
import { delay } from "../utils/cleanNumber";
import { LATEST_QR } from "../utils/qrStore";

const csvService = new CSVService();
const baileyservice = new BaileysService();

export const sendQRCode = async (req: Request, res: Response) => {
  try {
  const data = await baileyservice.connectWhatsApp();

    if(!LATEST_QR){
        return customResponse({
            res,
            success:false,
            message:"QR not generated yet. Please wait",
            status:202
        })
    }
    return customResponse({
      success: true,
      message: "QR code generated in terminal",
      status: 200,
      res,
      data:LATEST_QR
    });
  } catch (error) {
    console.error("Error in sendingqrcode:", error);
    return errorResponse({
      res,
      status: 500,
      error: error as Error,
    });
  }
};
export const uploadCSVFile = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return customResponse({
        res,
        status: 400,
        message: "No file uploaded",
        success: false,
      });
    }

    const data = await csvService.parseCSV(file.path);
    // delete the file after processing
    fs.unlink(req.file?.path || "", (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      }
    });
    return customResponse({
      res,
      status: 200,
      message: "File uploaded and processed successfully",
      success: true,
      length: data.length,
      data: data,
    });
  } catch (error) {
    console.error("Error in uploadCSVFile:", error);
    return errorResponse({
      res,
      status: 500,
      error: error as Error,
    });
  }
};

export const sendBulkMessage = async (req: Request, res: Response) => {
  try {
    const { phonenos, message } = req.body as unknown as {
      phonenos:string;
      message: string;
    };
    const parsedPhonenos = JSON.parse(phonenos)

    if (
      !message ||
      !phonenos ||
      !Array.isArray(parsedPhonenos) ||
      phonenos.length === 0
    ) {
      return customResponse({
        success: false,
        message: "Provide proper phone numbers and message",
        status: 400,
        res,
      });
    }

    // Send messages sequentially or in small batches
    const results = [];
    for (let m of parsedPhonenos) {
      try {
        await baileyservice.sendMessage({ phone: m, msg: message });
        results.push({ m, status: "sent" });
        // safe anti-spam delay 10-15 sec
        const wait = Math.floor(Math.random() * (15000 - 6000 + 1)) + 6000;
        await delay(wait);
      } catch (err: any) {
        results.push({ m, status: "failed", error: err.message });
      }
    }
    return customResponse({
      res,
      status: 200,
      success: true,
      message: `message sent to clients : ${results.length}`,
      data: {
        failed: results.filter((d) => d.status === "failed").length,
        sent: results.filter((d) => d.status === "sent").length,
        total: results.length,
        results,
      },
    });
  } catch (error: any) {
    console.log(error.message);
    return errorResponse({
      status: 500,
      error,
      res,
    });
  }
};

export const sendSingleMessage = async (req: Request, res: Response) => {
  try {
    const { message, phone } = req.body as unknown as {message:string,phone:string};
    console.log({message,phone});
    if (!message || !phone) {
      return customResponse({
        success: false,
        message: "Either phone or message is missing",
        status: 400,
        res,
      });
    }

    const sendMessage = await baileyservice.sendMessage({
      phone: Number(phone),
      msg: String(message),
    });
    if (!sendMessage) {
      console.error("Error during send message to client");
      return customResponse({
        success: false,
        message: `Error during send message to client:${phone}`,
        status: 400,
        res,
      });
    }

    return customResponse({
      success: true,
      message: `Message sent to client:${phone}`,
      status: 200,
      res,
    });
  } catch (error: any) {
    console.log(error.message);
    return errorResponse({
      status: 500,
      error,
      res,
    });
  }
};

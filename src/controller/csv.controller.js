const { CSVService } = require("../services/csv.services");
const { customResponse, errorResponse } = require("../middleware/response");
const fs = require("fs");
const { delay } = require("../utils/cleanNumber");
const { BaileysService, getQR } = require("../services/bailey.service");

const csvService = new CSVService();
const baileyService = new BaileysService();

const sendQRCode = async (req, res) => {
  try {
    await baileyService.connectWhatsApp();
    const qrCode = await getQR();
    return customResponse({
      success: true,
      message: "QR code generated in terminal",
      status: 200,
      res,
      data: qrCode
    });
  } catch (error) {
    return errorResponse({
      res,
      status: 500,
      error: error
    });
  }
};

const uploadCSVFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return customResponse({
        res,
        status: 400,
        message: "No file uploaded",
        success: false
      });
    }
    const data = await csvService.parseCSV(file.path);
    fs.unlink(req.file?.path || "", (err) => {
      if (err) console.error("Error deleting file:", err);
    });

    return customResponse({
      res,
      status: 200,
      message: "File uploaded successfully",
      success: true,
      data: data
    });
  } catch (error) {
    return errorResponse({ res, status: 500, error });
  }
};

const sendSingleMessage = async(req,res)=>{
  try {
    const {phone,message} = req.body;
    if(!phone || !message){
     return customResponse({
        res,
        status: 400,
        message: "Either message or phone is not provided",
        success: false
      });
    }

   const sendMessage =  await baileyService.sendMessage({phone,msg:message});

   if(!sendMessage){
      return customResponse({
        res,
        status: 404,
        message: "Either message or phone is not provided",
        success: false
      });
   }
    return customResponse({
        res,
        status: 200,
        message: "successfull",
        success: true
      });
  } catch (error) {
    console.error(error)
     return errorResponse({ res, status: 500, error });
  }
}
const sendBulkMessage = async(req,res)=>{
  try {
    const {phonenos,message} = req.body;
    const originalphonenos = JSON.parse(phonenos)
    if(!phonenos || !Array.isArray(originalphonenos) || originalphonenos.length <=0  || !message){
     return customResponse({
        res,
        status: 400,
        message: "Either message or phone is not provided",
        success: false
      });
    }
const results = [];
 for(const p of originalphonenos){
  try {
    const sent = await baileyService.sendMessage({
      phone:p,
      msg:message
    });
    results.push({
      phone:p,
      status:sent ? "sent" : "failed"
    });
    await delay(8000);
  } catch (error) {
    results.push({
      phone:p,
      status:"failed",
      error:error.message
    })
  }
 }

  return customResponse({
    success:true,
    message:"message sent to all successfully",
    status:200,
    data:results
  })
  } catch (error) {
    console.error(error)
     return errorResponse({ res, status: 500, error });
  }
}

module.exports = {
  sendQRCode,
  uploadCSVFile,
  sendSingleMessage,
  sendBulkMessage
  
};

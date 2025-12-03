import express from "express";


import upload from "../middleware/upload";
import { uploadCSVFile } from "../controller/csv.controller";


const router = express.Router();

router.post('/upload-csv',upload.single('csvFile'),uploadCSVFile);

export default router;
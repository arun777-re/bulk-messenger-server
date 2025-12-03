import express from 'express';
import { sendQRCode } from '../controller/csv.controller';



const router = express.Router();

router.get('/qr-code',sendQRCode);

export default router;

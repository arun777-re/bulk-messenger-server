import express from 'express';
import { sendBulkMessage, sendSingleMessage } from '../controller/csv.controller';



const router = express.Router();

router.post('/send-single',sendSingleMessage);
router.post('/send-bulk',sendBulkMessage);


export default router;
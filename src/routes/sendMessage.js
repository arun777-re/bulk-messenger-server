const express = require('express');
const { sendBulkMessage, sendSingleMessage } = require('../controller/csv.controller');

const router = express.Router();

router.post('/send-single', sendSingleMessage);
router.post('/send-bulk', sendBulkMessage);

module.exports = router;

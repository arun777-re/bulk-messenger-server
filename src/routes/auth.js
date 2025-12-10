const express = require('express');
const { sendQRCode } = require('../controller/csv.controller');

const router = express.Router();

// GET endpoint for QR code
router.get('/qr-code', sendQRCode);

module.exports = router;

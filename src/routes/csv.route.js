const { uploadCSVFile } = require("../controller/csv.controller");
const upload = require("../middleware/upload");

const express = require('express');
const router = express.Router();

router.post('/upload-csv', upload.single('csvFile'), uploadCSVFile);

module.exports = router; // 

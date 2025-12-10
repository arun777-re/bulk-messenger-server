// src/services/csv.services.js
const fs = require('fs');
const csv = require('csv-parser');
const { cleanNumber } = require('../utils/cleanNumber');

class CSVService {
  async parseCSV(filePath) {
    const result = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const title = row['title']?.trim() || row['"title"'];
          const city = row['city'];
          const state = row['state'];
          const rawphone = row['phone'];
          const phone = cleanNumber(rawphone);
          const website = row['website'];
          const category = row['categoryName'] || row['categoryName'];
          result.push({ title, state, rawphone, city, website, category });
        })
        .on('end', () => {
          console.log('CSV file successfully processed');
          resolve(result);
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }
}

module.exports = { CSVService };

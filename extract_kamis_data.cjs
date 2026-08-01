const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'F:\\2025\\충남도청\\컨설팅샘플(250509).xlsx';
const workbook = XLSX.readFile(filePath);

// Extract 소득조사표
const surveySheet = workbook.Sheets['소득조사표'];
const surveyRows = XLSX.utils.sheet_to_json(surveySheet, { header: 1, defval: '' });

// Extract 카미스BD
const kamisSheet = workbook.Sheets['카미스BD'];
const kamisRows = XLSX.utils.sheet_to_json(kamisSheet, { header: 1, defval: '' });

// Extract Kg당 가격추이
const priceSheet = workbook.Sheets['Kg당 가격추이'];
const priceRows = XLSX.utils.sheet_to_json(priceSheet, { header: 1, defval: '' });

const extractedData = {
  surveyRows: surveyRows.slice(0, 45),
  kamisSample: kamisRows.slice(0, 30),
  priceSample: priceRows.slice(0, 30)
};

fs.writeFileSync('extracted_kamis.json', JSON.stringify(extractedData, null, 2), 'utf8');
console.log('Extracted KAMIS & Survey data to extracted_kamis.json');

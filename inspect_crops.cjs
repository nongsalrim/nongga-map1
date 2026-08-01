const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'F:\\2025\\충남도청\\컨설팅샘플(250509).xlsx';
const workbook = XLSX.readFile(filePath);

console.log('Sheet names:', workbook.SheetNames);

// Inspect 코드표
if (workbook.Sheets['코드표']) {
  const codeSheet = XLSX.utils.sheet_to_json(workbook.Sheets['코드표'], { header: 1 });
  console.log('--- 코드표 Sample ---');
  console.log(codeSheet.slice(0, 20));
}

// Inspect 카미스BD headers and unique crops
if (workbook.Sheets['카미스BD']) {
  const kamisSheet = XLSX.utils.sheet_to_json(workbook.Sheets['카미스BD'], { header: 1 });
  console.log('--- 카미스BD Header & First 10 Rows ---');
  console.log(kamisSheet.slice(0, 10));
}

// Inspect 10개년BD
if (workbook.Sheets['10개년BD']) {
  const bd10Sheet = XLSX.utils.sheet_to_json(workbook.Sheets['10개년BD'], { header: 1 });
  console.log('--- 10개년BD Header & First 10 Rows ---');
  console.log(bd10Sheet.slice(0, 10));
}

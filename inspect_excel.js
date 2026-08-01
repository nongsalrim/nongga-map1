const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'F:\\2025\\충남도청\\컨설팅샘플(250509).xlsx';
console.log('Loading workbook:', filePath);

const workbook = XLSX.readFile(filePath);

console.log('Sheet Names:', workbook.SheetNames);

let report = [];

workbook.SheetNames.forEach((sheetName, idx) => {
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  let sheetInfo = {
    index: idx + 1,
    name: sheetName,
    range: sheet['!ref'],
    totalRows: rows.length,
    sampleRows: rows.slice(0, 15) // First 15 rows for inspection
  };
  
  report.push(sheetInfo);
});

fs.writeFileSync('excel_summary.json', JSON.stringify(report, null, 2), 'utf8');
console.log('Inspection complete! Written to excel_summary.json');

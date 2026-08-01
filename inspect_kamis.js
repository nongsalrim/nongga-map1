const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'F:\\2025\\충남도청\\컨설팅샘플(250509).xlsx';
console.log('Loading workbook:', filePath);
const workbook = XLSX.readFile(filePath);

const targetSheets = ['소득조사표', '카미스BD', 'Kg당 가격추이', '소득동향', '소득비교', '코드표'];

let details = {};

targetSheets.forEach(sheetName => {
  if (workbook.Sheets[sheetName]) {
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const nonEmp = json.filter(r => r.some(c => c !== ''));
    details[sheetName] = {
      totalRows: json.length,
      sample: nonEmp.slice(0, 35)
    };
  }
});

fs.writeFileSync('inspect_details.json', JSON.stringify(details, null, 2), 'utf8');
console.log('Details written to inspect_details.json');

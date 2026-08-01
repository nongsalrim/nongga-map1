const XLSX = require('xlsx');
const filePath = 'F:\\2025\\충남도청\\컨설팅샘플(250509).xlsx';
const workbook = XLSX.readFile(filePath, { cellFormulas: true, cellStyles: true });

const sheet = workbook.Sheets['소득조사표'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

console.log('--- 소득조사표 Cells & Formulas Sample ---');
for (let r = 0; r < Math.min(30, rows.length); r++) {
  let rowStr = [];
  for (let c = 0; c < Math.min(10, rows[r].length); c++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c });
    const cell = sheet[cellAddress];
    if (cell) {
      if (cell.f) {
        rowStr.push(`[${cellAddress}: =${cell.f}]`);
      } else if (cell.v !== undefined && cell.v !== '') {
        rowStr.push(`[${cellAddress}: ${cell.v}]`);
      }
    }
  }
  if (rowStr.length > 0) {
    console.log(`Row ${r+1}: ${rowStr.join(' ')}`);
  }
}

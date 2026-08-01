const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'F:\\2025\\충남도청\\컨설팅샘플(250509).xlsx';
const workbook = XLSX.readFile(filePath, { cellFormulas: true });

let detailedSummary = {};

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  // Filter out empty rows
  const nonEmptyRows = rows.filter(r => r.some(cell => cell !== ''));
  
  detailedSummary[sheetName] = {
    totalRows: rows.length,
    nonEmptyRowCount: nonEmptyRows.length,
    first20Rows: nonEmptyRows.slice(0, 25).map(row => 
      row.map(cell => typeof cell === 'string' ? cell.trim() : cell)
    )
  };
});

fs.writeFileSync('deep_summary.json', JSON.stringify(detailedSummary, null, 2), 'utf8');
console.log('Deep analysis written to deep_summary.json');

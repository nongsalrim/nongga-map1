const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'F:\\2025\\충남도청\\컨설팅샘플(250509).xlsx';
const workbook = XLSX.readFile(filePath);

const sheet10 = workbook.Sheets['10개년BD'];
if (sheet10) {
  const data10 = XLSX.utils.sheet_to_json(sheet10, { header: 1 });
  const headerRow = data10[0] || [];
  console.log('Total columns in 10개년BD:', headerRow.length);
  
  // Extract crop names from row 0 or 1
  let cropsFound = new Set();
  data10.slice(0, 5).forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
      if (typeof cell === 'string' && (cell.includes('수박') || cell.includes('딸기') || cell.includes('상추') || cell.includes('멜론') || cell.includes('고추') || cell.includes('토마토') || cell.includes('오이') || cell.includes('호박') || cell.includes('참외') || cell.includes('가지') || cell.includes('파프리카'))) {
        cropsFound.add(cell);
      }
    });
  });

  console.log('Crops found in 10개년BD:', Array.from(cropsFound));
}

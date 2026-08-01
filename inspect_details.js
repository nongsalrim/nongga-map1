const fs = require('fs');
const summary = JSON.parse(fs.readFileSync('deep_summary.json', 'utf8'));

['소득조사표', '시물레이션', '6개년 사업계획', '자산리스트', '대출리스트'].forEach(name => {
  console.log(`==================== [ SHEET: ${name} ] ====================`);
  if (summary[name]) {
    summary[name].first20Rows.forEach((row, i) => {
      console.log(`Row ${i+1}:`, row.filter(c => c !== '').join(' | '));
    });
  }
});

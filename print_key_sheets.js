const fs = require('fs');
const summary = JSON.parse(fs.readFileSync('deep_summary.json', 'utf8'));

const keySheets = ['목차', '소득조사표', '시물레이션', '6개년 사업계획', '자산리스트', '대출리스트', '소득비교', '노동시간동향', '상하위'];

keySheets.forEach(name => {
  console.log(`=== [ SHEET: ${name} ] ===`);
  if (summary[name]) {
    summary[name].first20Rows.forEach((row, i) => {
      const line = row.filter(c => c !== '').join(' | ');
      if (line) console.log(`Row ${i+1}: ${line}`);
    });
  }
  console.log('\n');
});

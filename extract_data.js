const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'F:\\2025\\충남도청\\컨설팅샘플(250509).xlsx';
const workbook = XLSX.readFile(filePath);

// 1. Asset List Data
const assetSheet = workbook.Sheets['자산리스트'];
const assets = XLSX.utils.sheet_to_json(assetSheet, { range: 2 });

// 2. Loan List Data
const loanSheet = workbook.Sheets['대출리스트'];
const loans = XLSX.utils.sheet_to_json(loanSheet, { range: 3 });

// 3. Top/Bottom Comparison Data
const topBottomSheet = workbook.Sheets['상하위'];
const topBottomData = XLSX.utils.sheet_to_json(topBottomSheet);

// 4. Sample 6-Year Business Plan Data
const planSheet = workbook.Sheets['6개년 사업계획'];
const businessPlan = XLSX.utils.sheet_to_json(planSheet, { header: 1 });

const output = {
  extractedAt: new Date().toISOString(),
  cropsAvailable: ['시설수박', '시설상추', '딸기', '고구마', '겉보리', '쌀보리', '밀', '노지풋옥수수'],
  assets: assets.slice(0, 15),
  loans: loans.slice(0, 10),
  topBottomData: topBottomData.slice(0, 25),
  businessPlanSample: businessPlan.slice(0, 30)
};

if (!fs.existsSync('src/data')) {
  fs.mkdirSync('src/data', { recursive: true });
}

fs.writeFileSync('src/data/sampleData.json', JSON.stringify(output, null, 2), 'utf8');
console.log('Sample data extracted successfully into src/data/sampleData.json');

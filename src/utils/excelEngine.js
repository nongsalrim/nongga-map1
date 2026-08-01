import { sampleDataRaw } from '../data/sampleData.js';
import { FULL_CROP_DATABASE } from '../data/cropDatabase.js';

const XLSX = typeof window !== 'undefined' ? window.XLSX : null;

// Pre-defined benchmark crop models (Full 19 Crops Database)
export const CROP_PRESETS = FULL_CROP_DATABASE;

export const SAMPLE_ASSETS = sampleDataRaw.assets || [];
export const SAMPLE_LOANS = sampleDataRaw.loans || [];

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        let result = {
          sheetNames: workbook.SheetNames,
          parsedData: {}
        };
        
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          result.parsedData[sheetName] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        });
        
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function calculateSimulatedPlan(baseModel, priceMultiplier = 1.0, areaMultiplier = 1.0) {
  const adjustedRevenue = Math.round(baseModel.revenue * priceMultiplier * areaMultiplier);
  const adjustedExpenses = Math.round(baseModel.operatingExpenses * areaMultiplier);
  const adjustedIncome = adjustedRevenue - adjustedExpenses;
  const adjustedNetProfit = Math.round(adjustedIncome * 0.78); // Estimate after tax & interest
  
  // 6-Year Growth Projection
  const years = [2025, 2026, 2027, 2028, 2029, 2030];
  const yearProjections = years.map((year, idx) => {
    const growthRate = 1 + (idx * 0.05); // 5% annual optimization/scale growth
    const yearRev = Math.round(adjustedRevenue * growthRate);
    const yearExp = Math.round(adjustedExpenses * (1 + idx * 0.03));
    const yearInc = yearRev - yearExp;
    return {
      year,
      revenue: yearRev,
      expense: yearExp,
      income: yearInc
    };
  });
  
  return {
    revenue: adjustedRevenue,
    expenses: adjustedExpenses,
    income: adjustedIncome,
    netProfit: adjustedNetProfit,
    bepRate: Math.round((adjustedExpenses / adjustedRevenue) * 100),
    yearProjections
  };
}

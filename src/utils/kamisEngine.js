/**
 * @file kamisEngine.js
 * @description KAMIS 유통시세 및 농진청 소득조사표 연동 진단 엔진 (안전 가드 적용)
 */

import { FULL_CROP_DATABASE } from '../data/cropDatabase.js';

const XLSX = typeof window !== 'undefined' ? window.XLSX : null;

/**
 * 농가 실제 실적과 KAMIS 유통시세/소득조사표 표준을 비교 분석
 */
export function analyzeKamisAlignment(farmModel) {
  const rawCropName = (farmModel.cropName || '시설수박').replace('업로드: ', '');
  const matchedCrop = FULL_CROP_DATABASE[rawCropName] || FULL_CROP_DATABASE['시설수박'];
  const cropName = matchedCrop ? matchedCrop.cropName : rawCropName;
  const kamisRef = (matchedCrop && matchedCrop.kamis) ? matchedCrop.kamis : {
    recentWholesalePrice: farmModel.pricePerKg || 2500,
    recentRetailPrice: Math.round((farmModel.pricePerKg || 2500) * 1.75),
    avg5YearPrice: Math.round((farmModel.pricePerKg || 2500) * 0.93),
    farmReceiveShare: 54.2,
    shippingCostShare: 7.5,
    wholesaleStageShare: 11.8,
    retailStageShare: 26.5,
    monthlyPriceTrends: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => ({ month: `${m}월`, price: farmModel.pricePerKg || 2500 }))
  };

  // 1. 단가 경쟁력 분석 (농가 추정 단가 vs KAMIS 5년 평균 & 최근 시세)
  const farmPricePerKg = farmModel.pricePerKg || (farmModel.yieldKg > 0 ? Math.round(farmModel.revenue / farmModel.yieldKg) : 2500);
  const recentWholesale = kamisRef.recentWholesalePrice || farmPricePerKg;
  const avg5Year = kamisRef.avg5YearPrice || farmPricePerKg;

  const priceVsAvgRatio = avg5Year > 0 ? ((farmPricePerKg / avg5Year) * 100).toFixed(1) : '100.0';
  const priceVsRecentRatio = recentWholesale > 0 ? ((farmPricePerKg / recentWholesale) * 100).toFixed(1) : '100.0';

  let priceGrade = '양호';
  let priceAdvice = '시세 수준에 부합합니다.';
  if (farmPricePerKg > recentWholesale * 1.1) {
    priceGrade = '최상 (프리미엄)';
    priceAdvice = '전국 도매시세 대비 10% 이상 높은 고품질/고단가 출하 구조 형성 중입니다.';
  } else if (farmPricePerKg < recentWholesale * 0.9) {
    priceGrade = '주의 (낮음)';
    priceAdvice = '도매 시세 대비 단가가 낮습니다. 출하 시기 조정 또는 직거래 비율 확대가 필요합니다.';
  }

  // 2. 소득조사표 경영비 비목별 갭 분석 (Over/Under)
  const majorCostRatios = (kamisRef.standardSurvey && kamisRef.standardSurvey.majorCostRatios) || {};
  const costBreakdown = farmModel.costBreakdown || [];

  const costAnalysis = costBreakdown.map(item => {
    const stdRatio = majorCostRatios[item.name] !== undefined ? majorCostRatios[item.name] : (item.percent || 15.0);
    const farmRatio = item.percent || 0;
    const diff = parseFloat((farmRatio - stdRatio).toFixed(1));
    return {
      name: item.name,
      farmCost: item.cost,
      farmPercent: farmRatio,
      stdPercent: stdRatio,
      diffPercent: diff,
      status: diff > 3.0 ? '과다 (절감필요)' : diff < -3.0 ? '효율적' : '적정'
    };
  });

  // 3. 유통채널 개선 시 소득 증대 효과 계산 (직거래 비중 20% 증가 시)
  const currentFarmIncome = farmModel.income || 0;
  const retailShare = kamisRef.retailStageShare || 26.5;
  const directSalesGain = Math.round((farmModel.revenue || 0) * 0.20 * (retailShare / 100));
  const expectedIncomeAfterDirect = currentFarmIncome + directSalesGain;

  // 4. 종합 진단 등급 산출 (Score: 100점 만점)
  let score = 80;
  if (Number(priceVsRecentRatio) >= 105) score += 10;
  if (Number(priceVsRecentRatio) < 90) score -= 10;

  let grade = 'B (우수)';
  if (score >= 90) grade = 'A+ (최우수)';
  else if (score >= 80) grade = 'A (우수)';
  else if (score >= 70) grade = 'B (보통)';
  else grade = 'C (개선필요)';

  return {
    cropName,
    kamisRef,
    farmPricePerKg,
    priceVsAvgRatio,
    priceVsRecentRatio,
    priceGrade,
    priceAdvice,
    costAnalysis,
    expectedIncomeAfterDirect,
    directSalesGain,
    score,
    grade
  };
}

/**
 * 엑셀 다운로드 유틸리티
 */
export function exportExcelReport(farmModel, analysis) {
  if (!XLSX) {
    alert('XLSX 라이브러리가 로드되지 않았습니다.');
    return;
  }
  const wb = XLSX.utils.book_new();
  const data = [
    ['진단 항목', '결과 값'],
    ['진단 대상 작목', farmModel.cropName],
    ['경영 진단 등급', analysis.grade],
    ['농가 출하 단가', `${analysis.farmPricePerKg} 원/kg`],
    ['KAMIS 도매 시세 대비', `${analysis.priceVsRecentRatio}%`],
    ['직거래 20% 확대 시 추가 소득', `${analysis.directSalesGain} 원`],
    ['', ''],
    ['비목명', '농가 비중(%)', '표준 비중(%)', '진단 결과'],
    ...analysis.costAnalysis.map(c => [c.name, `${c.farmPercent}%`, `${c.stdPercent}%`, c.status])
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'KAMIS_경영진단');
  XLSX.writeFile(wb, `${farmModel.cropName}_KAMIS_경영진단서.xlsx`);
}

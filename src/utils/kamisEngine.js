/**
 * @file kamisEngine.js
 * @description KAMIS 유통시세 및 농진청 소득조사표 연동 진단 엔진
 */

import { FULL_CROP_DATABASE } from '../data/cropDatabase.js';

const XLSX = typeof window !== 'undefined' ? window.XLSX : null;

/**
 * 농가 실제 실적과 KAMIS 유통시세/소득조사표 표준을 비교 분석
 */
export function analyzeKamisAlignment(farmModel) {
  const rawCropName = farmModel.cropName.replace('업로드: ', '');
  const matchedCrop = FULL_CROP_DATABASE[rawCropName] || FULL_CROP_DATABASE['시설수박'];
  const cropName = matchedCrop.cropName;
  const kamisRef = matchedCrop.kamis;


  // 1. 단가 경쟁력 분석 (농가 추정 단가 vs KAMIS 5년 평균 & 최근 시세)
  const farmPricePerKg = farmModel.pricePerKg || Math.round(farmModel.revenue / (farmModel.yieldKg || 180000));
  const priceVsAvgRatio = ((farmPricePerKg / kamisRef.avg5YearPrice) * 100).toFixed(1);
  const priceVsRecentRatio = ((farmPricePerKg / kamisRef.recentWholesalePrice) * 100).toFixed(1);

  let priceGrade = '양호';
  let priceAdvice = '시세 수준에 부합합니다.';
  if (farmPricePerKg > kamisRef.recentWholesalePrice * 1.1) {
    priceGrade = '최상 (프리미엄)';
    priceAdvice = '전국 도매시세 대비 10% 이상 높은 고품질/고단가 출하 구조 형성 중입니다.';
  } else if (farmPricePerKg < kamisRef.recentWholesalePrice * 0.9) {
    priceGrade = '주의 (낮음)';
    priceAdvice = '도매 시세 대비 단가가 낮습니다. 출하 시기 조정 또는 직거래 비율 확대가 필요합니다.';
  }

  // 2. 소득조사표 경영비 비목별 갭 분석 (Over/Under)
  const totalCost = farmModel.operatingExpenses;
  const costAnalysis = farmModel.costBreakdown.map(item => {
    const stdRatio = kamisRef.standardSurvey.majorCostRatios[item.name] || 15.0;
    const farmRatio = item.percent;
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
  const currentFarmIncome = farmModel.income;
  const directSalesGain = Math.round(farmModel.revenue * 0.20 * (kamisRef.retailStageShare / 100));
  const expectedIncomeAfterDirect = currentFarmIncome + directSalesGain;

  // 4. 종합 진단 등급 산출 (Score: 100점 만점)
  let score = 80;
  if (priceVsRecentRatio >= 105) score += 10;
  if (priceVsRecentRatio < 90) score -= 10;

  const bep = (farmModel.operatingExpenses / farmModel.revenue) * 100;
  if (bep <= 35) score += 10;
  else if (bep > 50) score -= 10;

  let grade = 'A';
  if (score >= 90) grade = 'S (우수 농가)';
  else if (score >= 80) grade = 'A (양호 농가)';
  else if (score >= 70) grade = 'B (보통 농가)';
  else grade = 'C (개선 필요 농가)';

  return {
    cropName,
    kamisRef,
    farmPricePerKg,
    priceVsAvgRatio,
    priceVsRecentRatio,
    priceGrade,
    priceAdvice,
    costAnalysis,
    currentFarmIncome,
    directSalesGain,
    expectedIncomeAfterDirect,
    grade,
    score
  };
}

/**
 * 엑셀 리포트 (.xlsx) 파일 다운로드 생성기
 */
export function exportExcelReport(farmModel, analysisResult) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: 종합 경영진단 요약
  const summaryData = [
    ['농가살림연구소(주) 경영진단 종합 보고서'],
    ['진단일자', new Date().toLocaleDateString('ko-KR')],
    ['진단 작목', farmModel.cropName],
    ['재배 면적', `${farmModel.areaPyung} 평 (${farmModel.areaM2} ㎡)`],
    ['경영 진단 등급', analysisResult.grade],
    ['진단 점수', `${analysisResult.score} 점 / 100점`],
    [],
    ['[재무 손익 핵심 지표]'],
    ['구분', '금액(원)', '매출 대비 비중(%)'],
    ['총수입 (매출액)', farmModel.revenue, '100.0%'],
    ['경영비 합계', farmModel.operatingExpenses, `${((farmModel.operatingExpenses / farmModel.revenue) * 100).toFixed(1)}%`],
    ['농가소득', farmModel.income, `${((farmModel.income / farmModel.revenue) * 100).toFixed(1)}%`],
    ['순이익', farmModel.netProfit, `${((farmModel.netProfit / farmModel.revenue) * 100).toFixed(1)}%`]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, '종합경영진단');

  // Sheet 2: KAMIS 연동 비목별 원가분석
  const costHeader = [['비목명', '농가 집계금액(원)', '농가 비중(%)', 'KAMIS 소득조사표 표준 비중(%)', '차이(%)', '진단 결과']];
  const costRows = analysisResult.costAnalysis.map(c => [
    c.name, c.farmCost, `${c.farmPercent}%`, `${c.stdPercent}%`, `${c.diffPercent}%`, c.status
  ]);

  const wsCost = XLSX.utils.aoa_to_sheet([...costHeader, ...costRows]);
  XLSX.utils.book_append_sheet(wb, wsCost, '소득조사비목분석');

  // Save workbook file
  const fileName = `농가경영진단보고서_${farmModel.cropName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

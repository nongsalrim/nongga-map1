/**
 * @file kamisData.js
 * @description KAMIS (한국농수산식품유통공사) 유통정보 및 농진청 농산물 소득조사표 기준 데이터 DB
 */

export const KAMIS_CROP_MARKET_DATA = {
  '시설수박': {
    cropName: '시설수박',
    unit: 'kg',
    recentWholesalePrice: 2150, // 최근 도매가격 (원/kg)
    recentRetailPrice: 3800,    // 최근 소매가격 (원/kg)
    avg5YearPrice: 1980,        // 5년 평균 도매가격
    farmReceiveShare: 53.5,     // 농가 수취율 (%)
    shippingCostShare: 7.2,     // 출하 직접비 (%)
    wholesaleStageShare: 11.8,  // 도매 단계 마진 (%)
    retailStageShare: 27.5,     // 소매 단계 마진 (%)
    monthlyPriceTrends: [
      { month: '1월', price: 2400 },
      { month: '2월', price: 2550 },
      { month: '3월', price: 2300 },
      { month: '4월', price: 2100 },
      { month: '5월', price: 1850 },
      { month: '6월', price: 1650 },
      { month: '7월', price: 1500 },
      { month: '8월', price: 1750 },
      { month: '9월', price: 2050 },
      { month: '10월', price: 2200 },
      { month: '11월', price: 2350 },
      { month: '12월', price: 2500 }
    ],
    standardSurvey: {
      yieldPer10a: 5468, // kg/10a (1,000평 = 3305㎡ 기준)
      grossIncomePer10a: 9842400,
      operatingCostPer10a: 3156000,
      farmIncomePer10a: 6686400,
      majorCostRatios: {
        '종자/종묘비': 11.7,
        '비료비': 14.0,
        '농약비': 4.9,
        '광열비': 11.1,
        '시설상각비': 13.5,
        '기타재료비': 33.4,
        '고용인건비': 11.4
      }
    }
  },
  '딸기': {
    cropName: '딸기',
    unit: 'kg',
    recentWholesalePrice: 12500,
    recentRetailPrice: 18900,
    avg5YearPrice: 11800,
    farmReceiveShare: 58.2,
    shippingCostShare: 6.5,
    wholesaleStageShare: 10.3,
    retailStageShare: 25.0,
    monthlyPriceTrends: [
      { month: '1월', price: 14500 },
      { month: '2월', price: 13800 },
      { month: '3월', price: 12000 },
      { month: '4월', price: 10500 },
      { month: '5월', price: 8900 },
      { month: '6월', price: 7500 },
      { month: '11월', price: 16500 },
      { month: '12월', price: 15200 }
    ],
    standardSurvey: {
      yieldPer10a: 2333,
      grossIncomePer10a: 28000000,
      operatingCostPer10a: 10416000,
      farmIncomePer10a: 17584000,
      majorCostRatios: {
        '종묘비': 17.6,
        '비료/양액': 14.4,
        '난방/광열비': 22.4,
        '고용노동비': 28.0,
        '시설상각비': 17.6
      }
    }
  },
  '시설상추': {
    cropName: '시설상추',
    unit: 'kg',
    recentWholesalePrice: 4500,
    recentRetailPrice: 8200,
    avg5YearPrice: 4100,
    farmReceiveShare: 49.5,
    shippingCostShare: 8.5,
    wholesaleStageShare: 14.0,
    retailStageShare: 28.0,
    monthlyPriceTrends: [
      { month: '1월', price: 3800 },
      { month: '2월', price: 4100 },
      { month: '3월', price: 4200 },
      { month: '4월', price: 4500 },
      { month: '5월', price: 4800 },
      { month: '6월', price: 5200 },
      { month: '7월', price: 6100 },
      { month: '8월', price: 6800 },
      { month: '9월', price: 5500 },
      { month: '10월', price: 4300 },
      { month: '11월', price: 3900 },
      { month: '12월', price: 4000 }
    ],
    standardSurvey: {
      yieldPer10a: 4375,
      grossIncomePer10a: 18375000,
      operatingCostPer10a: 7250000,
      farmIncomePer10a: 11125000,
      majorCostRatios: {
        '종자/종묘비': 14.6,
        '비료/농약비': 20.7,
        '인건비/고용노동': 31.0,
        '기타재료/광열비': 21.6,
        '시설상각비': 12.1
      }
    }
  }
};

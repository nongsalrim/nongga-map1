/**
 * @file FarmIntakeStep.js
 * @description 농가 경영체 정밀 데이터 입력 스키마
 * (건립/취득년도 vs 현재 시점 잔존가액 감가상각 정밀 계산 및 6차 산업 1·2·3차 산물 세부 매출 포함 통합 경영분석 엔진)
 */

import { FULL_CROP_DATABASE } from '../data/cropDatabase.js';
import { 
  saveFarmDraft, 
  getFarmDrafts, 
  autoSaveFarmDraft, 
  getAutoSaveDraft, 
  openFarmDraftModal 
} from './FarmDraftModal.js';

export function renderFarmIntakeStep(container, currentModel, currentAssets, currentLoans, onSubmit, onCropChange, onDraftLoad) {
  let selectedCropKey = currentModel.cropName ? currentModel.cropName.replace('업로드: ', '') : '시설딸기(수경)';
  if (!FULL_CROP_DATABASE[selectedCropKey]) selectedCropKey = '시설딸기(수경)';

  let baseCropModel = FULL_CROP_DATABASE[selectedCropKey];
  const currentYear = new Date().getFullYear();

  let farmState = {
    farmName: currentModel.farmOwner || currentModel.farmName || '공주시',
    region: currentModel.region || '충남',
    category: currentModel.category || baseCropModel.category || '시설채소',
    cropName: selectedCropKey,
    areaPyung: currentModel.areaPyung || 1000,
    areaM2: currentModel.areaM2 || Math.round((currentModel.areaPyung || 1000) * 3.305785),
    cycles: currentModel.cycles || 1,
    customRevenue: currentModel.revenue !== undefined ? currentModel.revenue : null,
    customPricePerKg: currentModel.pricePerKg !== undefined ? currentModel.pricePerKg : null,
    customYieldKg: currentModel.yieldKg !== undefined ? currentModel.yieldKg : null,
    revRaw: (currentModel.revenueBreakdown && currentModel.revenueBreakdown.raw !== undefined) ? currentModel.revenueBreakdown.raw : null,
    revByproduct: (currentModel.revenueBreakdown && currentModel.revenueBreakdown.byproduct !== undefined) ? currentModel.revenueBreakdown.byproduct : 0,
    revProcessed: (currentModel.revenueBreakdown && currentModel.revenueBreakdown.processed !== undefined) ? currentModel.revenueBreakdown.processed : 0,
    revExperience: (currentModel.revenueBreakdown && currentModel.revenueBreakdown.experience !== undefined) ? currentModel.revenueBreakdown.experience : 0
  };

  let assetsState = JSON.parse(JSON.stringify(currentAssets || []));
  let loansState = JSON.parse(JSON.stringify(currentLoans || []));

  // Default sample assets if empty
  if (!assetsState || assetsState.length === 0) {
    assetsState = [
      { 연번: 1, 목록: "주재배 온실 (유리/양액시설)", 구입가: 300000000, 건립년도: 2021, 내용년수: 15 },
      { 연번: 2, 목록: "난방 시설 및 광열 제어기", 구입가: 50000000, 건립년도: 2022, 내용년수: 10 },
      { 연번: 3, 목록: "농용 운반차 및 수확기", 구입가: 25000000, 건립년도: 2020, 내용년수: 8 },
      { 연번: 4, 목록: "저자극 양액 공급 장치", 구입가: 55490348, 건립년도: 2023, 내용년수: 10 }
    ];
  }

  // Default sample loans if empty
  if (!loansState || loansState.length === 0) {
    loansState = [
      { 대출조건: "원리금균등", 은행명: "청창농 사업비 대출", 대출금액: 314000000, 이자율: 1.5, 대출기간: 25, 거치기간: 5 },
      { 대출조건: "원금균등", 은행명: "충보 신용보증기금", 대출금액: 200000000, 이자율: 1.3, 대출기간: 5, 거치기간: 2 },
      { 대출조건: "일시상환", 은행명: "운전자금 신용대출", 대출금액: 50000000, 이자율: 5.09, 대출기간: 2, 거치기간: 2 },
      { 대출조건: "일시상환", 은행명: "시설 보구 신용대출", 대출금액: 60000000, 이자율: 5.08, 대출기간: 2, 거치기간: 2 }
    ];
  }

  let costItemsState = currentModel.costItemsState || null;
  let toastMsg = null;
  let lastAutoSaveTime = null;

  // Utility formatters
  const parseNum = (val) => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/%/g, '').replace(/원/g, '').trim();
    return Number(cleanStr) || 0;
  };

  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(parseNum(val))) + ' 원';
  const formatComma = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(parseNum(val)));
  
  const formatShortMoney = (val) => {
    const million = parseNum(val) / 10000;
    const formattedNum = (Math.round(million * 10) / 10).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `${formattedNum}만 원`;
  };

  // Helper for asset metrics based on build year vs current analysis year
  function calcAssetDepreciationMetrics(assets, targetYear = currentYear) {
    let totalCost = 0;
    let totalBookValue = 0;
    let totalAnnualDep = 0;

    const rows = (assets || []).filter(Boolean).map((a, idx) => {
      const price = parseNum(a.구입가 !== undefined ? a.구입가 : a.price) || 0;
      const buildYear = parseNum(a.건립년도 || a.buildYear) || (targetYear - 2);
      const years = parseNum(a.내용년수 || a.years) || 10;

      const elapsed = Math.max(0, targetYear - buildYear);
      const remainingYears = Math.max(0, years - elapsed);
      const annual = (remainingYears > 0 && years > 0) ? Math.round(price / years) : 0;
      const bookValue = Math.max(0, price - (annual * elapsed));

      totalCost += price;
      totalBookValue += bookValue;
      totalAnnualDep += annual;

      return {
        idx: idx + 1,
        name: a.목록 || a.name || '자산/시설',
        buildYear,
        years,
        elapsed,
        remainingYears,
        price,
        bookValue,
        annual,
        isCompleted: remainingYears <= 0
      };
    });

    return { rows, totalCost, totalBookValue, totalAnnualDep };
  }

  // Auto save trigger function
  function triggerAutoSave() {
    lastAutoSaveTime = autoSaveFarmDraft(farmState, costItemsState, assetsState, loansState);
  }

  // Calculate 5-Year Debt Repayment Schedule
  function calc5YearSchedule(loans) {
    const schedule = [1, 2, 3, 4, 5].map(y => ({
      year: y,
      principal: 0,
      interest: 0,
      total: 0,
      remainingBalance: 0,
      graceCount: 0,
      repayCount: 0
    }));

    (loans || []).filter(Boolean).forEach(loan => {
      let balance = parseNum(loan.대출금액 !== undefined ? loan.대출금액 : (loan.amount !== undefined ? loan.amount : loan.원금)) || 0;
      if (balance <= 0) return;

      const rateVal = parseNum(loan.이자율 !== undefined ? loan.이자율 : (loan.rate !== undefined ? loan.rate : loan.금리)) || 1.5;
      const rate = rateVal > 1 ? rateVal / 100 : rateVal;

      let period = parseNum(loan.대출기간 !== undefined ? loan.대출기간 : (loan.period !== undefined ? loan.period : loan.기간));
      if (!period && typeof loan.대출기간 === 'string') {
        const match = loan.대출기간.match(/^(\d+)/);
        if (match) period = parseInt(match[1], 10);
      }
      if (!period) period = 10;

      let grace = parseNum(loan.거치기간 !== undefined ? loan.거치기간 : (loan.grace !== undefined ? loan.grace : loan.gracePeriod));
      if (grace === undefined && typeof loan.대출기간 === 'string') {
        const match = loan.대출기간.match(/(\d+)\s*년\s*거치/);
        if (match) grace = parseInt(match[1], 10);
      }
      if (grace === undefined) grace = 0;

      const type = loan.대출조건 || loan.대출종류 || loan.type || '원리금균등';
      const repayYears = Math.max(1, period - grace);

      for (let y = 1; y <= 5; y++) {
        if (balance <= 0) continue;

        let p = 0;
        let i = Math.round(balance * rate);

        if (y <= grace) {
          p = 0;
          schedule[y - 1].graceCount++;
        } else {
          schedule[y - 1].repayCount++;
          if (type === '원금균등') {
            p = Math.min(balance, Math.round((parseNum(loan.대출금액) || 0) / repayYears));
          } else if (type === '일시상환') {
            if (y === period) {
              p = balance;
            } else {
              p = 0;
            }
          } else {
            const P = balance;
            const r = rate;
            const n = Math.max(1, period - y + 1);
            let pmt = 0;
            if (r > 0) {
              pmt = Math.round(P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
            } else {
              pmt = Math.round(P / n);
            }
            p = Math.min(balance, Math.max(0, pmt - i));
          }
        }

        balance = Math.max(0, balance - p);

        schedule[y - 1].principal += p;
        schedule[y - 1].interest += i;
        schedule[y - 1].total += (p + i);
      }
    });

    let totalInitialBalance = loans.reduce((sum, l) => sum + (parseNum(l.대출금액 || l.amount || l.원금) || 0), 0);
    let cumPrincipal = 0;
    schedule.forEach(s => {
      cumPrincipal += s.principal;
      s.remainingBalance = Math.max(0, totalInitialBalance - cumPrincipal);
    });

    return schedule;
  }

  function applyRdaBenchmarkToInputs() {
    baseCropModel = FULL_CROP_DATABASE[farmState.cropName] || FULL_CROP_DATABASE['시설상추'];
    const areaScaleFactor = (farmState.areaPyung || 1000) / (baseCropModel.areaPyung || 1000);
    const cycleScaleFactor = (farmState.cycles || 1) / (baseCropModel.cycles || 1);
    const totalScaleFactor = areaScaleFactor * cycleScaleFactor;

    farmState.customRevenue = null;
    farmState.customPricePerKg = null;
    farmState.customYieldKg = null;
    farmState.revRaw = null;
    farmState.revByproduct = 0;
    farmState.revProcessed = 0;
    farmState.revExperience = 0;

    const assetMetrics = calcAssetDepreciationMetrics(assetsState, currentYear);

    const year1InterestTotal = loansState.reduce((sum, loan) => {
      const amount = parseNum(loan.대출금액 !== undefined ? loan.대출금액 : (loan.amount !== undefined ? loan.amount : loan.원금)) || 0;
      const rateVal = parseNum(loan.이자율 !== undefined ? loan.이자율 : (loan.rate !== undefined ? loan.rate : loan.금리)) || 1.5;
      const rate = rateVal > 1 ? rateVal / 100 : rateVal;
      return sum + Math.round(amount * rate);
    }, 0);

    const cb = baseCropModel.costBreakdown || [];
    const totalBaseExpenses = (baseCropModel.operatingExpenses || 50000000) * totalScaleFactor;

    function findScaledCost(targetKeys, defaultPct) {
      for (const item of cb) {
        if (targetKeys.some(k => item.name.includes(k))) {
          return Math.round(item.cost * totalScaleFactor);
        }
      }
      return Math.round(totalBaseExpenses * defaultPct);
    }

    costItemsState = {
      _cropName: farmState.cropName,
      _scale: totalScaleFactor,
      variable: [
        { name: '종자/종묘비', key: '종자/종묘비', cost: findScaledCost(['종자', '종묘', '입목'], 0.10) },
        { name: '보통비료비', key: '보통비료비', cost: findScaledCost(['보통비료'], 0.08) },
        { name: '부산물비료비', key: '부산물비료비', cost: findScaledCost(['부산물비료', '퇴비'], 0.07) },
        { name: '농약/방제비', key: '농약비', cost: findScaledCost(['농약', '방제'], 0.08) },
        { name: '광열비/동력비', key: '기타비용 및 광열비', cost: findScaledCost(['광열비', '동력비', '기타비용'], 0.08) },
        { name: '고용인건비', key: '고용인건비', cost: findScaledCost(['인건비'], 0.10) },
        { name: '기타재료비', key: '기타재료비', cost: findScaledCost(['재료비'], 0.15) },
        { name: '대출이자 (순수 금융비용)', key: '대출이자', cost: year1InterestTotal, isAutoSynced: true }
      ],
      fixed: [
        { name: '시설/대농구 상각비', key: '대농구/시설상각비', cost: assetMetrics.totalAnnualDep > 0 ? assetMetrics.totalAnnualDep : findScaledCost(['상각비'], 0.12), isAutoSynced: assetMetrics.totalAnnualDep > 0 },
        { name: '자동차/운반비', key: '자동차비', cost: findScaledCost(['자동차', '운반', '차량'], 0.10) },
        { name: '수리 및 유지관리비', key: '수리비', cost: findScaledCost(['수리'], 0.05) },
        { name: '임차료/기타 고정비', key: '기타고정비', cost: findScaledCost(['기타고정비', '임차료'], 0.07) }
      ]
    };

    toastMsg = `✅ [농진청/산림청 ${farmState.region}지역 소득조사표] ${farmState.cropName} (${formatComma(farmState.areaPyung)}평 기준) 표준 예산 및 원물 매출 복원 완료!`;
    triggerAutoSave();
  }

  function renderForm() {
    baseCropModel = FULL_CROP_DATABASE[farmState.cropName] || FULL_CROP_DATABASE['시설상추'];
    
    const areaScaleFactor = (farmState.areaPyung || 1000) / (baseCropModel.areaPyung || 1000);
    const cycleScaleFactor = (farmState.cycles || 1) / (baseCropModel.cycles || 1);
    const totalScaleFactor = areaScaleFactor * cycleScaleFactor;

    const assetMetrics = calcAssetDepreciationMetrics(assetsState, currentYear);

    const year1InterestTotal = loansState.reduce((sum, loan) => {
      const amount = parseNum(loan.대출금액 !== undefined ? loan.대출금액 : (loan.amount !== undefined ? loan.amount : loan.원금)) || 0;
      const rateVal = parseNum(loan.이자율 !== undefined ? loan.이자율 : (loan.rate !== undefined ? loan.rate : loan.금리)) || 1.5;
      const rate = rateVal > 1 ? rateVal / 100 : rateVal;
      return sum + Math.round(amount * rate);
    }, 0);

    const rdaScaledCosts = (baseCropModel.costBreakdown || []).reduce((acc, item) => {
      acc[item.name] = Math.round(item.cost * totalScaleFactor);
      return acc;
    }, {});

    const isCropChanged = costItemsState && costItemsState._cropName && costItemsState._cropName !== farmState.cropName && !costItemsState._isLoadedFromDraft;
    
    if (!costItemsState || isCropChanged) {
      applyRdaBenchmarkToInputs();
    } else {
      costItemsState._cropName = farmState.cropName;
      costItemsState._scale = totalScaleFactor;
      delete costItemsState._isLoadedFromDraft;

      const depItem = costItemsState.fixed.find(i => i.name === '시설/대농구 상각비' || i.name.includes('상각비'));
      if (depItem && assetMetrics.totalAnnualDep > 0) {
        depItem.cost = assetMetrics.totalAnnualDep;
        depItem.isAutoSynced = true;
      }

      const intItem = costItemsState.variable.find(i => i.name.includes('대출이자') || i.key === '대출이자');
      if (intItem) {
        if (intItem.isAutoSynced !== false) {
          intItem.cost = year1InterestTotal;
          intItem.isAutoSynced = true;
        }
      } else {
        costItemsState.variable.push({
          name: '대출이자 (순수 금융비용)',
          key: '대출이자',
          cost: year1InterestTotal,
          isAutoSynced: true
        });
      }
    }

    const calculatedRevenue = Math.round(baseCropModel.revenue * totalScaleFactor);
    const totalVariableExpenses = costItemsState.variable.reduce((sum, item) => sum + (parseNum(item.cost) || 0), 0);
    const totalFixedExpenses = costItemsState.fixed.reduce((sum, item) => sum + (parseNum(item.cost) || 0), 0);
    const calculatedExpenses = totalVariableExpenses + totalFixedExpenses;

    const actualPricePerKg = farmState.customPricePerKg !== null ? farmState.customPricePerKg : (baseCropModel.pricePerKg || 2500);
    const actualYieldKg = farmState.customYieldKg !== null ? farmState.customYieldKg : Math.round((baseCropModel.yieldKg || 10000) * totalScaleFactor);

    const revRaw = farmState.revRaw !== null ? farmState.revRaw : Math.round(actualPricePerKg * actualYieldKg);
    const revByproduct = parseNum(farmState.revByproduct);
    const revProcessed = parseNum(farmState.revProcessed);
    const revExperience = parseNum(farmState.revExperience);

    const totalActualRevenue = revRaw + revByproduct + revProcessed + revExperience;
    const actualIncome = totalActualRevenue - calculatedExpenses;

    const rawShare = totalActualRevenue > 0 ? ((revRaw / totalActualRevenue) * 100).toFixed(1) : 0;
    const byproductShare = totalActualRevenue > 0 ? ((revByproduct / totalActualRevenue) * 100).toFixed(1) : 0;
    const processedShare = totalActualRevenue > 0 ? ((revProcessed / totalActualRevenue) * 100).toFixed(1) : 0;
    const experienceShare = totalActualRevenue > 0 ? ((revExperience / totalActualRevenue) * 100).toFixed(1) : 0;

    const totalLoansAmount = loansState.reduce((sum, l) => sum + (parseNum(l.대출금액 || l.amount || l.원금) || 0), 0);
    const schedule5Years = calc5YearSchedule(loansState);

    const allCrops = Object.keys(FULL_CROP_DATABASE);
    const categories = Array.from(new Set(allCrops.map(k => FULL_CROP_DATABASE[k].category || '기타')));

    const filteredCrops = farmState.category === '전체' 
      ? allCrops 
      : allCrops.filter(k => (FULL_CROP_DATABASE[k].category || '기타') === farmState.category);

    const savedDrafts = getFarmDrafts();

    container.innerHTML = `
      <div style="max-width: 1300px; margin: 0 auto; padding-bottom: 60px;">
        
        <!-- STEP 1 헤더 타이틀 -->
        <div style="background: linear-gradient(135deg, #0F172A, #1E293B); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; padding: 28px 32px; margin-bottom: 24px; text-align: center; color: #FFF; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
          <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #10B981; border: 1px solid rgba(16,185,129,0.4); padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; display: inline-block; margin-bottom: 10px;">EXCEL CONSULTING INPUT SCHEMA</span>
          <h1 style="font-size: 26px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 6px;">
            📝 농가 경영체 정밀 데이터 입력 센터
          </h1>
          <p style="font-size: 14px; color: #94A3B8; margin: 0 auto; max-width: 880px;">
            성실하게 관리한 정확한 데이터는 내 농장의 현재와 미래를 결정합니다.
          </p>
        </div>

        <!-- 💾 농가별 데이터 중간 저장 & 불러오기 관리 컨트롤 바 -->
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 14px; padding: 14px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 14px; font-weight: 800; color: #10B981; display: flex; align-items: center; gap: 6px;">
              💾 농가별 데이터 중간 저장 관리
            </span>
            <span id="draft-auto-save-status" style="font-size: 11.5px; color: #A7F3D0; background: rgba(16,185,129,0.2); padding: 3px 8px; border-radius: 6px; font-weight: 700;">
              ${lastAutoSaveTime ? `⚡ 실시간 자동 저장 완료 (${lastAutoSaveTime})` : '⚡ 실시간 자동 저장 작동 중'}
            </span>
          </div>

          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <button id="btn-save-farm-draft" style="background: linear-gradient(135deg, #10B981, #059669); color: #FFFFFF; border: none; padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 900; cursor: pointer; box-shadow: 0 4px 14px rgba(16,185,129,0.4); display: flex; align-items: center; gap: 8px; transition: all 0.2s ease;">
              💾 현재 농가 데이터 중간 저장
            </button>
            <button id="btn-open-draft-modal" style="background: linear-gradient(135deg, #2563EB, #1D4ED8); color: #FFFFFF; border: 1px solid #3B82F6; padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(37,99,235,0.4); transition: all 0.2s ease;">
              📂 저장된 농가 목록 불러오기 (${savedDrafts.length}개)
            </button>
          </div>
        </div>

        ${toastMsg ? `
          <div style="background: rgba(16,185,129,0.15); border: 1px solid #10B981; color: #A7F3D0; padding: 14px 20px; border-radius: 12px; margin-bottom: 24px; font-size: 14px; font-weight: 700; display: flex; justify-content: space-between; align-items: center;">
            <span>${toastMsg}</span>
            <button id="close-toast-btn" style="background:none; border:none; color:#A7F3D0; font-size:16px; cursor:pointer; font-weight:900;">✕</button>
          </div>
        ` : ''}

        <!-- 1. 엑셀 7대 컬럼 경영체 기본 데이터 입력 표 -->
        <div style="background: #1E293B; border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 24px; margin-bottom: 24px; color: #FFF; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; margin-bottom: 18px; flex-wrap:wrap; gap:10px;">
            <h2 style="font-size: 17px; font-weight: 800; color: #10B981; display: flex; align-items: center; gap: 8px;">
              📊 1. 농가 경영체 기본 데이터 (엑셀 표준 입력 양식)
            </h2>
            <button id="btn-apply-rda-direct" style="background: linear-gradient(135deg, #10B981, #059669); color: #FFF; border: none; padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 14px rgba(16,185,129,0.4); display: flex; align-items: center; gap: 6px; transition: all 0.2s ease;">
              🔄 면적·기작 기준 농진청 지역 소득조사표 평균 예산 입력란에 자동 적용
            </button>
          </div>

          <div class="data-table-container">
            <table class="data-table" style="text-align: center; border-collapse: separate; border-spacing: 0;">
              <thead>
                <tr style="background: rgba(59, 130, 246, 0.2); color: #93C5FD; font-size:14px;">
                  <th style="padding:12px; text-align:center;">농가명</th>
                  <th style="padding:12px; text-align:center;">지역</th>
                  <th style="padding:12px; text-align:center;">작목분류</th>
                  <th style="padding:12px; text-align:center; min-width:140px;">작목명</th>
                  <th style="padding:12px; text-align:center;">면적(㎡)</th>
                  <th style="padding:12px; text-align:center;">평</th>
                  <th style="padding:12px; text-align:center;">기작</th>
                </tr>
              </thead>
              <tbody>
                <tr style="background: rgba(255,255,255,0.03);">
                  <td style="padding:10px;">
                    <input type="text" id="ex-farm-name" value="${farmState.farmName}" placeholder="예: 공주시" style="text-align:center; padding:10px; background:#0F172A; border:1px solid rgba(255,255,255,0.2); color:#FFF; border-radius:8px; width:100%; font-size:14px; font-weight:700;" />
                  </td>
                  <td style="padding:10px;">
                    <select id="ex-region" style="padding:10px; background:#0F172A; border:1px solid rgba(255,255,255,0.2); color:#FFF; border-radius:8px; width:100%; text-align:center; font-size:14px; font-weight:600;">
                      ${['충남', '충북', '전남', '전북', '경남', '경북', '경기', '강원', '제주'].map(r => `<option value="${r}" ${farmState.region === r ? 'selected' : ''}>${r}</option>`).join('')}
                    </select>
                  </td>
                  <td style="padding:10px;">
                    <select id="ex-category" style="padding:10px; background:#0F172A; border:1px solid rgba(255,255,255,0.2); color:#FFF; border-radius:8px; width:100%; text-align:center; font-size:14px; font-weight:600;">
                      <option value="전체" ${farmState.category === '전체' ? 'selected' : ''}>전체분류</option>
                      ${categories.map(cat => `<option value="${cat}" ${farmState.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                    </select>
                  </td>
                  <td style="padding:10px;">
                    <select id="ex-crop-name" style="padding:10px; background:#0F172A; border:1px solid #10B981; color:#10B981; border-radius:8px; width:100%; text-align:center; font-size:14px; font-weight:800;">
                      ${filteredCrops.map(c => `<option value="${c}" ${farmState.cropName === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                  </td>
                  <td style="padding:10px;">
                    <input type="text" id="ex-area-m2" value="${formatComma(farmState.areaM2)}" style="text-align:right; padding:10px; background:#0F172A; border:1px solid rgba(255,255,255,0.2); color:#FFF; border-radius:8px; width:100%; font-size:14px; font-weight:700; font-family: Pretendard, monospace;" />
                  </td>
                  <td style="padding:10px;">
                    <input type="text" id="ex-area-pyung" value="${formatComma(farmState.areaPyung)}" style="text-align:right; padding:10px; background:#0F172A; border:1px solid rgba(255,255,255,0.2); color:#FFF; border-radius:8px; width:100%; font-size:14px; font-weight:700; font-family: Pretendard, monospace;" />
                  </td>
                  <td style="padding:10px;">
                    <input type="text" id="ex-cycles" value="${formatComma(farmState.cycles)}" style="text-align:right; padding:10px; background:#0F172A; border:1px solid rgba(255,255,255,0.2); color:#FFF; border-radius:8px; width:100%; font-size:14px; font-weight:700; font-family: Pretendard, monospace;" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 🎯 경영분석 대상 농가 실제 매출액 & 6차 산업 1·2·3차 산물 세부 입력 패널 -->
          <div style="margin-top: 20px; background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 14px; padding: 20px; color: #FFF;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
              <div>
                <span style="font-size: 15px; font-weight: 800; color: #60A5FA; display:flex; align-items:center; gap:6px;">
                  🎯 1-1. 경영분석 대상 농가 실제 경영 실적 & 6차 산업 (1차·2차·3차 산물) 정밀 매출 입력
                </span>
                <p style="font-size:12px; color:#94A3B8; margin-top:2px;">
                  원물 판매(1차) 외 <b>모종/부산물(1차), 가공품(2차), 체험/관광/서비스(3차)</b> 매출액을 입력하시면 <b>총 매출액과 실제 농가소득</b>이 자동 분석됩니다.
                </p>
              </div>
              <button id="btn-reset-actual-revenue" style="background: rgba(59,130,246,0.2); border:1px solid #3B82F6; color:#93C5FD; padding:6px 14px; border-radius:8px; font-size:12px; font-weight:800; cursor:pointer;">
                🔄 농진청 지역 표준 추정값으로 복원
              </button>
            </div>

            <!-- 상단 요약 KPI 4개 카드 -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 20px;">
              <div style="background:#0F172A; padding:14px 16px; border-radius:10px; border:1px solid #3B82F6;">
                <div style="font-size:12px; color:#93C5FD; font-weight:700;">🎯 6차 융복합 경영 총수입 (매출합계)</div>
                <input type="text" id="ex-actual-revenue" value="${formatComma(totalActualRevenue)}" style="text-align:right; padding:8px 10px; background:#1E293B; border:1px solid #3B82F6; color:#38BDF8; border-radius:6px; width:100%; font-size:17px; font-weight:900; margin-top:6px; font-family: Pretendard, monospace;" />
                <div style="font-size:10.5px; color:#64748B; margin-top:4px;">농진청 원물 표준액: ${formatShortMoney(calculatedRevenue)}</div>
              </div>

              <div style="background:#0F172A; padding:14px 16px; border-radius:10px; border:1px solid rgba(248,113,113,0.3);">
                <div style="font-size:12px; color:#F87171; font-weight:700;">🏢 대상 농가 총 경영비 (원가합계)</div>
                <div style="font-size:17px; font-weight:900; color:#F87171; margin-top:10px; text-align:right; font-family: Pretendard, monospace;">
                  ${formatMoney(calculatedExpenses)}
                </div>
                <div style="font-size:10.5px; color:#64748B; margin-top:4px;">경영비 세부항목 자동 합산</div>
              </div>

              <div style="background:#0F172A; padding:14px 16px; border-radius:10px; border:1px solid #10B981;">
                <div style="font-size:12px; color:#34D399; font-weight:700;">💰 대상 농가 실제 농가소득 (수입-경영비)</div>
                <div style="font-size:18px; font-weight:900; color:#10B981; margin-top:10px; text-align:right; font-family: Pretendard, monospace;">
                  ${formatMoney(actualIncome)}
                </div>
                <div style="font-size:10.5px; color:#64748B; margin-top:4px;">소득률: ${totalActualRevenue > 0 ? ((actualIncome / totalActualRevenue) * 100).toFixed(1) : 0}%</div>
              </div>

              <div style="background:#0F172A; padding:12px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.15);">
                <div style="display:flex; justify-content:space-between; gap:8px;">
                  <div style="flex:1;">
                    <div style="font-size:11px; color:#FBBF24; font-weight:700;">원물 단가(원/kg)</div>
                    <input type="text" id="ex-actual-price" value="${formatComma(actualPricePerKg)}" style="text-align:right; padding:6px; background:#1E293B; border:1px solid #FBBF24; color:#FBBF24; border-radius:6px; width:100%; font-size:13px; font-weight:800; margin-top:4px; font-family: Pretendard, monospace;" />
                  </div>
                  <div style="flex:1;">
                    <div style="font-size:11px; color:#A7F3D0; font-weight:700;">원물 생산량(kg)</div>
                    <input type="text" id="ex-actual-yield" value="${formatComma(actualYieldKg)}" style="text-align:right; padding:6px; background:#1E293B; border:1px solid #10B981; color:#A7F3D0; border-radius:6px; width:100%; font-size:13px; font-weight:800; margin-top:4px; font-family: Pretendard, monospace;" />
                  </div>
                </div>
                <div style="font-size:10.5px; color:#64748B; margin-top:6px; text-align:center;">
                  원물 매출 = <b>${formatMoney(actualPricePerKg * actualYieldKg)}</b>
                </div>
              </div>
            </div>

            <!-- 🌾 6차 산업 세부 매출 표 -->
            <div style="background: #0F172A; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px;">
              <div style="font-size: 13.5px; font-weight: 800; color: #FBBF24; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                <span>🌾 6차 산업 (1차·2차·3차 산물) 세부 매출 구성 정밀 입력표</span>
                <span style="font-size: 12px; color: #94A3B8; font-weight: 600;">각 매출액 입력 시 총수입과 농가소득이 자동 실시간 합산됩니다.</span>
              </div>

              <div class="data-table-container">
                <table class="data-table" style="font-size: 13px;">
                  <thead>
                    <tr style="background: rgba(59, 130, 246, 0.2); color: #93C5FD;">
                      <th>산업 구분</th>
                      <th>주요 품목 / 융복합 사업 명칭</th>
                      <th style="text-align: right; width: 220px;">농가 실제 연간 매출액 (원)</th>
                      <th style="text-align: center; width: 100px;">매출 비중</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="font-weight: 800; color: #10B981;">🌾 1차 산물 (원물 생과)</td>
                      <td style="color: #E2E8F0;">
                        ${farmState.cropName} 원물 생과 출하 매출 
                        <span style="font-size:11px; color:#94A3B8;">(${formatComma(actualPricePerKg)}원/kg × ${formatComma(actualYieldKg)}kg)</span>
                      </td>
                      <td>
                        <input type="text" id="ex-rev-raw" value="${formatComma(revRaw)}" style="text-align:right; background:#1E293B; border:1px solid #10B981; color:#34D399; padding:6px 10px; border-radius:6px; width:100%; font-size:13px; font-weight:800; font-family: Pretendard, monospace;" />
                      </td>
                      <td style="text-align:center; font-weight:800; color:#10B981;">${rawShare}%</td>
                    </tr>
                    <tr>
                      <td style="font-weight: 800; color: #A7F3D0;">🌱 1차 산물 (부산물·모종)</td>
                      <td style="color: #E2E8F0;">
                        육묘/모종 판매, 자묘 분양 및 부산물 판매 매출
                      </td>
                      <td>
                        <input type="text" id="ex-rev-byproduct" value="${formatComma(revByproduct)}" placeholder="예: 5,000,000" style="text-align:right; background:#1E293B; border:1px solid rgba(255,255,255,0.2); color:#A7F3D0; padding:6px 10px; border-radius:6px; width:100%; font-size:13px; font-weight:700; font-family: Pretendard, monospace;" />
                      </td>
                      <td style="text-align:center; font-weight:700; color:#A7F3D0;">${byproductShare}%</td>
                    </tr>
                    <tr>
                      <td style="font-weight: 800; color: #FBBF24;">🍓 2차 산물 (농산물 가공품)</td>
                      <td style="color: #E2E8F0;">
                        딸기잼, 딸기청, 건조과일, 즙/주스 등 가공품 판매 매출
                      </td>
                      <td>
                        <input type="text" id="ex-rev-processed" value="${formatComma(revProcessed)}" placeholder="예: 15,000,000" style="text-align:right; background:#1E293B; border:1px solid rgba(255,255,255,0.2); color:#FBBF24; padding:6px 10px; border-radius:6px; width:100%; font-size:13px; font-weight:700; font-family: Pretendard, monospace;" />
                      </td>
                      <td style="text-align:center; font-weight:700; color:#FBBF24;">${processedShare}%</td>
                    </tr>
                    <tr>
                      <td style="font-weight: 800; color: #C084FC;">🎨 3차 산물 (체험·관광·서비스)</td>
                      <td style="color: #E2E8F0;">
                        딸기 수확 체험, 팜카페, 교육농장, 주말농장 서비스 매출
                      </td>
                      <td>
                        <input type="text" id="ex-rev-experience" value="${formatComma(revExperience)}" placeholder="예: 10,000,000" style="text-align:right; background:#1E293B; border:1px solid rgba(255,255,255,0.2); color:#C084FC; padding:6px 10px; border-radius:6px; width:100%; font-size:13px; font-weight:700; font-family: Pretendard, monospace;" />
                      </td>
                      <td style="text-align:center; font-weight:700; color:#C084FC;">${experienceShare}%</td>
                    </tr>
                  </tbody>
                  <tfoot style="background: rgba(59, 130, 246, 0.2); font-weight: 900;">
                    <tr>
                      <td colspan="2" style="text-align: right; padding: 10px;">6차 융복합 경영 총 매출액 합계:</td>
                      <td style="text-align: right; color: #38BDF8; font-family: Pretendard, monospace; font-size: 15px;">${formatMoney(totalActualRevenue)}</td>
                      <td style="text-align: center; color: #38BDF8;">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

          </div>
        </div>

        <!-- 2. 경영비 세부 비목 입력 -->
        <div style="background: #1E293B; border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 24px; margin-bottom: 24px; color: #FFF; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; margin-bottom: 18px; flex-wrap:wrap; gap:10px;">
            <div>
              <h2 style="font-size: 17px; font-weight: 800; color: #F59E0B; display: flex; align-items: center; gap: 8px;">
                📋 2. 경영비 세부 비목별 예산 입력 (변동비 vs 고정비 구분)
              </h2>
              <p style="font-size: 12px; color: #94A3B8; margin-top: 2px;">
                우측의 <b>[농진청 ${farmState.region}지역 소득조사표 평균 가이드]</b> 및 아래 <b>[대출 이자 연동]</b>을 참조하세요.
              </p>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              <button id="btn-apply-rda-section2" style="background: rgba(16,185,129,0.2); border:1px solid #10B981; color:#10B981; padding:6px 14px; border-radius:8px; font-size:12px; font-weight:800; cursor:pointer;">
                🔄 지역 평균 예산 자동 적용
              </button>
              <span class="badge" style="background:rgba(245,158,11,0.2); color:#F59E0B; border:1px solid rgba(245,158,11,0.3); font-size:13px; font-weight:700;">
                총 경영비 합계: ${formatMoney(calculatedExpenses)}
              </span>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            
            <!-- 변동비 (Variable Costs) -->
            <div style="background:rgba(16,185,129,0.04); border:1px solid rgba(16,185,129,0.25); border-radius:12px; padding:18px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(16,185,129,0.2); padding-bottom:10px;">
                <h3 style="font-size:15px; font-weight:800; color:#10B981; display:flex; align-items:center; gap:6px;">
                  🌱 변동비 (Variable Costs)
                </h3>
                <span style="font-size:13px; font-weight:700; color:#34D399;">소계: ${formatMoney(totalVariableExpenses)}</span>
              </div>

              <div class="data-table-container">
                <table class="data-table" style="font-size:13px;">
                  <thead>
                    <tr>
                      <th>세부 비목명</th>
                      <th style="text-align:right;">농가 입력 예산(원)</th>
                      <th style="color:#10B981; text-align:right;">농진청 지역 평균 가이드</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${costItemsState.variable.map((item, idx) => {
                      const isLoanInterestItem = item.key === '대출이자' || item.name.includes('대출이자');
                      const guideCost = isLoanInterestItem ? year1InterestTotal : (rdaScaledCosts[item.key] || item.cost);
                      const rawDiff = guideCost ? ((item.cost - guideCost) / guideCost) * 100 : 0;
                      const diffPercent = rawDiff.toFixed(1);
                      const diffVal = Number(diffPercent);
                      const diffBadge = diffVal > 0 
                        ? `<span style="color:#F87171; font-size:11px;">(+${diffPercent}%)</span>` 
                        : diffVal < 0 
                        ? `<span style="color:#34D399; font-size:11px;">(${diffPercent}%)</span>` 
                        : `<span style="color:#94A3B8; font-size:11px;">(0.0%)</span>`;

                      const isSynced = item.isAutoSynced;

                      return `
                        <tr>
                          <td style="font-weight:600; color:#E2E8F0;">
                            ${item.name} ${isSynced ? `<span style="font-size:10px; background:rgba(16,185,129,0.2); color:#10B981; padding:2px 6px; border-radius:4px; margin-left:4px;">⚡순수이자 연동</span>` : ''}
                          </td>
                          <td>
                            <input type="text" class="v-cost-var-input" data-idx="${idx}" value="${formatComma(item.cost)}" style="text-align:right; background:#0F172A; border:1px solid ${isSynced ? '#10B981' : 'rgba(255,255,255,0.15)'}; color:${isSynced ? '#10B981' : '#FFF'}; padding:6px 10px; border-radius:6px; width:100%; font-size:13px; font-weight:700; font-family: Pretendard, monospace;" />
                          </td>
                          <td style="text-align:right; color:#94A3B8;">
                            ${formatShortMoney(guideCost)} ${diffBadge}
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 고정비 (Fixed Costs) -->
            <div style="background:rgba(59,130,246,0.04); border:1px solid rgba(59,130,246,0.25); border-radius:12px; padding:18px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid rgba(59,130,246,0.2); padding-bottom:10px;">
                <h3 style="font-size:15px; font-weight:800; color:#3B82F6; display:flex; align-items:center; gap:6px;">
                  🏢 고정비 (Fixed Costs)
                </h3>
                <span style="font-size:13px; font-weight:700; color:#60A5FA;">소계: ${formatMoney(totalFixedExpenses)}</span>
              </div>

              <div class="data-table-container">
                <table class="data-table" style="font-size:13px;">
                  <thead>
                    <tr>
                      <th>세부 비목명</th>
                      <th style="text-align:right;">농가 입력 예산(원)</th>
                      <th style="color:#60A5FA; text-align:right;">농진청 지역 평균 가이드</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${costItemsState.fixed.map((item, idx) => {
                      const guideCost = rdaScaledCosts[item.key] || item.cost;
                      const rawDiff = guideCost ? ((item.cost - guideCost) / guideCost) * 100 : 0;
                      const diffPercent = rawDiff.toFixed(1);
                      const diffVal = Number(diffPercent);
                      const diffBadge = diffVal > 0 
                        ? `<span style="color:#F87171; font-size:11px;">(+${diffPercent}%)</span>` 
                        : diffVal < 0 
                        ? `<span style="color:#34D399; font-size:11px;">(${diffPercent}%)</span>` 
                        : `<span style="color:#94A3B8; font-size:11px;">(0.0%)</span>`;

                      const isSynced = item.isAutoSynced;

                      return `
                        <tr>
                          <td style="font-weight:600; color:#E2E8F0;">
                            ${item.name} ${isSynced ? `<span style="font-size:10px; background:rgba(16,185,129,0.2); color:#10B981; padding:2px 6px; border-radius:4px; margin-left:4px;">⚡자산연동</span>` : ''}
                          </td>
                          <td>
                            <input type="text" class="v-cost-fix-input" data-idx="${idx}" value="${formatComma(item.cost)}" style="text-align:right; background:#0F172A; border:1px solid ${isSynced ? '#10B981' : 'rgba(255,255,255,0.15)'}; color:${isSynced ? '#10B981' : '#FFF'}; padding:6px 10px; border-radius:6px; width:100%; font-size:13px; font-weight:700; font-family: Pretendard, monospace;" />
                          </td>
                          <td style="text-align:right; color:#94A3B8;">
                            ${formatShortMoney(guideCost)} ${diffBadge}
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        <!-- 3. 농장 보유 자산 목록 (건립년도 vs 현재 시점 잔존가액 정밀 계산) -->
        <div style="background: #1E293B; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px; color: #FFF; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; margin-bottom: 18px; flex-wrap: wrap; gap: 10px;">
            <div>
              <h2 style="font-size: 17px; font-weight: 800; color: #3B82F6; display: flex; align-items: center; gap: 8px;">
                🏗️ 3. 농장 보유 자산 현황 & 건립년도 기준 감가상각비 계산 (현재 시점: ${currentYear}년)
              </h2>
              <p style="font-size: 12px; color: #94A3B8; margin-top: 2px;">
                자산의 <b>[건립/취득 연도]</b>와 내용년수를 비교하여 <b>현재 잔존 장부가액 및 현재 연 감가상각비</b>가 산출되어 위 <b>[고정비 ➔ 상각비]</b>에 자동 연동됩니다.
              </p>
            </div>
            <button id="intake-add-asset-btn" style="background: rgba(59,130,246,0.2); border: 1px solid #3B82F6; color: #60A5FA; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer;">
              + 자산 항목 추가
            </button>
          </div>

          <div class="data-table-container">
            <table class="data-table" style="font-size:13px;">
              <thead>
                <tr>
                  <th style="width: 45px; text-align:center;">연번</th>
                  <th>자산/시설 목록명</th>
                  <th style="text-align: right;">구입가/건립비(원)</th>
                  <th style="text-align: center; width: 110px;">건립/취득년도</th>
                  <th style="text-align: center; width: 90px;">내용년수</th>
                  <th style="text-align: right; color:#60A5FA;">현재 잔존가액</th>
                  <th style="text-align: right; color:#FBBF24;">현재 연 상각비</th>
                  <th style="text-align: center; width: 130px;">상각 상태</th>
                  <th style="width: 55px; text-align: center;">삭제</th>
                </tr>
              </thead>
              <tbody>
                ${assetMetrics.rows.map((asset, idx) => {
                  return `
                    <tr>
                      <td style="text-align: center; color:#94A3B8;">${asset.idx}</td>
                      <td>
                        <input type="text" class="i-asset-name" data-idx="${idx}" value="${asset.name}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px 10px; border-radius:6px; width:100%; font-size:13px;" />
                      </td>
                      <td>
                        <input type="text" class="i-asset-price" data-idx="${idx}" value="${formatComma(asset.price)}" style="text-align:right; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px 10px; border-radius:6px; width:100%; font-size:13px; font-weight:700; font-family: Pretendard, monospace;" />
                      </td>
                      <td>
                        <input type="text" class="i-asset-buildyear" data-idx="${idx}" value="${asset.buildYear}" style="text-align:center; background:#0F172A; border:1px solid #3B82F6; color:#93C5FD; padding:6px 6px; border-radius:6px; width:80px; margin:0 auto; font-size:13px; font-weight:700;" />
                      </td>
                      <td>
                        <input type="text" class="i-asset-years" data-idx="${idx}" value="${asset.years}" style="text-align:center; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px 6px; border-radius:6px; width:70px; margin:0 auto; font-size:13px; font-weight:700;" />
                      </td>
                      <td style="text-align:right; color:#60A5FA; font-weight:700; font-family: Pretendard, monospace;">
                        ${formatMoney(asset.bookValue)}
                      </td>
                      <td style="text-align:right; color:#FBBF24; font-weight:800; font-family: Pretendard, monospace;">
                        ${formatMoney(asset.annual)}
                      </td>
                      <td style="text-align:center;">
                        ${asset.isCompleted 
                          ? `<span style="font-size:11px; background:rgba(248,113,113,0.2); color:#F87171; border:1px solid rgba(248,113,113,0.3); padding:3px 8px; border-radius:6px; font-weight:700;">상각 완료 (0원)</span>`
                          : `<span style="font-size:11px; background:rgba(16,185,129,0.2); color:#10B981; border:1px solid rgba(16,185,129,0.3); padding:3px 8px; border-radius:6px; font-weight:700;">상각 중 (잔여 ${asset.remainingYears}년)</span>`}
                      </td>
                      <td style="text-align: center;">
                        <button class="i-btn-del-asset" data-idx="${idx}" style="background:rgba(239,68,68,0.2); color:#F87171; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">삭제</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot style="background: rgba(59, 130, 246, 0.1); font-weight: 800;">
                <tr>
                  <td colspan="2" style="text-align: right; padding: 12px;">전체 자산 총합계, 잔존장부가액 & 현재 연 감가상각비:</td>
                  <td style="text-align: right; color:#38BDF8; font-family: Pretendard, monospace;">${formatMoney(assetMetrics.totalCost)}</td>
                  <td colspan="2"></td>
                  <td style="text-align: right; color:#60A5FA; font-family: Pretendard, monospace;">${formatMoney(assetMetrics.totalBookValue)}</td>
                  <td style="text-align: right; color:#FBBF24; font-family: Pretendard, monospace;">${formatMoney(assetMetrics.totalAnnualDep)}</td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- 4. 농가 대출 및 부채 현황 -->
        <div style="background: #1E293B; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 32px; color: #FFF; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; margin-bottom: 18px; flex-wrap: wrap; gap: 10px;">
            <div>
              <h2 style="font-size: 17px; font-weight: 800; color: #EF4444; display: flex; align-items: center; gap: 8px;">
                💳 4. 농가 대출 및 부채 현황 (1년차 발생 순수 대출이자 연동)
              </h2>
              <p style="font-size: 12px; color: #94A3B8; margin-top: 2px;">
                대출금액, 금리, 거치기간을 입력하시면 <b>1년차 발생 순수 대출이자(${formatMoney(year1InterestTotal)})가 위 [변동비 ➔ 대출이자]</b> 항목에 자동 연동됩니다.
              </p>
            </div>
            <button id="intake-add-loan-btn" style="background: rgba(239,68,68,0.2); border: 1px solid #EF4444; color: #FCA5A5; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer;">
              + 대출 항목 추가
            </button>
          </div>

          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 120px;">상환방식</th>
                  <th>은행명 / 대출 사업명</th>
                  <th style="text-align: right;">대출금액(원)</th>
                  <th style="text-align: right;">금리(%)</th>
                  <th style="text-align: center;">대출기간(년)</th>
                  <th style="text-align: center;">거치기간(년)</th>
                  <th style="text-align: right; color:#F87171;">1년차 발생이자</th>
                  <th style="width: 60px; text-align: center;">삭제</th>
                </tr>
              </thead>
              <tbody>
                ${loansState.map((loan, idx) => {
                  const amt = parseNum(loan.대출금액 !== undefined ? loan.대출금액 : (loan.amount !== undefined ? loan.amount : loan.원금)) || 0;
                  const rateVal = parseNum(loan.이자율 !== undefined ? loan.이자율 : (loan.rate !== undefined ? loan.rate : loan.금리)) || 1.5;
                  const r = rateVal > 1 ? rateVal / 100 : rateVal;
                  const year1Int = Math.round(amt * r);
                  const displayRate = (r * 100).toFixed(2);
                  const cond = loan.대출조건 || loan.대출종류 || '원리금균등';
                  const period = parseNum(loan.대출기간 !== undefined ? loan.대출기간 : loan.period) || 10;
                  const grace = parseNum(loan.거치기간 !== undefined ? loan.거치기간 : loan.grace) || 0;

                  return `
                    <tr>
                      <td>
                        <select class="i-loan-type" data-idx="${idx}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:6px; width:100%; font-size:12px;">
                          <option value="원리금균등" ${cond === '원리금균등' ? 'selected' : ''}>원리금균등</option>
                          <option value="원금균등" ${cond === '원금균등' ? 'selected' : ''}>원금균등</option>
                          <option value="일시상환" ${cond === '일시상환' ? 'selected' : ''}>일시상환</option>
                        </select>
                      </td>
                      <td>
                        <input type="text" class="i-loan-name" data-idx="${idx}" value="${loan.은행명 || loan.name || ''}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px 10px; border-radius:6px; width:100%; font-size:13px;" />
                      </td>
                      <td>
                        <input type="text" class="i-loan-amount" data-idx="${idx}" value="${formatComma(amt)}" style="text-align:right; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px 10px; border-radius:6px; width:100%; font-size:13px; font-weight:700; font-family: Pretendard, monospace;" />
                      </td>
                      <td>
                        <input type="text" class="i-loan-rate" data-idx="${idx}" value="${displayRate}" style="text-align:right; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FBBF24; padding:6px 10px; border-radius:6px; width:70px; font-size:13px; font-weight:700;" />
                      </td>
                      <td>
                        <input type="text" class="i-loan-period" data-idx="${idx}" value="${period}" style="text-align:center; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px 10px; border-radius:6px; width:60px; margin:0 auto; font-size:13px; font-weight:700;" />
                      </td>
                      <td>
                        <input type="text" class="i-loan-grace" data-idx="${idx}" value="${grace}" style="text-align:center; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#A7F3D0; padding:6px 10px; border-radius:6px; width:60px; margin:0 auto; font-size:13px; font-weight:700;" />
                      </td>
                      <td style="text-align:right; color:#F87171; font-weight:800; font-family: Pretendard, monospace;">
                        ${formatMoney(year1Int)}
                      </td>
                      <td style="text-align: center;">
                        <button class="i-btn-del-loan" data-idx="${idx}" style="background:rgba(239,68,68,0.2); color:#F87171; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">삭제</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot style="background: rgba(239, 68, 68, 0.1); font-weight: 800;">
                <tr>
                  <td colspan="2" style="text-align: right; padding: 12px;">대출 총 잔액 & 1년차 발생 총 대출이자:</td>
                  <td style="text-align: right; color:#FCA5A5; font-family: Pretendard, monospace;">${formatMoney(totalLoansAmount)}</td>
                  <td colspan="3"></td>
                  <td style="text-align: right; color:#F87171; font-family: Pretendard, monospace;">${formatMoney(year1InterestTotal)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- 하단 메인 분석 실행 및 제출 버튼 -->
        <div style="text-align: center; margin-top: 36px;">
          <button id="intake-submit-btn" style="background: linear-gradient(135deg, #10B981, #059669); color: #FFF; border: none; padding: 18px 48px; border-radius: 16px; font-size: 18px; font-weight: 900; cursor: pointer; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4); transition: all 0.2s ease;">
            🚀 입력 데이터 기반 맞춤 농가 경영분석 & 1:1 진단서 생성하기 →
          </button>
        </div>

      </div>
    `;

    // Event binding
    const closeToast = document.getElementById('close-toast-btn');
    if (closeToast) closeToast.addEventListener('click', () => { toastMsg = null; renderForm(); });

    // Draft save & modal event handlers
    const btnSaveDraft = document.getElementById('btn-save-farm-draft');
    if (btnSaveDraft) {
      btnSaveDraft.addEventListener('click', () => {
        const saved = saveFarmDraft(farmState, costItemsState, assetsState, loansState);
        if (saved) {
          toastMsg = `💾 [${saved.name}] 데이터가 중간 저장 목록에 성공적으로 저장되었습니다!`;
          renderForm();
        }
      });
    }

    const btnOpenDraftModal = document.getElementById('btn-open-draft-modal');
    if (btnOpenDraftModal) {
      btnOpenDraftModal.addEventListener('click', () => {
        openFarmDraftModal(
          (loadedDraft) => {
            if (loadedDraft && loadedDraft.farmState) {
              farmState = loadedDraft.farmState;
              if (loadedDraft.costItemsState) {
                costItemsState = loadedDraft.costItemsState;
                costItemsState._isLoadedFromDraft = true;
              }
              if (loadedDraft.assetsState) assetsState = loadedDraft.assetsState;
              if (loadedDraft.loansState) loansState = loadedDraft.loansState;

              if (!FULL_CROP_DATABASE[farmState.cropName]) {
                const cropKeys = Object.keys(FULL_CROP_DATABASE);
                const matched = cropKeys.find(k => k.includes(farmState.cropName)) || '시설딸기(수경)';
                farmState.cropName = matched;
              }

              toastMsg = `📂 [${loadedDraft.name || loadedDraft.farmState.farmName}] 저장 데이터 불러오기 완료!`;
              triggerAutoSave();

              if (onDraftLoad) {
                const combinedCostBreakdown = [
                  ...(costItemsState ? costItemsState.variable : []).map(i => ({ name: i.name, cost: parseNum(i.cost), percent: 0 })),
                  ...(costItemsState ? costItemsState.fixed : []).map(i => ({ name: i.name, cost: parseNum(i.cost), percent: 0 }))
                ];
                const draftModel = {
                  category: farmState.category,
                  cropName: farmState.cropName,
                  farmOwner: farmState.farmName,
                  region: farmState.region,
                  areaPyung: farmState.areaPyung,
                  areaM2: farmState.areaM2,
                  cycles: farmState.cycles,
                  revenue: (farmState.revRaw || 0) + (farmState.revByproduct || 0) + (farmState.revProcessed || 0) + (farmState.revExperience || 0),
                  revenueBreakdown: {
                    raw: farmState.revRaw,
                    byproduct: farmState.revByproduct,
                    processed: farmState.revProcessed,
                    experience: farmState.revExperience
                  },
                  costItemsState: costItemsState,
                  costBreakdown: combinedCostBreakdown,
                  yieldKg: farmState.customYieldKg,
                  pricePerKg: farmState.customPricePerKg
                };
                onDraftLoad(draftModel, assetsState, loansState);
              }

              renderForm();
            }
          },
          () => {
            // New Farm Reset
            farmState = {
              farmName: '신규 농가',
              region: '충남',
              category: '시설채소',
              cropName: '시설딸기(수경)',
              areaPyung: 1000,
              areaM2: 3306,
              cycles: 1,
              customRevenue: null,
              customPricePerKg: null,
              customYieldKg: null,
              revRaw: null,
              revByproduct: 0,
              revProcessed: 0,
              revExperience: 0
            };
            assetsState = [];
            loansState = [];
            costItemsState = null;
            applyRdaBenchmarkToInputs();
            toastMsg = `🆕 신규 농가 입력 양식이 초기화되었습니다.`;
            renderForm();
          }
        );
      });
    }

    // Input handlers with auto-save trigger
    document.getElementById('ex-farm-name').addEventListener('change', (e) => { 
      farmState.farmName = e.target.value; 
      triggerAutoSave();
    });
    document.getElementById('ex-region').addEventListener('change', (e) => { 
      farmState.region = e.target.value; 
      triggerAutoSave();
    });

    document.getElementById('ex-category').addEventListener('change', (e) => {
      farmState.category = e.target.value;
      const allCrops = Object.keys(FULL_CROP_DATABASE);
      const filtered = farmState.category === '전체' ? allCrops : allCrops.filter(k => (FULL_CROP_DATABASE[k].category || '기타') === farmState.category);
      if (filtered.length > 0) farmState.cropName = filtered[0];
      applyRdaBenchmarkToInputs();
      renderForm();
    });

    document.getElementById('ex-crop-name').addEventListener('change', (e) => {
      farmState.cropName = e.target.value;
      applyRdaBenchmarkToInputs();
      renderForm();
    });

    document.getElementById('ex-area-pyung').addEventListener('change', (e) => {
      const p = parseNum(e.target.value);
      farmState.areaPyung = p;
      farmState.areaM2 = Math.round(p * 3.305785);
      applyRdaBenchmarkToInputs();
      renderForm();
    });

    document.getElementById('ex-area-m2').addEventListener('change', (e) => {
      const m2 = parseNum(e.target.value);
      farmState.areaM2 = m2;
      farmState.areaPyung = Math.round(m2 / 3.305785);
      applyRdaBenchmarkToInputs();
      renderForm();
    });

    document.getElementById('ex-cycles').addEventListener('change', (e) => {
      farmState.cycles = parseNum(e.target.value) || 1;
      applyRdaBenchmarkToInputs();
      renderForm();
    });

    const resetRdaBtn = document.getElementById('btn-apply-rda-direct');
    if (resetRdaBtn) resetRdaBtn.addEventListener('click', () => { applyRdaBenchmarkToInputs(); renderForm(); });
    const resetRdaBtn2 = document.getElementById('btn-apply-rda-section2');
    if (resetRdaBtn2) resetRdaBtn2.addEventListener('click', () => { applyRdaBenchmarkToInputs(); renderForm(); });

    // Actual revenue / price / yield handlers
    const resetRevenueBtn = document.getElementById('btn-reset-actual-revenue');
    if (resetRevenueBtn) {
      resetRevenueBtn.addEventListener('click', () => {
        farmState.customRevenue = null;
        farmState.customPricePerKg = null;
        farmState.customYieldKg = null;
        farmState.revRaw = null;
        farmState.revByproduct = 0;
        farmState.revProcessed = 0;
        farmState.revExperience = 0;
        triggerAutoSave();
        renderForm();
      });
    }

    const revenueInput = document.getElementById('ex-actual-revenue');
    if (revenueInput) {
      revenueInput.addEventListener('change', (e) => {
        const val = parseNum(e.target.value);
        farmState.customRevenue = val;
        farmState.revRaw = val - (revByproduct + revProcessed + revExperience);
        triggerAutoSave();
        renderForm();
      });
    }

    const priceInput = document.getElementById('ex-actual-price');
    if (priceInput) {
      priceInput.addEventListener('change', (e) => {
        farmState.customPricePerKg = parseNum(e.target.value);
        farmState.revRaw = farmState.customPricePerKg * actualYieldKg;
        farmState.customRevenue = farmState.revRaw + revByproduct + revProcessed + revExperience;
        triggerAutoSave();
        renderForm();
      });
    }

    const yieldInput = document.getElementById('ex-actual-yield');
    if (yieldInput) {
      yieldInput.addEventListener('change', (e) => {
        farmState.customYieldKg = parseNum(e.target.value);
        farmState.revRaw = actualPricePerKg * farmState.customYieldKg;
        farmState.customRevenue = farmState.revRaw + revByproduct + revProcessed + revExperience;
        triggerAutoSave();
        renderForm();
      });
    }

    // 6차 산업 1·2·3차 산물 세부 입력 핸들러
    const revRawInp = document.getElementById('ex-rev-raw');
    if (revRawInp) {
      revRawInp.addEventListener('change', (e) => {
        farmState.revRaw = parseNum(e.target.value);
        farmState.customRevenue = farmState.revRaw + revByproduct + revProcessed + revExperience;
        triggerAutoSave();
        renderForm();
      });
    }

    const revByproductInp = document.getElementById('ex-rev-byproduct');
    if (revByproductInp) {
      revByproductInp.addEventListener('change', (e) => {
        farmState.revByproduct = parseNum(e.target.value);
        farmState.customRevenue = revRaw + farmState.revByproduct + revProcessed + revExperience;
        triggerAutoSave();
        renderForm();
      });
    }

    const revProcessedInp = document.getElementById('ex-rev-processed');
    if (revProcessedInp) {
      revProcessedInp.addEventListener('change', (e) => {
        farmState.revProcessed = parseNum(e.target.value);
        farmState.customRevenue = revRaw + revByproduct + farmState.revProcessed + revExperience;
        triggerAutoSave();
        renderForm();
      });
    }

    const revExperienceInp = document.getElementById('ex-rev-experience');
    if (revExperienceInp) {
      revExperienceInp.addEventListener('change', (e) => {
        farmState.revExperience = parseNum(e.target.value);
        farmState.customRevenue = revRaw + revByproduct + revProcessed + farmState.revExperience;
        triggerAutoSave();
        renderForm();
      });
    }

    // Cost item inputs
    document.querySelectorAll('.v-cost-var-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        costItemsState.variable[idx].cost = parseNum(e.target.value);
        costItemsState.variable[idx].isAutoSynced = false;
        triggerAutoSave();
        renderForm();
      });
    });

    document.querySelectorAll('.v-cost-fix-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        costItemsState.fixed[idx].cost = parseNum(e.target.value);
        costItemsState.fixed[idx].isAutoSynced = false;
        triggerAutoSave();
        renderForm();
      });
    });

    // Asset handlers (건립년도 및 구입가/내용년수 연동)
    document.getElementById('intake-add-asset-btn').addEventListener('click', () => {
      assetsState.push({ 연번: assetsState.length + 1, 목록: "신규 시설/장비", 구입가: 10000000, 건립년도: currentYear, 내용년수: 10 });
      triggerAutoSave();
      renderForm();
    });

    document.querySelectorAll('.i-btn-del-asset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        assetsState.splice(idx, 1);
        triggerAutoSave();
        renderForm();
      });
    });

    document.querySelectorAll('.i-asset-name').forEach(inp => {
      inp.addEventListener('change', (e) => { 
        assetsState[Number(e.target.getAttribute('data-idx'))].목록 = e.target.value; 
        triggerAutoSave();
      });
    });

    document.querySelectorAll('.i-asset-price').forEach(inp => {
      inp.addEventListener('change', (e) => {
        assetsState[Number(e.target.getAttribute('data-idx'))].구입가 = parseNum(e.target.value);
        triggerAutoSave();
        renderForm();
      });
    });

    document.querySelectorAll('.i-asset-buildyear').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        assetsState[idx].건립년도 = parseNum(e.target.value) || currentYear;
        assetsState[idx].buildYear = parseNum(e.target.value) || currentYear;
        triggerAutoSave();
        renderForm();
      });
    });

    document.querySelectorAll('.i-asset-years').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        assetsState[idx].내용년수 = parseNum(e.target.value);
        triggerAutoSave();
        renderForm();
      });
    });

    // Loan handlers
    document.getElementById('intake-add-loan-btn').addEventListener('click', () => {
      loansState.push({ 대출조건: "원리금균등", 은행명: "신규 대출", 대출금액: 50000000, 이자율: 1.5, 대출기간: 10, 거치기간: 2 });
      triggerAutoSave();
      renderForm();
    });

    document.querySelectorAll('.i-btn-del-loan').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        loansState.splice(idx, 1);
        triggerAutoSave();
        renderForm();
      });
    });

    document.querySelectorAll('.i-loan-type').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        loansState[idx].대출조건 = e.target.value;
        loansState[idx].대출종류 = e.target.value;
        triggerAutoSave();
        renderForm();
      });
    });

    document.querySelectorAll('.i-loan-name').forEach(inp => {
      inp.addEventListener('change', (e) => { 
        loansState[Number(e.target.getAttribute('data-idx'))].은행명 = e.target.value; 
        triggerAutoSave();
      });
    });
    document.querySelectorAll('.i-loan-amount').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        loansState[idx].대출금액 = parseNum(e.target.value);
        loansState[idx].amount = parseNum(e.target.value);
        triggerAutoSave();
        renderForm();
      });
    });
    document.querySelectorAll('.i-loan-rate').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        const val = parseNum(e.target.value);
        loansState[idx].이자율 = val > 1 ? val / 100 : val;
        loansState[idx].rate = val > 1 ? val / 100 : val;
        triggerAutoSave();
        renderForm();
      });
    });
    document.querySelectorAll('.i-loan-period').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        loansState[idx].대출기간 = parseNum(e.target.value);
        loansState[idx].period = parseNum(e.target.value);
        triggerAutoSave();
        renderForm();
      });
    });
    document.querySelectorAll('.i-loan-grace').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        loansState[idx].거치기간 = parseNum(e.target.value);
        loansState[idx].grace = parseNum(e.target.value);
        triggerAutoSave();
        renderForm();
      });
    });

    // Submit handler
    document.getElementById('intake-submit-btn').addEventListener('click', () => {
      const combinedCostBreakdown = [
        ...costItemsState.variable.map(i => ({ name: i.name, cost: parseNum(i.cost), percent: calculatedExpenses > 0 ? Number(((parseNum(i.cost) / calculatedExpenses) * 100).toFixed(1)) : 0 })),
        ...costItemsState.fixed.map(i => ({ name: i.name, cost: parseNum(i.cost), percent: calculatedExpenses > 0 ? Number(((parseNum(i.cost) / calculatedExpenses) * 100).toFixed(1)) : 0 }))
      ];

      const finalModel = {
        category: farmState.category,
        cropName: farmState.cropName,
        farmOwner: farmState.farmName,
        region: farmState.region,
        areaPyung: farmState.areaPyung,
        areaM2: farmState.areaM2,
        cycles: farmState.cycles,
        revenue: totalActualRevenue,
        revenueBreakdown: {
          raw: revRaw,
          byproduct: revByproduct,
          processed: revProcessed,
          experience: revExperience
        },
        operatingExpenses: calculatedExpenses,
        income: actualIncome,
        netProfit: Math.round(actualIncome * 0.8),
        yieldKg: actualYieldKg,
        pricePerKg: actualPricePerKg,
        costBreakdown: combinedCostBreakdown,
        costItemsState: costItemsState,
        totalAssetsCost: assetMetrics.totalCost,
        totalAssetsBookValue: assetMetrics.totalBookValue,
        totalAssetsDepreciation: assetMetrics.totalAnnualDep,
        year1InterestTotal: year1InterestTotal,
        schedule5Years: schedule5Years,
        benchmark: baseCropModel.benchmark,
        kamisData: baseCropModel.kamisData
      };

      saveFarmDraft(farmState, costItemsState, assetsState, loansState);
      if (onSubmit) onSubmit(finalModel, assetsState, loansState, true);
    });
  }

  renderForm();
}

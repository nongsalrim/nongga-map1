/**
 * @file FarmIntakeStep.js
 * @description 거치기간 원금상환 0원 보장 & 순수 대출이자만 변동비(금융비용)에 100% 연동
 */

import { FULL_CROP_DATABASE } from '../data/cropDatabase.js';

export function renderFarmIntakeStep(container, currentModel, currentAssets, currentLoans, onSubmit) {
  let selectedCropKey = currentModel.cropName.replace('업로드: ', '') || '시설상추';
  if (!FULL_CROP_DATABASE[selectedCropKey]) selectedCropKey = '시설상추';

  let baseCropModel = FULL_CROP_DATABASE[selectedCropKey];

  let farmState = {
    farmName: currentModel.farmOwner || currentModel.farmName || '공주시',
    region: currentModel.region || '충남',
    category: currentModel.category || baseCropModel.category || '시설채소',
    cropName: selectedCropKey,
    areaPyung: currentModel.areaPyung || 800,
    areaM2: currentModel.areaM2 || Math.round((currentModel.areaPyung || 800) * 3.305785),
    cycles: currentModel.cycles || 12
  };

  let assetsState = JSON.parse(JSON.stringify(currentAssets || []));
  let loansState = JSON.parse(JSON.stringify(currentLoans || []));

  // Default sample loans if empty (청창농 3.14억 5년거치, 충보 2억 2년거치 등)
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

  // Utility formatters
  const parseNum = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return Number(String(val).replace(/,/g, '')) || 0;
  };

  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(parseNum(val))) + ' 원';
  const formatComma = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(parseNum(val)));
  
  const formatShortMoney = (val) => {
    const million = parseNum(val) / 10000;
    const formattedNum = (Math.round(million * 10) / 10).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `${formattedNum}만 원`;
  };

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

    loans.forEach(loan => {
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
            // 원리금균등 (Equal Payment)
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
    const areaScaleFactor = (farmState.areaPyung || 800) / (baseCropModel.areaPyung || 1000);
    const cycleScaleFactor = (farmState.cycles || 1) / (baseCropModel.cycles || 1);
    const totalScaleFactor = areaScaleFactor * cycleScaleFactor;

    const totalAssetsDepreciation = assetsState.reduce((sum, a) => {
      const price = parseNum(a.구입가) || 0;
      const years = parseNum(a.내용년수) || 10;
      return sum + (years > 0 ? Math.round(price / years) : 0);
    }, 0);

    const year1InterestTotal = loansState.reduce((sum, loan) => {
      const amount = parseNum(loan.대출금액 || loan.amount || loan.원금) || 0;
      const rateVal = parseNum(loan.이자율 || loan.rate || loan.금리 || 1.5);
      const rate = rateVal > 1 ? rateVal / 100 : rateVal;
      return sum + Math.round(amount * rate);
    }, 0);

    const rdaScaledCosts = (baseCropModel.costBreakdown || []).reduce((acc, item) => {
      acc[item.name] = Math.round(item.cost * totalScaleFactor);
      return acc;
    }, {});

    costItemsState = {
      _cropName: farmState.cropName,
      _scale: totalScaleFactor,
      variable: [
        { name: '종자/종묘비', key: '종자/종묘비', cost: rdaScaledCosts['종자/종묘비'] || Math.round(12500000 * totalScaleFactor) },
        { name: '보통비료비', key: '보통비료비', cost: rdaScaledCosts['보통비료비'] || Math.round(8300000 * totalScaleFactor) },
        { name: '부산물비료비', key: '부산물비료비', cost: rdaScaledCosts['부산물비료비'] || Math.round(7300000 * totalScaleFactor) },
        { name: '농약비', key: '농약비', cost: rdaScaledCosts['농약비'] || Math.round(5200000 * totalScaleFactor) },
        { name: '광열비/동력비', key: '기타비용 및 광열비', cost: rdaScaledCosts['기타비용 및 광열비'] || Math.round(10400000 * totalScaleFactor) },
        { name: '고용인건비', key: '고용인건비', cost: Math.round(15000000 * totalScaleFactor) },
        { name: '기타재료비', key: '기타재료비', cost: rdaScaledCosts['기타재료비'] || Math.round(33000000 * totalScaleFactor) },
        { name: '대출이자 (순수 금융비용)', key: '대출이자', cost: year1InterestTotal, isAutoSynced: true }
      ],
      fixed: [
        { name: '시설/대농구 상각비', key: '대농구/시설상각비', cost: totalAssetsDepreciation > 0 ? totalAssetsDepreciation : (rdaScaledCosts['대농구/시설상각비'] || Math.round(15600000 * totalScaleFactor)), isAutoSynced: totalAssetsDepreciation > 0 },
        { name: '자동차/운반비', key: '자동차비', cost: rdaScaledCosts['자동차비'] || Math.round(11400000 * totalScaleFactor) },
        { name: '수리 및 유지관리비', key: '수리비', cost: Math.round(4500000 * totalScaleFactor) },
        { name: '임차료/기타 고정비', key: '기타고정비', cost: Math.round(6800000 * totalScaleFactor) }
      ]
    };

    toastMsg = `✅ [농진청 ${farmState.region}지역 소득조사표] ${farmState.cropName} (${formatComma(farmState.areaPyung)}평 / ${farmState.cycles}기작) 평균 예산 및 순수 대출이자 연동 완료!`;
  }

  function renderForm() {
    baseCropModel = FULL_CROP_DATABASE[farmState.cropName] || FULL_CROP_DATABASE['시설상추'];
    
    const areaScaleFactor = (farmState.areaPyung || 800) / (baseCropModel.areaPyung || 1000);
    const cycleScaleFactor = (farmState.cycles || 1) / (baseCropModel.cycles || 1);
    const totalScaleFactor = areaScaleFactor * cycleScaleFactor;

    const totalAssetsCost = assetsState.reduce((sum, a) => sum + (parseNum(a.구입가) || 0), 0);
    const totalAssetsDepreciation = assetsState.reduce((sum, a) => {
      const price = parseNum(a.구입가) || 0;
      const years = parseNum(a.내용년수) || 10;
      return sum + (years > 0 ? Math.round(price / years) : 0);
    }, 0);

    const year1InterestTotal = loansState.reduce((sum, loan) => {
      const amount = parseNum(loan.대출금액 || loan.amount || loan.원금) || 0;
      const rateVal = parseNum(loan.이자율 || loan.rate || loan.금리 || 1.5);
      const rate = rateVal > 1 ? rateVal / 100 : rateVal;
      return sum + Math.round(amount * rate);
    }, 0);

    const rdaScaledCosts = (baseCropModel.costBreakdown || []).reduce((acc, item) => {
      acc[item.name] = Math.round(item.cost * totalScaleFactor);
      return acc;
    }, {});

    if (!costItemsState || costItemsState._cropName !== farmState.cropName || costItemsState._scale !== totalScaleFactor) {
      applyRdaBenchmarkToInputs();
    } else {
      const depItem = costItemsState.fixed.find(i => i.name === '시설/대농구 상각비');
      if (depItem && totalAssetsDepreciation > 0) {
        depItem.cost = totalAssetsDepreciation;
        depItem.isAutoSynced = true;
      }

      const intItem = costItemsState.variable.find(i => i.name.includes('대출이자') || i.key === '대출이자');
      if (intItem) {
        intItem.cost = year1InterestTotal;
        intItem.isAutoSynced = true;
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

    const calculatedIncome = calculatedRevenue - calculatedExpenses;

    const totalLoansAmount = loansState.reduce((sum, l) => sum + (parseNum(l.대출금액 || l.amount || l.원금) || 0), 0);
    const schedule5Years = calc5YearSchedule(loansState);

    const allCrops = Object.keys(FULL_CROP_DATABASE);
    const categories = Array.from(new Set(allCrops.map(k => FULL_CROP_DATABASE[k].category || '기타')));

    const filteredCrops = farmState.category === '전체' 
      ? allCrops 
      : allCrops.filter(k => (FULL_CROP_DATABASE[k].category || '기타') === farmState.category);

    container.innerHTML = `
      <div style="max-width: 1300px; margin: 0 auto; padding-bottom: 60px;">
        
        <!-- STEP 1 헤더 타이틀 -->
        <div style="background: linear-gradient(135deg, #0F172A, #1E293B); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; padding: 28px 32px; margin-bottom: 24px; text-align: center; color: #FFF; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
          <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #10B981; border: 1px solid rgba(16,185,129,0.4); padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; display: inline-block; margin-bottom: 10px;">EXCEL CONSULTING INPUT SCHEMA</span>
          <h1 style="font-size: 26px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 6px;">
            📝 농가 경영체 정밀 데이터 입력 센터
          </h1>
          <p style="font-size: 14px; color: #94A3B8; margin: 0 auto; max-width: 880px;">
            원금 상환금은 부채 상환 자금으로 경영비에서 제외되며, <b>순수 발생 대출이자(금융비용)만 변동비에 100% 자동 연동</b>됩니다.
          </p>
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

          <!-- 소득조사표 & KAMIS 시세 자동 연동 결과 미리보기 패널 -->
          <div style="margin-top: 20px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; padding: 20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
              <span style="font-size: 14px; font-weight: 800; color: #10B981; display:flex; align-items:center; gap:6px;">
                ⚡ 소득조사표 & KAMIS 유통정보 자동 산출 결과 미리보기
              </span>
              <span style="font-size:12px; color:#94A3B8;">
                [${farmState.region}] ${farmState.cropName} (${formatComma(farmState.areaPyung)}평 / ${farmState.cycles}기작 기준)
              </span>
            </div>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
              <div style="background:#0F172A; padding:12px 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.1);">
                <div style="font-size:11px; color:#94A3B8;">추정 총수입 (매출액)</div>
                <div style="font-size:16px; font-weight:800; color:#38BDF8; margin-top:2px; text-align:right;">${formatMoney(calculatedRevenue)}</div>
              </div>

              <div style="background:#0F172A; padding:12px 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.1);">
                <div style="font-size:11px; color:#94A3B8;">추정 경영비 (원가합계)</div>
                <div style="font-size:16px; font-weight:800; color:#F87171; margin-top:2px; text-align:right;">${formatMoney(calculatedExpenses)}</div>
              </div>

              <div style="background:#0F172A; padding:12px 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.1);">
                <div style="font-size:11px; color:#94A3B8;">추정 농가소득</div>
                <div style="font-size:16px; font-weight:800; color:#34D399; margin-top:2px; text-align:right;">${formatMoney(calculatedIncome)}</div>
              </div>

              <div style="background:#0F172A; padding:12px 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.1);">
                <div style="font-size:11px; color:#94A3B8;">KAMIS 5개년 평균 유통시세</div>
                <div style="font-size:15px; font-weight:800; color:#FBBF24; margin-top:2px; text-align:right;">kg당 ${formatMoney(baseCropModel.pricePerKg || 2500)}</div>
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
                원금 상환액은 경영비에서 제외되며, <b>[대출 이자(금융비용)]만 100% 자동 연동</b>됩니다.
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
                            ${item.name} ${isSynced ? `<span style="font-size:10px; background:rgba(16,185,129,0.2); color:#10B981; padding:2px 6px; border-radius:4px; margin-left:4px;">⚡순수이자만 연동</span>` : ''}
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

        <!-- 3. 농장 보유 자산 목록 -->
        <div style="background: #1E293B; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px; color: #FFF; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; margin-bottom: 18px; flex-wrap: wrap; gap: 10px;">
            <div>
              <h2 style="font-size: 17px; font-weight: 800; color: #3B82F6; display: flex; align-items: center; gap: 8px;">
                🏗️ 3. 농장 보유 자산 현황 & 연간 감가상각비 계산
              </h2>
              <p style="font-size: 12px; color: #94A3B8; margin-top: 2px;">
                자산 구입가와 내용년수를 입력하시면 <b>연간 감가상각비 총액이 하단에 산출</b>되어 위 <b>[고정비 ➔ 시설/대농구 상각비]</b>에 자동 연동됩니다.
              </p>
            </div>
            <button id="intake-add-asset-btn" class="btn-upload" style="background: #3B82F6; padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 700;">+ 새 자산 항목 추가</button>
          </div>

          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>연번</th>
                  <th>자산 / 시설 목록명</th>
                  <th style="text-align:right;">구입가(원)</th>
                  <th style="text-align:right;">내용년수(년)</th>
                  <th style="text-align:right; color:#F59E0B;">연 감가상각비(원)</th>
                  <th style="text-align:center;">삭제</th>
                </tr>
              </thead>
              <tbody>
                ${assetsState.length === 0 ? `
                  <tr><td colspan="6" style="text-align:center; color:#94A3B8; padding:20px;">등록된 자산이 없습니다. [+ 새 자산 항목 추가] 버튼을 눌러 추가하세요.</td></tr>
                ` : assetsState.map((asset, idx) => {
                  const price = parseNum(asset.구입가) || 0;
                  const years = parseNum(asset.내용년수) || 10;
                  const annualDep = years > 0 ? Math.round(price / years) : 0;

                  return `
                    <tr>
                      <td>${idx + 1}</td>
                      <td><input type="text" class="i-asset-name" data-idx="${idx}" value="${asset.목록 || asset.name || ''}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:100%;" /></td>
                      <td><input type="text" class="i-asset-price" data-idx="${idx}" value="${formatComma(price)}" style="text-align:right; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:100%; font-weight:700; font-family: Pretendard, monospace;" /></td>
                      <td><input type="text" class="i-asset-years" data-idx="${idx}" value="${formatComma(years)}" style="text-align:right; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:80px; font-weight:700; font-family: Pretendard, monospace;" /></td>
                      <td style="text-align:right; color:#F59E0B; font-weight:800; font-family: Pretendard, monospace;">${formatMoney(annualDep)}</td>
                      <td style="text-align:center;"><button class="i-btn-del-asset" data-idx="${idx}" style="background:#EF4444; color:#FFF; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;">삭제</button></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot style="background: rgba(59, 130, 246, 0.15); font-weight: 800;">
                <tr>
                  <td colspan="2" style="text-align:left; color:#93C5FD; padding:14px 16px;">
                    🏛️ 자산 집계 합계
                  </td>
                  <td style="text-align:right; color:#38BDF8; font-size:15px;">
                    총 자산가액: ${formatMoney(totalAssetsCost)}
                  </td>
                  <td></td>
                  <td style="text-align:right; color:#F59E0B; font-size:15px; border-left:1px solid rgba(255,255,255,0.1);">
                    ⚡ 연간 감가상각비 총액: ${formatMoney(totalAssetsDepreciation)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style="margin-top:14px; background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2); border-radius:8px; padding:10px 16px; font-size:12px; color:#93C5FD; display:flex; align-items:center; justify-content:space-between;">
            <span>💡 <b>상각비 자동 연동 안내</b>: 위 연간 감가상각비 총액 <b>${formatMoney(totalAssetsDepreciation)}</b>이 [2. 고정비 ➔ 시설/대농구 상각비] 항목에 실시간 연동 적용 중입니다.</span>
          </div>
        </div>

        <!-- 4. 농가 대출 & 부채 현황 -->
        <div style="background: #1E293B; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px; color: #FFF; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; margin-bottom: 18px; flex-wrap: wrap; gap: 10px;">
            <div>
              <h2 style="font-size: 17px; font-weight: 800; color: #EF4444; display: flex; align-items: center; gap: 8px;">
                💳 4. 농가 대출 및 부채 현황 (총 부채액: <span style="color:#EF4444;">${formatMoney(totalLoansAmount)}</span>)
              </h2>
              <p style="font-size: 12px; color: #94A3B8; margin-top: 2px;">
                대출 원금 상환액은 경영비(원가)에서 제외되며, <b>순수 발생 대출이자(금융비용)만 변동비 항목에 100% 연동</b>됩니다.
              </p>
            </div>
            <button id="intake-add-loan-btn" class="btn-upload" style="background: #EF4444; padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 700;">+ 새 대출 항목 추가</button>
          </div>

          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>상환 방식</th>
                  <th>은행 / 대출 사업명</th>
                  <th style="text-align:right;">대출금액(원)</th>
                  <th style="text-align:right;">금리(%)</th>
                  <th style="text-align:right;">상환기간(년)</th>
                  <th style="text-align:right;">거치기간(년)</th>
                  <th style="text-align:center;">삭제</th>
                </tr>
              </thead>
              <tbody>
                ${loansState.length === 0 ? `
                  <tr><td colspan="7" style="text-align:center; color:#94A3B8; padding:20px;">등록된 대출이 없습니다. [+ 새 대출 항목 추가] 버튼을 눌러 추가하세요.</td></tr>
                ` : loansState.map((loan, idx) => {
                  const amount = parseNum(loan.대출금액 !== undefined ? loan.대출금액 : (loan.amount !== undefined ? loan.amount : loan.원금)) || 0;
                  const rateVal = parseNum(loan.이자율 !== undefined ? loan.이자율 : (loan.rate !== undefined ? loan.rate : loan.금리)) || 1.5;
                  const rate = rateVal > 1 ? rateVal : rateVal * 100;
                  
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

                  return `
                    <tr>
                      <td>
                        <select class="i-loan-type" data-idx="${idx}" style="background:#0F172A; color:#FFF; border:1px solid rgba(255,255,255,0.15); padding:8px; border-radius:6px;">
                          <option value="원리금균등" ${(loan.대출조건 || loan.대출종류 || loan.type) === '원리금균등' ? 'selected' : ''}>원리금균등</option>
                          <option value="원금균등" ${(loan.대출조건 || loan.대출종류 || loan.type) === '원금균등' ? 'selected' : ''}>원금균등</option>
                          <option value="일시상환" ${(loan.대출조건 || loan.대출종류 || loan.type) === '일시상환' ? 'selected' : ''}>일시상환</option>
                        </select>
                      </td>
                      <td><input type="text" class="i-loan-name" data-idx="${idx}" value="${loan.은행명 || loan.name || ''}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:100%;" /></td>
                      <td><input type="text" class="i-loan-amount" data-idx="${idx}" value="${formatComma(amount)}" style="text-align:right; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:100%; font-weight:700; font-family: Pretendard, monospace;" /></td>
                      <td><input type="number" step="0.1" class="i-loan-rate" data-idx="${idx}" value="${rate}" style="text-align:right; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:70px; font-weight:700; font-family: Pretendard, monospace;" />%</td>
                      <td><input type="text" class="i-loan-period" data-idx="${idx}" value="${formatComma(period)}" style="text-align:right; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:60px; font-weight:700; font-family: Pretendard, monospace;" />년</td>
                      <td><input type="text" class="i-loan-grace" data-idx="${idx}" value="${formatComma(grace)}" style="text-align:right; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:60px; font-weight:700; font-family: Pretendard, monospace;" />년</td>
                      <td style="text-align:center;"><button class="i-btn-del-loan" data-idx="${idx}" style="background:#EF4444; color:#FFF; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;">삭제</button></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- 5개년 연도별 대출 상환금 및 이자 시뮬레이션 표 -->
          <div style="margin-top: 24px; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 12px; padding: 20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
              <div>
                <h3 style="font-size:15px; font-weight:800; color:#EF4444; display:flex; align-items:center; gap:6px;">
                  📅 5개년 연도별 대출 원리금 상환 시뮬레이션
                </h3>
                <p style="font-size:12px; color:#94A3B8; margin-top:2px;">
                  등록된 ${loansState.length}개 대출의 연도별 상환 원금 및 순수 발생 이자 현황입니다.
                </p>
              </div>
              <span class="badge" style="background:rgba(239,68,68,0.2); color:#FCA5A5; border:1px solid rgba(239,68,68,0.3); font-size:12px; font-weight:700;">
                1년 차 발생 이자: ${formatMoney(year1InterestTotal)}
              </span>
            </div>

            <div class="data-table-container">
              <table class="data-table" style="font-size:13px; text-align:center;">
                <thead>
                  <tr style="background: rgba(239, 68, 68, 0.2); color: #FCA5A5;">
                    <th style="text-align:center; padding:10px;">연도</th>
                    <th style="text-align:center;">상환 구분</th>
                    <th style="text-align:right;">상환 원금(원)</th>
                    <th style="text-align:right; color:#FBBF24;">발생 이자(원) ⚡연동</th>
                    <th style="text-align:right; color:#EF4444;">연간 총 상환액(원)</th>
                    <th style="text-align:right;">기말 대출 잔액(원)</th>
                  </tr>
                </thead>
                <tbody>
                  ${schedule5Years.map(item => {
                    let statusBadge = '';
                    if (item.principal === 0) {
                      statusBadge = `<span style="color:#FBBF24; font-size:11px; background:rgba(251,191,36,0.15); padding:4px 10px; border-radius:6px; font-weight:800; border:1px solid rgba(251,191,36,0.3);">🟡 전액 거치 (원금 0원 / 이자만 납입)</span>`;
                    } else if (item.graceCount > 0) {
                      statusBadge = `<span style="color:#60A5FA; font-size:11px; background:rgba(96,165,250,0.15); padding:4px 10px; border-radius:6px; font-weight:800; border:1px solid rgba(96,165,250,0.3);">🔵 혼합상환 (원금 ${formatShortMoney(item.principal)} + 일부 거치)</span>`;
                    } else {
                      statusBadge = `<span style="color:#34D399; font-size:11px; background:rgba(52,211,153,0.15); padding:4px 10px; border-radius:6px; font-weight:800; border:1px solid rgba(52,211,153,0.3);">🟢 원리금 상환 진행 (원금 + 이자 납입)</span>`;
                    }

                    return `
                      <tr>
                        <td style="font-weight:800; color:#FFF;">${item.year}년 차</td>
                        <td>${statusBadge}</td>
                        <td style="text-align:right; font-family: Pretendard, monospace; font-weight:700; color:${item.principal === 0 ? '#94A3B8' : '#FFF'};">
                          ${item.principal === 0 ? '0 원 (원금 유예)' : formatMoney(item.principal)}
                        </td>
                        <td style="text-align:right; color:#FBBF24; font-family: Pretendard, monospace; font-weight:800;">
                          ${formatMoney(item.interest)}
                        </td>
                        <td style="text-align:right; color:#EF4444; font-family: Pretendard, monospace; font-weight:800; font-size:14px;">${formatMoney(item.total)}</td>
                        <td style="text-align:right; color:#94A3B8; font-family: Pretendard, monospace;">${formatMoney(item.remainingBalance)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- 대출 이자만 변동비 연동 안내 카드 -->
            <div style="margin-top:14px; background:rgba(16,185,129,0.1); border:1px solid #10B981; border-radius:8px; padding:12px 18px; font-size:13px; color:#A7F3D0; display:flex; align-items:center; justify-content:space-between;">
              <span>⚡ <b>경영 컨설팅 회계 원칙</b>: 원금 상환금은 부채 상환 자금으로 경영비에서 제외되며, <b>순수 발생 대출 이자 (${formatMoney(year1InterestTotal)})만 [🌱 변동비 ➔ 대출이자(순수 금융비용)] 항목에 100% 자동 연동</b>됩니다.</span>
            </div>
          </div>

        </div>

        <!-- 하단 대형 분석 실행 CTA 버튼 -->
        <div style="text-align: center; margin-top: 36px;">
          <button id="intake-submit-btn" class="btn-upload" style="background: linear-gradient(135deg, #10B981, #059669); padding: 18px 48px; font-size: 18px; font-weight: 900; border-radius: 14px; box-shadow: 0 8px 25px rgba(16,185,129,0.4); cursor: pointer; letter-spacing: -0.5px;">
            🚀 입력 데이터 기반 맞춤 농가 경영분석 & 1:1 진단서 생성하기 →
          </button>
        </div>

      </div>
    `;

    // Event Handlers for RDA benchmark apply buttons
    const handleRdaApplyClick = () => {
      applyRdaBenchmarkToInputs();
      renderForm();
    };

    const btnRda1 = document.getElementById('btn-apply-rda-direct');
    if (btnRda1) btnRda1.addEventListener('click', handleRdaApplyClick);

    const btnRda2 = document.getElementById('btn-apply-rda-section2');
    if (btnRda2) btnRda2.addEventListener('click', handleRdaApplyClick);

    const closeToast = document.getElementById('close-toast-btn');
    if (closeToast) {
      closeToast.addEventListener('click', () => {
        toastMsg = null;
        renderForm();
      });
    }

    // 7-Column Input Event Handlers
    document.getElementById('ex-farm-name').addEventListener('change', (e) => { farmState.farmName = e.target.value; });
    document.getElementById('ex-region').addEventListener('change', (e) => {
      farmState.region = e.target.value;
      applyRdaBenchmarkToInputs();
      renderForm();
    });
    
    document.getElementById('ex-category').addEventListener('change', (e) => {
      farmState.category = e.target.value;
      const crops = farmState.category === '전체' ? Object.keys(FULL_CROP_DATABASE) : Object.keys(FULL_CROP_DATABASE).filter(k => (FULL_CROP_DATABASE[k].category || '기타') === farmState.category);
      if (!crops.includes(farmState.cropName)) {
        farmState.cropName = crops[0] || '시설상추';
      }
      applyRdaBenchmarkToInputs();
      renderForm();
    });

    document.getElementById('ex-crop-name').addEventListener('change', (e) => {
      farmState.cropName = e.target.value;
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

    document.getElementById('ex-area-pyung').addEventListener('change', (e) => {
      const pyung = parseNum(e.target.value);
      farmState.areaPyung = pyung;
      farmState.areaM2 = Math.round(pyung * 3.305785);
      applyRdaBenchmarkToInputs();
      renderForm();
    });

    document.getElementById('ex-cycles').addEventListener('change', (e) => {
      farmState.cycles = parseNum(e.target.value) || 1;
      applyRdaBenchmarkToInputs();
      renderForm();
    });

    // Cost Items input handlers
    document.querySelectorAll('.v-cost-var-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        costItemsState.variable[idx].cost = parseNum(e.target.value);
        costItemsState.variable[idx].isAutoSynced = false;
        renderForm();
      });
    });

    document.querySelectorAll('.v-cost-fix-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        costItemsState.fixed[idx].cost = parseNum(e.target.value);
        costItemsState.fixed[idx].isAutoSynced = false;
        renderForm();
      });
    });

    // Asset handlers
    document.getElementById('intake-add-asset-btn').addEventListener('click', () => {
      assetsState.push({ 연번: assetsState.length + 1, 목록: "신규 시설/장비", 구입가: 10000000, 내용년수: 10 });
      renderForm();
    });

    document.querySelectorAll('.i-btn-del-asset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        assetsState.splice(idx, 1);
        renderForm();
      });
    });

    document.querySelectorAll('.i-asset-name').forEach(inp => {
      inp.addEventListener('change', (e) => { assetsState[Number(e.target.getAttribute('data-idx'))].목록 = e.target.value; });
    });
    document.querySelectorAll('.i-asset-price').forEach(inp => {
      inp.addEventListener('change', (e) => {
        assetsState[Number(e.target.getAttribute('data-idx'))].구입가 = parseNum(e.target.value);
        renderForm();
      });
    });
    document.querySelectorAll('.i-asset-years').forEach(inp => {
      inp.addEventListener('change', (e) => {
        assetsState[Number(e.target.getAttribute('data-idx'))].내용년수 = parseNum(e.target.value);
        renderForm();
      });
    });

    // Loan handlers
    document.getElementById('intake-add-loan-btn').addEventListener('click', () => {
      loansState.push({ 대출조건: "원리금균등", 은행명: "신규 대출", 대출금액: 50000000, 이자율: 1.5, 대출기간: 10, 거치기간: 2 });
      renderForm();
    });

    document.querySelectorAll('.i-btn-del-loan').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        loansState.splice(idx, 1);
        renderForm();
      });
    });

    document.querySelectorAll('.i-loan-type').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        loansState[idx].대출조건 = e.target.value;
        loansState[idx].대출종류 = e.target.value;
        renderForm();
      });
    });

    document.querySelectorAll('.i-loan-name').forEach(inp => {
      inp.addEventListener('change', (e) => { loansState[Number(e.target.getAttribute('data-idx'))].은행명 = e.target.value; });
    });
    document.querySelectorAll('.i-loan-amount').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        loansState[idx].대출금액 = parseNum(e.target.value);
        loansState[idx].amount = parseNum(e.target.value);
        renderForm();
      });
    });
    document.querySelectorAll('.i-loan-rate').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        const val = parseNum(e.target.value);
        loansState[idx].이자율 = val > 1 ? val / 100 : val;
        loansState[idx].rate = val > 1 ? val / 100 : val;
        renderForm();
      });
    });
    document.querySelectorAll('.i-loan-period').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        loansState[idx].대출기간 = parseNum(e.target.value);
        loansState[idx].period = parseNum(e.target.value);
        renderForm();
      });
    });
    document.querySelectorAll('.i-loan-grace').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        loansState[idx].거치기간 = parseNum(e.target.value);
        loansState[idx].grace = parseNum(e.target.value);
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
        revenue: calculatedRevenue,
        operatingExpenses: calculatedExpenses,
        income: calculatedIncome,
        netProfit: Math.round(calculatedIncome * 0.8),
        yieldKg: Math.round((baseCropModel.yieldKg || 100000) * totalScaleFactor),
        pricePerKg: baseCropModel.pricePerKg || 2500,
        costBreakdown: combinedCostBreakdown,
        costItemsState: costItemsState,
        totalAssetsCost: totalAssetsCost,
        totalAssetsDepreciation: totalAssetsDepreciation,
        year1InterestTotal: year1InterestTotal,
        schedule5Years: schedule5Years,
        benchmark: baseCropModel.benchmark,
        kamisData: baseCropModel.kamisData
      };

      if (onSubmit) onSubmit(finalModel, assetsState, loansState);
    });
  }

  renderForm();
}

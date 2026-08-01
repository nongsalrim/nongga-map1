/**
 * @file FarmIntakeStep.js
 * @description 엑셀 양식과 100% 동일한 7대 표준 컬럼 (농가명, 지역, 작목분류, 작목명, 면적(㎡), 평, 기작) 데이터 입력 센터
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

  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(val)) + ' 원';

  function renderForm() {
    baseCropModel = FULL_CROP_DATABASE[farmState.cropName] || FULL_CROP_DATABASE['시설상추'];
    
    // Auto calculate scaled revenue & expenses based on Pyung & Cycles
    const areaScaleFactor = (farmState.areaPyung || 800) / (baseCropModel.areaPyung || 1000);
    const cycleScaleFactor = (farmState.cycles || 1) / (baseCropModel.cycles || 1);
    const totalScaleFactor = areaScaleFactor * cycleScaleFactor;

    const calculatedRevenue = Math.round(baseCropModel.revenue * totalScaleFactor);
    const calculatedExpenses = Math.round(baseCropModel.operatingExpenses * totalScaleFactor);
    const calculatedIncome = calculatedRevenue - calculatedExpenses;

    const scaledCostBreakdown = (baseCropModel.costBreakdown || []).map(item => ({
      name: item.name,
      cost: Math.round(item.cost * totalScaleFactor),
      percent: item.percent
    }));

    const totalAssetsCost = assetsState.reduce((sum, a) => sum + (Number(a.구입가) || 0), 0);
    const totalLoansAmount = loansState.reduce((sum, l) => sum + (Number(l.대출금액) || 0), 0);

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
          <p style="font-size: 14px; color: #94A3B8; margin: 0 auto; max-width: 760px;">
            컨설팅 표준 엑셀 양식의 <b>[농가명, 지역, 작목분류, 작목명, 면적(㎡), 평, 기작]</b> 데이터를 입력하시면 농진청 소득조사표 & KAMIS 유통시세 DB와 즉시 자동 연동됩니다.
          </p>
        </div>

        <!-- 1. 엑셀 7대 컬럼 경영체 기본 데이터 입력 표 -->
        <div style="background: #1E293B; border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 24px; margin-bottom: 24px; color: #FFF; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; margin-bottom: 18px;">
            <h2 style="font-size: 17px; font-weight: 800; color: #10B981; display: flex; align-items: center; gap: 8px;">
              📊 1. 농가 경영체 기본 데이터 (엑셀 표준 입력 양식)
            </h2>
            <span style="font-size: 12px; color: #94A3B8;">* 면적(㎡)과 평수는 자동 상호 환산되며 작목 변경 시 소득조사표가 연동됩니다.</span>
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
                    <input type="number" id="ex-area-m2" value="${farmState.areaM2}" style="text-align:center; padding:10px; background:#0F172A; border:1px solid rgba(255,255,255,0.2); color:#FFF; border-radius:8px; width:100%; font-size:14px; font-weight:700;" />
                  </td>
                  <td style="padding:10px;">
                    <input type="number" id="ex-area-pyung" value="${farmState.areaPyung}" style="text-align:center; padding:10px; background:#0F172A; border:1px solid rgba(255,255,255,0.2); color:#FFF; border-radius:8px; width:100%; font-size:14px; font-weight:700;" />
                  </td>
                  <td style="padding:10px;">
                    <input type="number" id="ex-cycles" value="${farmState.cycles}" style="text-align:center; padding:10px; background:#0F172A; border:1px solid rgba(255,255,255,0.2); color:#FFF; border-radius:8px; width:100%; font-size:14px; font-weight:700;" />
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
                [${farmState.region}] ${farmState.cropName} (${farmState.areaPyung}평 / ${farmState.cycles}기작 기준)
              </span>
            </div>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
              <div style="background:#0F172A; padding:12px 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.1);">
                <div style="font-size:11px; color:#94A3B8;">추정 총수입 (매출액)</div>
                <div style="font-size:16px; font-weight:800; color:#38BDF8; margin-top:2px;">${formatMoney(calculatedRevenue)}</div>
              </div>

              <div style="background:#0F172A; padding:12px 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.1);">
                <div style="font-size:11px; color:#94A3B8;">추정 경영비 (원가합계)</div>
                <div style="font-size:16px; font-weight:800; color:#F87171; margin-top:2px;">${formatMoney(calculatedExpenses)}</div>
              </div>

              <div style="background:#0F172A; padding:12px 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.1);">
                <div style="font-size:11px; color:#94A3B8;">추정 농가소득</div>
                <div style="font-size:16px; font-weight:800; color:#34D399; margin-top:2px;">${formatMoney(calculatedIncome)}</div>
              </div>

              <div style="background:#0F172A; padding:12px 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.1);">
                <div style="font-size:11px; color:#94A3B8;">KAMIS 5개년 평균 유통시세</div>
                <div style="font-size:15px; font-weight:800; color:#FBBF24; margin-top:2px;">kg당 ${formatMoney(baseCropModel.pricePerKg || 2500)}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. 농장 보유 자산 목록 (거래처 제거 반영) -->
        <div style="background: #1E293B; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px; color: #FFF; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; margin-bottom: 18px; flex-wrap: wrap; gap: 10px;">
            <div>
              <h2 style="font-size: 17px; font-weight: 800; color: #3B82F6; display: flex; align-items: center; gap: 8px;">
                🏗️ 2. 농장 보유 자산 현황 (총 자산가액: <span style="color:#10B981;">${formatMoney(totalAssetsCost)}</span>)
              </h2>
              <p style="font-size: 12px; color: #94A3B8; margin-top: 2px;">시설공사, 기계장치, 건물 등 보유 자산을 등록하여 연간 감가상각비를 산출합니다.</p>
            </div>
            <button id="intake-add-asset-btn" class="btn-upload" style="background: #3B82F6; padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 700;">+ 새 자산 항목 추가</button>
          </div>

          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>연번</th>
                  <th>자산 / 시설 목록명</th>
                  <th>구입가(원)</th>
                  <th>내용년수(년)</th>
                  <th>삭제</th>
                </tr>
              </thead>
              <tbody>
                ${assetsState.length === 0 ? `
                  <tr><td colspan="5" style="text-align:center; color:#94A3B8; padding:20px;">등록된 자산이 없습니다. [+ 새 자산 항목 추가] 버튼을 눌러 추가하세요.</td></tr>
                ` : assetsState.map((asset, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><input type="text" class="i-asset-name" data-idx="${idx}" value="${asset.목록 || asset.name || ''}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:100%;" /></td>
                    <td><input type="number" class="i-asset-price" data-idx="${idx}" value="${asset.구입가 || 0}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:100%;" /></td>
                    <td><input type="number" class="i-asset-years" data-idx="${idx}" value="${asset.내용년수 || 10}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:80px;" /></td>
                    <td><button class="i-btn-del-asset" data-idx="${idx}" style="background:#EF4444; color:#FFF; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;">삭제</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. 농가 대출 & 부채 현황 -->
        <div style="background: #1E293B; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px; color: #FFF; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; margin-bottom: 18px; flex-wrap: wrap; gap: 10px;">
            <div>
              <h2 style="font-size: 17px; font-weight: 800; color: #EF4444; display: flex; align-items: center; gap: 8px;">
                💳 3. 농가 대출 및 부채 현황 (총 부채액: <span style="color:#EF4444;">${formatMoney(totalLoansAmount)}</span>)
              </h2>
              <p style="font-size: 12px; color: #94A3B8; margin-top: 2px;">청창농 자금, 신용보증, 시설자금 대출 현황을 등록하여 연말 상환 스케줄을 산출합니다.</p>
            </div>
            <button id="intake-add-loan-btn" class="btn-upload" style="background: #EF4444; padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 700;">+ 새 대출 항목 추가</button>
          </div>

          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>상환 방식</th>
                  <th>은행 / 대출 사업명</th>
                  <th>대출금액(원)</th>
                  <th>금리(%)</th>
                  <th>상환기간(년)</th>
                  <th>거치기간(년)</th>
                  <th>삭제</th>
                </tr>
              </thead>
              <tbody>
                ${loansState.length === 0 ? `
                  <tr><td colspan="7" style="text-align:center; color:#94A3B8; padding:20px;">등록된 대출이 없습니다. [+ 새 대출 항목 추가] 버튼을 눌러 추가하세요.</td></tr>
                ` : loansState.map((loan, idx) => `
                  <tr>
                    <td>
                      <select class="i-loan-type" data-idx="${idx}" style="background:#0F172A; color:#FFF; border:1px solid rgba(255,255,255,0.15); padding:8px; border-radius:6px;">
                        <option value="원리금균등" ${(loan.대출조건 || loan.대출종류) === '원리금균등' ? 'selected' : ''}>원리금균등</option>
                        <option value="원금균등" ${(loan.대출조건 || loan.대출종류) === '원금균등' ? 'selected' : ''}>원금균등</option>
                        <option value="일시상환" ${(loan.대출조건 || loan.대출종류) === '일시상환' ? 'selected' : ''}>일시상환</option>
                      </select>
                    </td>
                    <td><input type="text" class="i-loan-name" data-idx="${idx}" value="${loan.은행명 || loan.name || ''}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:100%;" /></td>
                    <td><input type="number" class="i-loan-amount" data-idx="${idx}" value="${loan.대출금액 || 0}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:100%;" /></td>
                    <td><input type="number" step="0.1" class="i-loan-rate" data-idx="${idx}" value="${loan.이자율 ? (loan.이자율 > 1 ? loan.이자율 : loan.이자율 * 100) : 1.5}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:70px;" />%</td>
                    <td><input type="number" class="i-loan-period" data-idx="${idx}" value="${loan.대출기간 || 10}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:60px;" />년</td>
                    <td><input type="number" class="i-loan-grace" data-idx="${idx}" value="${loan.거치기간 || 0}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:60px;" />년</td>
                    <td><button class="i-btn-del-loan" data-idx="${idx}" style="background:#EF4444; color:#FFF; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;">삭제</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
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

    // 7-Column Input Event Handlers
    document.getElementById('ex-farm-name').addEventListener('change', (e) => { farmState.farmName = e.target.value; });
    document.getElementById('ex-region').addEventListener('change', (e) => { farmState.region = e.target.value; });
    
    document.getElementById('ex-category').addEventListener('change', (e) => {
      farmState.category = e.target.value;
      const crops = farmState.category === '전체' ? Object.keys(FULL_CROP_DATABASE) : Object.keys(FULL_CROP_DATABASE).filter(k => (FULL_CROP_DATABASE[k].category || '기타') === farmState.category);
      if (!crops.includes(farmState.cropName)) {
        farmState.cropName = crops[0] || '시설상추';
      }
      renderForm();
    });

    document.getElementById('ex-crop-name').addEventListener('change', (e) => {
      farmState.cropName = e.target.value;
      renderForm();
    });

    // Auto sync ㎡ and 평
    document.getElementById('ex-area-m2').addEventListener('input', (e) => {
      const m2 = Number(e.target.value) || 0;
      farmState.areaM2 = m2;
      farmState.areaPyung = Math.round(m2 / 3.305785);
      const pyungEl = document.getElementById('ex-area-pyung');
      if (pyungEl) pyungEl.value = farmState.areaPyung;
    });

    document.getElementById('ex-area-pyung').addEventListener('input', (e) => {
      const pyung = Number(e.target.value) || 0;
      farmState.areaPyung = pyung;
      farmState.areaM2 = Math.round(pyung * 3.305785);
      const m2El = document.getElementById('ex-area-m2');
      if (m2El) m2El.value = farmState.areaM2;
    });

    document.getElementById('ex-cycles').addEventListener('change', (e) => {
      farmState.cycles = Number(e.target.value) || 1;
      renderForm();
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
      inp.addEventListener('change', (e) => { assetsState[Number(e.target.getAttribute('data-idx'))].구입가 = Number(e.target.value); });
    });
    document.querySelectorAll('.i-asset-years').forEach(inp => {
      inp.addEventListener('change', (e) => { assetsState[Number(e.target.getAttribute('data-idx'))].내용년수 = Number(e.target.value); });
    });

    // Loan handlers
    document.getElementById('intake-add-loan-btn').addEventListener('click', () => {
      loansState.push({ 대출조건: "원리금균등", 은행명: "신규 대출", 대출금액: 50000000, 이자율: 0.02, 대출기간: 10, 거치기간: 2 });
      renderForm();
    });

    document.querySelectorAll('.i-btn-del-loan').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        loansState.splice(idx, 1);
        renderForm();
      });
    });

    document.querySelectorAll('.i-loan-name').forEach(inp => {
      inp.addEventListener('change', (e) => { loansState[Number(e.target.getAttribute('data-idx'))].은행명 = e.target.value; });
    });
    document.querySelectorAll('.i-loan-amount').forEach(inp => {
      inp.addEventListener('change', (e) => { loansState[Number(e.target.getAttribute('data-idx'))].대출금액 = Number(e.target.value); });
    });

    // Submit handler
    document.getElementById('intake-submit-btn').addEventListener('click', () => {
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
        costBreakdown: scaledCostBreakdown,
        benchmark: baseCropModel.benchmark,
        kamisData: baseCropModel.kamisData
      };

      if (onSubmit) onSubmit(finalModel, assetsState, loansState);
    });
  }

  renderForm();
}

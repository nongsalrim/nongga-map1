/**
 * @file FarmIntakeStep.js
 * @description Step 1: 메인 농가 경영체 정밀 데이터 입력 센터 (컨설팅 전용 메인 진입 폼)
 */

import { CROP_PRESETS } from '../../utils/excelEngine.js';

export function renderFarmIntakeStep(container, currentModel, currentAssets, currentLoans, onSubmit, onSelectCrop) {
  let modelState = JSON.parse(JSON.stringify(currentModel));
  let assetsState = JSON.parse(JSON.stringify(currentAssets || []));
  let loansState = JSON.parse(JSON.stringify(currentLoans || []));

  const cropList = Object.keys(CROP_PRESETS);
  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(val)) + ' 원';

  function renderForm() {
    const totalAssetsCost = assetsState.reduce((sum, a) => sum + (Number(a.구입가) || 0), 0);
    const totalLoansAmount = loansState.reduce((sum, l) => sum + (Number(l.대출금액) || 0), 0);

    container.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto; padding-bottom: 60px;">
        
        <!-- STEP 1 헤더 안내 배너 -->
        <div style="background: linear-gradient(135deg, #0F172A, #1E293B); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; padding: 32px; margin-bottom: 28px; text-align: center; color: #FFF; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
          <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #10B981; border: 1px solid rgba(16,185,129,0.4); padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; display: inline-block; margin-bottom: 12px;">STEP 1 · FARM DATA INTAKE CENTER</span>
          <h1 style="font-size: 28px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 8px;">
            📝 농가 경영체 정밀 데이터 입력 센터
          </h1>
          <p style="font-size: 14px; color: #94A3B8; max-width: 720px; margin: 0 auto;">
            농가별 재배 품목, 면적, 보유 자산, 대출 현황을 직접 입력하시면 농진청 소득조사표 및 KAMIS 유통시세 DB와 실시간 연동되어 맞춤형 컨설팅 진단서가 생성됩니다.
          </p>
        </div>

        <!-- 폼 카드 영역 -->
        <div style="display: grid; grid-template-columns: 1fr; gap: 24px;">

          <!-- 섹션 1: 농가 기본 & 재배 정보 -->
          <div style="background: #1E293B; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px; color: #FFF;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; margin-bottom: 20px;">
              <h2 style="font-size: 18px; font-weight: 800; color: #10B981; display: flex; align-items: center; gap: 10px;">
                🏡 1. 농가 기본 정보 & 대표 작목 재배 면적
              </h2>
              <span style="font-size: 12px; color: #94A3B8;">* 작목 선택 시 농진청 표준 소득조사표 표준값이 자동 로드됩니다.</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
              <div>
                <label style="font-size: 13px; color: #94A3B8; display: block; margin-bottom: 8px; font-weight: 600;">농가명 / 대표자명</label>
                <input type="text" id="intake-farm-name" value="${modelState.cropName.includes('홍길동') ? modelState.cropName : (modelState.farmOwner || '홍길동 농가')}" placeholder="예: 홍길동 농가" style="width: 100%; padding: 12px 16px; background: #0F172A; border: 1px solid rgba(255,255,255,0.15); color: #FFF; border-radius: 10px; font-size: 14px;" />
              </div>

              <div>
                <label style="font-size: 13px; color: #94A3B8; display: block; margin-bottom: 8px; font-weight: 600;">진단 대상 작목 선택 (19개 작목)</label>
                <select id="intake-crop-select" style="width: 100%; padding: 12px 16px; background: #0F172A; border: 1px solid #10B981; color: #10B981; border-radius: 10px; font-size: 14px; font-weight: 700;">
                  ${cropList.map(c => `<option value="${c}" ${(modelState.cropName.includes(c) || modelState.cropName === c) ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>

              <div>
                <label style="font-size: 13px; color: #94A3B8; display: block; margin-bottom: 8px; font-weight: 600;">재배 면적 (평)</label>
                <input type="number" id="intake-area-pyung" value="${modelState.areaPyung || 1000}" style="width: 100%; padding: 12px 16px; background: #0F172A; border: 1px solid rgba(255,255,255,0.15); color: #FFF; border-radius: 10px; font-size: 14px;" />
              </div>

              <div>
                <label style="font-size: 13px; color: #94A3B8; display: block; margin-bottom: 8px; font-weight: 600;">연간 작기(기작) 수</label>
                <input type="number" id="intake-cycles" value="${modelState.cycles || 1}" style="width: 100%; padding: 12px 16px; background: #0F172A; border: 1px solid rgba(255,255,255,0.15); color: #FFF; border-radius: 10px; font-size: 14px;" />
              </div>

              <div>
                <label style="font-size: 13px; color: #94A3B8; display: block; margin-bottom: 8px; font-weight: 600;">연간 총수입 (매출액: 원)</label>
                <input type="number" id="intake-revenue" value="${modelState.revenue}" style="width: 100%; padding: 12px 16px; background: #0F172A; border: 1px solid rgba(255,255,255,0.15); color: #FFF; border-radius: 10px; font-size: 14px;" />
              </div>

              <div>
                <label style="font-size: 13px; color: #94A3B8; display: block; margin-bottom: 8px; font-weight: 600;">연간 경영비 총액 (원)</label>
                <input type="number" id="intake-expenses" value="${modelState.operatingExpenses}" style="width: 100%; padding: 12px 16px; background: #0F172A; border: 1px solid rgba(255,255,255,0.15); color: #FFF; border-radius: 10px; font-size: 14px;" />
              </div>
            </div>
          </div>

          <!-- 섹션 2: 농장 보유 자산 목록 -->
          <div style="background: #1E293B; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px; color: #FFF;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
              <div>
                <h2 style="font-size: 18px; font-weight: 800; color: #3B82F6; display: flex; align-items: center; gap: 10px;">
                  🏗️ 2. 농장 보유 주요 자산 현황
                </h2>
                <p style="font-size: 12px; color: #94A3B8; margin-top: 4px;">시설공사, 기계장치, 건물 등 보유 자산을 등록하여 연간 감가상각비를 산출합니다. (총 자산: <span style="color:#10B981; font-weight:700;">${formatMoney(totalAssetsCost)}</span>)</p>
              </div>
              <button id="intake-add-asset-btn" class="btn-upload" style="background: #3B82F6; padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 700;">+ 새 자산 항목 추가</button>
            </div>

            <div class="data-table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>연번</th>
                    <th>자산 / 시설 목록명</th>
                    <th>구입가(원)</th>
                    <th>내용년수(년)</th>
                    <th>거래처</th>
                    <th>삭제</th>
                  </tr>
                </thead>
                <tbody>
                  ${assetsState.length === 0 ? `
                    <tr><td colspan="6" style="text-align:center; color:#94A3B8; padding:20px;">등록된 자산이 없습니다. [+ 새 자산 항목 추가] 버튼을 눌러 추가하세요.</td></tr>
                  ` : assetsState.map((asset, idx) => `
                    <tr>
                      <td>${idx + 1}</td>
                      <td><input type="text" class="i-asset-name" data-idx="${idx}" value="${asset.목록 || asset.name || ''}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:100%;" /></td>
                      <td><input type="number" class="i-asset-price" data-idx="${idx}" value="${asset.구입가 || 0}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:100%;" /></td>
                      <td><input type="number" class="i-asset-years" data-idx="${idx}" value="${asset.내용년수 || 10}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:70px;" /></td>
                      <td><input type="text" class="i-asset-vendor" data-idx="${idx}" value="${asset.거래처 || '자체시설'}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:8px; border-radius:6px; width:100%;" /></td>
                      <td><button class="i-btn-del-asset" data-idx="${idx}" style="background:#EF4444; color:#FFF; border:none; padding:6px 12px; border-radius:6px; cursor:pointer;">삭제</button></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- 섹션 3: 농가 대출 & 부채 현황 -->
          <div style="background: #1E293B; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px; color: #FFF;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
              <div>
                <h2 style="font-size: 18px; font-weight: 800; color: #EF4444; display: flex; align-items: center; gap: 10px;">
                  💳 3. 농가 대출 및 부채 현황
                </h2>
                <p style="font-size: 12px; color: #94A3B8; margin-top: 4px;">청창농 자금, 신용보증, 시설자금 대출 현황을 등록하여 상환 스케줄을 계산합니다. (총 부채: <span style="color:#EF4444; font-weight:700;">${formatMoney(totalLoansAmount)}</span>)</p>
              </div>
              <button id="intake-add-loan-btn" class="btn-upload" style="background: #EF4444; padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 700;">+ 새 대출 항목 추가</button>
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

        </div>

        <!-- 하단 대형 분석 실행 CTA 버튼 -->
        <div style="text-align: center; margin-top: 40px;">
          <button id="intake-submit-btn" class="btn-upload" style="background: linear-gradient(135deg, #10B981, #059669); padding: 20px 50px; font-size: 18px; font-weight: 900; border-radius: 16px; box-shadow: 0 8px 25px rgba(16,185,129,0.4); cursor: pointer; letter-spacing: -0.5px;">
            🚀 입력 데이터 기반 맞춤 농가 경영분석 & 1:1 진단서 생성하기 →
          </button>
        </div>

      </div>
    `;

    // Crop selection change listener
    const cropSelect = document.getElementById('intake-crop-select');
    if (cropSelect) {
      cropSelect.addEventListener('change', (e) => {
        if (onSelectCrop) onSelectCrop(e.target.value);
      });
    }

    // Asset handlers
    document.getElementById('intake-add-asset-btn').addEventListener('click', () => {
      assetsState.push({ 연번: assetsState.length + 1, 목록: "신규 시설/장비", 구입가: 10000000, 내용년수: 10, 거래처: "자체구매" });
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
      const farmNameInp = document.getElementById('intake-farm-name');
      const areaInp = document.getElementById('intake-area-pyung');
      const revInp = document.getElementById('intake-revenue');
      const expInp = document.getElementById('intake-expenses');

      if (farmNameInp) modelState.cropName = farmNameInp.value;
      if (areaInp) {
        modelState.areaPyung = Number(areaInp.value);
        modelState.areaM2 = Math.round(Number(areaInp.value) * 3.305785);
      }
      if (revInp) modelState.revenue = Number(revInp.value);
      if (expInp) modelState.operatingExpenses = Number(expInp.value);
      modelState.income = modelState.revenue - modelState.operatingExpenses;

      if (onSubmit) onSubmit(modelState, assetsState, loansState);
    });
  }

  renderForm();
}

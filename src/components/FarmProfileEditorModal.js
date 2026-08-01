/**
 * @file FarmProfileEditorModal.js
 * @description 농가 경영체 정밀 데이터 직접 입력 및 관리 모달 (컨설턴트 전용 전문 입력 창)
 */

export function renderFarmProfileEditorModal(currentModel, currentAssets, currentLoans, onSave, onClose) {
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'pdf-modal-overlay';
  modalOverlay.style.zIndex = '2000';

  let modelState = JSON.parse(JSON.stringify(currentModel));
  let assetsState = JSON.parse(JSON.stringify(currentAssets || []));
  let loansState = JSON.parse(JSON.stringify(currentLoans || []));

  let activeTab = 'profile'; // 'profile', 'assets', 'loans', 'costs'

  function renderModalBody() {
    const totalAssetsCost = assetsState.reduce((sum, a) => sum + (Number(a.구입가) || 0), 0);
    const totalLoansAmount = loansState.reduce((sum, l) => sum + (Number(l.대출금액) || 0), 0);
    const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(val) + ' 원';

    modalOverlay.innerHTML = `
      <div class="pdf-modal-container" style="max-width: 1000px; max-height: 92vh;">
        <div class="pdf-modal-header" style="background: #0F172A; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <div>
            <h2 style="color:#FFF; font-size:18px; display:flex; align-items:center; gap:8px;">
              📝 컨설팅 전용 농가 경영체 정밀 데이터 입력 및 편집 센터
            </h2>
            <p style="font-size:12px; color:#94A3B8; margin-top:2px;">농장별 재배 면적, 자산 현황, 대출 현황, 원가 비목을 직접 입력하여 대시보드 및 보고서에 실시간 적용합니다.</p>
          </div>
          <div class="pdf-modal-actions">
            <button id="editor-save-btn" class="btn-upload" style="background: linear-gradient(135deg, #10B981, #059669);">
              💾 농가 데이터 대시보드 적용
            </button>
            <button id="editor-close-btn" style="background:transparent; border:none; color:#FFF; font-size:24px; cursor:pointer;">&times;</button>
          </div>
        </div>

        <!-- 서브 탭 네비게이션 -->
        <div style="background: #1E293B; padding: 10px 24px; border-bottom: 1px solid rgba(255,255,255,0.1); display:flex; gap:10px;">
          <button class="nav-tab ${activeTab === 'profile' ? 'active' : ''}" id="tab-btn-profile">🏡 1. 농장 기본 & 재배정보</button>
          <button class="nav-tab ${activeTab === 'assets' ? 'active' : ''}" id="tab-btn-assets">🏗️ 2. 농장 자산 현황 (${assetsState.length}건)</button>
          <button class="nav-tab ${activeTab === 'loans' ? 'active' : ''}" id="tab-btn-loans">💳 3. 농장 대출 & 부채 현황 (${loansState.length}건)</button>
          <button class="nav-tab ${activeTab === 'costs' ? 'active' : ''}" id="tab-btn-costs">📋 4. 경영비 비목 예산 설정</button>
        </div>

        <div style="padding: 24px; overflow-y: auto; background: #0F172A; color: #FFF; flex: 1;">
          ${activeTab === 'profile' ? `
            <!-- 1. 농장 기본 & 재배정보 -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <label style="font-size:13px; color:#94A3B8; display:block; margin-bottom:6px;">농가명 / 대표자명</label>
                <input type="text" id="inp-farm-name" value="${modelState.cropName || '홍길동 농가'}" style="width:100%; padding:10px; background:#1E293B; border:1px solid rgba(255,255,255,0.15); color:#FFF; border-radius:8px;" />
              </div>

              <div>
                <label style="font-size:13px; color:#94A3B8; display:block; margin-bottom:6px;">주요 재배 품목</label>
                <input type="text" id="inp-crop-name" value="${modelState.cropName.replace('업로드: ', '')}" style="width:100%; padding:10px; background:#1E293B; border:1px solid rgba(255,255,255,0.15); color:#FFF; border-radius:8px;" />
              </div>

              <div>
                <label style="font-size:13px; color:#94A3B8; display:block; margin-bottom:6px;">재배 면적 (평)</label>
                <input type="number" id="inp-area-pyung" value="${modelState.areaPyung || 1000}" style="width:100%; padding:10px; background:#1E293B; border:1px solid rgba(255,255,255,0.15); color:#FFF; border-radius:8px;" />
              </div>

              <div>
                <label style="font-size:13px; color:#94A3B8; display:block; margin-bottom:6px;">연간 기작 수 (회)</label>
                <input type="number" id="inp-cycles" value="${modelState.cycles || 1}" style="width:100%; padding:10px; background:#1E293B; border:1px solid rgba(255,255,255,0.15); color:#FFF; border-radius:8px;" />
              </div>

              <div>
                <label style="font-size:13px; color:#94A3B8; display:block; margin-bottom:6px;">연간 총수입 (매출액: 원)</label>
                <input type="number" id="inp-revenue" value="${modelState.revenue}" style="width:100%; padding:10px; background:#1E293B; border:1px solid rgba(255,255,255,0.15); color:#FFF; border-radius:8px;" />
              </div>

              <div>
                <label style="font-size:13px; color:#94A3B8; display:block; margin-bottom:6px;">연간 경영비 총액 (원)</label>
                <input type="number" id="inp-expenses" value="${modelState.operatingExpenses}" style="width:100%; padding:10px; background:#1E293B; border:1px solid rgba(255,255,255,0.15); color:#FFF; border-radius:8px;" />
              </div>

              <div>
                <label style="font-size:13px; color:#94A3B8; display:block; margin-bottom:6px;">예상 출하 단가 (원/kg)</label>
                <input type="number" id="inp-price" value="${modelState.pricePerKg || 2500}" style="width:100%; padding:10px; background:#1E293B; border:1px solid rgba(255,255,255,0.15); color:#FFF; border-radius:8px;" />
              </div>

              <div>
                <label style="font-size:13px; color:#94A3B8; display:block; margin-bottom:6px;">연간 생산량 (kg)</label>
                <input type="number" id="inp-yield" value="${modelState.yieldKg || 100000}" style="width:100%; padding:10px; background:#1E293B; border:1px solid rgba(255,255,255,0.15); color:#FFF; border-radius:8px;" />
              </div>
            </div>
          ` : activeTab === 'assets' ? `
            <!-- 2. 농장 자산 현황 -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 style="font-size:16px;">🏗️ 보유 농장 자산 목록 (총 자산가액: <span style="color:#10B981;">${formatMoney(totalAssetsCost)}</span>)</h3>
              <button id="add-asset-btn" class="btn-upload" style="padding:6px 14px; font-size:12px;">+ 자산 항목 추가</button>
            </div>

            <div class="data-table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>연번</th>
                    <th>자산/시설 목록명</th>
                    <th>구입가(원)</th>
                    <th>내용년수(년)</th>
                    <th>작동</th>
                  </tr>
                </thead>
                <tbody>
                  ${assetsState.map((asset, idx) => `
                    <tr>
                      <td>${idx + 1}</td>
                      <td><input type="text" class="asset-inp-name" data-idx="${idx}" value="${asset.목록 || asset.name || ''}" style="background:#1E293B; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:4px; width:100%;" /></td>
                      <td><input type="number" class="asset-inp-price" data-idx="${idx}" value="${asset.구입가 || 0}" style="background:#1E293B; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:4px; width:100%;" /></td>
                      <td><input type="number" class="asset-inp-years" data-idx="${idx}" value="${asset.내용년수 || 10}" style="background:#1E293B; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:4px; width:60px;" /></td>
                      <td><button class="btn-delete-asset" data-idx="${idx}" style="background:#EF4444; color:#FFF; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">삭제</button></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : activeTab === 'loans' ? `
            <!-- 3. 농장 대출 & 부채 현황 -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 style="font-size:16px;">💳 농가 대출 및 부채 현황 (총 대출액: <span style="color:#EF4444;">${formatMoney(totalLoansAmount)}</span>)</h3>
              <button id="add-loan-btn" class="btn-upload" style="padding:6px 14px; font-size:12px; background:#3B82F6;">+ 대출 항목 추가</button>
            </div>

            <div class="data-table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>상환방식</th>
                    <th>은행 / 대출 사업명</th>
                    <th>대출금액(원)</th>
                    <th>이자율(%)</th>
                    <th>대출기간(년)</th>
                    <th>거치기간(년)</th>
                    <th>작동</th>
                  </tr>
                </thead>
                <tbody>
                  ${loansState.map((loan, idx) => `
                    <tr>
                      <td>
                        <select class="loan-inp-type" data-idx="${idx}" style="background:#1E293B; color:#FFF; border:1px solid rgba(255,255,255,0.15); padding:6px; border-radius:4px;">
                          <option value="원리금균등" ${(loan.대출조건 || loan.대출종류) === '원리금균등' ? 'selected' : ''}>원리금균등</option>
                          <option value="원금균등" ${(loan.대출조건 || loan.대출종류) === '원금균등' ? 'selected' : ''}>원금균등</option>
                          <option value="일시상환" ${(loan.대출조건 || loan.대출종류) === '일시상환' ? 'selected' : ''}>일시상환</option>
                        </select>
                      </td>
                      <td><input type="text" class="loan-inp-name" data-idx="${idx}" value="${loan.은행명 || loan.name || ''}" style="background:#1E293B; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:4px; width:100%;" /></td>
                      <td><input type="number" class="loan-inp-amount" data-idx="${idx}" value="${loan.대출금액 || 0}" style="background:#1E293B; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:4px; width:100%;" /></td>
                      <td><input type="number" step="0.1" class="loan-inp-rate" data-idx="${idx}" value="${loan.이자율 ? (loan.이자율 > 1 ? loan.이자율 : loan.이자율 * 100) : 1.5}" style="background:#1E293B; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:4px; width:60px;" />%</td>
                      <td><input type="number" class="loan-inp-period" data-idx="${idx}" value="${loan.대출기간 || 10}" style="background:#1E293B; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:4px; width:50px;" />년</td>
                      <td><input type="number" class="loan-inp-grace" data-idx="${idx}" value="${loan.거치기간 || 0}" style="background:#1E293B; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:4px; width:50px;" />년</td>
                      <td><button class="btn-delete-loan" data-idx="${idx}" style="background:#EF4444; color:#FFF; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">삭제</button></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <!-- 4. 경영비 비목 예산 설정 -->
            <h3 style="font-size:16px; margin-bottom:16px;">📋 경영비 8대 세부 비목별 예산 및 비중 설정</h3>
            <div class="data-table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>비목명</th>
                    <th>집계 금액(원)</th>
                    <th>비중(%)</th>
                  </tr>
                </thead>
                <tbody>
                  ${modelState.costBreakdown.map((cost, idx) => `
                    <tr>
                      <td style="font-weight:600;">${cost.name}</td>
                      <td><input type="number" class="cost-inp-amount" data-idx="${idx}" value="${cost.cost}" style="background:#1E293B; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:4px; width:100%;" /></td>
                      <td style="color:#10B981; font-weight:700;">${cost.percent}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;

    // Tab events
    document.getElementById('tab-btn-profile').addEventListener('click', () => { activeTab = 'profile'; renderModalBody(); });
    document.getElementById('tab-btn-assets').addEventListener('click', () => { activeTab = 'assets'; renderModalBody(); });
    document.getElementById('tab-btn-loans').addEventListener('click', () => { activeTab = 'loans'; renderModalBody(); });
    document.getElementById('tab-btn-costs').addEventListener('click', () => { activeTab = 'costs'; renderModalBody(); });

    // Asset Events
    const addAssetBtn = document.getElementById('add-asset-btn');
    if (addAssetBtn) {
      addAssetBtn.addEventListener('click', () => {
        assetsState.push({ 연번: assetsState.length + 1, 목록: "신규 시설/장비", 구입가: 10000000, 내용년수: 10, 거래처: "자체구매" });
        renderModalBody();
      });
    }

    document.querySelectorAll('.btn-delete-asset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        assetsState.splice(idx, 1);
        renderModalBody();
      });
    });

    document.querySelectorAll('.asset-inp-name').forEach(inp => {
      inp.addEventListener('change', (e) => { assetsState[Number(e.target.getAttribute('data-idx'))].목록 = e.target.value; });
    });
    document.querySelectorAll('.asset-inp-price').forEach(inp => {
      inp.addEventListener('change', (e) => { assetsState[Number(e.target.getAttribute('data-idx'))].구입가 = Number(e.target.value); });
    });
    document.querySelectorAll('.asset-inp-years').forEach(inp => {
      inp.addEventListener('change', (e) => { assetsState[Number(e.target.getAttribute('data-idx'))].내용년수 = Number(e.target.value); });
    });

    // Loan Events
    const addLoanBtn = document.getElementById('add-loan-btn');
    if (addLoanBtn) {
      addLoanBtn.addEventListener('click', () => {
        loansState.push({ 대출조건: "원리금균등", 은행명: "신규 대출", 대출금액: 50000000, 이자율: 0.02, 대출기간: 10, 거치기간: 2 });
        renderModalBody();
      });
    }

    document.querySelectorAll('.btn-delete-loan').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        loansState.splice(idx, 1);
        renderModalBody();
      });
    });

    document.querySelectorAll('.loan-inp-name').forEach(inp => {
      inp.addEventListener('change', (e) => { loansState[Number(e.target.getAttribute('data-idx'))].은행명 = e.target.value; });
    });
    document.querySelectorAll('.loan-inp-amount').forEach(inp => {
      inp.addEventListener('change', (e) => { loansState[Number(e.target.getAttribute('data-idx'))].대출금액 = Number(e.target.value); });
    });
    document.querySelectorAll('.loan-inp-rate').forEach(inp => {
      inp.addEventListener('change', (e) => { loansState[Number(e.target.getAttribute('data-idx'))].이자율 = Number(e.target.value) / 100; });
    });

    // Profile Inputs Events
    const inpName = document.getElementById('inp-farm-name');
    if (inpName) inpName.addEventListener('change', (e) => { modelState.cropName = e.target.value; });
    const inpArea = document.getElementById('inp-area-pyung');
    if (inpArea) inpArea.addEventListener('change', (e) => { modelState.areaPyung = Number(e.target.value); modelState.areaM2 = Math.round(Number(e.target.value) * 3.305785); });
    const inpRev = document.getElementById('inp-revenue');
    if (inpRev) inpRev.addEventListener('change', (e) => { modelState.revenue = Number(e.target.value); modelState.income = modelState.revenue - modelState.operatingExpenses; });
    const inpExp = document.getElementById('inp-expenses');
    if (inpExp) inpExp.addEventListener('change', (e) => { modelState.operatingExpenses = Number(e.target.value); modelState.income = modelState.revenue - modelState.operatingExpenses; });

    // Save & Close listeners
    document.getElementById('editor-close-btn').addEventListener('click', () => modalOverlay.remove());
    document.getElementById('editor-save-btn').addEventListener('click', () => {
      modalOverlay.remove();
      if (onSave) onSave(modelState, assetsState, loansState);
    });
  }

  renderModalBody();
  document.body.appendChild(modalOverlay);
}

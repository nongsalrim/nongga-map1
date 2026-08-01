/**
 * @file FarmProfileEditorView.js
 * @description 농가 경영체 정밀 데이터 직접 입력 및 관리 전용 임베디드 뷰 (컨설턴트 전용 1번 탭)
 */

export function renderFarmProfileEditorView(container, model, assetsList, loansList, onSave) {
  let modelState = JSON.parse(JSON.stringify(model));
  let assetsState = JSON.parse(JSON.stringify(assetsList || []));
  let loansState = JSON.parse(JSON.stringify(loansList || []));

  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(val)) + ' 원';

  function updateView() {
    const totalAssetsCost = assetsState.reduce((sum, a) => sum + (Number(a.구입가) || 0), 0);
    const totalLoansAmount = loansState.reduce((sum, l) => sum + (Number(l.대출금액) || 0), 0);

    container.innerHTML = `
      <div style="background: linear-gradient(135deg, #1E293B, #0F172A); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 28px; margin-bottom: 24px; color: #FFF;">
        
        <!-- 상단 헤더 & 저장 버튼 -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 24px; flex-wrap:wrap; gap:16px;">
          <div>
            <span class="badge" style="background:rgba(59,130,246,0.2); color:#3B82F6; border:1px solid rgba(59,130,246,0.3); margin-bottom:6px; display:inline-block;">FARM DATA ENTRY CENTER</span>
            <h2 style="font-size:22px; font-weight:800; color:#FFF; display:flex; align-items:center; gap:8px;">
              📝 농가별 경영체 정밀 데이터 직접 입력 & 관리
            </h2>
            <p style="font-size:13px; color:#94A3B8; margin-top:4px;">
              컨설팅 대상 농가의 재배면적, 대표 작목, 보유 자산, 대출 현황, 원가 예산을 입력하시면 전체 대시보드 및 보고서에 즉시 100% 실시간 반영됩니다.
            </p>
          </div>

          <button id="btn-save-farm-editor" class="btn-upload" style="background: linear-gradient(135deg, #10B981, #059669); padding: 14px 28px; font-size:15px; font-weight:700; border-radius:10px; box-shadow:0 4px 14px rgba(16,185,129,0.3); cursor:pointer;">
            💾 입력한 농가 데이터 대시보드에 즉시 반영하기
          </button>
        </div>

        <!-- 1. 농장 기본 & 재배 정보 입력 -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:20px; margin-bottom:24px;">
          <h3 style="font-size:16px; font-weight:700; color:#10B981; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
            🏡 1. 농장 기본 및 재배면적 정보
          </h3>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
            <div>
              <label style="font-size:12px; color:#94A3B8; display:block; margin-bottom:6px;">농가명 / 대표자명</label>
              <input type="text" id="inp-view-farm-name" value="${modelState.cropName || '홍길동 농가'}" style="width:100%; padding:10px; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; border-radius:8px;" />
            </div>

            <div>
              <label style="font-size:12px; color:#94A3B8; display:block; margin-bottom:6px;">주요 재배 품목</label>
              <input type="text" id="inp-view-crop-name" value="${modelState.cropName.replace('업로드: ', '')}" style="width:100%; padding:10px; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; border-radius:8px;" />
            </div>

            <div>
              <label style="font-size:12px; color:#94A3B8; display:block; margin-bottom:6px;">재배 면적 (평)</label>
              <input type="number" id="inp-view-area-pyung" value="${modelState.areaPyung || 1000}" style="width:100%; padding:10px; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; border-radius:8px;" />
            </div>

            <div>
              <label style="font-size:12px; color:#94A3B8; display:block; margin-bottom:6px;">연간 기작 수 (회)</label>
              <input type="number" id="inp-view-cycles" value="${modelState.cycles || 1}" style="width:100%; padding:10px; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; border-radius:8px;" />
            </div>

            <div>
              <label style="font-size:12px; color:#94A3B8; display:block; margin-bottom:6px;">연간 총수입 (매출액: 원)</label>
              <input type="number" id="inp-view-revenue" value="${modelState.revenue}" style="width:100%; padding:10px; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; border-radius:8px;" />
            </div>

            <div>
              <label style="font-size:12px; color:#94A3B8; display:block; margin-bottom:6px;">연간 경영비 총액 (원)</label>
              <input type="number" id="inp-view-expenses" value="${modelState.operatingExpenses}" style="width:100%; padding:10px; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; border-radius:8px;" />
            </div>

            <div>
              <label style="font-size:12px; color:#94A3B8; display:block; margin-bottom:6px;">예상 출하 단가 (원/kg)</label>
              <input type="number" id="inp-view-price" value="${modelState.pricePerKg || 2500}" style="width:100%; padding:10px; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; border-radius:8px;" />
            </div>

            <div>
              <label style="font-size:12px; color:#94A3B8; display:block; margin-bottom:6px;">연간 생산량 (kg)</label>
              <input type="number" id="inp-view-yield" value="${modelState.yieldKg || 100000}" style="width:100%; padding:10px; background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; border-radius:8px;" />
            </div>
          </div>
        </div>

        <!-- 2. 농장 자산 현황 입력 -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:20px; margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
            <h3 style="font-size:16px; font-weight:700; color:#3B82F6; display:flex; align-items:center; gap:8px;">
              🏗️ 2. 농장 보유 자산 현황 (총 자산가액: <span style="color:#10B981;">${formatMoney(totalAssetsCost)}</span>)
            </h3>
            <button id="btn-view-add-asset" class="btn-upload" style="padding:6px 14px; font-size:12px; background:#3B82F6;">+ 새 자산 항목 추가</button>
          </div>

          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>연번</th>
                  <th>자산/시설 목록명</th>
                  <th>구입가(원)</th>
                  <th>내용년수(년)</th>
                  <th>거래처</th>
                  <th>작동</th>
                </tr>
              </thead>
              <tbody>
                ${assetsState.length === 0 ? `
                  <tr><td colspan="6" style="text-align:center; color:#94A3B8; padding:16px;">등록된 자산이 없습니다. [+ 새 자산 항목 추가] 버튼을 누르세요.</td></tr>
                ` : assetsState.map((asset, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><input type="text" class="v-asset-name" data-idx="${idx}" value="${asset.목록 || asset.name || ''}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:4px; width:100%;" /></td>
                    <td><input type="number" class="v-asset-price" data-idx="${idx}" value="${asset.구입가 || 0}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:4px; width:100%;" /></td>
                    <td><input type="number" class="v-asset-years" data-idx="${idx}" value="${asset.내용년수 || 10}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:4px; width:70px;" /></td>
                    <td><input type="text" class="v-asset-vendor" data-idx="${idx}" value="${asset.거래처 || '자체시설'}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:4px; width:100%;" /></td>
                    <td><button class="v-btn-del-asset" data-idx="${idx}" style="background:#EF4444; color:#FFF; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;">삭제</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. 농장 대출 & 부채 현황 입력 -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:20px; margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
            <h3 style="font-size:16px; font-weight:700; color:#EF4444; display:flex; align-items:center; gap:8px;">
              💳 3. 농가 대출 및 부채 현황 (총 부채액: <span style="color:#EF4444;">${formatMoney(totalLoansAmount)}</span>)
            </h3>
            <button id="btn-view-add-loan" class="btn-upload" style="padding:6px 14px; font-size:12px; background:#EF4444;">+ 새 대출 항목 추가</button>
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
                ${loansState.length === 0 ? `
                  <tr><td colspan="7" style="text-align:center; color:#94A3B8; padding:16px;">등록된 대출이 없습니다. [+ 새 대출 항목 추가] 버튼을 누르세요.</td></tr>
                ` : loansState.map((loan, idx) => `
                  <tr>
                    <td>
                      <select class="v-loan-type" data-idx="${idx}" style="background:#0F172A; color:#FFF; border:1px solid rgba(255,255,255,0.15); padding:6px; border-radius:4px;">
                        <option value="원리금균등" ${(loan.대출조건 || loan.대출종류) === '원리금균등' ? 'selected' : ''}>원리금균등</option>
                        <option value="원금균등" ${(loan.대출조건 || loan.대출종류) === '원금균등' ? 'selected' : ''}>원금균등</option>
                        <option value="일시상환" ${(loan.대출조건 || loan.대출종류) === '일시상환' ? 'selected' : ''}>일시상환</option>
                      </select>
                    </td>
                    <td><input type="text" class="v-loan-name" data-idx="${idx}" value="${loan.은행명 || loan.name || ''}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:4px; width:100%;" /></td>
                    <td><input type="number" class="v-loan-amount" data-idx="${idx}" value="${loan.대출금액 || 0}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:4px; width:100%;" /></td>
                    <td><input type="number" step="0.1" class="v-loan-rate" data-idx="${idx}" value="${loan.이자율 ? (loan.이자율 > 1 ? loan.이자율 : loan.이자율 * 100) : 1.5}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:4px; width:60px;" />%</td>
                    <td><input type="number" class="v-loan-period" data-idx="${idx}" value="${loan.대출기간 || 10}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:4px; width:50px;" />년</td>
                    <td><input type="number" class="v-loan-grace" data-idx="${idx}" value="${loan.거치기간 || 0}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:4px; width:50px;" />년</td>
                    <td><button class="v-btn-del-loan" data-idx="${idx}" style="background:#EF4444; color:#FFF; border:none; padding:4px 10px; border-radius:4px; cursor:pointer;">삭제</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 4. 경영비 비목 예산 입력 -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:20px;">
          <h3 style="font-size:16px; font-weight:700; color:#F59E0B; margin-bottom:16px;">📋 4. 경영비 세부 비목별 예산 설정</h3>
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
                    <td><input type="number" class="v-cost-amount" data-idx="${idx}" value="${cost.cost}" style="background:#0F172A; border:1px solid rgba(255,255,255,0.15); color:#FFF; padding:6px; border-radius:4px; width:100%;" /></td>
                    <td style="color:#10B981; font-weight:700;">${cost.percent}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div style="text-align:center; margin-top:30px;">
          <button id="btn-save-farm-editor-bottom" class="btn-upload" style="background: linear-gradient(135deg, #10B981, #059669); padding: 16px 40px; font-size:16px; font-weight:800; border-radius:12px; cursor:pointer;">
            💾 입력한 농가 데이터 대시보드에 즉시 반영하기
          </button>
        </div>
      </div>
    `;

    // Event binding
    document.getElementById('btn-view-add-asset').addEventListener('click', () => {
      assetsState.push({ 연번: assetsState.length + 1, 목록: "신규 자산/장비", 구입가: 10000000, 내용년수: 10, 거래처: "자체구매" });
      updateView();
    });

    document.querySelectorAll('.v-btn-del-asset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        assetsState.splice(idx, 1);
        updateView();
      });
    });

    document.querySelectorAll('.v-asset-name').forEach(inp => {
      inp.addEventListener('change', (e) => { assetsState[Number(e.target.getAttribute('data-idx'))].목록 = e.target.value; });
    });
    document.querySelectorAll('.v-asset-price').forEach(inp => {
      inp.addEventListener('change', (e) => { assetsState[Number(e.target.getAttribute('data-idx'))].구입가 = Number(e.target.value); });
    });

    document.getElementById('btn-view-add-loan').addEventListener('click', () => {
      loansState.push({ 대출조건: "원리금균등", 은행명: "신규 농업대출", 대출금액: 50000000, 이자율: 0.02, 대출기간: 10, 거치기간: 2 });
      updateView();
    });

    document.querySelectorAll('.v-btn-del-loan').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.target.getAttribute('data-idx'));
        loansState.splice(idx, 1);
        updateView();
      });
    });

    document.querySelectorAll('.v-loan-name').forEach(inp => {
      inp.addEventListener('change', (e) => { loansState[Number(e.target.getAttribute('data-idx'))].은행명 = e.target.value; });
    });
    document.querySelectorAll('.v-loan-amount').forEach(inp => {
      inp.addEventListener('change', (e) => { loansState[Number(e.target.getAttribute('data-idx'))].대출금액 = Number(e.target.value); });
    });

    const triggerSave = () => {
      // Gather inputs
      const farmNameInp = document.getElementById('inp-view-farm-name');
      if (farmNameInp) modelState.cropName = farmNameInp.value;
      const areaInp = document.getElementById('inp-view-area-pyung');
      if (areaInp) {
        modelState.areaPyung = Number(areaInp.value);
        modelState.areaM2 = Math.round(Number(areaInp.value) * 3.305785);
      }
      const revInp = document.getElementById('inp-view-revenue');
      if (revInp) modelState.revenue = Number(revInp.value);
      const expInp = document.getElementById('inp-view-expenses');
      if (expInp) modelState.operatingExpenses = Number(expInp.value);
      modelState.income = modelState.revenue - modelState.operatingExpenses;

      if (onSave) onSave(modelState, assetsState, loansState);
    };

    document.getElementById('btn-save-farm-editor').addEventListener('click', triggerSave);
    document.getElementById('btn-save-farm-editor-bottom').addEventListener('click', triggerSave);
  }

  updateView();
}

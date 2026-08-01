/**
 * @file FinancialScheduleView.js
 * @description 자산 및 대출 상환 스케줄 동적 뷰 (컨설턴트 직접 편집 지원)
 */

export function renderFinancialSchedule(container, assetsList, loansList, onOpenEditor) {
  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(val)) + ' 원';

  const assets = assetsList || [];
  const loans = loansList || [];

  const totalAssetVal = assets.reduce((sum, a) => sum + (Number(a.구입가) || 0), 0);
  const totalLoanVal = loans.reduce((sum, l) => sum + (Number(l.대출금액) || 0), 0);

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; background:#1E293B; border:1px solid rgba(255,255,255,0.1); padding:16px 24px; border-radius:16px; margin-bottom:20px;">
      <div>
        <h2 style="font-size:18px; font-weight:800; color:#FFF;">🏛️ 농가 자산 & 부채 정밀 통합 관리 센터</h2>
        <p style="font-size:12px; color:#94A3B8; margin-top:2px;">농장 보유 자산과 대출 상환 스케줄을 직접 추가/수정/삭제하여 재무 상태를 분석합니다.</p>
      </div>
      <button id="btn-open-financial-editor" class="btn-upload" style="background:linear-gradient(135deg, #3B82F6, #1D4ED8);">
        📝 자산 & 대출 정보 편집하기
      </button>
    </div>

    <div class="panel-grid">
      <!-- 농가 보유 자산 목록 -->
      <div class="panel-card">
        <div class="panel-title">
          <span>🏗️ 보유 자산 & 감가상각 현황</span>
          <span class="badge">총 자산가액: ${formatMoney(totalAssetVal)}</span>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>연번</th>
                <th>자산/시설 목록명</th>
                <th>내용년수</th>
                <th class="num">구입가(원)</th>
                <th class="num">연 감가상각비</th>
                <th class="num">거래처</th>
              </tr>
            </thead>
            <tbody>
              ${assets.length === 0 ? `
                <tr><td colspan="6" style="text-align:center; color:#94A3B8; padding:20px;">등록된 자산이 없습니다. [자산 정보 편집하기] 버튼을 통해 자산을 추가해 주세요.</td></tr>
              ` : assets.map((asset, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td class="highlight">${asset.목록 || asset.name || '공사/시설'}</td>
                  <td>${asset.내용년수 || 10}년</td>
                  <td class="num">${formatMoney(asset.구입가 || 0)}</td>
                  <td class="num" style="color:var(--accent-gold);">${formatMoney(asset.연감가상각비 || Math.round((asset.구입가 || 0) / (asset.내용년수 || 10)))}</td>
                  <td class="num" style="color:#94A3B8;">${asset.거래처 || '자체시설'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 농가 대출 상환 스케줄 -->
      <div class="panel-card">
        <div class="panel-title">
          <span>💳 대출 상환 스케줄 & 부채 비율</span>
          <span class="badge" style="background:rgba(239, 68, 68, 0.15); color:var(--accent-rose); border-color:rgba(239, 68, 68, 0.3);">총 부채: ${formatMoney(totalLoanVal)}</span>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>상환방식</th>
                <th>은행/사업명</th>
                <th class="num">대출금액</th>
                <th class="num">금리</th>
                <th>상환기간</th>
              </tr>
            </thead>
            <tbody>
              ${loans.length === 0 ? `
                <tr><td colspan="5" style="text-align:center; color:#94A3B8; padding:20px;">등록된 대출이 없습니다. [자산 & 대출 정보 편집하기] 버튼을 눌러 대출을 추가해 주세요.</td></tr>
              ` : loans.map(loan => `
                <tr>
                  <td><span class="badge" style="background:rgba(59,130,246,0.15); color:var(--secondary); border:none;">${loan.대출조건 || loan.대출종류 || '원리금균등'}</span></td>
                  <td class="highlight">${loan.은행명 || loan.name || '농업 자금 대출'}</td>
                  <td class="num">${formatMoney(loan.대출금액 || 0)}</td>
                  <td class="num">${((loan.이자율 ? (loan.이자율 > 1 ? loan.이자율 : loan.이자율 * 100) : 1.5)).toFixed(1)}%</td>
                  <td>${loan.대출기간 || 10}년 (${loan.거치기간 || 0}년 거치)</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top:20px; height: 180px;" class="chart-wrapper">
          <canvas id="loanRepaymentChart"></canvas>
        </div>
      </div>
    </div>
  `;

  // Render Loan Repayment Schedule Chart
  const ctx = document.getElementById('loanRepaymentChart').getContext('2d');

  const startBalance = totalLoanVal || 624000000;
  const yearBalances = [
    startBalance,
    Math.round(startBalance * 0.95),
    Math.round(startBalance * 0.82),
    Math.round(startBalance * 0.68),
    Math.round(startBalance * 0.52),
    Math.round(startBalance * 0.35),
    Math.round(startBalance * 0.15)
  ];

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['2024년', '2025년', '2026년', '2027년', '2028년', '2029년', '2030년'],
      datasets: [
        {
          label: '연말 추정 부채잔액(원)',
          data: yearBalances,
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: '#94A3B8' }, grid: { display: false } },
        y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      },
      plugins: {
        legend: { labels: { color: '#94A3B8', font: { family: 'Pretendard' } } }
      }
    }
  });

  const editorBtn = document.getElementById('btn-open-financial-editor');
  if (editorBtn && onOpenEditor) {
    editorBtn.addEventListener('click', onOpenEditor);
  }
}

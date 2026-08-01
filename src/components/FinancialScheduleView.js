import { SAMPLE_ASSETS, SAMPLE_LOANS } from '../utils/excelEngine.js';

export function renderFinancialSchedule(container) {
  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(val)) + ' 원';

  container.innerHTML = `
    <div class="panel-grid">
      <div class="panel-card">
        <div class="panel-title">
          <span>🏛️ 농가 주요 투자자산 및 감가상각 현황</span>
          <span class="badge">총 ${SAMPLE_ASSETS.length}개 자산 등록</span>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>연번</th>
                <th>목록명</th>
                <th>내용년수</th>
                <th class="num">구입가(원)</th>
                <th class="num">연 감가상각비</th>
                <th class="num">잔존가액</th>
              </tr>
            </thead>
            <tbody>
              ${SAMPLE_ASSETS.map((asset, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td class="highlight">${asset.목록 || asset.name || '공사 및 시설'}</td>
                  <td>${asset.내용년수 || 20}년</td>
                  <td class="num">${formatMoney(asset.구입가 || 15000000)}</td>
                  <td class="num">${formatMoney(asset.연감가상각비 || (asset.구입가 / (asset.내용년수||20)))}</td>
                  <td class="num" style="color:var(--primary);">${formatMoney(asset.잔존가액 || (asset.구입가 * 0.8))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel-card">
        <div class="panel-title">
          <span>💳 대출 상환 계획 및 원리금 타임라인</span>
          <span class="badge" style="background:rgba(239, 68, 68, 0.15); color:var(--accent-rose); border-color:rgba(239, 68, 68, 0.3);">총 대출 624,000,000원</span>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>대출조건</th>
                <th>은행/사업명</th>
                <th class="num">대출금액</th>
                <th class="num">금리</th>
                <th>상환기간</th>
              </tr>
            </thead>
            <tbody>
              ${SAMPLE_LOANS.map(loan => `
                <tr>
                  <td><span class="badge" style="background:rgba(59,130,246,0.15); color:var(--secondary); border:none;">${loan.대출조건 || '원리금균등'}</span></td>
                  <td class="highlight">${loan.은행명 || loan.name || '청창농 사업비'}</td>
                  <td class="num">${formatMoney(loan.대출금액 || 314000000)}</td>
                  <td class="num">${((loan.이자율 || 0.015) * 100).toFixed(1)}%</td>
                  <td>${loan.대출기간 || 25}년 (${loan.거치기간 || 5}년 거치)</td>
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
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['2024년', '2025년', '2026년', '2027년', '2028년', '2029년', '2030년'],
      datasets: [
        {
          label: '연말 대출잔액(원)',
          data: [624000000, 624000000, 491777777, 425111111, 358444444, 306111619, 292427157],
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
}

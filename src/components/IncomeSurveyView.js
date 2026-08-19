export function renderIncomeSurvey(container, model) {
  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(val) + ' 원';

  container.innerHTML = `
    <div class="panel-grid">
      <div class="panel-card">
        <div class="panel-title">
          <span>📋 작목별 소득조사표 및 경영비 비목 분석</span>
          <span class="badge">${model.cropName} (기준 : ${model.areaPyung}평 / ${model.cycles}기작)</span>
        </div>
        
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>구분</th>
                <th>비목명</th>
                <th class="num">금액(원)</th>
                <th class="num">비중(%)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background: rgba(56, 189, 248, 0.15); border-bottom: 1px solid rgba(56, 189, 248, 0.3);">
                <td style="color: #38BDF8; font-weight:900;">총수입</td>
                <td style="color: #7DD3FC; font-weight:700;">주산물 가액 + 6차 산업 기타수익</td>
                <td class="num" style="color: #38BDF8; font-weight:900; font-family: Pretendard, monospace;">${formatMoney(model.revenue)}</td>
                <td class="num" style="color: #38BDF8; font-weight:900;">100.0%</td>
              </tr>
              ${model.costBreakdown.map(item => `
                <tr style="color: #E2E8F0;">
                  <td style="color: #94A3B8;">경영비</td>
                  <td style="color: #F1F5F9; font-weight: 600;">${item.name}</td>
                  <td class="num" style="color: #F1F5F9; font-family: Pretendard, monospace;">${formatMoney(item.cost)}</td>
                  <td class="num" style="color: #94A3B8;">${item.percent}%</td>
                </tr>
              `).join('')}
              <tr style="background: rgba(248, 113, 113, 0.15); border-top: 1px solid rgba(248, 113, 113, 0.4); border-bottom: 1px solid rgba(248, 113, 113, 0.4);">
                <td style="color: #F87171; font-weight:900;">경영비 합계</td>
                <td style="color: #FCA5A5; font-weight:700;">중간재비 + 시설상각비 + 기타비용</td>
                <td class="num" style="color: #F87171; font-weight:900; font-family: Pretendard, monospace;">${formatMoney(model.operatingExpenses)}</td>
                <td class="num" style="color: #F87171; font-weight:900;">${((model.operatingExpenses / model.revenue) * 100).toFixed(1)}%</td>
              </tr>
              <tr style="background: rgba(16, 185, 129, 0.2); font-size: 15px; border-top: 1px solid rgba(16, 185, 129, 0.5);">
                <td style="color: #34D399; font-weight:900;">농가소득</td>
                <td style="color: #A7F3D0; font-weight:800;">총수입 - 경영비</td>
                <td class="num" style="color: #34D399; font-weight:900; font-family: Pretendard, monospace;">${formatMoney(model.income)}</td>
                <td class="num" style="color: #34D399; font-weight:900;">${((model.income / model.revenue) * 100).toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel-card">
        <div class="panel-title">
          <span>📊 경영비 구성 비율</span>
        </div>
        <div class="chart-wrapper">
          <canvas id="costDoughnutChart"></canvas>
        </div>
      </div>
    </div>
  `;

  // Render Doughnut Chart using Chart.js
  const ctx = document.getElementById('costDoughnutChart').getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: model.costBreakdown.map(i => i.name),
      datasets: [{
        data: model.costBreakdown.map(i => i.cost),
        backgroundColor: [
          '#10B981', '#3B82F6', '#F59E0B', '#EF4444',
          '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94A3B8', font: { family: 'Pretendard', size: 11 } }
        }
      }
    }
  });
}

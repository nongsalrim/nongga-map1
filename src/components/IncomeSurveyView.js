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
              <tr style="background: rgba(16, 185, 129, 0.1);">
                <td class="highlight">총수입</td>
                <td class="highlight">주산물 가액 + 기타수익</td>
                <td class="num highlight">${formatMoney(model.revenue)}</td>
                <td class="num highlight">100.0%</td>
              </tr>
              ${model.costBreakdown.map(item => `
                <tr>
                  <td>경영비</td>
                  <td>${item.name}</td>
                  <td class="num">${formatMoney(item.cost)}</td>
                  <td class="num">${item.percent}%</td>
                </tr>
              `).join('')}
              <tr style="background: rgba(239, 68, 68, 0.1);">
                <td style="color: var(--accent-rose); font-weight:700;">경영비 합계</td>
                <td style="color: var(--accent-rose); font-weight:700;">중간재비 + 시설상각비 + 기타비용</td>
                <td class="num" style="color: var(--accent-rose); font-weight:700;">${formatMoney(model.operatingExpenses)}</td>
                <td class="num" style="color: var(--accent-rose); font-weight:700;">${((model.operatingExpenses / model.revenue) * 100).toFixed(1)}%</td>
              </tr>
              <tr style="background: rgba(245, 158, 11, 0.15); font-size: 15px;">
                <td style="color: var(--accent-gold); font-weight:800;">농가소득</td>
                <td style="color: var(--accent-gold); font-weight:800;">총수입 - 경영비</td>
                <td class="num" style="color: var(--accent-gold); font-weight:800;">${formatMoney(model.income)}</td>
                <td class="num" style="color: var(--accent-gold); font-weight:800;">${((model.income / model.revenue) * 100).toFixed(1)}%</td>
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

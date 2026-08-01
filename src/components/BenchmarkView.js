export function renderBenchmark(container, model) {
  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(val) + ' 원';
  const bm = model.benchmark;

  container.innerHTML = `
    <div class="panel-grid">
      <div class="panel-card">
        <div class="panel-title">
          <span>🏆 전국 농산물 소득조사 상·하위 20% 벤치마킹 분석</span>
          <span class="badge">RDA 농촌진흥청 DB 연동</span>
        </div>

        <div class="data-table-container" style="margin-bottom: 20px;">
          <table class="data-table">
            <thead>
              <tr>
                <th>구분</th>
                <th class="num" style="color: var(--primary);">상위 20% 농가 (A)</th>
                <th class="num" style="color: var(--secondary);">전국 평균 (B)</th>
                <th class="num" style="color: var(--accent-rose);">하위 20% 농가 (C)</th>
                <th class="num">격차 비율 (A/C)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="highlight">총수입</td>
                <td class="num highlight">${formatMoney(bm.top20.revenue)}</td>
                <td class="num">${formatMoney(bm.avg.revenue)}</td>
                <td class="num">${formatMoney(bm.bottom20.revenue)}</td>
                <td class="num highlight" style="color:var(--primary);">${(bm.top20.revenue / bm.bottom20.revenue).toFixed(2)}배</td>
              </tr>
              <tr>
                <td>수량 (Kg)</td>
                <td class="num">${new Intl.NumberFormat('ko-KR').format(bm.top20.yield)} kg</td>
                <td class="num">${new Intl.NumberFormat('ko-KR').format(bm.avg.yield)} kg</td>
                <td class="num">${new Intl.NumberFormat('ko-KR').format(bm.bottom20.yield)} kg</td>
                <td class="num">${(bm.top20.yield / bm.bottom20.yield).toFixed(2)}배</td>
              </tr>
              <tr>
                <td>경영비 (원)</td>
                <td class="num" style="color:var(--primary);">${formatMoney(bm.top20.expense)}</td>
                <td class="num">${formatMoney(bm.avg.expense)}</td>
                <td class="num" style="color:var(--accent-rose);">${formatMoney(bm.bottom20.expense)}</td>
                <td class="num">${(bm.top20.expense / bm.bottom20.expense).toFixed(2)}배</td>
              </tr>
              <tr style="background: rgba(16, 185, 129, 0.15); font-size: 15px;">
                <td style="font-weight:800; color:var(--primary);">농가소득 (수입-경영비)</td>
                <td class="num" style="font-weight:800; color:var(--primary);">${formatMoney(bm.top20.income)}</td>
                <td class="num" style="font-weight:800; color:var(--secondary);">${formatMoney(bm.avg.income)}</td>
                <td class="num" style="font-weight:800; color:var(--accent-rose);">${formatMoney(bm.bottom20.income)}</td>
                <td class="num" style="font-weight:800; color:var(--primary);">${(bm.top20.income / bm.bottom20.income).toFixed(2)}배</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 14px 18px; border-radius: var(--radius-md); font-size: 13px; color: var(--text-main);">
          💡 <strong>핵심 컨설팅 인사이트:</strong> 상위 20% 농가는 하위 20% 농가에 비해 <strong>총수입이 ${(bm.top20.revenue / bm.bottom20.revenue).toFixed(2)}배 높은 반면, 경영비는 오히려 ${(((bm.bottom20.expense - bm.top20.expense) / bm.bottom20.expense) * 100).toFixed(1)}% 절감</strong>하고 있습니다. (단가 관리 및 정밀 영농을 통한 원가 절감 필수)
        </div>
      </div>

      <div class="panel-card">
        <div class="panel-title">
          <span>📈 그룹별 소득 구조 비교 차트</span>
        </div>
        <div class="chart-wrapper">
          <canvas id="benchmarkBarChart"></canvas>
        </div>
      </div>
    </div>
  `;

  // Render Bar Chart
  const ctx = document.getElementById('benchmarkBarChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['상위 20%', '전국 평균', '하위 20%'],
      datasets: [
        {
          label: '총수입',
          data: [bm.top20.revenue, bm.avg.revenue, bm.bottom20.revenue],
          backgroundColor: '#10B981'
        },
        {
          label: '경영비',
          data: [bm.top20.expense, bm.avg.expense, bm.bottom20.expense],
          backgroundColor: '#EF4444'
        },
        {
          label: '농가소득',
          data: [bm.top20.income, bm.avg.income, bm.bottom20.income],
          backgroundColor: '#F59E0B'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      },
      plugins: {
        legend: { labels: { color: '#94A3B8', font: { family: 'Pretendard' } } }
      }
    }
  });
}

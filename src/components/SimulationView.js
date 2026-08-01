import { calculateSimulatedPlan } from '../utils/excelEngine.js';

export function renderSimulation(container, model) {
  let priceMult = 1.0;
  let areaMult = 1.0;

  function updateView() {
    const simData = calculateSimulatedPlan(model, priceMult, areaMult);
    const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(val) + ' 원';

    container.innerHTML = `
      <div class="panel-grid">
        <div class="panel-card">
          <div class="panel-title">
            <span>⚡ 실시간 경영 시뮬레이터 (What-If Analysis)</span>
            <span class="badge">시나리오 조정</span>
          </div>

          <div class="slider-group">
            <div class="slider-header">
              <span>판매 단가 변동률:</span>
              <strong style="color:var(--primary); font-size:16px;">${Math.round((priceMult - 1) * 100)}%</strong>
            </div>
            <input type="range" id="price-slider" class="slider-input" min="0.7" max="1.5" step="0.05" value="${priceMult}">
          </div>

          <div class="slider-group" style="margin-bottom:24px;">
            <div class="slider-header">
              <span>재배 면적 확장률:</span>
              <strong style="color:var(--secondary); font-size:16px;">${Math.round((areaMult - 1) * 100)}%</strong>
            </div>
            <input type="range" id="area-slider" class="slider-input" min="0.5" max="2.0" step="0.1" value="${areaMult}">
          </div>

          <div style="background: rgba(15, 23, 42, 0.7); border:1px solid var(--border-color); padding: 18px; border-radius: var(--radius-md); display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            <div>
              <div style="font-size:12px; color:var(--text-muted);">추정 총수입</div>
              <div style="font-size:20px; font-weight:800; color:#FFF;">${formatMoney(simData.revenue)}</div>
            </div>
            <div>
              <div style="font-size:12px; color:var(--text-muted);">추정 경영비</div>
              <div style="font-size:20px; font-weight:800; color:var(--accent-rose);">${formatMoney(simData.expenses)}</div>
            </div>
            <div>
              <div style="font-size:12px; color:var(--text-muted);">추정 소득</div>
              <div style="font-size:20px; font-weight:800; color:var(--primary);">${formatMoney(simData.income)}</div>
            </div>
            <div>
              <div style="font-size:12px; color:var(--text-muted);">손익분기점(BEP) 비율</div>
              <div style="font-size:20px; font-weight:800; color:var(--accent-gold);">${simData.bepRate}%</div>
            </div>
          </div>
        </div>

        <div class="panel-card">
          <div class="panel-title">
            <span>📅 6개년 장기 경영실적 추정 차트 (2025~2030)</span>
          </div>
          <div class="chart-wrapper">
            <canvas id="sim6YearChart"></canvas>
          </div>
        </div>
      </div>

      <div class="panel-card" style="margin-top:24px;">
        <div class="panel-title">
          <span>📋 6개년 상세 사업계획서 스케줄</span>
        </div>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>연도</th>
                <th class="num">추정 총수입</th>
                <th class="num">추정 경영비</th>
                <th class="num">추정 농가소득</th>
                <th class="num">손익분기율</th>
              </tr>
            </thead>
            <tbody>
              ${simData.yearProjections.map(yp => `
                <tr>
                  <td class="highlight">${yp.year}년차</td>
                  <td class="num">${formatMoney(yp.revenue)}</td>
                  <td class="num" style="color:var(--accent-rose);">${formatMoney(yp.expense)}</td>
                  <td class="num" style="color:var(--primary); font-weight:700;">${formatMoney(yp.income)}</td>
                  <td class="num">${Math.round((yp.expense / yp.revenue) * 100)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Add Slider Events
    document.getElementById('price-slider').addEventListener('input', (e) => {
      priceMult = parseFloat(e.target.value);
      updateView();
    });

    document.getElementById('area-slider').addEventListener('input', (e) => {
      areaMult = parseFloat(e.target.value);
      updateView();
    });

    // Render 6-Year Chart
    const ctx = document.getElementById('sim6YearChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: simData.yearProjections.map(y => y.year + '년'),
        datasets: [
          {
            label: '총수입(원)',
            data: simData.yearProjections.map(y => y.revenue),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true
          },
          {
            label: '경영비(원)',
            data: simData.yearProjections.map(y => y.expense),
            borderColor: '#EF4444',
            backgroundColor: 'transparent'
          },
          {
            label: '농가소득(원)',
            data: simData.yearProjections.map(y => y.income),
            borderColor: '#F59E0B',
            backgroundColor: 'transparent'
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

  updateView();
}

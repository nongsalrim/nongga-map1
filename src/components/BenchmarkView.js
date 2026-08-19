/**
 * @file BenchmarkView.js
 * @description 전국 농산물 소득조사 상·하위 20% 벤치마킹 분석 뷰 (단가 원/kg 항목 포함 20년차 경영컨설턴트 진단)
 */

export function renderBenchmark(container, model) {
  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(val || 0)) + ' 원';
  const formatComma = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(val || 0));
  const bm = model.benchmark || {
    top20: { revenue: 120000000, yield: 15000, price: 8000, expense: 45000000, income: 75000000 },
    avg: { revenue: 100000000, yield: 13000, price: 7692, expense: 50000000, income: 50000000 },
    bottom20: { revenue: 80000000, yield: 11000, price: 7272, expense: 55000000, income: 25000000 }
  };

  const top20Price = bm.top20.price || (bm.top20.yield > 0 ? Math.round(bm.top20.revenue / bm.top20.yield) : 0);
  const avgPrice = bm.avg.price || (bm.avg.yield > 0 ? Math.round(bm.avg.revenue / bm.avg.yield) : 0);
  const bottom20Price = bm.bottom20.price || (bm.bottom20.yield > 0 ? Math.round(bm.bottom20.revenue / bm.bottom20.yield) : 0);
  
  const priceRatio = bottom20Price > 0 ? (top20Price / bottom20Price).toFixed(2) : '1.00';
  const priceDiffPct = bottom20Price > 0 ? (((top20Price - bottom20Price) / bottom20Price) * 100).toFixed(1) : 0;

  const revRatio = bm.bottom20.revenue > 0 ? (bm.top20.revenue / bm.bottom20.revenue).toFixed(2) : '1.00';
  const yieldRatio = bm.bottom20.yield > 0 ? (bm.top20.yield / bm.bottom20.yield).toFixed(2) : '1.00';
  const expRatio = bm.bottom20.expense > 0 ? (bm.top20.expense / bm.bottom20.expense).toFixed(2) : '1.00';
  const incRatio = bm.bottom20.income > 0 ? (bm.top20.income / bm.bottom20.income).toFixed(2) : '1.00';
  const expSavePct = bm.bottom20.expense > 0 ? (((bm.bottom20.expense - bm.top20.expense) / bm.bottom20.expense) * 100).toFixed(1) : 0;

  container.innerHTML = `
    <div class="panel-grid">
      <div class="panel-card">
        <div class="panel-title" style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:18px; font-weight:900; color:#FFF; display:flex; align-items:center; gap:8px;">
            🏆 전국 농산물 소득조사 상·하위 20% 벤치마킹 분석 (${model.cropName || '시설딸기'})
          </span>
          <span class="badge" style="background:rgba(16,185,129,0.2); color:#34D399; border-color:rgba(16,185,129,0.4);">RDA 농촌진흥청 DB 연동</span>
        </div>

        <div class="data-table-container" style="margin-bottom: 20px;">
          <table class="data-table">
            <thead>
              <tr style="background: rgba(59, 130, 246, 0.2); font-size:14px;">
                <th>구분</th>
                <th class="num" style="color: #34D399; font-weight:800;">상위 20% 농가 (A)</th>
                <th class="num" style="color: #60A5FA; font-weight:800;">전국 평균 (B)</th>
                <th class="num" style="color: #F87171; font-weight:800;">하위 20% 농가 (C)</th>
                <th class="num" style="color: #FBBF24; font-weight:800;">격차 비율 (A/C)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-weight:800; color:#38BDF8;">총수입 (원)</td>
                <td class="num" style="font-weight:800; color:#38BDF8; font-family: Pretendard, monospace;">${formatMoney(bm.top20.revenue)}</td>
                <td class="num" style="font-family: Pretendard, monospace;">${formatMoney(bm.avg.revenue)}</td>
                <td class="num" style="font-family: Pretendard, monospace;">${formatMoney(bm.bottom20.revenue)}</td>
                <td class="num" style="font-weight:800; color:#38BDF8;">${revRatio}배</td>
              </tr>
              <tr>
                <td style="font-weight:700;">수량 (Kg)</td>
                <td class="num" style="font-family: Pretendard, monospace;">${formatComma(bm.top20.yield)} kg</td>
                <td class="num" style="font-family: Pretendard, monospace;">${formatComma(bm.avg.yield)} kg</td>
                <td class="num" style="font-family: Pretendard, monospace;">${formatComma(bm.bottom20.yield)} kg</td>
                <td class="num" style="font-weight:700;">${yieldRatio}배</td>
              </tr>
              <!-- 💰 신규 단가(원/kg) 항목 추가 -->
              <tr style="background: rgba(251, 191, 36, 0.12); border-top: 1px dashed rgba(251, 191, 36, 0.4); border-bottom: 1px dashed rgba(251, 191, 36, 0.4);">
                <td style="font-weight:900; color:#FBBF24; font-size:14px; display:flex; align-items:center; gap:6px;">
                  💰 수취 단가 (원/kg)
                </td>
                <td class="num" style="font-weight:900; color:#FBBF24; font-size:15px; font-family: Pretendard, monospace;">
                  ${formatComma(top20Price)} 원/kg
                </td>
                <td class="num" style="font-weight:800; color:#FCD34D; font-family: Pretendard, monospace;">
                  ${formatComma(avgPrice)} 원/kg
                </td>
                <td class="num" style="font-weight:800; color:#FDE68A; font-family: Pretendard, monospace;">
                  ${formatComma(bottom20Price)} 원/kg
                </td>
                <td class="num" style="font-weight:900; color:#FBBF24; font-size:15px;">
                  ${priceRatio}배
                </td>
              </tr>
              <tr>
                <td style="font-weight:700; color:#F87171;">경영비 (원)</td>
                <td class="num" style="font-weight:700; color:#34D399; font-family: Pretendard, monospace;">${formatMoney(bm.top20.expense)}</td>
                <td class="num" style="font-family: Pretendard, monospace;">${formatMoney(bm.avg.expense)}</td>
                <td class="num" style="color:#F87171; font-family: Pretendard, monospace;">${formatMoney(bm.bottom20.expense)}</td>
                <td class="num" style="font-weight:700; color:#F87171;">${expRatio}배</td>
              </tr>
              <tr style="background: rgba(16, 185, 129, 0.18); font-size: 15px;">
                <td style="font-weight:900; color:#10B981;">농가소득 (수입-경영비)</td>
                <td class="num" style="font-weight:900; color:#10B981; font-family: Pretendard, monospace;">${formatMoney(bm.top20.income)}</td>
                <td class="num" style="font-weight:800; color:#60A5FA; font-family: Pretendard, monospace;">${formatMoney(bm.avg.income)}</td>
                <td class="num" style="font-weight:800; color:#F87171; font-family: Pretendard, monospace;">${formatMoney(bm.bottom20.income)}</td>
                <td class="num" style="font-weight:900; color:#10B981;">${incRatio}배</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 16px 20px; border-radius: 12px; font-size: 13.5px; color: #FFF; line-height: 1.6;">
          💡 <strong>20년 차 베테랑 경영컨설턴트 핵심 인사이트:</strong><br/>
          상위 20% 선도 농가는 하위 20% 농가 대비 <b>총수입이 ${revRatio}배 (${formatComma(bm.top20.revenue - bm.bottom20.revenue)}원 추가)</b> 높은 반면, 
          <b>kg당 수취 단가는 +${priceDiffPct}% (${formatComma(top20Price - bottom20Price)}원/kg 프리미엄) 높고</b>, 
          <b>경영비는 오히려 ${expSavePct}% 절감</b>하고 있습니다.<br/>
          <span style="color:#A7F3D0; font-weight:700;">➔ 핵심 결론: 단순 생산량 확대를 넘어 고품질 출하를 통한 수취단가 관리(+${priceDiffPct}%) 및 정밀 비목 제어를 통한 원가절감(-${expSavePct}%)의 다각화 전략이 필수적입니다.</span>
        </div>
      </div>

      <div class="panel-card">
        <div class="panel-title">
          <span>📈 그룹별 경영 실적 & 수취단가 벤치마킹 차트</span>
        </div>
        <div class="chart-wrapper" style="height:320px; position:relative;">
          <canvas id="benchmarkBarChart"></canvas>
        </div>
      </div>
    </div>
  `;

  // Render Bar Chart with standard canvas check
  const canvas = document.getElementById('benchmarkBarChart');
  if (canvas && typeof window !== 'undefined' && window.Chart) {
    try {
      const ctx = canvas.getContext('2d');
      new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['상위 20% 농가 (A)', '전국 평균 (B)', '하위 20% 농가 (C)'],
          datasets: [
            {
              label: '총수입 (원)',
              data: [bm.top20.revenue, bm.avg.revenue, bm.bottom20.revenue],
              backgroundColor: '#38BDF8'
            },
            {
              label: '경영비 (원)',
              data: [bm.top20.expense, bm.avg.expense, bm.bottom20.expense],
              backgroundColor: '#F87171'
            },
            {
              label: '농가소득 (원)',
              data: [bm.top20.income, bm.avg.income, bm.bottom20.income],
              backgroundColor: '#10B981'
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
            legend: { labels: { color: '#CBD5E1', font: { family: 'Pretendard', weight: 'bold' } } }
          }
        }
      });
    } catch (err) {
      console.warn('Benchmark bar chart error:', err);
    }
  }
}

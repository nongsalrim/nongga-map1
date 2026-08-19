/**
 * @file BenchmarkView.js
 * @description 전국 농산물 소득조사 상·하위 20% 벤치마킹 분석 뷰 (분석농가 현재 포지션 포함 20년차 경영컨설턴트 진단)
 */

export function renderBenchmark(container, model) {
  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(val || 0)) + ' 원';
  const formatComma = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(val || 0));

  const bm = model.benchmark || {
    top20: { revenue: 151875000, yield: 16200, price: 9900, expense: 50220000, income: 101655000 },
    avg: { revenue: 121500000, yield: 13500, price: 9000, expense: 55800000, income: 65700000 },
    bottom20: { revenue: 87480000, yield: 10125, price: 7920, expense: 64170000, income: 23310000 }
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

  // 분석농가 현재 실적 수치 (내 농가 포지션 계산)
  const myRevenue = model.revenue || 107440000;
  const myExpense = model.operatingExpenses || 95697210;
  const myIncome = model.income !== undefined ? model.income : (myRevenue - myExpense);
  const myYield = model.yieldKg || model.yield || (model.areaPyung ? Math.round(model.areaPyung * 13.5) : 13500);
  const myPrice = model.unitPrice || model.pricePerKg || (myYield > 0 ? Math.round(myRevenue / myYield) : 8000);

  const getDiffStr = (myVal, avgVal, isExpense = false) => {
    if (!avgVal) return '-';
    const pct = (((myVal - avgVal) / avgVal) * 100).toFixed(1);
    if (isExpense) {
      if (pct < 0) return `<span style="color:#34D399; font-weight:800;">평균 대비 ${Math.abs(pct)}% 절감 🌟</span>`;
      return `<span style="color:#F87171; font-weight:800;">평균 대비 +${pct}% 과다 ⚠️</span>`;
    } else {
      if (pct >= 0) return `<span style="color:#34D399; font-weight:800;">평균 대비 +${pct}% 초과 🚀</span>`;
      return `<span style="color:#F87171; font-weight:800;">평균 대비 ${pct}% 미달 ⚠️</span>`;
    }
  };

  const getPosBadge = (myVal, topVal, avgVal, isExpense = false) => {
    if (isExpense) {
      if (myVal <= topVal) return `<span class="badge" style="background:rgba(16,185,129,0.25); color:#34D399; border-color:#10B981;">🥇 최우수 (상위 20%)</span>`;
      if (myVal <= avgVal) return `<span class="badge" style="background:rgba(59,130,246,0.25); color:#60A5FA; border-color:#3B82F6;">🥈 우수 (평균 이하)</span>`;
      return `<span class="badge" style="background:rgba(239,68,68,0.25); color:#FCA5A5; border-color:#EF4444;">⚠️ 원가절감 필요</span>`;
    } else {
      if (myVal >= topVal) return `<span class="badge" style="background:rgba(16,185,129,0.25); color:#34D399; border-color:#10B981;">🥇 상위 20% 이내</span>`;
      if (myVal >= avgVal) return `<span class="badge" style="background:rgba(59,130,246,0.25); color:#60A5FA; border-color:#3B82F6;">🥈 평균 이상 (중상위)</span>`;
      return `<span class="badge" style="background:rgba(245,158,11,0.25); color:#FBBF24; border-color:#F59E0B;">🥉 평균 이하 (개선 필요)</span>`;
    }
  };

  container.innerHTML = `
    <div class="panel-grid">
      <div class="panel-card">
        <div class="panel-title" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <span style="font-size:18px; font-weight:900; color:#FFF; display:flex; align-items:center; gap:8px;">
            🏆 전국 농산물 소득조사 벤치마킹 & 분석농가 포지션 진단 (${model.cropName || '시설딸기(수경)'})
          </span>
          <span class="badge" style="background:rgba(16,185,129,0.2); color:#34D399; border-color:rgba(16,185,129,0.4);">RDA 농촌진흥청 DB 연동</span>
        </div>

        <div class="data-table-container" style="margin-bottom: 20px;">
          <table class="data-table" style="font-size: 13px;">
            <thead>
              <tr style="background: rgba(59, 130, 246, 0.2); font-size:13.5px;">
                <th style="width: 14%;">구분</th>
                <th class="num" style="color: #38BDF8; font-weight:900; background: rgba(56, 189, 248, 0.12); border-left: 2px solid #38BDF8; border-right: 2px solid #38BDF8;">
                  🎯 내 농가 (분석대상)
                </th>
                <th class="num" style="color: #34D399; font-weight:800;">상위 20% 농가 (A)</th>
                <th class="num" style="color: #60A5FA; font-weight:800;">전국 평균 (B)</th>
                <th class="num" style="color: #F87171; font-weight:800;">하위 20% 농가 (C)</th>
                <th style="text-align:center; color: #FBBF24; font-weight:800; width: 22%;">📊 내 농가 포지션 진단</th>
              </tr>
            </thead>
            <tbody>
              <!-- 총수입 -->
              <tr>
                <td style="font-weight:900; color:#38BDF8;">총수입 (원)</td>
                <td class="num" style="font-weight:900; color:#38BDF8; background: rgba(56, 189, 248, 0.08); border-left: 2px solid #38BDF8; border-right: 2px solid #38BDF8; font-family: Pretendard, monospace; font-size:14.5px;">
                  ${formatMoney(myRevenue)}
                </td>
                <td class="num" style="font-weight:800; color:#34D399; font-family: Pretendard, monospace;">${formatMoney(bm.top20.revenue)}</td>
                <td class="num" style="font-family: Pretendard, monospace;">${formatMoney(bm.avg.revenue)}</td>
                <td class="num" style="font-family: Pretendard, monospace;">${formatMoney(bm.bottom20.revenue)}</td>
                <td style="text-align:center;">
                  ${getPosBadge(myRevenue, bm.top20.revenue, bm.avg.revenue)}<br/>
                  <small>${getDiffStr(myRevenue, bm.avg.revenue)}</small>
                </td>
              </tr>

              <!-- 수량 -->
              <tr>
                <td style="font-weight:700;">수량 (Kg)</td>
                <td class="num" style="font-weight:900; color:#FFF; background: rgba(56, 189, 248, 0.08); border-left: 2px solid #38BDF8; border-right: 2px solid #38BDF8; font-family: Pretendard, monospace;">
                  ${formatComma(myYield)} kg
                </td>
                <td class="num" style="font-family: Pretendard, monospace;">${formatComma(bm.top20.yield)} kg</td>
                <td class="num" style="font-family: Pretendard, monospace;">${formatComma(bm.avg.yield)} kg</td>
                <td class="num" style="font-family: Pretendard, monospace;">${formatComma(bm.bottom20.yield)} kg</td>
                <td style="text-align:center;">
                  ${getPosBadge(myYield, bm.top20.yield, bm.avg.yield)}<br/>
                  <small>${getDiffStr(myYield, bm.avg.yield)}</small>
                </td>
              </tr>

              <!-- 수취 단가 -->
              <tr style="background: rgba(251, 191, 36, 0.12); border-top: 1px dashed rgba(251, 191, 36, 0.4); border-bottom: 1px dashed rgba(251, 191, 36, 0.4);">
                <td style="font-weight:900; color:#FBBF24; font-size:13.5px; display:flex; align-items:center; gap:4px;">
                  💰 수취 단가 (원/kg)
                </td>
                <td class="num" style="font-weight:900; color:#FBBF24; font-size:15px; background: rgba(251, 191, 36, 0.2); border-left: 2px solid #FBBF24; border-right: 2px solid #FBBF24; font-family: Pretendard, monospace;">
                  ${formatComma(myPrice)} 원/kg
                </td>
                <td class="num" style="font-weight:900; color:#FBBF24; font-size:14px; font-family: Pretendard, monospace;">
                  ${formatComma(top20Price)} 원/kg
                </td>
                <td class="num" style="font-weight:800; color:#FCD34D; font-family: Pretendard, monospace;">
                  ${formatComma(avgPrice)} 원/kg
                </td>
                <td class="num" style="font-weight:800; color:#FDE68A; font-family: Pretendard, monospace;">
                  ${formatComma(bottom20Price)} 원/kg
                </td>
                <td style="text-align:center;">
                  ${getPosBadge(myPrice, top20Price, avgPrice)}<br/>
                  <small>${getDiffStr(myPrice, avgPrice)}</small>
                </td>
              </tr>

              <!-- 경영비 -->
              <tr>
                <td style="font-weight:700; color:#F87171;">경영비 (원)</td>
                <td class="num" style="font-weight:900; color:#F87171; background: rgba(248, 113, 113, 0.08); border-left: 2px solid #F87171; border-right: 2px solid #F87171; font-family: Pretendard, monospace; font-size:14.5px;">
                  ${formatMoney(myExpense)}
                </td>
                <td class="num" style="font-weight:700; color:#34D399; font-family: Pretendard, monospace;">${formatMoney(bm.top20.expense)}</td>
                <td class="num" style="font-family: Pretendard, monospace;">${formatMoney(bm.avg.expense)}</td>
                <td class="num" style="color:#F87171; font-family: Pretendard, monospace;">${formatMoney(bm.bottom20.expense)}</td>
                <td style="text-align:center;">
                  ${getPosBadge(myExpense, bm.top20.expense, bm.avg.expense, true)}<br/>
                  <small>${getDiffStr(myExpense, bm.avg.expense, true)}</small>
                </td>
              </tr>

              <!-- 농가소득 -->
              <tr style="background: rgba(16, 185, 129, 0.18); font-size: 14.5px;">
                <td style="font-weight:900; color:#10B981;">농가소득 (수입-경영비)</td>
                <td class="num" style="font-weight:900; color:#34D399; background: rgba(16, 185, 129, 0.25); border-left: 2px solid #34D399; border-right: 2px solid #34D399; font-family: Pretendard, monospace; font-size:15px;">
                  ${formatMoney(myIncome)}
                </td>
                <td class="num" style="font-weight:900; color:#10B981; font-family: Pretendard, monospace;">${formatMoney(bm.top20.income)}</td>
                <td class="num" style="font-weight:800; color:#60A5FA; font-family: Pretendard, monospace;">${formatMoney(bm.avg.income)}</td>
                <td class="num" style="font-weight:800; color:#F87171; font-family: Pretendard, monospace;">${formatMoney(bm.bottom20.income)}</td>
                <td style="text-align:center;">
                  ${getPosBadge(myIncome, bm.top20.income, bm.avg.income)}<br/>
                  <small>${getDiffStr(myIncome, bm.avg.income)}</small>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 18px 22px; border-radius: 12px; font-size: 13.5px; color: #FFF; line-height: 1.6;">
          💡 <strong>20년 차 베테랑 경영컨설턴트 1:1 맞춤 포지션 종합 진단:</strong><br/>
          <div style="margin-top:6px;">
            • <b>내 농가 현황:</b> 총수입 <b>${formatMoney(myRevenue)}</b>, 경영비 <b>${formatMoney(myExpense)}</b>, 추정 농가소득 <b>${formatMoney(myIncome)}</b> (수취단가: <b>${formatComma(myPrice)} 원/kg</b>)<br/>
            • <b>경영 포지션:</b> 농가소득 기준 ${myIncome >= bm.top20.income ? '<b style="color:#34D399;">전국 상위 20% 최상위 그룹</b>에 속해 있습니다.' : (myIncome >= bm.avg.income ? '<b style="color:#60A5FA;">전국 평균 이상(중상위) 그룹</b>에 위치하고 있습니다.' : '<b style="color:#FBBF24;">전국 평균 이하 그룹</b>으로 경영비 절감 및 수취단가 개선이 시급합니다.')}<br/>
            <span style="color:#A7F3D0; font-weight:700;">➔ 처방전: 상위 20% 선도 농가(소득 ${formatMoney(bm.top20.income)}) 도달을 위해 수취단가 +${priceDiffPct}% 프리미엄 확보와 경영비 ${expSavePct}% 절감 목표를 병행하십시오.</span>
          </div>
        </div>
      </div>

      <!-- 막대 차트 (내 농가 포함 4개 그룹 비교) -->
      <div class="panel-card">
        <div class="panel-title">
          <span>📈 내 농가 vs 전국 벤치마킹 그룹 실적 비교 차트</span>
        </div>
        <div class="chart-wrapper" style="height:320px; position:relative;">
          <canvas id="benchmarkBarChart"></canvas>
        </div>
      </div>
    </div>
  `;

  // Render Bar Chart with analysis farm included as the 1st bar
  const canvas = document.getElementById('benchmarkBarChart');
  if (canvas && typeof window !== 'undefined' && window.Chart) {
    try {
      const ctx = canvas.getContext('2d');
      new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['🎯 내 농가 (분석대상)', '상위 20% 농가 (A)', '전국 평균 (B)', '하위 20% 농가 (C)'],
          datasets: [
            {
              label: '총수입 (원)',
              data: [myRevenue, bm.top20.revenue, bm.avg.revenue, bm.bottom20.revenue],
              backgroundColor: ['#38BDF8', 'rgba(56,189,248,0.5)', 'rgba(56,189,248,0.3)', 'rgba(56,189,248,0.2)']
            },
            {
              label: '경영비 (원)',
              data: [myExpense, bm.top20.expense, bm.avg.expense, bm.bottom20.expense],
              backgroundColor: ['#F87171', 'rgba(248,113,113,0.5)', 'rgba(248,113,113,0.3)', 'rgba(248,113,113,0.2)']
            },
            {
              label: '농가소득 (원)',
              data: [myIncome, bm.top20.income, bm.avg.income, bm.bottom20.income],
              backgroundColor: ['#34D399', 'rgba(52,211,153,0.5)', 'rgba(52,211,153,0.3)', 'rgba(52,211,153,0.2)']
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: '#94A3B8', font: { family: 'Pretendard', weight: 'bold' } }, grid: { color: 'rgba(255,255,255,0.05)' } },
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

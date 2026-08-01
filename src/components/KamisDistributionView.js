/**
 * @file KamisDistributionView.js
 * @description KAMIS 유통시세 및 소득조사표 연동 진단 뷰 컴포넌트 (안전한 예외 처리 적용)
 */

import { analyzeKamisAlignment, exportExcelReport } from '../utils/kamisEngine.js';

export function renderKamisDistribution(container, model, openReportModal) {
  const analysis = analyzeKamisAlignment(model);
  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(val || 0)) + ' 원';

  const kamisRef = analysis.kamisRef || {};
  const monthlyTrends = kamisRef.monthlyPriceTrends || [];

  container.innerHTML = `
    <div class="panel-grid">
      <!-- KAMIS 연동 단가 및 유통구조 진단 -->
      <div class="panel-card">
        <div class="panel-title">
          <span>🚚 KAMIS 유통시세 & 농가 수취 단가 연동 진단</span>
          <span class="badge" style="background: rgba(59, 130, 246, 0.2); color: #60A5FA; border-color: #3B82F6;">진단등급: ${analysis.grade}</span>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 20px;">
          <div style="background: rgba(15, 23, 42, 0.7); border:1px solid var(--border-color); padding: 14px; border-radius: var(--radius-md);">
            <div style="font-size:12px; color:var(--text-muted);">농가 추정 출하단가</div>
            <div style="font-size:20px; font-weight:800; color:var(--primary);">${formatMoney(analysis.farmPricePerKg)} /kg</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">${analysis.priceAdvice}</div>
          </div>

          <div style="background: rgba(15, 23, 42, 0.7); border:1px solid var(--border-color); padding: 14px; border-radius: var(--radius-md);">
            <div style="font-size:12px; color:var(--text-muted);">KAMIS 최근 도매시세</div>
            <div style="font-size:20px; font-weight:800; color:#FFF;">${formatMoney(kamisRef.recentWholesalePrice || analysis.farmPricePerKg)} /kg</div>
            <div style="font-size:11px; color:var(--secondary); margin-top:4px;">5년 평균: ${formatMoney(kamisRef.avg5YearPrice || analysis.farmPricePerKg)}/kg (${analysis.priceVsAvgRatio}%)</div>
          </div>

          <div style="background: rgba(15, 23, 42, 0.7); border:1px solid var(--border-color); padding: 14px; border-radius: var(--radius-md);">
            <div style="font-size:12px; color:var(--text-muted);">직거래 20% 확대 시 소득</div>
            <div style="font-size:20px; font-weight:800; color:var(--accent-gold);">${formatMoney(analysis.expectedIncomeAfterDirect)}</div>
            <div style="font-size:11px; color:var(--accent-gold); margin-top:4px;">+${formatMoney(analysis.directSalesGain)} 증가 예상</div>
          </div>
        </div>

        <div style="margin-top:16px;">
          <div style="font-size:14px; font-weight:700; margin-bottom:10px;">📈 KAMIS 품목별 월별 가격 동향 (최근 시세)</div>
          <div class="chart-wrapper" style="height: 250px; position: relative;">
            <canvas id="kamisPriceChart"></canvas>
          </div>
        </div>
      </div>

      <!-- 소득조사표 비목별 갭 분석 -->
      <div class="panel-card">
        <div class="panel-title">
          <span>📋 소득조사표 표준 대비 비목별 갭(Gap)</span>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>비목명</th>
                <th class="num">농가비중</th>
                <th class="num">표준비중</th>
                <th>진단결과</th>
              </tr>
            </thead>
            <tbody>
              ${analysis.costAnalysis.map(c => `
                <tr>
                  <td style="font-weight:600;">${c.name}</td>
                  <td class="num">${c.farmPercent}%</td>
                  <td class="num" style="color:var(--text-muted);">${c.stdPercent}%</td>
                  <td>
                    <span class="badge" style="
                      background: ${c.diffPercent > 3 ? 'rgba(239,68,68,0.2)' : c.diffPercent < -3 ? 'rgba(16,185,129,0.2)' : 'rgba(148,163,184,0.2)'};
                      color: ${c.diffPercent > 3 ? '#F87171' : c.diffPercent < -3 ? '#34D399' : '#CBD5E1'};
                      border-color: transparent;
                    ">
                      ${c.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top:20px; text-align:center; display:flex; gap:10px; justify-content:center;">
          <button id="btn-export-excel" class="btn-upload" style="background:#059669; border:none; cursor:pointer;">
            📊 엑셀 진단서 다운로드
          </button>
          <button id="btn-open-pdf-modal" class="btn-upload" style="background:linear-gradient(135deg, #3B82F6, #1D4ED8); border:none; cursor:pointer;">
            📄 PDF 종합진단 보고서 출력
          </button>
        </div>
      </div>
    </div>
  `;

  // Render KAMIS Monthly Price Line Chart Safely
  const canvas = document.getElementById('kamisPriceChart');
  if (canvas && typeof window !== 'undefined' && window.Chart) {
    try {
      const ctx = canvas.getContext('2d');
      new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: monthlyTrends.map(m => m.month),
          datasets: [{
            label: `${analysis.cropName} KAMIS 도매가격 (원/kg)`,
            data: monthlyTrends.map(m => m.price),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            fill: true,
            tension: 0.3
          }]
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
    } catch (err) {
      console.warn('Chart rendering issue:', err);
    }
  }

  // Export Excel Event Listener
  const btnExport = document.getElementById('btn-export-excel');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      exportExcelReport(model, analysis);
    });
  }

  // Open PDF Modal Event Listener
  const btnPdf = document.getElementById('btn-open-pdf-modal');
  if (btnPdf) {
    btnPdf.addEventListener('click', () => {
      openReportModal(model, analysis);
    });
  }
}

/**
 * @file KamisDistributionView.js
 * @description KAMIS 유통시세 및 11개년 연도별 kg당 유통단계별 가격 추이 진단 뷰 (20년차 경영컨설턴트 유통 마진 레포트 내장)
 */

import { analyzeKamisAlignment, exportExcelReport, get11YearDistributionData } from '../utils/kamisEngine.js';

export function renderKamisDistribution(container, model, openReportModal) {
  const analysis = analyzeKamisAlignment(model);
  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(val || 0)) + ' 원';

  const trendData = analysis.trend11Y || get11YearDistributionData(model.cropName, analysis.farmPricePerKg);
  const rows = trendData.rows || [];
  const avg10 = trendData.avg10Years || {};

  container.innerHTML = `
    <div style="max-width: 1300px; margin: 0 auto; padding-bottom: 40px;">
      
      <!-- 1. 대형 유통 현황 메인 패널 -->
      <div class="panel-card" style="margin-bottom: 24px;">
        <div class="panel-title" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <span class="badge" style="background: rgba(59, 130, 246, 0.2); color: #60A5FA; border: 1px solid rgba(59,130,246,0.4); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700;">
              KAMIS DISTRIBUTION PRICE ANALYSIS
            </span>
            <h2 style="font-size: 20px; font-weight: 900; color: #FFF; margin-top: 4px; display:flex; align-items:center; gap:8px;">
              🚚 11개년 ${analysis.cropName} 연도별 kg당 유통 단계별 가격 추이 & 20년 차 컨설턴트 진단
            </h2>
          </div>

          <div style="display:flex; gap:10px; align-items:center;">
            <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34D399; border-color: rgba(16,185,129,0.3); font-size:13px; font-weight:800;">
              진단등급: ${analysis.grade}
            </span>
            <button id="btn-export-excel" style="background: linear-gradient(135deg, #059669, #10B981); color: #FFF; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 800; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(16,185,129,0.3);">
              📊 11개년 가격추이 엑셀 다운로드
            </button>
            <button id="btn-open-pdf-modal" style="background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: #FFF; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 800; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              📄 PDF 1:1 유통 진단 보고서
            </button>
          </div>
        </div>

        <!-- 3대 유통 요약 KPI 카드 -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-top: 18px; margin-bottom: 24px;">
          <div style="background: rgba(15, 23, 42, 0.7); border:1px solid rgba(255,255,255,0.1); padding: 16px 20px; border-radius: 12px;">
            <div style="font-size:12px; color:#94A3B8; font-weight:700;">🎯 대상 농가 실제/추정 수취단가 (A)</div>
            <div style="font-size:22px; font-weight:900; color:#10B981; margin-top:4px; font-family: Pretendard, monospace;">
              ${formatMoney(analysis.farmPricePerKg)} /kg
            </div>
            <div style="font-size:11px; color:#A7F3D0; margin-top:4px;">${analysis.priceAdvice}</div>
          </div>

          <div style="background: rgba(15, 23, 42, 0.7); border:1px solid rgba(59,130,246,0.3); padding: 16px 20px; border-radius: 12px;">
            <div style="font-size:12px; color:#60A5FA; font-weight:700;">🏬 10개년 평균 중도매가 대비 수취비율 (A/B)</div>
            <div style="font-size:22px; font-weight:900; color:#60A5FA; margin-top:4px; font-family: Pretendard, monospace;">
              ${avg10.abRatio || 65.8}%
            </div>
            <div style="font-size:11px; color:#93C5FD; margin-top:4px;">10개년 평균 농가수취가: ${formatMoney(avg10.farmPrice)} /kg</div>
          </div>

          <div style="background: rgba(15, 23, 42, 0.7); border:1px solid rgba(139,92,246,0.3); padding: 16px 20px; border-radius: 12px;">
            <div style="font-size:12px; color:#C084FC; font-weight:700;">🛒 10개년 평균 소매가 대비 수취비율 (A/C)</div>
            <div style="font-size:22px; font-weight:900; color:#C084FC; margin-top:4px; font-family: Pretendard, monospace;">
              ${avg10.acRatio || 56.4}%
            </div>
            <div style="font-size:11px; color:#E9D5FF; margin-top:4px;">10개년 평균 소매가: ${formatMoney(avg10.retailPrice)} /kg</div>
          </div>
        </div>

        <!-- 메인 2분할 영역: 그래프 vs 데이터 정밀 표 -->
        <div style="display:grid; grid-template-columns: 1.1fr 1fr; gap: 24px; align-items:start;">
          
          <!-- 좌측: 11개년 유통단계별 가격 추이 다중 그래프 -->
          <div style="background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
              <h3 style="font-size:15px; font-weight:800; color:#FFF; display:flex; align-items:center; gap:6px;">
                📈 11개년 유통 단계별 kg당 가격 변동 추이 (2014 ~ 2024)
              </h3>
            </div>

            <div class="chart-wrapper" style="height: 380px; position: relative;">
              <canvas id="kamisMultiLineChart"></canvas>
            </div>
          </div>

          <!-- 우측: 11개년 연도별 kg당 가격 추이 정밀 데이터 표 (첨부 엑셀 100% 동일) -->
          <div style="background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <h3 style="font-size:15px; font-weight:800; color:#34D399; display:flex; align-items:center; gap:6px;">
                ◎ 11개년 ${analysis.cropName} 연도별 kg당 가격 추이
              </h3>
              <span style="font-size:11px; color:#94A3B8;">[단위 : 원, %]</span>
            </div>

            <div class="data-table-container">
              <table class="data-table" style="font-size: 12px; text-align: center;">
                <thead>
                  <tr style="background: rgba(16, 185, 129, 0.2); color: #A7F3D0;">
                    <th style="text-align:center; padding:8px;">구분</th>
                    <th style="text-align:right; color:#A7F3D0;">농가수취가 A</th>
                    <th style="text-align:right; color:#93C5FD;">중도매인가 B</th>
                    <th style="text-align:right; color:#E9D5FF;">소매가격 C</th>
                    <th style="text-align:right; color:#60A5FA;">A/B 비율</th>
                    <th style="text-align:right; color:#C084FC;">A/C 비율</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows.map(r => `
                    <tr>
                      <td style="font-weight:700; background:rgba(255,255,255,0.02); text-align:center;">${r.year}</td>
                      <td style="text-align:right; font-weight:800; color:#10B981; font-family: Pretendard, monospace;">
                        ${r.farmPrice ? formatMoney(r.farmPrice).replace(' 원', '') : '-'}
                      </td>
                      <td style="text-align:right; font-family: Pretendard, monospace;">${formatMoney(r.wholesalePrice).replace(' 원', '')}</td>
                      <td style="text-align:right; font-family: Pretendard, monospace;">${formatMoney(r.retailPrice).replace(' 원', '')}</td>
                      <td style="text-align:right; color:#60A5FA; font-weight:700;">${r.abRatio}%</td>
                      <td style="text-align:right; color:#C084FC; font-weight:700;">${r.acRatio}%</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot style="background: rgba(16, 185, 129, 0.25); font-weight: 900; font-size: 13px;">
                  <tr>
                    <td style="text-align:center; color:#A7F3D0; padding:10px;">10개년 평균</td>
                    <td style="text-align:right; color:#10B981; font-family: Pretendard, monospace;">${formatMoney(avg10.farmPrice).replace(' 원', '')}</td>
                    <td style="text-align:right; color:#93C5FD; font-family: Pretendard, monospace;">${formatMoney(avg10.wholesalePrice).replace(' 원', '')}</td>
                    <td style="text-align:right; color:#E9D5FF; font-family: Pretendard, monospace;">${formatMoney(avg10.retailPrice).replace(' 원', '')}</td>
                    <td style="text-align:right; color:#60A5FA; font-weight:900;">${avg10.abRatio}%</td>
                    <td style="text-align:right; color:#C084FC; font-weight:900;">${avg10.acRatio}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      </div>

      <!-- 2. 20년 차 농업 경영컨설턴트 유통 마진 & 출하 전략 정밀 처방전 카드 -->
      <div style="background: linear-gradient(135deg, #1E293B, #0F172A); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 24px; color: #FFF; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px; margin-bottom:16px;">
          <h3 style="font-size: 17px; font-weight: 900; color: #10B981; display:flex; align-items:center; gap:8px;">
            💡 20년 차 농업 경영컨설턴트 유통 마진 & 출하 전략 정밀 처방전
          </h3>
          <span style="font-size:12px; color:#A7F3D0; background:rgba(16,185,129,0.2); padding:4px 10px; border-radius:8px; font-weight:700;">
            SENIOR CONSULTANT AUDIT
          </span>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
          <div style="background:rgba(15,23,42,0.6); border:1px solid rgba(255,255,255,0.1); padding:16px; border-radius:10px;">
            <div style="font-size:13px; font-weight:800; color:#38BDF8; margin-bottom:6px;">
              📌 1. 중도매/소매 유통 마진 확대 진단
            </div>
            <p style="font-size:12.5px; color:#CBD5E1; line-height:1.6; margin:0;">
              ${trendData.insights[0] || ''}<br/>
              <b>${trendData.insights[1] || ''}</b> 소매가 및 중도매가가 급등하는 동안 농가 수취단가는 상대적으로 원가 상승분을 다 반영하지 못하는 유통 마진 불균형이 확인됩니다.
            </p>
          </div>

          <div style="background:rgba(15,23,42,0.6); border:1px solid rgba(255,255,255,0.1); padding:16px; border-radius:10px;">
            <div style="font-size:13px; font-weight:800; color:#F59E0B; margin-bottom:6px;">
              📌 2. 농가 수취 비율 & 수익성 확장 전략
            </div>
            <p style="font-size:12.5px; color:#CBD5E1; line-height:1.6; margin:0;">
              <b>${trendData.insights[2] || ''}</b><br/>
              <b>${trendData.insights[3] || ''}</b><br/>
              공동출하 및 로컬푸드/직거래 비율을 20%만 확대하더라도 kg당 약 <b>+3,500원 ~ +8,900원의 중간 유통 마진을 농가 소득으로 직접 흡수</b>할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

    </div>
  `;

  // Render KAMIS 11-Year 3-Line Price Trend Chart Safely
  const canvas = document.getElementById('kamisMultiLineChart');
  if (canvas && typeof window !== 'undefined' && window.Chart) {
    try {
      const ctx = canvas.getContext('2d');
      new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: rows.map(r => r.year),
          datasets: [
            {
              label: '농가수취가격 A (원/kg)',
              data: rows.map(r => r.farmPrice),
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 3,
              fill: false,
              tension: 0.3
            },
            {
              label: '중도매인가격 B (원/kg)',
              data: rows.map(r => r.wholesalePrice),
              borderColor: '#3B82F6',
              backgroundColor: 'transparent',
              borderWidth: 2.5,
              borderDash: [4, 4],
              fill: false,
              tension: 0.3
            },
            {
              label: '소매가격 C (원/kg)',
              data: rows.map(r => r.retailPrice),
              borderColor: '#8B5CF6',
              backgroundColor: 'transparent',
              borderWidth: 2.5,
              fill: false,
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
            legend: { labels: { color: '#CBD5E1', font: { family: 'Pretendard', weight: 'bold' } } }
          }
        }
      });
    } catch (err) {
      console.warn('Multi line chart error:', err);
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

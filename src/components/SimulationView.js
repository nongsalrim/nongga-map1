/**
 * @file SimulationView.js
 * @description ⚡ 6개년 실시간 장기 경영 시뮬레이터 (What-If Analysis) & 출력창 모달 / 엑셀 다운로드 연동 뷰
 */

import { calculateSimulatedPlan } from '../utils/excelEngine.js';
import { openSimulationModal, exportSimulationExcel } from './SimulationDetailModal.js';

export function renderSimulation(container, model) {
  let priceMult = 1.0;
  let areaMult = 1.0;

  function updateView() {
    const simData = calculateSimulatedPlan(model, priceMult, areaMult);
    const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(val || 0)) + ' 원';

    container.innerHTML = `
      <div style="max-width: 1300px; margin: 0 auto; padding-bottom: 40px;">
        
        <div class="panel-grid" style="margin-bottom:24px;">
          
          <!-- 슬라이더 및 시뮬레이터 요약 카드 -->
          <div class="panel-card">
            <div class="panel-title" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <div>
                <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34D399; border:1px solid rgba(16,185,129,0.4); padding:4px 12px; border-radius:12px; font-size:12px; font-weight:700;">
                  WHAT-IF SIMULATOR
                </span>
                <h2 style="font-size: 20px; font-weight: 900; color: #FFF; margin-top: 4px; display:flex; align-items:center; gap:8px;">
                  ⚡ 실시간 경영 시뮬레이터 (What-If Analysis)
                </h2>
              </div>

              <div style="display:flex; gap:10px; align-items:center;">
                <button id="btn-sim-export-excel" style="background: linear-gradient(135deg, #059669, #10B981); color: #FFF; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 800; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(16,185,129,0.3);">
                  📊 6개년 사업계획서 엑셀 다운로드
                </button>
                <button id="btn-sim-open-modal" style="background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: #FFF; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 800; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                  📄 6개년 시뮬레이션 출력창 열기
                </button>
              </div>
            </div>

            <div class="slider-group" style="margin-top:16px;">
              <div class="slider-header" style="display:flex; justify-content:space-between; font-size:14px; font-weight:700; color:#E2E8F0;">
                <span>판매 단가 변동률:</span>
                <strong style="color:#10B981; font-size:18px; font-weight:900;">${Math.round((priceMult - 1) * 100)}%</strong>
              </div>
              <input type="range" id="price-slider" class="slider-input" min="0.7" max="1.5" step="0.05" value="${priceMult}" style="width:100%; margin-top:8px;">
            </div>

            <div class="slider-group" style="margin-bottom:24px; margin-top:16px;">
              <div class="slider-header" style="display:flex; justify-content:space-between; font-size:14px; font-weight:700; color:#E2E8F0;">
                <span>재배 면적 확장률:</span>
                <strong style="color:#60A5FA; font-size:18px; font-weight:900;">${Math.round((areaMult - 1) * 100)}%</strong>
              </div>
              <input type="range" id="area-slider" class="slider-input" min="0.5" max="2.0" step="0.1" value="${areaMult}" style="width:100%; margin-top:8px;">
            </div>

            <div style="background: rgba(15, 23, 42, 0.7); border:1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 14px; display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
              <div>
                <div style="font-size:12px; color:#94A3B8; font-weight:700;">추정 총수입</div>
                <div style="font-size:22px; font-weight:900; color:#38BDF8; margin-top:4px; font-family: Pretendard, monospace;">${formatMoney(simData.revenue)}</div>
              </div>
              <div>
                <div style="font-size:12px; color:#94A3B8; font-weight:700;">추정 경영비</div>
                <div style="font-size:22px; font-weight:900; color:#F87171; margin-top:4px; font-family: Pretendard, monospace;">${formatMoney(simData.expenses)}</div>
              </div>
              <div>
                <div style="font-size:12px; color:#94A3B8; font-weight:700;">추정 소득</div>
                <div style="font-size:22px; font-weight:900; color:#10B981; margin-top:4px; font-family: Pretendard, monospace;">${formatMoney(simData.income)}</div>
              </div>
              <div>
                <div style="font-size:12px; color:#94A3B8; font-weight:700;">손익분기점(BEP) 비율</div>
                <div style="font-size:22px; font-weight:900; color:#FBBF24; margin-top:4px;">${simData.bepRate}%</div>
              </div>
            </div>
          </div>

          <!-- 6개년 장기 추정 차트 -->
          <div class="panel-card">
            <div class="panel-title">
              <h3 style="font-size:16px; font-weight:800; color:#FFF; display:flex; align-items:center; gap:6px;">
                🗓️ 6개년 장기 경영실적 추정 차트 (2025~2030)
              </h3>
            </div>
            <div class="chart-wrapper" style="height: 320px; position: relative;">
              <canvas id="sim6YearChart"></canvas>
            </div>
          </div>

        </div>

        <!-- 하단 6개년 상세 사업계획서 표 패널 -->
        <div class="panel-card" style="margin-top:24px;">
          <div class="panel-title" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <h3 style="font-size:17px; font-weight:900; color:#10B981; display:flex; align-items:center; gap:8px;">
              📋 6개년 상세 사업계획서 스케줄
            </h3>
            <button id="btn-sim-open-modal-2" style="background: rgba(59,130,246,0.2); border:1px solid #3B82F6; color:#93C5FD; padding:6px 14px; border-radius:8px; font-size:12px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:4px;">
              📄 사업계획서 출력창 열기
            </button>
          </div>

          <div class="data-table-container">
            <table class="data-table" style="text-align:center;">
              <thead>
                <tr style="background: rgba(16, 185, 129, 0.2); color:#A7F3D0; font-size:14px;">
                  <th style="text-align:center;">연도</th>
                  <th style="text-align:right;">추정 총수입</th>
                  <th style="text-align:right; color:#F87171;">추정 경영비</th>
                  <th style="text-align:right; color:#34D399;">추정 농가소득</th>
                  <th style="text-align:right; color:#FBBF24;">손익분기율</th>
                </tr>
              </thead>
              <tbody>
                ${simData.yearProjections.map(yp => `
                  <tr>
                    <td style="font-weight:800; color:#10B981;">${yp.year}년차</td>
                    <td style="text-align:right; font-weight:800; color:#38BDF8; font-family: Pretendard, monospace;">${formatMoney(yp.revenue)}</td>
                    <td style="text-align:right; font-weight:700; color:#F87171; font-family: Pretendard, monospace;">${formatMoney(yp.expense)}</td>
                    <td style="text-align:right; font-weight:900; color:#34D399; font-family: Pretendard, monospace;">${formatMoney(yp.income)}</td>
                    <td style="text-align:right; font-weight:800; color:#FBBF24;">${Math.round((yp.expense / yp.revenue) * 100)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
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

    // Export & Modal Event Listeners
    const btnExcel = document.getElementById('btn-sim-export-excel');
    if (btnExcel) {
      btnExcel.addEventListener('click', () => {
        exportSimulationExcel(simData, model, priceMult, areaMult);
      });
    }

    const btnModal1 = document.getElementById('btn-sim-open-modal');
    if (btnModal1) {
      btnModal1.addEventListener('click', () => {
        openSimulationModal(model, simData, priceMult, areaMult);
      });
    }

    const btnModal2 = document.getElementById('btn-sim-open-modal-2');
    if (btnModal2) {
      btnModal2.addEventListener('click', () => {
        openSimulationModal(model, simData, priceMult, areaMult);
      });
    }

    // Render 6-Year Chart
    const canvas = document.getElementById('sim6YearChart');
    if (canvas && typeof window !== 'undefined' && window.Chart) {
      try {
        const ctx = canvas.getContext('2d');
        new window.Chart(ctx, {
          type: 'line',
          data: {
            labels: simData.yearProjections.map(y => y.year + '년차'),
            datasets: [
              {
                label: '총수입 (원)',
                data: simData.yearProjections.map(y => y.revenue),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3
              },
              {
                label: '경영비 (원)',
                data: simData.yearProjections.map(y => y.expense),
                borderColor: '#EF4444',
                backgroundColor: 'transparent',
                borderWidth: 2.5,
                fill: false,
                tension: 0.3
              },
              {
                label: '농가소득 (원)',
                data: simData.yearProjections.map(y => y.income),
                borderColor: '#F59E0B',
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
        console.warn('Simulation 6-year chart error:', err);
      }
    }
  }

  updateView();
}

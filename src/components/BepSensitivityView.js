/**
 * @file BepSensitivityView.js
 * @description 🎯 6. 손익분기점 (BEP) & 민감도 분석 (경영 20년차 컨설턴트 한계생산성 및 리스크 진단 모듈 & PDF/엑셀 다운로드 연동)
 */

export function renderBepSensitivity(container, model) {
  const parseNum = (val) => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/%/g, '').replace(/원/g, '').trim();
    return Number(cleanStr) || 0;
  };

  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(parseNum(val))) + ' 원';
  const formatComma = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(parseNum(val)));
  
  const formatShortMoney = (val) => {
    const million = parseNum(val) / 10000;
    const formattedNum = (Math.round(million * 10) / 10).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `${formattedNum}만 원`;
  };

  const farmName = model.farmOwner || model.farmName || '농가';
  const cropName = model.cropName || '시설딸기(수경)';

  const revenue = parseNum(model.revenue) || 100000000;
  const expenses = parseNum(model.operatingExpenses) || 40000000;
  const income = parseNum(model.income) || (revenue - expenses);
  const yieldKg = parseNum(model.yieldKg) || 20000;
  const pricePerKg = parseNum(model.pricePerKg) || 5000;

  // BEP Calculations
  const bepYieldKg = pricePerKg > 0 ? Math.round(expenses / pricePerKg) : 0;
  const bepPricePerKg = yieldKg > 0 ? Math.round(expenses / yieldKg) : 0;
  const marginOfSafety = revenue > 0 ? (((revenue - expenses) / revenue) * 100).toFixed(1) : '0.0';

  const priceBufferPct = pricePerKg > 0 ? (((pricePerKg - bepPricePerKg) / pricePerKg) * 100).toFixed(1) : '0.0';
  const yieldBufferPct = yieldKg > 0 ? (((yieldKg - bepYieldKg) / yieldKg) * 100).toFixed(1) : '0.0';

  // 5x5 Sensitivity Matrix Scenario Generators (Price Variations vs Yield Variations)
  const priceScenarios = [-0.20, -0.10, 0.0, 0.10, 0.20]; // -20%, -10%, 기준, +10%, +20%
  const yieldScenarios = [-0.20, -0.10, 0.0, 0.10, 0.20]; // -20%, -10%, 기준, +10%, +20%

  container.innerHTML = `
    <div style="padding: 10px 0;">
      
      <!-- 상단 안내 헤더 카드 -->
      <div style="background: linear-gradient(135deg, #0F172A, #1E293B); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 24px 28px; margin-bottom: 24px; color: #FFF; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div>
            <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #10B981; border: 1px solid rgba(16,185,129,0.4); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700;">
              20년 차 베테랑 컨설턴트 한계생산성 & 리스크 진단 모듈
            </span>
            <h2 style="font-size: 22px; font-weight: 900; margin-top: 8px; color: #FFF;">
              🎯 6. 손익분기점 (BEP) & 시장 변동 민감도 분석
            </h2>
            <p style="font-size: 13px; color: #94A3B8; margin-top: 4px;">
              농가가 적자를 면하기 위한 <b>최소 출하 가격(BEP 단가)</b> 및 <b>최소 생산량(BEP 수량)</b>을 진단하고, 단가·수량 변동 시의 손익 시나리오를 예측합니다.
            </p>
          </div>

          <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
            <button id="btn-export-bep-pdf" style="background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: #FFF; border: none; padding: 11px 20px; border-radius: 10px; font-weight: 800; font-size: 13.5px; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(59,130,246,0.35);">
              📄 민감도 매트릭스 PDF 다운로드
            </button>
            <button id="btn-export-bep-excel" style="background: linear-gradient(135deg, #059669, #10B981); color: #FFF; border: none; padding: 11px 20px; border-radius: 10px; font-weight: 800; font-size: 13.5px; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(16,185,129,0.35);">
              📊 엑셀 다운로드
            </button>
          </div>
        </div>
      </div>

      <!-- BEP 4대 핵심 지표 카드 -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px; margin-bottom: 28px;">
        
        <!-- 1. BEP 손익분기 매출액 -->
        <div style="background: #1E293B; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 20px; color: #FFF; box-shadow: 0 4px 16px rgba(0,0,0,0.2);">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; color:#94A3B8; font-weight:600;">BEP 손익분기 매출액</span>
            <span style="font-size:18px;">🏛️</span>
          </div>
          <div style="font-size: 22px; font-weight: 900; color: #F59E0B; margin-top: 10px; font-family: Pretendard, monospace;">
            ${formatMoney(expenses)}
          </div>
          <div style="font-size: 12px; color: #94A3B8; margin-top: 6px;">
            총 경영비(원가합계)와 동일한 매출액
          </div>
        </div>

        <!-- 2. BEP 손익분기 단가 -->
        <div style="background: #1E293B; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 20px; color: #FFF; box-shadow: 0 4px 16px rgba(0,0,0,0.2);">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; color:#94A3B8; font-weight:600;">BEP 최소 출하 단가</span>
            <span style="font-size:18px;">🏷️</span>
          </div>
          <div style="font-size: 22px; font-weight: 900; color: #34D399; margin-top: 10px; font-family: Pretendard, monospace;">
            kg당 ${formatComma(bepPricePerKg)} 원
          </div>
          <div style="font-size: 12px; color: #A7F3D0; margin-top: 6px;">
            현재 단가(${formatComma(pricePerKg)}원) 대비 <b>${priceBufferPct}%</b> 여유 확보
          </div>
        </div>

        <!-- 3. BEP 손익분기 수량 -->
        <div style="background: #1E293B; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 20px; color: #FFF; box-shadow: 0 4px 16px rgba(0,0,0,0.2);">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; color:#94A3B8; font-weight:600;">BEP 최소 수확 생산량</span>
            <span style="font-size:18px;">⚖️</span>
          </div>
          <div style="font-size: 22px; font-weight: 900; color: #60A5FA; margin-top: 10px; font-family: Pretendard, monospace;">
            ${formatComma(bepYieldKg)} kg
          </div>
          <div style="font-size: 12px; color: #93C5FD; margin-top: 6px;">
            현재 생산량(${formatComma(yieldKg)}kg) 대비 <b>${yieldBufferPct}%</b> 안전 지대
          </div>
        </div>

        <!-- 4. 20년차 컨설턴트 총평 -->
        <div style="background: #1E293B; border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 14px; padding: 20px; color: #FFF; box-shadow: 0 4px 16px rgba(0,0,0,0.2);">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:13px; color:#34D399; font-weight:800;">컨설턴트 안심 진단</span>
            <span style="font-size:20px;">👨‍🌾</span>
          </div>
          <div style="font-size: 17px; font-weight: 900; color: ${Number(marginOfSafety) > 30 ? '#34D399' : (Number(marginOfSafety) > 15 ? '#FBBF24' : '#F87171')}; margin-top: 8px;">
            ${Number(marginOfSafety) > 30 ? '🟢 고수익·안전 경영체' : Number(marginOfSafety) > 15 ? '🟡 적정 안전선 경영체' : '🔴 원가 관리 주의 필요'}
          </div>
          <div style="font-size: 13px; color: #F1F5F9; margin-top: 8px; line-height: 1.5; font-weight: 500;">
            ${Number(marginOfSafety) > 30 
              ? '단가 및 생산량 변동 리스크 방어력이 매우 뛰어난 상태입니다.' 
              : '시장 가격 하락 시 적자 전환 가능성이 있어 원가 절감이 필요합니다.'}
          </div>
        </div>

      </div>

      <!-- 민감도 분석 마트릭스 (Sensitivity Matrix) Table -->
      <div style="background: #1E293B; border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 24px; margin-bottom: 24px; color: #FFF; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; margin-bottom: 18px; flex-wrap:wrap; gap:10px;">
          <div>
            <h3 style="font-size: 17px; font-weight: 800; color: #38BDF8; display: flex; align-items: center; gap: 8px;">
              📊 2D 민감도 매트릭스 (판매단가 변동 × 수확량 변동 시나리오)
            </h3>
            <p style="font-size: 12px; color: #94A3B8; margin-top: 2px;">
              시장 유통시세 변동(-20%~+20%) 및 생육/기상 조건에 따른 생산량 변동 시의 <b>예상 농가 소득 matrix</b>입니다.
            </p>
          </div>
          <span class="badge" style="background:rgba(56,189,248,0.2); color:#38BDF8; border:1px solid rgba(56,189,248,0.3); font-size:12px; font-weight:700;">
            기준 조건: ${formatComma(pricePerKg)}원/kg × ${formatComma(yieldKg)}kg = 소득 ${formatShortMoney(income)}
          </span>
        </div>

        <div class="data-table-container">
          <table class="data-table" style="text-align:center; font-size:13px;">
            <thead>
              <tr style="background: rgba(15, 23, 42, 0.8);">
                <th style="padding:12px; text-align:center; color:#94A3B8;">수확량＼단가</th>
                ${priceScenarios.map(pRatio => {
                  const targetP = Math.round(pricePerKg * (1 + pRatio));
                  const label = pRatio === 0 ? `기준 (${formatComma(targetP)}원)` : `${pRatio > 0 ? '+' : ''}${Math.round(pRatio*100)}% (${formatComma(targetP)}원)`;
                  return `<th style="padding:12px; text-align:center; color:${pRatio === 0 ? '#34D399' : '#93C5FD'}; font-weight:800;">${label}</th>`;
                }).join('')}
              </tr>
            </thead>
            <tbody>
              ${yieldScenarios.map(yRatio => {
                const targetY = Math.round(yieldKg * (1 + yRatio));
                const yLabel = yRatio === 0 ? `기준 (${formatComma(targetY)}kg)` : `${yRatio > 0 ? '+' : ''}${Math.round(yRatio*100)}% (${formatComma(targetY)}kg)`;

                return `
                  <tr>
                    <td style="font-weight:800; color:${yRatio === 0 ? '#34D399' : '#FFF'}; background:rgba(15,23,42,0.5); border-right:1px solid rgba(255,255,255,0.1);">
                      ${yLabel}
                    </td>
                    ${priceScenarios.map(pRatio => {
                      const simP = Math.round(pricePerKg * (1 + pRatio));
                      const simRev = simP * targetY;
                      const simInc = simRev - expenses;
                      const isBaseline = pRatio === 0 && yRatio === 0;

                      let cellBg = isBaseline ? 'rgba(16, 185, 129, 0.25)' : (simInc >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.15)');
                      let cellBorder = isBaseline ? '2px solid #10B981' : '1px solid rgba(255,255,255,0.05)';
                      let textColor = simInc >= 0 ? '#34D399' : '#F87171';

                      return `
                        <td style="background:${cellBg}; border:${cellBorder}; padding:12px 8px;">
                          <div style="font-weight:800; color:${textColor}; font-size:13px; font-family: Pretendard, monospace;">
                            ${simInc >= 0 ? '+' : ''}${formatShortMoney(simInc)}
                          </div>
                          <div style="font-size:10px; color:${simInc >= 0 ? '#94A3B8' : '#F87171'}; margin-top:2px;">
                            ${simInc >= 0 ? '🟢 흑자' : '🔴 적자전환'}
                          </div>
                        </td>
                      `;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 컨설턴트 맞춤 가이드 카드 -->
      <div style="background: linear-gradient(135deg, #1E293B, #0F172A); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 16px; padding: 22px 26px; color: #FFF; display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
        <div style="font-size: 36px; background: rgba(245,158,11,0.15); width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(245,158,11,0.3);">
          💡
        </div>
        <div style="flex: 1; min-width: 280px;">
          <h4 style="font-size: 16px; font-weight: 800; color: #F59E0B; margin-bottom: 4px;">
            경영 20년 차 컨설턴트의 BEP 리스크 방어 가이드
          </h4>
          <p style="font-size: 13px; color: #F1F5F9; line-height: 1.5;">
            현재 농가의 손익분기 단가는 <b>kg당 ${formatComma(bepPricePerKg)} 원</b>입니다. 
            시세가 -20% 급락하고 수확량이 -10% 감소하는 최악의 고온/가뭄 시나리오에서도 <b>${formatShortMoney((pricePerKg*0.8)*(yieldKg*0.9) - expenses)}</b>의 안정적인 소득을 유지하려면, **고정비 감가상각 절감 및 지자체 에너지 보조금 매칭 전략(7번 탭)**을 수립하는 것을 적극 권장합니다.
          </p>
        </div>
      </div>

    </div>
  `;

  // Attach Event Listeners for PDF and Excel buttons
  const pdfBtn = document.getElementById('btn-export-bep-pdf');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      openBepPdfModal(farmName, cropName, revenue, expenses, income, yieldKg, pricePerKg, bepYieldKg, bepPricePerKg, marginOfSafety, priceScenarios, yieldScenarios);
    });
  }

  const excelBtn = document.getElementById('btn-export-bep-excel');
  if (excelBtn) {
    excelBtn.addEventListener('click', () => {
      exportBepExcel(farmName, cropName, expenses, pricePerKg, yieldKg, priceScenarios, yieldScenarios);
    });
  }
}

// 📄 PDF 출력 및 인쇄 전용 모달 생성 함수
function openBepPdfModal(farmName, cropName, revenue, expenses, income, yieldKg, pricePerKg, bepYieldKg, bepPricePerKg, marginOfSafety, priceScenarios, yieldScenarios) {
  const formatComma = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(val || 0));
  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(val || 0)) + ' 원';
  const formatShortMoney = (val) => {
    const million = (val || 0) / 10000;
    const formattedNum = (Math.round(million * 10) / 10).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `${formattedNum}만 원`;
  };

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'bep-pdf-modal-overlay';
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(8px);
    z-index: 99999;
    display: flex; justify-content: center; align-items: center;
    padding: 20px; box-sizing: border-box;
  `;

  let matrixRowsHtml = '';
  yieldScenarios.forEach(yRatio => {
    const targetY = Math.round(yieldKg * (1 + yRatio));
    const yLabel = yRatio === 0 ? `기준 (${formatComma(targetY)}kg)` : `${yRatio > 0 ? '+' : ''}${Math.round(yRatio*100)}% (${formatComma(targetY)}kg)`;

    matrixRowsHtml += `
      <tr>
        <td style="padding:10px; font-weight:800; background:#F8FAFC; border:1px solid #CBD5E1; text-align:center;">${yLabel}</td>
        ${priceScenarios.map(pRatio => {
          const simP = Math.round(pricePerKg * (1 + pRatio));
          const simRev = simP * targetY;
          const simInc = simRev - expenses;
          const isBaseline = pRatio === 0 && yRatio === 0;

          let cellBg = isBaseline ? '#D1FAE5' : (simInc >= 0 ? '#F0FDF4' : '#FEF2F2');
          let textColor = simInc >= 0 ? '#047857' : '#DC2626';

          return `
            <td style="background:${cellBg}; border:1px solid #CBD5E1; padding:10px; text-align:center;">
              <div style="font-weight:800; color:${textColor}; font-size:13px;">
                ${simInc >= 0 ? '+' : ''}${formatShortMoney(simInc)}
              </div>
              <div style="font-size:10px; color:${simInc >= 0 ? '#059669' : '#EF4444'}; margin-top:2px;">
                ${simInc >= 0 ? '🟢 흑자' : '🔴 적자전환'}
              </div>
            </td>
          `;
        }).join('')}
      </tr>
    `;
  });

  modalOverlay.innerHTML = `
    <div style="background:#FFF; border-radius:16px; width:100%; max-width:1100px; max-height:92vh; overflow-y:auto; color:#0F172A; padding:28px 36px; box-shadow:0 25px 50px rgba(0,0,0,0.5); font-family:Pretendard, sans-serif;">
      
      <!-- 상단 액션 바 (인쇄 시 숨김) -->
      <div class="no-print" style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #E2E8F0; padding-bottom:16px; margin-bottom:20px;">
        <div>
          <span style="background:#E0E7FF; color:#3730A3; font-weight:800; padding:4px 10px; border-radius:12px; font-size:12px;">PDF & PRINT REPORT</span>
          <h3 style="font-size:20px; font-weight:900; color:#0F172A; margin-top:4px;">📄 2D 민감도 매트릭스 리포트 PDF 출력 및 인쇄</h3>
        </div>
        <div style="display:flex; gap:10px;">
          <button id="btn-do-bep-print" style="background:#2563EB; color:#FFF; border:none; padding:10px 20px; border-radius:8px; font-weight:800; font-size:14px; cursor:pointer;">
            🖨️ PDF 저장 / 즉시 인쇄
          </button>
          <button id="btn-close-bep-pdf" style="background:#64748B; color:#FFF; border:none; padding:10px 16px; border-radius:8px; font-weight:800; font-size:14px; cursor:pointer;">
            ✕ 닫기
          </button>
        </div>
      </div>

      <!-- 리포트 본문 (A4 Landscape Print Target) -->
      <div id="bep-print-area" style="padding:10px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:3px solid #0F172A; padding-bottom:12px; margin-bottom:20px;">
          <div>
            <div style="font-size:12px; color:#64748B; font-weight:700;">농가살림연구소(주) 경영진단 솔루션</div>
            <h1 style="font-size:24px; font-weight:900; color:#0F172A; margin-top:2px;">🎯 2D 손익분기점(BEP) & 시장 변동 민감도 분석 리포트</h1>
          </div>
          <div style="text-align:right; font-size:12px; color:#475569;">
            <div>진단 농가: <b>${farmName}</b> (${cropName})</div>
            <div>발행일자: ${new Date().toLocaleDateString('ko-KR')}</div>
          </div>
        </div>

        <!-- BEP 4대 지표 요약 -->
        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; margin-bottom:20px;">
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:12px 14px; border-radius:8px;">
            <div style="font-size:11px; color:#64748B; font-weight:700;">BEP 손익분기 매출액</div>
            <div style="font-size:17px; font-weight:900; color:#D97706; margin-top:4px;">${formatMoney(expenses)}</div>
          </div>
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:12px 14px; border-radius:8px;">
            <div style="font-size:11px; color:#64748B; font-weight:700;">BEP 최소 출하 단가</div>
            <div style="font-size:17px; font-weight:900; color:#059669; margin-top:4px;">kg당 ${formatComma(bepPricePerKg)}원</div>
          </div>
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:12px 14px; border-radius:8px;">
            <div style="font-size:11px; color:#64748B; font-weight:700;">BEP 최소 수확 생산량</div>
            <div style="font-size:17px; font-weight:900; color:#2563EB; margin-top:4px;">${formatComma(bepYieldKg)} kg</div>
          </div>
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:12px 14px; border-radius:8px;">
            <div style="font-size:11px; color:#64748B; font-weight:700;">경영 안전 여유율</div>
            <div style="font-size:17px; font-weight:900; color:#059669; margin-top:4px;">+${marginOfSafety}%</div>
          </div>
        </div>

        <!-- 2D 민감도 매트릭스 표 -->
        <div style="margin-bottom:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <h3 style="font-size:15px; font-weight:800; color:#0F172A;">📊 2D 민감도 매트릭스 (판매단가 변동 × 수확량 변동 시나리오)</h3>
            <span style="font-size:11px; color:#64748B;">기준: ${formatComma(pricePerKg)}원/kg × ${formatComma(yieldKg)}kg = 소득 ${formatShortMoney(income)}</span>
          </div>
          <table style="width:100%; border-collapse:collapse; text-align:center; font-size:12px;">
            <thead>
              <tr style="background:#0F172A; color:#FFF;">
                <th style="padding:10px; border:1px solid #334155;">수확량＼단가</th>
                ${priceScenarios.map(pRatio => {
                  const targetP = Math.round(pricePerKg * (1 + pRatio));
                  const label = pRatio === 0 ? `기준 (${formatComma(targetP)}원)` : `${pRatio > 0 ? '+' : ''}${Math.round(pRatio*100)}% (${formatComma(targetP)}원)`;
                  return `<th style="padding:10px; border:1px solid #334155;">${label}</th>`;
                }).join('')}
              </tr>
            </thead>
            <tbody>
              ${matrixRowsHtml}
            </tbody>
          </table>
        </div>

        <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:8px; padding:14px 18px; font-size:12px; color:#1E3A8A; line-height:1.5;">
          💡 <b>20년 차 컨설턴트 총평:</b> 현재 농가의 손익분기 단가는 <b>kg당 ${formatComma(bepPricePerKg)} 원</b>이며, 경영 안전 여유율은 <b>+${marginOfSafety}%</b>입니다. 시세 변동 시에도 흑자를 유지하기 위해 정밀 수취단가 관리 및 경영비 절감을 적극 도모하십시오.
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(modalOverlay);

  const closeModal = () => {
    if (document.body.contains(modalOverlay)) {
      document.body.removeChild(modalOverlay);
    }
  };

  document.getElementById('btn-close-bep-pdf').addEventListener('click', closeModal);
  document.getElementById('btn-do-bep-print').addEventListener('click', () => {
    window.print();
  });
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

// 📊 엑셀 (CSV UTF-8 BOM) 다운로드 함수
function exportBepExcel(farmName, cropName, expenses, pricePerKg, yieldKg, priceScenarios, yieldScenarios) {
  const formatComma = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(val || 0));
  const formatShortMoney = (val) => {
    const million = (val || 0) / 10000;
    const formattedNum = (Math.round(million * 10) / 10).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `${formattedNum}만 원`;
  };

  let csv = '\uFEFF';
  csv += `"[${farmName}] ${cropName} 2D 손익분기점(BEP) & 민감도 분석 매트릭스",,,,,,\n`;
  csv += `"작성일자: ${new Date().toLocaleDateString('ko-KR')}",,,,,,\n\n`;

  csv += `"수확량＼단가",${priceScenarios.map(pRatio => {
    const targetP = Math.round(pricePerKg * (1 + pRatio));
    return `"${pRatio === 0 ? '기준' : (pRatio > 0 ? '+' : '') + Math.round(pRatio*100) + '%'}(${targetP}원)"`;
  }).join(',')}\n`;

  yieldScenarios.forEach(yRatio => {
    const targetY = Math.round(yieldKg * (1 + yRatio));
    const yLabel = yRatio === 0 ? `기준(${targetY}kg)` : `${yRatio > 0 ? '+' : ''}${Math.round(yRatio*100)}%(${targetY}kg)`;
    
    const rowVals = priceScenarios.map(pRatio => {
      const simP = Math.round(pricePerKg * (1 + pRatio));
      const simRev = simP * targetY;
      const simInc = simRev - expenses;
      return `"${simInc >= 0 ? '+' : ''}${formatShortMoney(simInc)}"`;
    });

    csv += `"${yLabel}",${rowVals.join(',')}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${farmName}_2D_민감도매트릭스_분석.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

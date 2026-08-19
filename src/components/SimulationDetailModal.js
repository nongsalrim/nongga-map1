/**
 * @file SimulationDetailModal.js
 * @description 📅 6개년 장기 경영실적 추정 사업계획서 정밀 명세서 모달 & 엑셀/PDF 출력 엔진
 * (텍스트/비고 가운데맞춤, 숫자/금액 오른쪽맞춤 및 #,##0 / 0.0% 천단위 구분기호 서식 포함)
 */

const parseNum = (val) => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleanStr = String(val).replace(/,/g, '').replace(/%/g, '').replace(/원/g, '').trim();
  return Number(cleanStr) || 0;
};

const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(parseNum(val))) + ' 원';
const formatComma = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(parseNum(val)));

/**
 * 6개년 사업계획서 엑셀 다운로드 (SheetJS + UTF-8 BOM CSV Fallback)
 */
export async function exportSimulationExcel(simData, farmModel, priceMult = 1.0, areaMult = 1.0, yieldMult = 1.0) {
  let XLSX = typeof window !== 'undefined' ? window.XLSX : null;

  if (!XLSX && typeof document !== 'undefined') {
    try {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      document.head.appendChild(script);
      await new Promise((res) => setTimeout(res, 300));
    } catch (e) {
      console.warn('SheetJS load error:', e);
    }
  }

  const farmName = farmModel.farmOwner || farmModel.farmName || '농가';
  const cropName = farmModel.cropName || '시설딸기(수경)';
  const currentYear = new Date().getFullYear();
  const yearProjections = simData.yearProjections || [];

  const pricePercentStr = `${Math.round((priceMult - 1) * 100)}%`;
  const areaPercentStr = `${Math.round((areaMult - 1) * 100)}%`;
  const yieldPercentStr = `${Math.round((yieldMult - 1) * 100)}%`;

  if (window.XLSX) {
    const wb = window.XLSX.utils.book_new();

    const sheetData = [
      [`[${farmName}] ${cropName} 6개년 장기 경영실적 추정 사업계획서`],
      [`시나리오 조건: 판매단가 ${pricePercentStr} / 재배면적 ${areaPercentStr} / 생산수량 ${yieldPercentStr}`],
      [`작성일자: ${new Date().toLocaleDateString('ko-KR')}`],
      [],
      ['경영연차', '해당연도', '추정 총수입(매출액)', '추정 경영비(원가)', '추정 농가소득', '누적 농가소득', '손익분기율(BEP)', '전년대비 소득성장률', '비고']
    ];

    let cumIncome = 0;
    let prevIncome = 0;

    yearProjections.forEach((yp, idx) => {
      const rev = parseNum(yp.revenue);
      const exp = parseNum(yp.expense);
      const inc = parseNum(yp.income);
      cumIncome += inc;
      const bep = rev > 0 ? Number(((exp / rev) * 100).toFixed(1)) : 0;

      let growthStr = '-';
      if (idx > 0 && prevIncome > 0) {
        const g = (((inc - prevIncome) / prevIncome) * 100).toFixed(1);
        growthStr = `+${g}%`;
      }
      prevIncome = inc;

      sheetData.push([
        `${yp.year}년차`,
        `${currentYear + idx}년`,
        rev,
        exp,
        inc,
        cumIncome,
        `${bep}%`,
        growthStr,
        idx === 0 ? '기준연도' : (idx === 5 ? '목표 연차' : '성장 연차')
      ]);
    });

    // Summary Totals Row
    const totalRev = yearProjections.reduce((sum, y) => sum + parseNum(y.revenue), 0);
    const totalExp = yearProjections.reduce((sum, y) => sum + parseNum(y.expense), 0);
    const totalInc = yearProjections.reduce((sum, y) => sum + parseNum(y.income), 0);
    const avgBep = totalRev > 0 ? Number(((totalExp / totalRev) * 100).toFixed(1)) : 0;

    sheetData.push([
      '6개년 총합계',
      `${currentYear}~${currentYear + 5}년`,
      totalRev,
      totalExp,
      totalInc,
      totalInc,
      `${avgBep}%`,
      '평균',
      '6개년 누적 총계'
    ]);

    const ws = window.XLSX.utils.aoa_to_sheet(sheetData);
    const range = window.XLSX.utils.decode_range(ws['!ref']);

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_ref = window.XLSX.utils.encode_cell({ c: C, r: R });
        if (!ws[cell_ref]) continue;

        const cell = ws[cell_ref];

        // Header styles
        if (R === 4) {
          cell.s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "10B981" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
          continue;
        }

        // Column 2,3,4,5 are numeric currency columns
        if ([2, 3, 4, 5].includes(C) && typeof cell.v === 'number') {
          cell.z = '#,##0';
          cell.s = { alignment: { horizontal: 'right', vertical: 'center' } };
        } else {
          cell.s = { alignment: { horizontal: 'center', vertical: 'center' } };
        }
      }
    }

    ws['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 16 }
    ];

    window.XLSX.utils.book_append_sheet(wb, ws, '6개년_사업계획서');
    window.XLSX.writeFile(wb, `${farmName}_6개년_장기_사업계획서.xlsx`);
    return;
  }

  // Fallback CSV (UTF-8 BOM)
  let csv = '\uFEFF';
  csv += `"[${farmName}] ${cropName} 6개년 장기 경영실적 추정 사업계획서"\n`;
  csv += `"시나리오 조건: 판매단가 변동률 ${pricePercentStr} / 재배면적 확장률 ${areaPercentStr}"\n`;
  csv += `"작성일자: ${new Date().toLocaleDateString('ko-KR')}"\n\n`;
  csv += `"경영연차","해당연도","추정 총수입(원)","추정 경영비(원)","추정 농가소득(원)","누적 농가소득(원)","손익분기율(%)","성장률","비고"\n`;

  let cumIncome = 0;
  let prevIncome = 0;

  yearProjections.forEach((yp, idx) => {
    const rev = parseNum(yp.revenue);
    const exp = parseNum(yp.expense);
    const inc = parseNum(yp.income);
    cumIncome += inc;
    const bep = rev > 0 ? Number(((exp / rev) * 100).toFixed(1)) : 0;

    let growthStr = '-';
    if (idx > 0 && prevIncome > 0) {
      const g = (((inc - prevIncome) / prevIncome) * 100).toFixed(1);
      growthStr = `+${g}%`;
    }
    prevIncome = inc;

    csv += `"${yp.year}년차","${currentYear + idx}년",${rev},${exp},${inc},${cumIncome},"${bep}%","${growthStr}","${idx === 0 ? '기준연도' : (idx === 5 ? '목표 연차' : '성장 연차')}"\n`;
  });

  const totalRev = yearProjections.reduce((sum, y) => sum + parseNum(y.revenue), 0);
  const totalExp = yearProjections.reduce((sum, y) => sum + parseNum(y.expense), 0);
  const totalInc = yearProjections.reduce((sum, y) => sum + parseNum(y.income), 0);
  const avgBep = totalRev > 0 ? Number(((totalExp / totalRev) * 100).toFixed(1)) : 0;

  csv += `"6개년 총합계","${currentYear}~${currentYear + 5}년",${totalRev},${totalExp},${totalInc},${totalInc},"${avgBep}%","평균","6개년 누적 총계"\n`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${farmName}_6개년_장기_사업계획서.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 6개년 사업계획서 출력창 / 모달 렌더링
 */
export function openSimulationModal(farmModel, simData, priceMult = 1.0, areaMult = 1.0, yieldMult = 1.0) {
  const farmName = farmModel.farmOwner || farmModel.farmName || '공주시';
  const cropName = farmModel.cropName || '시설딸기(수경)';
  const currentYear = new Date().getFullYear();
  const yearProjections = simData.yearProjections || [];

  const pricePercentStr = `${Math.round((priceMult - 1) * 100)}%`;
  const areaPercentStr = `${Math.round((areaMult - 1) * 100)}%`;
  const yieldPercentStr = `${Math.round((yieldMult - 1) * 100)}%`;

  const totalRev = yearProjections.reduce((sum, y) => sum + parseNum(y.revenue), 0);
  const totalExp = yearProjections.reduce((sum, y) => sum + parseNum(y.expense), 0);
  const totalInc = yearProjections.reduce((sum, y) => sum + parseNum(y.income), 0);
  const avgBep = totalRev > 0 ? Number(((totalExp / totalRev) * 100).toFixed(1)) : 0;

  // Create Modal Container
  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'sim-output-modal-overlay';
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(8px);
    z-index: 9999;
    display: flex; justify-content: center; align-items: center;
    padding: 20px;
    box-sizing: border-box;
  `;

  modalOverlay.innerHTML = `
    <div style="
      background: #1E293B;
      border: 1px solid rgba(16, 185, 129, 0.4);
      border-radius: 20px;
      width: 100%; max-width: 1100px;
      max-height: 90vh;
      display: flex; flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      overflow: hidden;
      color: #FFF;
      font-family: Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
    ">
      
      <!-- 모달 상단 헤더 -->
      <div style="
        background: linear-gradient(135deg, #0F172A, #1E293B);
        padding: 24px 30px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex; justify-content: space-between; align-items: center;
        flex-wrap: wrap; gap: 12px;
      ">
        <div>
          <span style="background:rgba(16,185,129,0.2); color:#34D399; border:1px solid rgba(16,185,129,0.4); padding:4px 12px; border-radius:12px; font-size:12px; font-weight:700;">
            6-YEAR LONG-TERM BUSINESS PLAN
          </span>
          <h2 style="font-size: 22px; font-weight: 900; color: #FFF; margin-top: 6px; display: flex; align-items: center; gap: 8px;">
            📄 [${farmName}] ${cropName} 6개년 장기 사업계획서 종합 명세서
          </h2>
        </div>

        <div style="display:flex; gap:10px; align-items:center;">
          <button id="sim-modal-btn-excel" style="
            background: linear-gradient(135deg, #059669, #10B981);
            color: #FFF; border: none; padding: 10px 18px; border-radius: 10px;
            font-weight: 800; font-size: 13px; cursor: pointer;
            display: flex; align-items: center; gap: 6px;
            box-shadow: 0 4px 14px rgba(16,185,129,0.3);
          ">
            📊 엑셀명세서 다운로드
          </button>

          <button id="sim-modal-btn-print" style="
            background: linear-gradient(135deg, #3B82F6, #1D4ED8);
            color: #FFF; border: none; padding: 10px 18px; border-radius: 10px;
            font-weight: 800; font-size: 13px; cursor: pointer;
            display: flex; align-items: center; gap: 6px;
          ">
            🖨️ 인쇄 / PDF 저장
          </button>

          <button id="sim-modal-btn-close" style="
            background: rgba(255, 255, 255, 0.1);
            color: #94A3B8; border: none; padding: 10px 16px; border-radius: 10px;
            font-weight: 800; font-size: 14px; cursor: pointer;
          ">
            ✕ 닫기
          </button>
        </div>
      </div>

      <!-- 모달 본문 영역 (스크롤 가능) -->
      <div id="sim-modal-printable-area" style="padding: 28px 30px; overflow-y: auto; flex: 1;">
        
        <!-- 시나리오 가중치 상태 배너 -->
        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 18px 24px; margin-bottom: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div>
            <div style="font-size:12px; color:#94A3B8;">판매 단가 변동률</div>
            <div style="font-size:18px; font-weight:800; color:#10B981; margin-top:2px;">${pricePercentStr}</div>
          </div>
          <div>
            <div style="font-size:12px; color:#94A3B8;">재배 면적 확장률</div>
            <div style="font-size:18px; font-weight:800; color:#60A5FA; margin-top:2px;">${areaPercentStr}</div>
          </div>
          <div>
            <div style="font-size:12px; color:#94A3B8;">6개년 누적 추정 총수입</div>
            <div style="font-size:18px; font-weight:800; color:#38BDF8; margin-top:2px; font-family: Pretendard, monospace;">${formatMoney(totalRev)}</div>
          </div>
          <div>
            <div style="font-size:12px; color:#94A3B8;">6개년 누적 추정 농가소득</div>
            <div style="font-size:18px; font-weight:800; color:#34D399; margin-top:2px; font-family: Pretendard, monospace;">${formatMoney(totalInc)}</div>
          </div>
        </div>

        <!-- 6개년 장기 상세 사업계획서 표 -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 16px; font-weight: 800; color: #10B981; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            📋 연도별 상세 경영실적 추정 스케줄 (2025 ~ 2030)
          </h3>

          <div class="data-table-container">
            <table class="data-table" style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px;">
              <thead>
                <tr style="background: rgba(16, 185, 129, 0.2); color: #A7F3D0;">
                  <th style="padding: 12px; text-align: center;">경영연차</th>
                  <th style="padding: 12px; text-align: center;">해당연도</th>
                  <th style="padding: 12px; text-align: right;">추정 총수입(매출액)</th>
                  <th style="padding: 12px; text-align: right; color:#F87171;">추정 경영비(원가)</th>
                  <th style="padding: 12px; text-align: right; color:#34D399;">추정 농가소득</th>
                  <th style="padding: 12px; text-align: right; color:#60A5FA;">누적 농가소득</th>
                  <th style="padding: 12px; text-align: right; color:#FBBF24;">손익분기율(BEP)</th>
                  <th style="padding: 12px; text-align: center;">소득 성장률</th>
                </tr>
              </thead>
              <tbody>
                ${(() => {
                  let cumInc = 0;
                  let prevInc = 0;
                  return yearProjections.map((yp, idx) => {
                    const rev = parseNum(yp.revenue);
                    const exp = parseNum(yp.expense);
                    const inc = parseNum(yp.income);
                    cumInc += inc;
                    const bep = rev > 0 ? Number(((exp / rev) * 100).toFixed(1)) : 0;

                    let growthStr = '-';
                    if (idx > 0 && prevInc > 0) {
                      const g = (((inc - prevInc) / prevInc) * 100).toFixed(1);
                      growthStr = `<span style="color:#34D399; font-weight:700;">+${g}%</span>`;
                    }
                    prevInc = inc;

                    return `
                      <tr style="background: rgba(255, 255, 255, 0.02);">
                        <td style="padding: 10px; text-align: center; font-weight: 800; color: #10B981;">${yp.year}년차</td>
                        <td style="padding: 10px; text-align: center; color: #94A3B8;">${currentYear + idx}년</td>
                        <td style="padding: 10px; text-align: right; font-weight: 800; color: #38BDF8; font-family: Pretendard, monospace;">${formatMoney(rev)}</td>
                        <td style="padding: 10px; text-align: right; font-weight: 700; color: #F87171; font-family: Pretendard, monospace;">${formatMoney(exp)}</td>
                        <td style="padding: 10px; text-align: right; font-weight: 900; color: #34D399; font-family: Pretendard, monospace;">${formatMoney(inc)}</td>
                        <td style="padding: 10px; text-align: right; font-weight: 800; color: #60A5FA; font-family: Pretendard, monospace;">${formatMoney(cumInc)}</td>
                        <td style="padding: 10px; text-align: right; font-weight: 800; color: #FBBF24;">${bep}%</td>
                        <td style="padding: 10px; text-align: center;">${growthStr}</td>
                      </tr>
                    `;
                  }).join('');
                })()}
              </tbody>
              <tfoot style="background: rgba(16, 185, 129, 0.25); font-weight: 900; font-size: 14px;">
                <tr>
                  <td colspan="2" style="padding: 14px; text-align: center; color: #A7F3D0;">6개년 총합계 및 누적 성과:</td>
                  <td style="padding: 14px; text-align: right; color: #38BDF8; font-family: Pretendard, monospace;">${formatMoney(totalRev)}</td>
                  <td style="padding: 14px; text-align: right; color: #F87171; font-family: Pretendard, monospace;">${formatMoney(totalExp)}</td>
                  <td style="padding: 14px; text-align: right; color: #34D399; font-family: Pretendard, monospace;">${formatMoney(totalInc)}</td>
                  <td style="padding: 14px; text-align: right; color: #60A5FA; font-family: Pretendard, monospace;">${formatMoney(totalInc)}</td>
                  <td style="padding: 14px; text-align: right; color: #FBBF24;">${avgBep}%</td>
                  <td style="padding: 14px; text-align: center; color: #A7F3D0;">6년 누적계</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- 20년 차 베테랑 경영컨설턴트 장기 비전 및 전략 가이드 -->
        <div style="background: linear-gradient(135deg, #1E293B, #0F172A); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 14px; padding: 20px; color: #FFF;">
          <h4 style="font-size: 15px; font-weight: 800; color: #10B981; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            💡 20년 차 베테랑 농업 경영컨설턴트 장기 로드맵 처방전
          </h4>
          <p style="font-size: 12.5px; color: #CBD5E1; line-height: 1.6; margin: 0;">
            • <b>6개년 누적 목표 소득 달성 전략</b>: 본 사업계획서에 따르면 6개년간 총 <b>${formatMoney(totalInc)}의 농가소득</b>이 창출될 것으로 예상됩니다.<br/>
            • <b>손익분기점(BEP) 관리</b>: 평균 경영비 비율은 <b>${avgBep}%</b> 수준으로, 시설 안정화 및 고용인건비/광열비 절감을 통해 BEP를 50% 이하로 낮추는 원가 절감 전략이 지속 필요합니다.<br/>
            • <b>재무 건전성 및 부채 상환</b>: 창출되는 농가소득의 최소 30%를 대출 원금 균등 상환 재원으로 적립하여 5년차 이후 거치기간 종료 시의 이자 부담을 적극 방어하십시오.
          </p>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  // Modal Events
  document.getElementById('sim-modal-btn-close').addEventListener('click', () => {
    document.body.removeChild(modalOverlay);
  });

  document.getElementById('sim-modal-btn-excel').addEventListener('click', () => {
    exportSimulationExcel(simData, farmModel, priceMult, areaMult);
  });

  document.getElementById('sim-modal-btn-print').addEventListener('click', () => {
    window.print();
  });
}

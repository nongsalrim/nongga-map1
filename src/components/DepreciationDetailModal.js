/**
 * @file DepreciationDetailModal.js
 * @description 🏗️ 건립/취득연도 vs 현재시점 기준 5개년 자산 감가상각비 정밀 명세서 모달 & 엑셀/PDF 다운로드 엔진
 */

const parseNum = (val) => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleanStr = String(val).replace(/,/g, '').replace(/%/g, '').replace(/원/g, '').trim();
  return Number(cleanStr) || 0;
};

const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(parseNum(val))) + ' 원';
const formatComma = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(parseNum(val)));

export function calc5YearDepreciationSchedule(assetsList) {
  const assets = assetsList || [];
  const currentYear = new Date().getFullYear();

  let totalAssetVal = 0;
  let totalAnnualDep = 0;
  let total5YearDep = 0;

  const rows = assets.map((a, idx) => {
    const cost = parseNum(a.구입가) || 0;
    const years = parseNum(a.내용년수) || 10;
    const buildYear = parseNum(a.건립년도 || a.buildYear) || (currentYear - 2);
    const endYear = buildYear + years - 1; // 마지막 상각 대상 연도

    const elapsed = Math.max(0, currentYear - buildYear);
    const remainingYears = Math.max(0, years - elapsed);
    const annual = (remainingYears > 0 && years > 0) ? Math.round(cost / years) : 0;
    const bookValue = Math.max(0, cost - (annual * elapsed));

    // 5개년 시뮬레이션 [currentYear, currentYear+1, currentYear+2, currentYear+3, currentYear+4]
    const yearly = [0, 1, 2, 3, 4].map(offset => {
      const targetY = currentYear + offset;
      if (targetY >= buildYear && targetY <= endYear) {
        return annual;
      }
      return 0;
    });

    const total5Y = yearly.reduce((sum, v) => sum + v, 0);

    totalAssetVal += cost;
    totalAnnualDep += annual;
    total5YearDep += total5Y;

    return {
      idx: idx + 1,
      name: a.목록 || a.name || '공사/시설',
      buildYear: buildYear,
      years: years,
      elapsed: elapsed,
      remainingYears: remainingYears,
      cost: cost,
      bookValue: bookValue,
      annual: annual,
      yearlyDep: yearly,
      total5Y: total5Y,
      isCompleted: remainingYears <= 0
    };
  });

  const yearTotals = [0, 1, 2, 3, 4].map(yIdx => rows.reduce((sum, r) => sum + r.yearlyDep[yIdx], 0));

  return {
    rows,
    totalAssetVal,
    totalAnnualDep,
    total5YearDep,
    yearTotals,
    startYear: currentYear
  };
}

export async function exportDepreciationExcel(schedule, farmName = '농가') {
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

  const startY = schedule.startYear || new Date().getFullYear();
  const rows = schedule.rows || [];

  if (window.XLSX) {
    const wb = window.XLSX.utils.book_new();

    const sheetData = [
      [`[${farmName}] 농장 보유자산 건립년도 및 5개년 감가상각비 정밀 명세서`],
      [`작성기준: 현재 시점 ${startY}년 기준 (건립년도 및 잔존수명 자동반영)`],
      [`작성일자: ${new Date().toLocaleDateString('ko-KR')}`],
      [],
      ['연번', '자산/시설 목록명', '건립/취득년도', '내용년수', '경과년수', '잔여수명', '구입가/건립비(원)', '현재 잔존장부가액', '현재 연 상각비', `${startY}년`, `${startY+1}년`, `${startY+2}년`, `${startY+3}년`, `${startY+4}년`, '5개년 상각합계', '상각 상태']
    ];

    rows.forEach(r => {
      sheetData.push([
        r.idx,
        r.name,
        `${r.buildYear}년`,
        `${r.years}년`,
        `${r.elapsed}년`,
        `${r.remainingYears}년`,
        r.cost,
        r.bookValue,
        r.annual,
        r.yearlyDep[0],
        r.yearlyDep[1],
        r.yearlyDep[2],
        r.yearlyDep[3],
        r.yearlyDep[4],
        r.total5Y,
        r.isCompleted ? '상각 완료' : '상각 진행 중'
      ]);
    });

    // Summary Totals Row
    const yt = schedule.yearTotals || [0,0,0,0,0];
    sheetData.push([
      '합계',
      '전체 보유 자산 총계',
      '-',
      '-',
      '-',
      '-',
      schedule.totalAssetVal,
      rows.reduce((s, r) => s + r.bookValue, 0),
      schedule.totalAnnualDep,
      yt[0],
      yt[1],
      yt[2],
      yt[3],
      yt[4],
      schedule.total5YearDep,
      '총계'
    ]);

    const ws = window.XLSX.utils.aoa_to_sheet(sheetData);
    const range = window.XLSX.utils.decode_range(ws['!ref']);

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_ref = window.XLSX.utils.encode_cell({ c: C, r: R });
        if (!ws[cell_ref]) continue;

        const cell = ws[cell_ref];

        if (R === 4) {
          cell.s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "10B981" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
          continue;
        }

        if ([6, 7, 8, 9, 10, 11, 12, 13, 14].includes(C) && typeof cell.v === 'number') {
          cell.z = '#,##0';
          cell.s = { alignment: { horizontal: 'right', vertical: 'center' } };
        } else {
          cell.s = { alignment: { horizontal: 'center', vertical: 'center' } };
        }
      }
    }

    ws['!cols'] = [
      { wch: 6 }, { wch: 25 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 14 }
    ];

    window.XLSX.utils.book_append_sheet(wb, ws, '5개년_감가상각명세');
    window.XLSX.writeFile(wb, `${farmName}_건립년도반영_5개년_감가상각명세.xlsx`);
    return;
  }

  // Fallback CSV (UTF-8 BOM)
  let csv = '\uFEFF';
  csv += `"[${farmName}] 농장 보유자산 건립년도 및 5개년 감가상각비 정밀 명세서"\n`;
  csv += `"작성기준: 현재 시점 ${startY}년 기준 (건립년도 및 잔존수명 자동반영)"\n`;
  csv += `"작성일자: ${new Date().toLocaleDateString('ko-KR')}"\n\n`;
  csv += `"연번","자산/시설 목록명","건립/취득년도","내용년수","경과년수","잔여수명","구입가/건립비(원)","현재 잔존장부가액(원)","현재 연 상각비(원)","${startY}년","${startY+1}년","${startY+2}년","${startY+3}년","${startY+4}년","5개년 상각합계(원)","상각 상태"\n`;

  rows.forEach(r => {
    csv += `${r.idx},"${r.name}","${r.buildYear}년","${r.years}년","${r.elapsed}년","${r.remainingYears}년",${r.cost},${r.bookValue},${r.annual},${r.yearlyDep[0]},${r.yearlyDep[1]},${r.yearlyDep[2]},${r.yearlyDep[3]},${r.yearlyDep[4]},${r.total5Y},"${r.isCompleted ? '상각 완료' : '상각 진행 중'}"\n`;
  });

  const yt = schedule.yearTotals || [0,0,0,0,0];
  csv += `"합계","전체 보유 자산 총계","-","-","-","-",${schedule.totalAssetVal},${rows.reduce((s, r) => s + r.bookValue, 0)},${schedule.totalAnnualDep},${yt[0]},${yt[1]},${yt[2]},${yt[3]},${yt[4]},${schedule.total5YearDep},"총계"\n`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${farmName}_건립년도반영_5개년_감가상각명세.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function openDepreciationModal(farmModel, assetsList) {
  const farmName = farmModel.farmOwner || farmModel.farmName || '농가';
  const schedule = calc5YearDepreciationSchedule(assetsList);
  const startY = schedule.startYear;
  const rows = schedule.rows || [];
  const yearTotals = schedule.yearTotals || [0,0,0,0,0];

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'depreciation-modal-overlay';
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(8px);
    z-index: 9999;
    display: flex; justify-content: center; align-items: center;
    padding: 20px; box-sizing: border-box;
  `;

  modalOverlay.innerHTML = `
    <div style="
      background: #1E293B;
      border: 1px solid rgba(16, 185, 129, 0.4);
      border-radius: 20px;
      width: 100%; max-width: 1200px;
      max-height: 90vh;
      display: flex; flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      overflow: hidden;
      color: #FFF;
      font-family: Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
    ">
      
      <!-- 헤더 -->
      <div style="
        background: linear-gradient(135deg, #0F172A, #1E293B);
        padding: 24px 30px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex; justify-content: space-between; align-items: center;
        flex-wrap: wrap; gap: 12px;
      ">
        <div>
          <span style="background:rgba(16,185,129,0.2); color:#34D399; border:1px solid rgba(16,185,129,0.4); padding:4px 12px; border-radius:12px; font-size:12px; font-weight:700;">
            BUILD YEAR & LIFESPAN AUDIT (현재 시점 ${startY}년 기준)
          </span>
          <h2 style="font-size: 22px; font-weight: 900; color: #FFF; margin-top: 6px; display: flex; align-items: center; gap: 8px;">
            🏗️ [${farmName}] 건립년도 반영 5개년 감가상각비 시뮬레이션 명세서
          </h2>
        </div>

        <div style="display:flex; gap:10px; align-items:center;">
          <button id="dep-modal-btn-excel" style="
            background: linear-gradient(135deg, #059669, #10B981);
            color: #FFF; border: none; padding: 10px 18px; border-radius: 10px;
            font-weight: 800; font-size: 13px; cursor: pointer;
            display: flex; align-items: center; gap: 6px;
            box-shadow: 0 4px 14px rgba(16,185,129,0.3);
          ">
            📊 엑셀 명세서 다운로드
          </button>

          <button id="dep-modal-btn-print" style="
            background: linear-gradient(135deg, #3B82F6, #1D4ED8);
            color: #FFF; border: none; padding: 10px 18px; border-radius: 10px;
            font-weight: 800; font-size: 13px; cursor: pointer;
            display: flex; align-items: center; gap: 6px;
          ">
            🖨️ 인쇄 / PDF 저장
          </button>

          <button id="dep-modal-btn-close" style="
            background: rgba(255, 255, 255, 0.1);
            color: #94A3B8; border: none; padding: 10px 16px; border-radius: 10px;
            font-weight: 800; font-size: 14px; cursor: pointer;
          ">
            ✕ 닫기
          </button>
        </div>
      </div>

      <!-- 본문 테이블 -->
      <div style="padding: 24px 30px; overflow-y: auto; flex: 1;">
        
        <!-- 요약 인사이트 카드 -->
        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 18px 24px; margin-bottom: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div>
            <div style="font-size:12px; color:#94A3B8;">총 자산 구입가 (건립비)</div>
            <div style="font-size:18px; font-weight:800; color:#38BDF8; margin-top:2px; font-family: Pretendard, monospace;">${formatMoney(schedule.totalAssetVal)}</div>
          </div>
          <div>
            <div style="font-size:12px; color:#94A3B8;">현재 총 잔존 장부가액</div>
            <div style="font-size:18px; font-weight:800; color:#60A5FA; margin-top:2px; font-family: Pretendard, monospace;">${formatMoney(rows.reduce((s, r) => s + r.bookValue, 0))}</div>
          </div>
          <div>
            <div style="font-size:12px; color:#94A3B8;">${startY}년 현재 연 감가상각비</div>
            <div style="font-size:18px; font-weight:800; color:#FBBF24; margin-top:2px; font-family: Pretendard, monospace;">${formatMoney(schedule.totalAnnualDep)}</div>
          </div>
          <div>
            <div style="font-size:12px; color:#94A3B8;">5개년 누적 감가상각비</div>
            <div style="font-size:18px; font-weight:800; color:#34D399; margin-top:2px; font-family: Pretendard, monospace;">${formatMoney(schedule.total5YearDep)}</div>
          </div>
        </div>

        <div class="data-table-container">
          <table class="data-table" style="width: 100%; border-collapse: separate; border-spacing: 0; font-size: 12.5px;">
            <thead>
              <tr style="background: rgba(16, 185, 129, 0.2); color: #A7F3D0;">
                <th style="padding: 10px; text-align: center;">연번</th>
                <th style="padding: 10px; text-align: left;">자산/시설 목록명</th>
                <th style="padding: 10px; text-align: center;">건립년도</th>
                <th style="padding: 10px; text-align: center;">내용년수</th>
                <th style="padding: 10px; text-align: center;">경과/잔여</th>
                <th style="padding: 10px; text-align: right;">구입가/건립비</th>
                <th style="padding: 10px; text-align: right; color:#60A5FA;">잔존 장부가액</th>
                <th style="padding: 10px; text-align: right; color:#FBBF24;">현재 연 상각비</th>
                <th style="padding: 10px; text-align: right;">${startY}년</th>
                <th style="padding: 10px; text-align: right;">${startY+1}년</th>
                <th style="padding: 10px; text-align: right;">${startY+2}년</th>
                <th style="padding: 10px; text-align: right;">${startY+3}년</th>
                <th style="padding: 10px; text-align: right;">${startY+4}년</th>
                <th style="padding: 10px; text-align: right; color:#34D399;">5개년 합계</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr style="background: rgba(255, 255, 255, 0.02);">
                  <td style="padding: 10px; text-align: center; color:#94A3B8;">${r.idx}</td>
                  <td style="padding: 10px; font-weight: 700; color:#FFF;">${r.name}</td>
                  <td style="padding: 10px; text-align: center; color:#93C5FD;">${r.buildYear}년</td>
                  <td style="padding: 10px; text-align: center;">${r.years}년</td>
                  <td style="padding: 10px; text-align: center;">
                    ${r.isCompleted 
                      ? `<span style="color:#F87171; font-weight:700;">상각 완료</span>` 
                      : `<span style="color:#34D399; font-weight:700;">${r.elapsed}년/잔여${r.remainingYears}년</span>`}
                  </td>
                  <td style="padding: 10px; text-align: right; font-family: Pretendard, monospace;">${formatMoney(r.cost)}</td>
                  <td style="padding: 10px; text-align: right; color:#60A5FA; font-family: Pretendard, monospace;">${formatMoney(r.bookValue)}</td>
                  <td style="padding: 10px; text-align: right; color:#FBBF24; font-weight: 800; font-family: Pretendard, monospace;">${formatMoney(r.annual)}</td>
                  <td style="padding: 10px; text-align: right; font-family: Pretendard, monospace;">${formatMoney(r.yearlyDep[0])}</td>
                  <td style="padding: 10px; text-align: right; font-family: Pretendard, monospace;">${formatMoney(r.yearlyDep[1])}</td>
                  <td style="padding: 10px; text-align: right; font-family: Pretendard, monospace;">${formatMoney(r.yearlyDep[2])}</td>
                  <td style="padding: 10px; text-align: right; font-family: Pretendard, monospace;">${formatMoney(r.yearlyDep[3])}</td>
                  <td style="padding: 10px; text-align: right; font-family: Pretendard, monospace;">${formatMoney(r.yearlyDep[4])}</td>
                  <td style="padding: 10px; text-align: right; color:#34D399; font-weight: 800; font-family: Pretendard, monospace;">${formatMoney(r.total5Y)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot style="background: rgba(16, 185, 129, 0.25); font-weight: 900; font-size: 13.5px;">
              <tr>
                <td colspan="5" style="padding: 12px; text-align: center; color:#A7F3D0;">합계 및 연도별 추정 감가상각비:</td>
                <td style="padding: 12px; text-align: right; color:#38BDF8; font-family: Pretendard, monospace;">${formatMoney(schedule.totalAssetVal)}</td>
                <td style="padding: 12px; text-align: right; color:#60A5FA; font-family: Pretendard, monospace;">${formatMoney(rows.reduce((s, r) => s + r.bookValue, 0))}</td>
                <td style="padding: 12px; text-align: right; color:#FBBF24; font-family: Pretendard, monospace;">${formatMoney(schedule.totalAnnualDep)}</td>
                <td style="padding: 12px; text-align: right; font-family: Pretendard, monospace;">${formatMoney(yearTotals[0])}</td>
                <td style="padding: 12px; text-align: right; font-family: Pretendard, monospace;">${formatMoney(yearTotals[1])}</td>
                <td style="padding: 12px; text-align: right; font-family: Pretendard, monospace;">${formatMoney(yearTotals[2])}</td>
                <td style="padding: 12px; text-align: right; font-family: Pretendard, monospace;">${formatMoney(yearTotals[3])}</td>
                <td style="padding: 12px; text-align: right; font-family: Pretendard, monospace;">${formatMoney(yearTotals[4])}</td>
                <td style="padding: 12px; text-align: right; color:#34D399; font-family: Pretendard, monospace;">${formatMoney(schedule.total5YearDep)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  document.getElementById('dep-modal-btn-close').addEventListener('click', () => {
    document.body.removeChild(modalOverlay);
  });

  document.getElementById('dep-modal-btn-excel').addEventListener('click', () => {
    exportDepreciationExcel(schedule, farmName);
  });

  document.getElementById('dep-modal-btn-print').addEventListener('click', () => {
    window.print();
  });
}

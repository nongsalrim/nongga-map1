/**
 * @file DepreciationDetailModal.js
 * @description 🏗️ 5개년 자산 감가상각비 정밀 명세서 모달 & 엑셀/PDF 다운로드 엔진
 */

const XLSX = typeof window !== 'undefined' ? window.XLSX : null;

export function calc5YearDepreciationSchedule(assetsList) {
  const parseNum = (val) => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/%/g, '').replace(/원/g, '').trim();
    return Number(cleanStr) || 0;
  };

  const assets = assetsList || [];
  const currentYear = new Date().getFullYear();

  let totalAssetVal = 0;
  let totalAnnualDep = 0;
  let total5YearDep = 0;

  const rows = assets.map((a, idx) => {
    const cost = parseNum(a.구입가) || 0;
    const years = parseNum(a.내용년수) || 10;
    const annual = years > 0 ? Math.round(cost / years) : 0;

    const yearly = [1, 2, 3, 4, 5].map(y => (y <= years ? annual : 0));
    const total5Y = yearly.reduce((sum, v) => sum + v, 0);

    totalAssetVal += cost;
    totalAnnualDep += annual;
    total5YearDep += total5Y;

    return {
      idx: idx + 1,
      name: a.목록 || a.name || '공사/시설',
      years: years,
      cost: cost,
      annual: annual,
      yearlyDep: yearly,
      total5Y: total5Y
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

export function exportDepreciationExcel(schedule, farmName = '농가') {
  if (!XLSX) {
    alert('XLSX 라이브러리가 로드되지 않았습니다.');
    return;
  }

  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(val);

  const startYear = schedule.startYear;
  const sheetData = [
    [`[${farmName}] 농가 보유 자산 & 5개년 연도별 감가상각비 정밀 명세서`],
    [`작성일자: ${new Date().toLocaleDateString('ko-KR')}`],
    [],
    ['연번', '자산/시설 목록명', '내용년수', '구입가(원)', '연간 감가상각비(원)', `${startYear}년(1년차)`, `${startYear+1}년(2년차)`, `${startYear+2}년(3년차)`, `${startYear+3}년(4년차)`, `${startYear+4}년(5년차)`, '5개년 누적 상각비(원)']
  ];

  schedule.rows.forEach(r => {
    sheetData.push([
      r.idx,
      r.name,
      `${r.years}년`,
      formatMoney(r.cost),
      formatMoney(r.annual),
      formatMoney(r.yearlyDep[0]),
      formatMoney(r.yearlyDep[1]),
      formatMoney(r.yearlyDep[2]),
      formatMoney(r.yearlyDep[3]),
      formatMoney(r.yearlyDep[4]),
      formatMoney(r.total5Y)
    ]);
  });

  // Footer Total Summary
  sheetData.push([
    '합계',
    '전체 자산 및 상각비 총액',
    '-',
    formatMoney(schedule.totalAssetVal),
    formatMoney(schedule.totalAnnualDep),
    formatMoney(schedule.yearTotals[0]),
    formatMoney(schedule.yearTotals[1]),
    formatMoney(schedule.yearTotals[2]),
    formatMoney(schedule.yearTotals[3]),
    formatMoney(schedule.yearTotals[4]),
    formatMoney(schedule.total5YearDep)
  ]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 6 },
    { wch: 25 },
    { wch: 10 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, '5개년_감가상각비_명세서');
  XLSX.writeFile(wb, `${farmName}_5개년_자산감가상각비_명세서.xlsx`);
}

export function renderDepreciationDetailModal(assetsList, farmName = '농가') {
  const schedule = calc5YearDepreciationSchedule(assetsList);
  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(val)) + ' 원';

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'depreciation-modal-overlay';
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(8px);
    z-index: 99999;
    display: flex; justify-content: center; align-items: center;
    padding: 20px;
    box-sizing: border-box;
  `;

  const startYear = schedule.startYear;

  modalOverlay.innerHTML = `
    <div style="background: #1E293B; border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; width: 100%; max-width: 1200px; max-height: 90vh; overflow-y: auto; color: #FFF; padding: 28px 32px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
      
      <!-- 상단 헤더 및 액션 버튼 -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 18px; margin-bottom: 22px; flex-wrap: wrap; gap: 12px;">
        <div>
          <span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #F59E0B; border: 1px solid rgba(245,158,11,0.4); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700;">
            ASSET DEPRECIATION DETAIL REPORT
          </span>
          <h2 style="font-size: 22px; font-weight: 900; color: #FFF; margin-top: 6px;">
            🏗️ 보유 자산 & 5개년 연도별 감가상각비 정밀 명세서
          </h2>
          <p style="font-size: 13px; color: #94A3B8; margin-top: 2px;">
            내용년수별 연간 감가상각비 합계 및 5개년 연도별 상각비 시뮬레이션 명세서입니다.
          </p>
        </div>

        <div style="display: flex; gap: 10px; align-items: center;">
          <button id="btn-dep-excel" style="background: linear-gradient(135deg, #059669, #10B981); color: #FFF; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 800; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(16,185,129,0.3);">
            📊 엑셀 명세서 다운로드
          </button>
          <button id="btn-dep-print" style="background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: #FFF; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 800; font-size: 13px; cursor: pointer; display: flex; align- items: center; gap: 6px;">
            📄 PDF / 인쇄 출력
          </button>
          <button id="btn-close-dep-modal" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #FFF; padding: 10px 16px; border-radius: 10px; font-weight: 800; font-size: 14px; cursor: pointer;">
            ✕ 닫기
          </button>
        </div>
      </div>

      <!-- 3대 요약 KPI 카드 -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div style="background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.1); padding: 16px 20px; border-radius: 12px;">
          <div style="font-size: 12px; color: #94A3B8;">총 자산가액 합계</div>
          <div style="font-size: 20px; font-weight: 900; color: #38BDF8; margin-top: 4px; font-family: Pretendard, monospace;">
            ${formatMoney(schedule.totalAssetVal)}
          </div>
        </div>

        <div style="background: rgba(15,23,42,0.6); border: 1px solid rgba(245,158,11,0.3); padding: 16px 20px; border-radius: 12px;">
          <div style="font-size: 12px; color: #F59E0B; font-weight: 700;">⚡ 연간 감가상각비 총액 (고정비 연동)</div>
          <div style="font-size: 20px; font-weight: 900; color: #F59E0B; margin-top: 4px; font-family: Pretendard, monospace;">
            ${formatMoney(schedule.totalAnnualDep)}
          </div>
        </div>

        <div style="background: rgba(15,23,42,0.6); border: 1px solid rgba(16,185,129,0.3); padding: 16px 20px; border-radius: 12px;">
          <div style="font-size: 12px; color: #34D399; font-weight: 700;">📅 5개년 누적 감가상각비 총액</div>
          <div style="font-size: 20px; font-weight: 900; color: #34D399; margin-top: 4px; font-family: Pretendard, monospace;">
            ${formatMoney(schedule.total5YearDep)}
          </div>
        </div>
      </div>

      <!-- 5개년 연도별 감가상각비 정밀 테이블 -->
      <div class="data-table-container">
        <table class="data-table" style="font-size: 13px; text-align: center;">
          <thead>
            <tr style="background: rgba(59, 130, 246, 0.2); color: #93C5FD;">
              <th style="text-align:center; padding:12px 8px;">연번</th>
              <th style="text-align:left; padding:12px;">자산 / 시설 목록명</th>
              <th style="text-align:center;">내용년수</th>
              <th style="text-align:right;">구입가(원)</th>
              <th style="text-align:right; color:#FBBF24;">연 감가상각비(원)</th>
              <th style="text-align:right;">${startYear}년(1년차)</th>
              <th style="text-align:right;">${startYear+1}년(2년차)</th>
              <th style="text-align:right;">${startYear+2}년(3년차)</th>
              <th style="text-align:right;">${startYear+3}년(4년차)</th>
              <th style="text-align:right;">${startYear+4}년(5년차)</th>
              <th style="text-align:right; color:#34D399;">5개년 합계(원)</th>
            </tr>
          </thead>
          <tbody>
            ${schedule.rows.map(r => `
              <tr>
                <td style="font-weight:700;">${r.idx}</td>
                <td style="text-align:left; font-weight:800; color:#FFF;">${r.name}</td>
                <td><span class="badge" style="background:rgba(255,255,255,0.1); color:#CBD5E1;">${r.years}년</span></td>
                <td style="text-align:right; font-family: Pretendard, monospace;">${formatMoney(r.cost)}</td>
                <td style="text-align:right; color:#FBBF24; font-weight:800; font-family: Pretendard, monospace;">${formatMoney(r.annual)}</td>
                <td style="text-align:right; font-family: Pretendard, monospace;">${formatMoney(r.yearlyDep[0])}</td>
                <td style="text-align:right; font-family: Pretendard, monospace;">${formatMoney(r.yearlyDep[1])}</td>
                <td style="text-align:right; font-family: Pretendard, monospace;">${formatMoney(r.yearlyDep[2])}</td>
                <td style="text-align:right; font-family: Pretendard, monospace;">${formatMoney(r.yearlyDep[3])}</td>
                <td style="text-align:right; font-family: Pretendard, monospace;">${formatMoney(r.yearlyDep[4])}</td>
                <td style="text-align:right; color:#34D399; font-weight:800; font-family: Pretendard, monospace;">${formatMoney(r.total5Y)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot style="background: rgba(16, 185, 129, 0.2); font-weight: 900; font-size: 14px;">
            <tr>
              <td colspan="3" style="text-align:center; color:#A7F3D0; padding:14px;">
                🏛️ 자산 및 감가상각비 총 합계 (TOTAL SUMMARY)
              </td>
              <td style="text-align:right; color:#38BDF8; font-family: Pretendard, monospace;">
                ${formatMoney(schedule.totalAssetVal)}
              </td>
              <td style="text-align:right; color:#FBBF24; font-family: Pretendard, monospace;">
                ${formatMoney(schedule.totalAnnualDep)}
              </td>
              <td style="text-align:right; font-family: Pretendard, monospace;">${formatMoney(schedule.yearTotals[0])}</td>
              <td style="text-align:right; font-family: Pretendard, monospace;">${formatMoney(schedule.yearTotals[1])}</td>
              <td style="text-align:right; font-family: Pretendard, monospace;">${formatMoney(schedule.yearTotals[2])}</td>
              <td style="text-align:right; font-family: Pretendard, monospace;">${formatMoney(schedule.yearTotals[3])}</td>
              <td style="text-align:right; font-family: Pretendard, monospace;">${formatMoney(schedule.yearTotals[4])}</td>
              <td style="text-align:right; color:#34D399; font-family: Pretendard, monospace; font-size:15px;">
                ${formatMoney(schedule.total5YearDep)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  `;

  document.body.appendChild(modalOverlay);

  // Close handlers
  const closeModal = () => {
    if (document.body.contains(modalOverlay)) {
      document.body.removeChild(modalOverlay);
    }
  };

  document.getElementById('btn-close-dep-modal').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Excel Export
  document.getElementById('btn-dep-excel').addEventListener('click', () => {
    exportDepreciationExcel(schedule, farmName);
  });

  // Print PDF
  document.getElementById('btn-dep-print').addEventListener('click', () => {
    window.print();
  });
}

/**
 * @file LoanScheduleModal.js
 * @description 💳 대출 현황 & 26개년 연도별 상환계획 정밀 명세서 모달 및 엑셀 다운로드 엔진 (대출 실행년도 기반 100% 동적 상환 스케줄)
 */

export function calcDetailedLoanSchedule(loansList) {
  const parseNum = (val) => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/%/g, '').replace(/원/g, '').trim();
    return Number(cleanStr) || 0;
  };

  const currentYear = new Date().getFullYear();

  const defaultLoans = [
    { condition: '원리금균등', name: '청창농 사업비 대출', amount: 314000000, startYear: 2026, startDate: '2026-01-01', endDate: '2050-12-31', rate: 0.015, period: 25, grace: 5, zeroYears: 0 },
    { condition: '원금균등', name: '충보 신용보증기금 (이차보전)', amount: 200000000, startYear: 2026, startDate: '2026-01-01', endDate: '2032-12-31', rate: 0.05, period: 7, grace: 2, zeroYears: 5 },
    { condition: '일시상환', name: '운전자금 신용대출', amount: 50000000, startYear: 2026, startDate: '2026-01-01', endDate: '2027-12-31', rate: 0.0509, period: 2, grace: 2, zeroYears: 0 },
    { condition: '일시상환', name: '시설 보구 신용대출', amount: 60000000, startYear: 2026, startDate: '2026-01-01', endDate: '2027-12-31', rate: 0.0508, period: 2, grace: 2, zeroYears: 0 }
  ];

  const loans = (loansList && loansList.length > 0) ? loansList.filter(Boolean).map((l, i) => {
    const sYear = parseNum(l.대출실행년도 || l.startYear || l.year) || currentYear;
    const period = parseNum(l.대출기간 !== undefined ? l.대출기간 : l.period) || 10;
    const grace = parseNum(l.거치기간 !== undefined ? l.거치기간 : l.grace) || 0;
    const zeroYears = parseNum(l.무이자기간 !== undefined ? l.무이자기간 : l.zeroYears) || 0;
    const amount = parseNum(l.대출금액 !== undefined ? l.대출금액 : l.amount) || 0;
    const rVal = parseNum(l.이자율 !== undefined ? l.이자율 : l.rate) || 1.5;
    const rate = rVal > 1 ? rVal / 100 : rVal;
    const condition = l.대출조건 || l.대출종류 || defaultLoans[i % 4].condition;
    const name = l.은행명 || l.name || defaultLoans[i % 4].name;

    return {
      condition,
      name,
      amount,
      startYear: sYear,
      startDate: l.대출일 || `${sYear}-01-01`,
      endDate: l.만기일 || `${sYear + period - 1}-12-31`,
      rate,
      period,
      grace,
      zeroYears
    };
  }) : defaultLoans;

  const totalAmount = loans.reduce((sum, l) => sum + l.amount, 0);

  // Determine starting calendar year for 26-year schedule
  let startCalYear = Math.min(...loans.map(l => l.startYear));
  if (!startCalYear || isNaN(startCalYear) || startCalYear < 2000) startCalYear = currentYear;
  const endCalYear = startCalYear + 25;

  const yearlySchedule = {};
  for (let yr = startCalYear; yr <= endCalYear; yr++) {
    yearlySchedule[yr] = { bal: 0, interest: 0, principal: 0 };
  }

  // Calculate annual schedule per loan
  loans.forEach(loan => {
    let balance = loan.amount;
    const lStart = loan.startYear;
    const period = loan.period;
    const grace = loan.grace;
    const zeroYears = loan.zeroYears;
    const rate = loan.rate;
    const type = loan.condition;
    const repayYears = Math.max(1, period - grace);

    for (let yr = lStart; yr < lStart + period; yr++) {
      if (!yearlySchedule[yr]) {
        yearlySchedule[yr] = { bal: 0, interest: 0, principal: 0 };
      }
      if (balance <= 0) break;

      const loanYearIndex = yr - lStart + 1; // 1..period
      const activeRate = (loanYearIndex <= zeroYears) ? 0 : rate;
      let p = 0;
      let i = Math.round(balance * activeRate);

      if (loanYearIndex <= grace) {
        p = 0;
      } else {
        if (type === '원금균등') {
          p = Math.min(balance, Math.round(loan.amount / repayYears));
        } else if (type === '일시상환') {
          if (loanYearIndex === period) {
            p = balance;
          } else {
            p = 0;
          }
        } else {
          // 원리금균등
          const P = balance;
          const r = activeRate;
          const remYears = Math.max(1, period - loanYearIndex + 1);
          let pmt = 0;
          if (r > 0) {
            pmt = Math.round(P * (r * Math.pow(1 + r, remYears)) / (Math.pow(1 + r, remYears) - 1));
          } else {
            pmt = Math.round(P / remYears);
          }
          p = Math.min(balance, Math.max(0, pmt - i));
        }
      }

      balance = Math.max(0, balance - p);

      yearlySchedule[yr].principal += p;
      yearlySchedule[yr].interest += i;
      yearlySchedule[yr].bal += balance;
    }
  });

  return {
    loans,
    totalAmount,
    yearlySchedule,
    startCalYear,
    endCalYear
  };
}

export async function exportLoanExcel(loansList, farmName = '농가') {
  let XLSX = typeof window !== 'undefined' ? window.XLSX : null;

  if (!XLSX && typeof document !== 'undefined') {
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.onload = () => resolve();
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
      });
      XLSX = window.XLSX;
    } catch (e) {
      console.warn('SheetJS CDN load failed for loan excel:', e);
    }
  }

  const scheduleInfo = calcDetailedLoanSchedule(loansList);
  const loans = scheduleInfo.loans;
  const yearly = scheduleInfo.yearlySchedule;
  const formatMoney = (val) => val === 0 ? '-' : new Intl.NumberFormat('ko-KR').format(Math.round(val));

  // If SheetJS is available
  if (XLSX) {
    const wb = XLSX.utils.book_new();

    const sheetData = [
      [`◎ 대출 현황`, '', '', '', '', '', '', '[단위 : 원, %]'],
      ['대출조건', '은행명', '대출금액', '대출일', '만기일', '이자율', '대출기간', '거치기간']
    ];

    loans.forEach(l => {
      const rateVal = l.rate > 1 ? l.rate / 100 : l.rate;
      const graceStr = l.grace > 0 ? `${l.grace}년 거치` : '-';
      sheetData.push([
        l.condition,
        l.name,
        l.amount,
        l.startDate,
        l.endDate,
        rateVal,
        `${l.period} 년`,
        graceStr
      ]);
    });

    // Summary row
    sheetData.push([
      '합계',
      '',
      scheduleInfo.totalAmount,
      '', '', '', '', ''
    ]);

    sheetData.push([]);
    sheetData.push([`◎ 연도별 상환계획 (${scheduleInfo.startCalYear}년 ~ ${scheduleInfo.endCalYear}년)`, '', '', '', '', '', '', '[단위 : 원]']);
    sheetData.push(['년도', '연말 잔액', '이자', '상환액', '년도', '연말 잔액', '이자', '상환액']);

    const yearsList = Object.keys(yearly).map(Number).sort((a, b) => a - b);
    const halfLen = Math.ceil(yearsList.length / 2);

    for (let i = 0; i < halfLen; i++) {
      const yLeft = yearsList[i];
      const leftData = yearly[yLeft];
      const yRight = yearsList[i + halfLen];
      const rightData = yRight ? yearly[yRight] : null;

      sheetData.push([
        `${yLeft}년`,
        leftData.bal === 0 ? '-' : leftData.bal,
        leftData.interest === 0 ? '-' : leftData.interest,
        leftData.principal === 0 ? '-' : leftData.principal,
        yRight ? `${yRight}년` : '',
        rightData ? (rightData.bal === 0 ? '-' : rightData.bal) : '',
        rightData ? (rightData.interest === 0 ? '-' : rightData.interest) : '',
        rightData ? (rightData.principal === 0 ? '-' : rightData.principal) : ''
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Apply exact alignment & number formatting
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
        if (!ws[cell_ref]) continue;

        const cell = ws[cell_ref];
        const val = cell.v;

        // Cell Alignment & Number Formatting
        if (typeof val === 'number') {
          // If interest rate cell (Column Index 5 in Loan Table)
          if (R >= 2 && R < 2 + loans.length && C === 5) {
            cell.z = '0.00%';
          } else {
            cell.z = '#,##0';
          }
          cell.s = {
            alignment: { horizontal: 'right', vertical: 'center' }
          };
        } else {
          // Text / Date / Condition labels: Center aligned
          cell.s = {
            alignment: { horizontal: 'center', vertical: 'center' }
          };
        }

        // Header Rows Bold & Center
        if (R === 1 || R === 2 + loans.length + 3) {
          cell.s = {
            font: { bold: true },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: "E2E8F0" } }
          };
        }
      }
    }

    ws['!cols'] = [
      { wch: 14 }, { wch: 22 }, { wch: 18 }, { wch: 14 },
      { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 14 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, '대출상환스케줄');
    XLSX.writeFile(wb, `${farmName}_대출상환스케줄_및_연도별상환계획.xlsx`);
    return;
  }

  // Fallback CSV (UTF-8 BOM)
  let csv = '\uFEFF';
  csv += `"◎ 대출 현황",,,,,,,,"[단위 : 원, %]"\n`;
  csv += `"대출조건","은행명","대출금액","대출일","만기일","이자율","대출기간","거치기간"\n`;

  loans.forEach(l => {
    const rateStr = (l.rate > 1 ? l.rate : l.rate * 100).toFixed(2) + '%';
    const graceStr = l.grace > 0 ? `${l.grace}년 거치` : '-';
    csv += `"${l.condition}","${l.name}",${formatMoney(l.amount)},"${l.startDate}","${l.endDate}","${rateStr}","${l.period} 년","${graceStr}"\n`;
  });

  csv += `"합계","",${formatMoney(scheduleInfo.totalAmount)},,,,,\n\n`;
  csv += `"◎ 연도별 상환계획 (${scheduleInfo.startCalYear}년 ~ ${scheduleInfo.endCalYear}년)",,,,,,,,"[단위 : 원]"\n`;
  csv += `"년도","연말 잔액","이자","상환액","년도","연말 잔액","이자","상환액"\n`;

  const yearsList = Object.keys(yearly).map(Number).sort((a, b) => a - b);
  const halfLen = Math.ceil(yearsList.length / 2);

  for (let i = 0; i < halfLen; i++) {
    const yLeft = yearsList[i];
    const leftData = yearly[yLeft];
    const yRight = yearsList[i + halfLen];
    const rightData = yRight ? yearly[yRight] : null;

    csv += `"${yLeft}년",${leftData.bal === 0 ? '-' : formatMoney(leftData.bal)},${leftData.interest === 0 ? '-' : formatMoney(leftData.interest)},${leftData.principal === 0 ? '-' : formatMoney(leftData.principal)},"${yRight ? yRight + '년' : ''}",${rightData ? (rightData.bal === 0 ? '-' : formatMoney(rightData.bal)) : ''},${rightData ? (rightData.interest === 0 ? '-' : formatMoney(rightData.interest)) : ''},${rightData ? (rightData.principal === 0 ? '-' : formatMoney(rightData.principal)) : ''}\n`;
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${farmName}_대출상환스케줄_및_연도별상환계획.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function renderLoanScheduleModal(loansList, farmName = '농가') {
  const scheduleInfo = calcDetailedLoanSchedule(loansList);
  const loans = scheduleInfo.loans;
  const yearly = scheduleInfo.yearlySchedule;

  const formatMoney = (val) => val === 0 ? '-' : new Intl.NumberFormat('ko-KR').format(Math.round(val)) + ' 원';

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'loan-modal-overlay';
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

  const yearsList = Object.keys(yearly).map(Number).sort((a, b) => a - b);
  const halfLen = Math.ceil(yearsList.length / 2);

  let yearlyRowsHtml = '';
  for (let i = 0; i < halfLen; i++) {
    const yLeft = yearsList[i];
    const leftData = yearly[yLeft];
    const yRight = yearsList[i + halfLen];
    const rightData = yRight ? yearly[yRight] : null;

    yearlyRowsHtml += `
      <tr>
        <td style="text-align:center; font-weight:700; background:rgba(255,255,255,0.03);">${yLeft}년</td>
        <td style="text-align:right; font-family:Pretendard, monospace;">${leftData.bal === 0 ? '-' : formatMoney(leftData.bal)}</td>
        <td style="text-align:right; color:#FBBF24; font-family:Pretendard, monospace;">${formatMoney(leftData.interest)}</td>
        <td style="text-align:right; color:#34D399; font-weight:800; font-family:Pretendard, monospace;">${formatMoney(leftData.principal)}</td>

        <td style="text-align:center; border-left: 2px solid rgba(255,255,255,0.2); font-weight:700; background:rgba(255,255,255,0.03);">${yRight ? yRight + '년' : ''}</td>
        <td style="text-align:right; font-family:Pretendard, monospace;">${rightData ? (rightData.bal === 0 ? '-' : formatMoney(rightData.bal)) : ''}</td>
        <td style="text-align:right; color:#FBBF24; font-family:Pretendard, monospace;">${rightData ? formatMoney(rightData.interest) : ''}</td>
        <td style="text-align:right; color:#34D399; font-weight:800; font-family:Pretendard, monospace;">${rightData ? formatMoney(rightData.principal) : ''}</td>
      </tr>
    `;
  }

  modalOverlay.innerHTML = `
    <div style="background: #1E293B; border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; width: 100%; max-width: 1250px; max-height: 92vh; overflow-y: auto; color: #FFF; padding: 28px 32px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
      
      <!-- 상단 헤더 및 다운로드 액션 -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 18px; margin-bottom: 22px; flex-wrap: wrap; gap: 12px;">
        <div>
          <span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #FCA5A5; border: 1px solid rgba(239,68,68,0.4); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700;">
            EXCEL FINANCIAL SCHEDULE REPORT
          </span>
          <h2 style="font-size: 22px; font-weight: 900; color: #FFF; margin-top: 6px;">
            💳 대출 상환 스케줄 & 26개년 연도별 상환계획 정밀 명세서
          </h2>
          <p style="font-size: 13px; color: #94A3B8; margin-top: 2px;">
            보유 대출금별 조건 및 ${scheduleInfo.startCalYear}~${scheduleInfo.endCalYear}년 26개년 연말 원금잔액/발생이자/원금상환액 정밀 스케줄표입니다.
          </p>
        </div>

        <div style="display: flex; gap: 10px; align-items: center;">
          <button id="btn-loan-excel" style="background: linear-gradient(135deg, #059669, #10B981); color: #FFF; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 800; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(16,185,129,0.3);">
            📊 대출 스케줄 엑셀 다운로드
          </button>
          <button id="btn-loan-print" style="background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: #FFF; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 800; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            📄 PDF / 인쇄 출력
          </button>
          <button id="btn-close-loan-modal" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #FFF; padding: 10px 16px; border-radius: 10px; font-weight: 800; font-size: 14px; cursor: pointer;">
            ✕ 닫기
          </button>
        </div>
      </div>

      <!-- Section 1: ◎ 대출 현황 (Table matching Excel) -->
      <div style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h3 style="font-size: 16px; font-weight: 800; color: #60A5FA;">◎ 대출 현황</h3>
          <span style="font-size: 12px; color: #94A3B8;">[단위 : 원, %]</span>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr style="background: rgba(30, 58, 138, 0.3); color: #93C5FD;">
                <th style="text-align:center;">대출조건</th>
                <th style="text-align:center;">은행명 / 사업명</th>
                <th class="num">대출금액</th>
                <th style="text-align:center;">대출일</th>
                <th style="text-align:center;">만기일</th>
                <th class="num">이자율</th>
                <th style="text-align:center;">대출기간</th>
                <th style="text-align:center;">거치기간</th>
              </tr>
            </thead>
            <tbody>
              ${loans.map(l => {
                const rateStr = (l.rate > 1 ? l.rate : l.rate * 100).toFixed(2) + '%';
                const graceStr = l.grace > 0 ? `${l.grace}년 거치` : '-';
                return `
                  <tr>
                    <td style="text-align:center;"><span class="badge" style="background:rgba(59,130,246,0.15); color:#60A5FA;">${l.condition}</span></td>
                    <td style="text-align:center; font-weight:800; color:#FFF;">${l.name}</td>
                    <td style="text-align:right; font-family:Pretendard, monospace; font-weight:700;">${formatMoney(l.amount)}</td>
                    <td style="text-align:center;">${l.startDate}</td>
                    <td style="text-align:center;">${l.endDate}</td>
                    <td style="text-align:right; color:#FBBF24; font-weight:800;">${rateStr}</td>
                    <td style="text-align:center;">${l.period} 년</td>
                    <td style="text-align:center; color:#A7F3D0;">${graceStr}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot style="background: rgba(239, 68, 68, 0.15); font-weight: 900; font-size: 14px;">
              <tr>
                <td colspan="2" style="text-align:center; color:#FCA5A5; padding:12px;">합계 (TOTAL)</td>
                <td style="text-align:right; color:#FCA5A5; font-family:Pretendard, monospace; font-size:15px;">${formatMoney(scheduleInfo.totalAmount)}</td>
                <td colspan="5"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Section 2: ◎ 연도별 상환계획 (2-Column Side-by-Side Split Table matching Excel) -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h3 style="font-size: 16px; font-weight: 800; color: #34D399;">◎ 연도별 상환계획 (${scheduleInfo.startCalYear}년 ~ ${scheduleInfo.endCalYear}년)</h3>
          <span style="font-size: 12px; color: #94A3B8;">[단위 : 원]</span>
        </div>

        <div class="data-table-container">
          <table class="data-table" style="font-size: 13px;">
            <thead>
              <tr style="background: rgba(16, 185, 129, 0.2); color: #A7F3D0;">
                <th style="width:7%; text-align:center;">년도</th>
                <th style="text-align:right; width:18%;">연말 잔액</th>
                <th style="text-align:right; color:#FBBF24; width:12.5%;">이자</th>
                <th style="text-align:right; color:#34D399; width:12.5%;">상환액</th>

                <th style="width:7%; text-align:center; border-left:2px solid rgba(255,255,255,0.2);">년도</th>
                <th style="text-align:right; width:18%;">연말 잔액</th>
                <th style="text-align:right; color:#FBBF24; width:12.5%;">이자</th>
                <th style="text-align:right; color:#34D399; width:12.5%;">상환액</th>
              </tr>
            </thead>
            <tbody>
              ${yearlyRowsHtml}
            </tbody>
          </table>
        </div>
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

  document.getElementById('btn-close-loan-modal').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Excel Export
  document.getElementById('btn-loan-excel').addEventListener('click', async () => {
    const btn = document.getElementById('btn-loan-excel');
    const origText = btn.innerHTML;
    btn.innerHTML = '⌛ 엑셀 생성 중...';
    btn.disabled = true;
    try {
      await exportLoanExcel(loans, farmName);
    } catch (err) {
      console.error('Loan excel export error:', err);
    } finally {
      btn.innerHTML = origText;
      btn.disabled = false;
    }
  });

  // Print PDF
  document.getElementById('btn-loan-print').addEventListener('click', () => {
    window.print();
  });
}

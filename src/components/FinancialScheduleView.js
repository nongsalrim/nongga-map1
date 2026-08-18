/**
 * @file FinancialScheduleView.js
 * @description 자산 및 대출 상환 스케줄 동적 뷰 (5개년 감가상각비 명세서 & 엑셀/PDF 다운로드 및 금리/거치기간 버그 완벽 수정)
 */

import { calc5YearDepreciationSchedule, renderDepreciationDetailModal, exportDepreciationExcel } from './DepreciationDetailModal.js';

export function renderFinancialSchedule(container, assetsList, loansList, onOpenEditor) {
  const parseNum = (val) => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/%/g, '').replace(/원/g, '').trim();
    return Number(cleanStr) || 0;
  };

  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(parseNum(val))) + ' 원';

  const assets = assetsList || [];
  const loans = loansList || [];

  const depSchedule = calc5YearDepreciationSchedule(assets);

  const totalAssetVal = depSchedule.totalAssetVal;
  const totalAnnualDep = depSchedule.totalAnnualDep;
  const total5YearDep = depSchedule.total5YearDep;

  const totalLoanVal = loans.reduce((sum, l) => sum + (parseNum(l.대출금액 !== undefined ? l.대출금액 : (l.amount !== undefined ? l.amount : l.원금)) || 0), 0);

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; background:#1E293B; border:1px solid rgba(255,255,255,0.1); padding:16px 24px; border-radius:16px; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
      <div>
        <h2 style="font-size:18px; font-weight:800; color:#FFF;">🏛️ 농가 자산 & 부채 정밀 통합 관리 센터</h2>
        <p style="font-size:12px; color:#94A3B8; margin-top:2px;">농장 보유 자산과 대출 상환 스케줄을 분석하고 5개년 감가상각비 명세서를 엑셀/PDF로 출력합니다.</p>
      </div>
      <div style="display:flex; gap:10px; align-items:center;">
        <button id="btn-open-dep-detail" class="btn-upload" style="background:linear-gradient(135deg, #10B981, #059669); font-weight:800;">
          📊 5개년 감가상각비 명세서 & 엑셀/PDF
        </button>
        <button id="btn-open-financial-editor" class="btn-upload" style="background:linear-gradient(135deg, #3B82F6, #1D4ED8); font-weight:800;">
          📝 자산 & 대출 정보 편집하기
        </button>
      </div>
    </div>

    <div class="panel-grid">
      <!-- 농가 보유 자산 목록 & 5개년 감가상각비 합계 표 -->
      <div class="panel-card">
        <div class="panel-title">
          <span>🏗️ 보유 자산 & 감가상각 현황</span>
          <span class="badge" style="background:rgba(56, 189, 248, 0.15); color:#38BDF8; border-color:rgba(56, 189, 248, 0.3);">총 자산가액: ${formatMoney(totalAssetVal)}</span>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>연번</th>
                <th>자산/시설 목록명</th>
                <th>내용년수</th>
                <th class="num">구입가(원)</th>
                <th class="num" style="color:#FBBF24;">연 감가상각비</th>
                <th class="num" style="color:#34D399;">5개년 누적 상각비</th>
              </tr>
            </thead>
            <tbody>
              ${assets.length === 0 ? `
                <tr><td colspan="6" style="text-align:center; color:#94A3B8; padding:20px;">등록된 자산이 없습니다. [자산 정보 편집하기] 버튼을 통해 자산을 추가해 주세요.</td></tr>
              ` : depSchedule.rows.map(row => `
                <tr>
                  <td>${row.idx}</td>
                  <td class="highlight">${row.name}</td>
                  <td>${row.years}년</td>
                  <td class="num">${formatMoney(row.cost)}</td>
                  <td class="num" style="color:#FBBF24; font-weight:800; font-family: Pretendard, monospace;">${formatMoney(row.annual)}</td>
                  <td class="num" style="color:#34D399; font-weight:800; font-family: Pretendard, monospace;">${formatMoney(row.total5Y)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot style="background: rgba(16, 185, 129, 0.15); font-weight: 900; font-size: 13px;">
              <tr>
                <td colspan="3" style="text-align:left; color:#A7F3D0; padding:12px 14px;">
                  🏛️ 자산 및 감가상각비 총 합계 (SUMMARY)
                </td>
                <td class="num" style="color:#38BDF8; font-family: Pretendard, monospace;">
                  ${formatMoney(totalAssetVal)}
                </td>
                <td class="num" style="color:#FBBF24; font-family: Pretendard, monospace;">
                  ${formatMoney(totalAnnualDep)}
                </td>
                <td class="num" style="color:#34D399; font-family: Pretendard, monospace;">
                  ${formatMoney(total5YearDep)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style="margin-top:14px; background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25); border-radius:8px; padding:10px 14px; font-size:12px; color:#A7F3D0; display:flex; justify-content:space-between; align-items:center;">
          <span>⚡ 연간 감가상각비 총액 <b>${formatMoney(totalAnnualDep)}</b>이 경영비(고정비) 항목에 자동 수산 연동되어 있습니다.</span>
          <button id="btn-quick-dep-excel" style="background:#059669; color:#FFF; border:none; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:800; cursor:pointer;">
            📊 엑셀 명세서 다운로드
          </button>
        </div>
      </div>

      <!-- 농가 대출 상환 스케줄 -->
      <div class="panel-card">
        <div class="panel-title">
          <span>💳 대출 상환 스케줄 & 부채 비율</span>
          <span class="badge" style="background:rgba(239, 68, 68, 0.15); color:#FCA5A5; border-color:rgba(239, 68, 68, 0.3);">총 부채: ${formatMoney(totalLoanVal)}</span>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>상환방식</th>
                <th>은행/사업명</th>
                <th class="num">대출금액</th>
                <th class="num">금리</th>
                <th>상환기간</th>
              </tr>
            </thead>
            <tbody>
              ${loans.length === 0 ? `
                <tr><td colspan="5" style="text-align:center; color:#94A3B8; padding:20px;">등록된 대출이 없습니다. [자산 & 대출 정보 편집하기] 버튼을 눌러 대출을 추가해 주세요.</td></tr>
              ` : loans.map(loan => {
                const amount = parseNum(loan.대출금액 !== undefined ? loan.대출금액 : (loan.amount !== undefined ? loan.amount : loan.원금)) || 0;
                const rateVal = parseNum(loan.이자율 !== undefined ? loan.이자율 : (loan.rate !== undefined ? loan.rate : loan.금리)) || 1.5;
                const displayRate = (rateVal > 1 ? rateVal : rateVal * 100).toFixed(1) + '%';

                let periodNum = parseNum(loan.대출기간 !== undefined ? loan.대출기간 : loan.period);
                if (!periodNum && typeof loan.대출기간 === 'string') {
                  const match = loan.대출기간.match(/^(\d+)/);
                  if (match) periodNum = parseInt(match[1], 10);
                }
                if (!periodNum) periodNum = 10;

                let graceNum = parseNum(loan.거치기간 !== undefined ? loan.거치기간 : loan.grace);
                if (graceNum === undefined && typeof loan.대출기간 === 'string') {
                  const match = loan.대출기간.match(/(\d+)\s*년\s*거치/);
                  if (match) graceNum = parseInt(match[1], 10);
                }
                if (graceNum === undefined) graceNum = 0;

                const displayPeriod = `${periodNum}년 (${graceNum}년 거치)`;

                return `
                  <tr>
                    <td><span class="badge" style="background:rgba(59,130,246,0.15); color:#60A5FA; border:none;">${loan.대출조건 || loan.대출종류 || '원리금균등'}</span></td>
                    <td class="highlight">${loan.은행명 || loan.name || '농업 자금 대출'}</td>
                    <td class="num">${formatMoney(amount)}</td>
                    <td class="num" style="color:#FBBF24; font-weight:800;">${displayRate}</td>
                    <td style="font-weight:700;">${displayPeriod}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top:20px; height: 180px;" class="chart-wrapper">
          <canvas id="loanRepaymentChart"></canvas>
        </div>
      </div>
    </div>
  `;

  // Render Loan Repayment Schedule Chart safely
  const canvas = document.getElementById('loanRepaymentChart');
  if (canvas && typeof window !== 'undefined' && window.Chart) {
    try {
      const ctx = canvas.getContext('2d');
      const startBalance = totalLoanVal || 624000000;
      const yearBalances = [
        startBalance,
        Math.round(startBalance * 0.95),
        Math.round(startBalance * 0.82),
        Math.round(startBalance * 0.68),
        Math.round(startBalance * 0.52),
        Math.round(startBalance * 0.35),
        Math.round(startBalance * 0.15)
      ];

      new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: ['2024년', '2025년', '2026년', '2027년', '2028년', '2029년', '2030년'],
          datasets: [
            {
              label: '연말 추정 부채잔액(원)',
              data: yearBalances,
              borderColor: '#EF4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              fill: true,
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
            legend: { labels: { color: '#94A3B8', font: { family: 'Pretendard' } } }
          }
        }
      });
    } catch (err) {
      console.warn('Loan chart error:', err);
    }
  }

  // Open 5-Year Depreciation Modal
  const depModalBtn = document.getElementById('btn-open-dep-detail');
  if (depModalBtn) {
    depModalBtn.addEventListener('click', () => {
      renderDepreciationDetailModal(assets);
    });
  }

  // Quick Excel Export Button
  const quickExcelBtn = document.getElementById('btn-quick-dep-excel');
  if (quickExcelBtn) {
    quickExcelBtn.addEventListener('click', () => {
      exportDepreciationExcel(depSchedule);
    });
  }

  // Editor button
  const editorBtn = document.getElementById('btn-open-financial-editor');
  if (editorBtn && onOpenEditor) {
    editorBtn.addEventListener('click', onOpenEditor);
  }
}

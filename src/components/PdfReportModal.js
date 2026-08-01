/**
 * @file PdfReportModal.js
 * @description 농가살림연구소(주) 공식 경영진단 컨설팅 보고서 (PDF 출력 및 엑셀 다운로드 팝업)
 */

export function renderPdfReportModal(model, analysis, onClose) {
  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(val) + ' 원';
  const todayStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'pdf-modal-overlay';
  modalOverlay.innerHTML = `
    <div class="pdf-modal-container">
      <div class="pdf-modal-header">
        <h2>📄 농가살림연구소(주) 공식 경영진단 보고서</h2>
        <div class="pdf-modal-actions">
          <button id="pdf-print-btn" class="btn-upload" style="background:#10B981;">🖨️ PDF/인쇄 다운로드</button>
          <button id="pdf-close-btn" style="background:transparent; border:none; color:#FFF; font-size:24px; cursor:pointer;">&times;</button>
        </div>
      </div>

      <div id="pdf-report-content" class="printable-report-page">
        <div class="report-header">
          <div class="report-brand">
            <div class="report-logo">농</div>
            <div>
              <h1 class="report-company-name">농가살림연구소(주)</h1>
              <p class="report-subtitle">NONGGA SALIM RESEARCH INSTITUTE CO., LTD.</p>
            </div>
          </div>
          <div class="report-meta">
            <div><strong>발행일자:</strong> ${todayStr}</div>
            <div><strong>문서번호:</strong> MAP1-DIAG-${Date.now().toString().slice(-6)}</div>
            <div><strong>진단작목:</strong> ${model.cropName}</div>
          </div>
        </div>

        <hr class="report-divider" />

        <!-- 1. 종합 진단 요약 -->
        <section class="report-section">
          <h2 class="report-section-title">1. 경영진단 종합 성과 평가</h2>
          <div class="grade-banner">
            <div class="grade-badge-circle">${analysis.grade.slice(0, 1)}</div>
            <div>
              <div class="grade-title">종합 평가 등급: <strong>${analysis.grade}</strong> (진단 점수: ${analysis.score}점)</div>
              <p class="grade-desc">
                본 진단서는 농진청 <strong>농산물 소득조사표</strong> 기준 및 <strong>KAMIS 한국농수산식품유통공사</strong> 유통시세 DB를 연동하여 분석된 정밀 종합 진단서입니다.
              </p>
            </div>
          </div>

          <div class="report-kpi-grid">
            <div class="report-kpi-box">
              <span class="label">연간 총수입 (매출액)</span>
              <span class="val">${formatMoney(model.revenue)}</span>
            </div>
            <div class="report-kpi-box">
              <span class="label">연간 경영비</span>
              <span class="val" style="color:#DC2626;">${formatMoney(model.operatingExpenses)}</span>
            </div>
            <div class="report-kpi-box">
              <span class="label">농가 소득</span>
              <span class="val" style="color:#059669;">${formatMoney(model.income)}</span>
            </div>
            <div class="report-kpi-box">
              <span class="label">손익분기율 (BEP)</span>
              <span class="val" style="color:#D97706;">${((model.operatingExpenses / model.revenue) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </section>

        <!-- 2. 소득조사표 및 KAMIS 연동 원가 분석 -->
        <section class="report-section">
          <h2 class="report-section-title">2. KAMIS & 소득조사표 연동 원가비목 정밀 진단</h2>
          <table class="report-table">
            <thead>
              <tr>
                <th>비목명</th>
                <th class="num">농가 집계금액(원)</th>
                <th class="num">농가 비중</th>
                <th class="num">KAMIS 표준 비중</th>
                <th class="num">차이(Gap)</th>
                <th>진단 처방</th>
              </tr>
            </thead>
            <tbody>
              ${analysis.costAnalysis.map(c => `
                <tr>
                  <td><strong>${c.name}</strong></td>
                  <td class="num">${formatMoney(c.farmCost)}</td>
                  <td class="num">${c.farmPercent}%</td>
                  <td class="num">${c.stdPercent}%</td>
                  <td class="num" style="color:${c.diffPercent > 0 ? '#DC2626' : '#059669'};">
                    ${c.diffPercent > 0 ? '+' : ''}${c.diffPercent}%
                  </td>
                  <td>${c.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>

        <!-- 3. KAMIS 유통시세 & 수취단가 진단 -->
        <section class="report-section">
          <h2 class="report-section-title">3. KAMIS 시장 시세 및 유통구조 진단</h2>
          <div class="report-callout">
            <p><strong>· 농가 추정 수취 단가:</strong> ${formatMoney(analysis.farmPricePerKg)} / kg</p>
            <p><strong>· KAMIS 최근 도매 시세:</strong> ${formatMoney(analysis.kamisRef.recentWholesalePrice)} / kg (5년 평균: ${formatMoney(analysis.kamisRef.avg5YearPrice)} / kg)</p>
            <p><strong>· 유통 개선 제언:</strong> ${analysis.priceAdvice}</p>
            <p><strong>· 직거래 20% 확대 시 소득 증가액:</strong> <span style="color:#059669; font-weight:bold;">+${formatMoney(analysis.directSalesGain)}</span> (추정 소득: ${formatMoney(analysis.expectedIncomeAfterDirect)})</p>
          </div>
        </section>

        <!-- 4. 전문가 개선 액션 플랜 -->
        <section class="report-section">
          <h2 class="report-section-title">4. 농가살림연구소(주) 수석 컨설턴트 개선 처방전 (Action Plan)</h2>
          <ul class="report-action-list">
            <li><strong>비용 절감 액션:</strong> 경영비 비목 중 비중이 높게 집계된 항목의 공동 구매 및 지원 사업 확대를 통한 경영비 5~10% 절감 추진.</li>
            <li><strong>단가 상승 액션:</strong> KAMIS 도매시장 출하 시기 모니터링을 통한 출하 시점 다변화 및 규격화로 수취 단가 제고.</li>
            <li><strong>재무 안정성 액션:</strong> 6개년 사업계획 수립을 통한 대출 상환 스케줄 준수 및 고정 자산 시설상각 관리 강화.</li>
          </ul>
        </section>

        <div class="report-footer">
          <p>농가살림연구소(주) 경영분석 자동화 솔루션 (MAP1) | TEL: 041-000-0000 | www.nonggasalim.co.kr</p>
          <div class="report-seal">농가살림연구소(주) [직인생략]</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  // Print button listener
  document.getElementById('pdf-print-btn').addEventListener('click', () => {
    window.print();
  });

  // Close button listener
  const close = () => {
    modalOverlay.remove();
    if (onClose) onClose();
  };

  document.getElementById('pdf-close-btn').addEventListener('click', close);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) close();
  });
}

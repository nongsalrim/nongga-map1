/**
 * @file KpiSummaryCards.js
 * @description 컨설팅 리포트 상단 4대 핵심 KPI 요약 카드 (고대비 선명 컬러 및 프리미엄 글래스모피즘)
 */

export function renderKpiCards(container, data) {
  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(val || 0)) + '원';
  const formatPercent = (val) => (val || 0).toFixed(1) + '%';

  const expenses = data.expenses || data.operatingExpenses || 0;
  const revenue = data.revenue || 1;
  const incomeRate = (data.income / revenue) * 100;
  const expenseRate = (expenses / revenue) * 100;

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
      
      <!-- Card 1: 총수입 -->
      <div style="background: #1E293B; border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 16px; padding: 20px 22px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
        <div style="font-size: 13px; font-weight: 700; color: #94A3B8; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
          <span>총수입 (Gross Revenue)</span>
          <span style="font-size: 16px;">🌾</span>
        </div>
        <div style="font-size: 25px; font-weight: 900; color: #38BDF8; letter-spacing: -0.5px; font-family: Pretendard, monospace;">
          ${formatMoney(data.revenue)}
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #38BDF8; margin-top: 8px; display: flex; align-items: center; gap: 4px;">
          <span>▲ 1000평 / ${data.cycles || 1}기작 기준</span>
        </div>
      </div>

      <!-- Card 2: 경영비 -->
      <div style="background: #1E293B; border: 1px solid rgba(248, 113, 113, 0.4); border-radius: 16px; padding: 20px 22px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
        <div style="font-size: 13px; font-weight: 700; color: #94A3B8; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
          <span>경영비 (Operating Expenses)</span>
          <span style="font-size: 16px;">🏢</span>
        </div>
        <div style="font-size: 25px; font-weight: 900; color: #F87171; letter-spacing: -0.5px; font-family: Pretendard, monospace;">
          ${formatMoney(expenses)}
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #F87171; margin-top: 8px; display: flex; align-items: center; gap: 4px;">
          <span>비중: ${formatPercent(expenseRate)}</span>
        </div>
      </div>

      <!-- Card 3: 농가소득 -->
      <div style="background: #1E293B; border: 1px solid rgba(52, 211, 153, 0.4); border-radius: 16px; padding: 20px 22px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
        <div style="font-size: 13px; font-weight: 700; color: #94A3B8; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
          <span>농가소득 (Farm Income)</span>
          <span style="font-size: 16px;">💰</span>
        </div>
        <div style="font-size: 25px; font-weight: 900; color: #34D399; letter-spacing: -0.5px; font-family: Pretendard, monospace;">
          ${formatMoney(data.income)}
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #34D399; margin-top: 8px; display: flex; align-items: center; gap: 4px;">
          <span>소득률: ${formatPercent(incomeRate)}</span>
        </div>
      </div>

      <!-- Card 4: 추정 순수익 -->
      <div style="background: #1E293B; border: 1px solid rgba(251, 191, 36, 0.4); border-radius: 16px; padding: 20px 22px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
        <div style="font-size: 13px; font-weight: 700; color: #94A3B8; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
          <span>추정 순수익 (Estimated Net Profit)</span>
          <span style="font-size: 16px;">🌟</span>
        </div>
        <div style="font-size: 25px; font-weight: 900; color: #FBBF24; letter-spacing: -0.5px; font-family: Pretendard, monospace;">
          ${formatMoney(data.netProfit)}
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #FBBF24; margin-top: 8px; display: flex; align-items: center; gap: 4px;">
          <span>상각 및 이자비용 반영 후</span>
        </div>
      </div>

    </div>
  `;
}

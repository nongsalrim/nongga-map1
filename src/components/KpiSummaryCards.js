export function renderKpiCards(container, data) {
  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(val) + '원';
  const formatPercent = (val) => val.toFixed(1) + '%';

  const incomeRate = (data.income / data.revenue) * 100;

  container.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">총수입 (Gross Revenue)</div>
        <div class="kpi-value">${formatMoney(data.revenue)}</div>
        <div class="kpi-sub positive">
          <span>▲ 1000평 / ${data.cycles || 1}기작 기준</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-title">경영비 (Operating Expenses)</div>
        <div class="kpi-value" style="color: var(--accent-rose);">${formatMoney(data.expenses || data.operatingExpenses)}</div>
        <div class="kpi-sub warning">
          <span>비중: ${formatPercent(((data.expenses || data.operatingExpenses) / data.revenue) * 100)}</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-title">농가소득 (Farm Income)</div>
        <div class="kpi-value" style="color: var(--primary);">${formatMoney(data.income)}</div>
        <div class="kpi-sub positive">
          <span>소득률: ${formatPercent(incomeRate)}</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-title">추정 순수익 (Estimated Net Profit)</div>
        <div class="kpi-value" style="color: var(--accent-gold);">${formatMoney(data.netProfit)}</div>
        <div class="kpi-sub info">
          <span>상각 및 이자비용 반영 후</span>
        </div>
      </div>
    </div>
  `;
}

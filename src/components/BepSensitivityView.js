/**
 * @file BepSensitivityView.js
 * @description 🎯 6. 손익분기점 (BEP) & 민감도 분석 (경영 20년차 컨설턴트 한계생산성 및 리스크 진단 모듈)
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

  const revenue = parseNum(model.revenue) || 100000000;
  const expenses = parseNum(model.operatingExpenses) || 40000000;
  const income = parseNum(model.income) || (revenue - expenses);
  const yieldKg = parseNum(model.yieldKg) || 20000;
  const pricePerKg = parseNum(model.pricePerKg) || 5000;
  const areaPyung = parseNum(model.areaPyung) || 1000;

  // BEP Calculations
  // 1. BEP Sales Volume (kg) = Total Operating Expenses / Price Per Kg
  const bepYieldKg = pricePerKg > 0 ? Math.round(expenses / pricePerKg) : 0;
  
  // 2. BEP Selling Price (원/kg) = Total Operating Expenses / Total Yield Kg
  const bepPricePerKg = yieldKg > 0 ? Math.round(expenses / yieldKg) : 0;
  
  // 3. Margin of Safety (%) = (Revenue - Expenses) / Revenue * 100
  const marginOfSafety = revenue > 0 ? (((revenue - expenses) / revenue) * 100).toFixed(1) : '0.0';

  // Price difference vs BEP
  const priceBufferPct = pricePerKg > 0 ? (((pricePerKg - bepPricePerKg) / pricePerKg) * 100).toFixed(1) : '0.0';
  const yieldBufferPct = yieldKg > 0 ? (((yieldKg - bepYieldKg) / yieldKg) * 100).toFixed(1) : '0.0';

  // 5x5 Sensitivity Matrix Scenario Generators (Price Variations vs Yield Variations)
  const priceScenarios = [-0.20, -0.10, 0.0, 0.10, 0.20]; // -20%, -10%, 기준, +10%, +20%
  const yieldScenarios = [-0.20, -0.10, 0.0, 0.10, 0.20]; // -20%, -10%, 기준, +10%, +20%

  container.innerHTML = `
    <div style="padding: 10px 0;">
      
      <!-- 상단 안내 헤더 카드 -->
      <div style="background: linear-gradient(135deg, #0F172A, #1E293B); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 24px 28px; margin-bottom: 24px; color: #FFF; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
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

          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 14px 20px; text-align: right;">
            <div style="font-size: 12px; color: #A7F3D0; font-weight: 600;">경영 안전 여유율 (Margin of Safety)</div>
            <div style="font-size: 24px; font-weight: 900; color: #34D399; margin-top: 2px;">
              +${marginOfSafety}%
            </div>
            <div style="font-size: 11px; color: #94A3B8; margin-top: 2px;">매출이 최대 ${marginOfSafety}% 하락해도 흑자 유지</div>
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
        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.15)); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 14px; padding: 20px; color: #FFF;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; color:#A7F3D0; font-weight:700;">컨설턴트 안심 진단</span>
            <span style="font-size:18px;">👨‍🌾</span>
          </div>
          <div style="font-size: 15px; font-weight: 800; color: #FFF; margin-top: 8px;">
            ${Number(marginOfSafety) > 30 ? '🟢 고수익·안전 경영체' : Number(marginOfSafety) > 15 ? '🟡 적정 안전선 경영체' : '🔴 원가 관리 주의 필요'}
          </div>
          <div style="font-size: 12px; color: #CBD5E1; margin-top: 6px; line-height: 1.4;">
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
                      let textColor = simInc >= 0 ? (isBaseline ? '#A7F3D0' : '#34D399') : '#FCA5A5';

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
          <p style="font-size: 13px; color: #CBD5E1; line-height: 1.5;">
            현재 농가의 손익분기 단가는 <b>kg당 ${formatComma(bepPricePerKg)} 원</b>입니다. 
            시세가 -20% 급락하고 수확량이 -10% 감소하는 최악의 고온/가뭄 시나리오에서도 <b>${formatShortMoney((pricePerKg*0.8)*(yieldKg*0.9) - expenses)}</b>의 안정적인 소득을 유지하려면, **고정비 감가상각 절감 및 지자체 에너지 보조금 매칭 전략(7번 탭)**을 수립하는 것을 적극 권장합니다.
          </p>
        </div>
      </div>

    </div>
  `;
}

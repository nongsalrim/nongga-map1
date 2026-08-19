/**
 * @file FarmShareLinkModal.js
 * @description 🔗 특정 농가 전용 1:1 경영진단 카카오톡 공유 링크 생성 & 복사 모달
 */

export function openFarmShareLinkModal(model, activeTab = 'survey') {
  const parseNum = (val) => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/%/g, '').replace(/원/g, '').trim();
    return Number(cleanStr) || 0;
  };

  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(parseNum(val))) + ' 원';
  const formatComma = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(parseNum(val)));

  const farmOwner = model.farmOwner || model.farmName || '농가';
  const cropName = model.cropName || '시설딸기(수경)';
  const areaPyung = parseNum(model.areaPyung) || 1000;
  const region = model.region || '충남';

  // Payload for encryption in URL
  const payloadObj = {
    farmOwner,
    region,
    cropName,
    areaPyung,
    areaM2: parseNum(model.areaM2) || Math.round(areaPyung * 3.3058),
    revenue: parseNum(model.revenue),
    operatingExpenses: parseNum(model.operatingExpenses),
    income: parseNum(model.income),
    yieldKg: parseNum(model.yieldKg),
    pricePerKg: parseNum(model.pricePerKg)
  };

  const base64Data = btoa(encodeURIComponent(JSON.stringify(payloadObj)));

  // Default Base Domain
  let defaultDomain = 'https://nongga-map1.vercel.app';
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    defaultDomain = window.location.origin;
  }

  const generateShareUrl = (domain) => {
    const cleanDomain = domain.trim().replace(/\/$/, '');
    return `${cleanDomain}/?data=${base64Data}&tab=${activeTab}`;
  };

  const generateKakaoMsg = (shareUrl) => {
    return `[농가살림연구소(주)] 1:1 농가 맞춤 경영진단 리포트 안내 🌾\n\n` +
      `안녕하세요, ${farmOwner} 님!\n` +
      `신청하신 [${region} ${cropName} (${formatComma(areaPyung)}평)] 경영체 원가분석 및 7대 컨설팅 진단 보고서 생성이 완료되었습니다.\n\n` +
      `아래 전용 링크를 클릭하시면 본인 농가의 7대 경영진단서 조회 및 PDF/엑셀 인쇄 출력이 즉시 가능합니다:\n\n` +
      `🔗 1:1 진단서 열기: ${shareUrl}\n\n` +
      `*(본 링크는 ${farmOwner} 님의 전용 실적 데이터만 안전하게 담겨 있습니다.)*`;
  };

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'farm-share-link-modal-overlay';
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(15, 23, 42, 0.88);
    backdrop-filter: blur(10px);
    z-index: 99999;
    display: flex; justify-content: center; align-items: center;
    padding: 20px; box-sizing: border-box;
  `;

  let currentUrl = generateShareUrl(defaultDomain);
  let currentMsg = generateKakaoMsg(currentUrl);

  modalOverlay.innerHTML = `
    <div style="background: #1E293B; border: 1px solid rgba(139, 92, 246, 0.5); border-radius: 20px; width: 100%; max-width: 680px; color: #FFF; padding: 28px 32px; box-shadow: 0 25px 60px rgba(0,0,0,0.6); font-family: Pretendard, sans-serif;">
      
      <!-- 모달 상단 헤더 -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; margin-bottom: 22px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="font-size:24px; background:rgba(139,92,246,0.2); width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(139,92,246,0.4);">
            🔗
          </div>
          <div>
            <span style="background:rgba(139,92,246,0.2); color:#C084FC; font-weight:800; padding:3px 10px; border-radius:10px; font-size:11.5px; border:1px solid rgba(139,92,246,0.3);">
              1:1 FARM DEDICATED LINK GENERATOR
            </span>
            <h3 style="font-size: 19px; font-weight: 900; color: #FFF; margin-top: 4px;">
              [${farmOwner}] 농가 전용 1:1 진단 접속 링크 생성기
            </h3>
          </div>
        </div>
        <button id="btn-close-share-modal" style="background:none; border:none; color:#94A3B8; font-size:20px; cursor:pointer; font-weight:900;">✕</button>
      </div>

      <!-- 진단 농가 요약 칩 -->
      <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <span style="font-size:12px; color:#94A3B8;">분석 농가:</span>
          <span style="font-size:14px; font-weight:800; color:#38BDF8; margin-left:4px;">${farmOwner} 님</span>
          <span style="font-size:12px; color:#94A3B8; margin-left:12px;">작목:</span>
          <span style="font-size:14px; font-weight:800; color:#34D399; margin-left:4px;">${region} ${cropName} (${formatComma(areaPyung)}평)</span>
        </div>
        <span style="font-size:11px; background:rgba(56,189,248,0.15); color:#38BDF8; padding:3px 8px; border-radius:6px; font-weight:700;">
          단독 데이터 분리 완료
        </span>
      </div>

      <!-- 웹 서버 도메인 설정 입력창 -->
      <div style="margin-bottom: 20px;">
        <label style="font-size: 13px; font-weight: 800; color: #C084FC; display: block; margin-bottom: 6px;">
          🌐 웹 서비스 기본 도메인 (Vercel 배포 주소)
        </label>
        <input type="text" id="share-domain-input" value="${defaultDomain}" style="width: 100%; padding: 12px 14px; background: #0F172A; border: 1px solid #8B5CF6; color: #FFF; border-radius: 10px; font-size: 13.5px; font-weight: 700; box-sizing: border-border-box;" />
        <p style="font-size: 11.5px; color: #94A3B8; margin-top: 4px;">
          * Vercel 라이브 배포 완료 후 https://nongga-map1.vercel.app 주소를 입력하시면 농가가 스마트폰으로 즉시 접속 가능합니다.
        </p>
      </div>

      <!-- 카카오톡 공유용 전체 문구 텍스트 박스 -->
      <div style="margin-bottom: 24px;">
        <label style="font-size: 13px; font-weight: 800; color: #FBBF24; display: block; margin-bottom: 6px;">
          📱 카카오톡 / 문자 전달용 맞춤 안내 문구 (자동 생성)
        </label>
        <textarea id="share-kakao-text" rows="7" readonly style="width: 100%; padding: 14px; background: #0F172A; border: 1px solid rgba(255,255,255,0.15); color: #F1F5F9; border-radius: 12px; font-size: 12.5px; line-height: 1.5; font-family: Pretendard, monospace; box-sizing: border-box; resize: none;">${currentMsg}</textarea>
      </div>

      <!-- 모달 하단 액션 버튼 그룹 -->
      <div style="display: flex; gap: 12px; justify-content: flex-end; flex-wrap: wrap;">
        <button id="btn-copy-kakao-msg" style="background: linear-gradient(135deg, #F59E0B, #D97706); color: #FFF; border: none; padding: 12px 22px; border-radius: 10px; font-size: 14px; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(245,158,11,0.4);">
          📋 카카오톡 안내 문구 전체 복사
        </button>
        <button id="btn-copy-url-only" style="background: linear-gradient(135deg, #8B5CF6, #6D28D9); color: #FFF; border: none; padding: 12px 22px; border-radius: 10px; font-size: 14px; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(139,92,246,0.4);">
          🔗 URL 주소만 복사
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(modalOverlay);

  const domainInput = document.getElementById('share-domain-input');
  const kakaoText = document.getElementById('share-kakao-text');

  const updateModalUrls = () => {
    const domainVal = domainInput.value || defaultDomain;
    currentUrl = generateShareUrl(domainVal);
    currentMsg = generateKakaoMsg(currentUrl);
    kakaoText.value = currentMsg;
  };

  domainInput.addEventListener('input', updateModalUrls);

  const closeModal = () => {
    if (document.body.contains(modalOverlay)) {
      document.body.removeChild(modalOverlay);
    }
  };

  document.getElementById('btn-close-share-modal').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Copy Kakao Message button
  document.getElementById('btn-copy-kakao-msg').addEventListener('click', () => {
    updateModalUrls();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentMsg).then(() => {
        alert(`✅ [${farmOwner}] 님 전용 카카오톡 안내 문구가 클립보드에 복사되었습니다!\n\n카카오톡이나 문자에 바로 [붙여넣기(Ctrl+V)] 하셔서 농가에 전달해 주세요.`);
        closeModal();
      }).catch(() => {
        prompt('아래 문구를 전체 선택 후 복사하여 전달해 주세요:', currentMsg);
      });
    } else {
      prompt('아래 문구를 전체 선택 후 복사하여 전달해 주세요:', currentMsg);
    }
  });

  // Copy URL Only button
  document.getElementById('btn-copy-url-only').addEventListener('click', () => {
    updateModalUrls();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentUrl).then(() => {
        alert(`✅ [${farmOwner}] 님 전용 1:1 진단 URL 주소가 클립보드에 복사되었습니다!\n\n🔗 주소: ${currentUrl}`);
        closeModal();
      }).catch(() => {
        prompt('아래 주소를 복사해 주세요:', currentUrl);
      });
    } else {
      prompt('아래 주소를 복사해 주세요:', currentUrl);
    }
  });
}

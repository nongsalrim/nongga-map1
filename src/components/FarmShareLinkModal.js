/**
 * @file FarmShareLinkModal.js
 * @description 🔗 특정 농가 전용 1:1 경영진단 카카오톡 공유 링크 생성 & 복사 모달 (농가 성함 실시간 연동)
 */

import { encodeFarmData } from '../utils/urlCodec.js';

export function openFarmShareLinkModal(model, activeTab = 'survey') {
  const parseNum = (val) => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/%/g, '').replace(/원/g, '').trim();
    return Number(cleanStr) || 0;
  };

  const formatMoney = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(parseNum(val))) + ' 원';
  const formatComma = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(parseNum(val)));

  let initialOwner = model.farmOwner || model.farmName || '';
  if (!initialOwner || initialOwner === '농가' || initialOwner === '신규 농가') {
    initialOwner = '안동현';
  }

  const cropName = model.cropName || '시설딸기(수경)';
  const areaPyung = parseNum(model.areaPyung) || 1000;
  const region = model.region || '충남';

  // Default Base Domain (Permanent 24/7 GitHub Pages Live URL)
  let defaultDomain = 'https://nongsalrim.github.io/nongga-map1';
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    defaultDomain = window.location.origin;
  }

  const buildPayloadAndUrls = (ownerName, domainName) => {
    const cleanOwner = (ownerName || '안동현').trim();
    const cleanDomain = (domainName || defaultDomain).trim().replace(/\/$/, '');

    const payloadObj = {
      farmOwner: cleanOwner,
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

    const base64Data = encodeFarmData(payloadObj);
    const shareUrl = `${cleanDomain}/?data=${base64Data}&tab=${activeTab}`;

    const kakaoMsg = `[농가살림연구소(주)] 1:1 농가 맞춤 경영진단 리포트 안내 🌾\n\n` +
      `안녕하세요, ${cleanOwner} 님!\n` +
      `신청하신 [${region} ${cropName} (${formatComma(areaPyung)}평)] 경영체 원가분석 및 7대 컨설팅 진단 보고서 생성이 완료되었습니다.\n\n` +
      `아래 전용 링크를 클릭하시면 본인 농가의 7대 경영진단서 조회 및 PDF/엑셀 인쇄 출력이 즉시 가능합니다:\n\n` +
      `🔗 1:1 진단서 열기: ${shareUrl}\n\n` +
      `*(본 링크는 ${cleanOwner} 님의 전용 실적 데이터만 안전하게 담겨 있습니다.)*`;

    return { cleanOwner, shareUrl, kakaoMsg };
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

  let currentData = buildPayloadAndUrls(initialOwner, defaultDomain);

  modalOverlay.innerHTML = `
    <div style="background: #1E293B; border: 1px solid rgba(139, 92, 246, 0.5); border-radius: 20px; width: 100%; max-width: 680px; color: #FFF; padding: 28px 32px; box-shadow: 0 25px 60px rgba(0,0,0,0.6); font-family: Pretendard, sans-serif;">
      
      <!-- 모달 상단 헤더 -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; margin-bottom: 20px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="font-size:24px; background:rgba(139,92,246,0.2); width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(139,92,246,0.4);">
            🔗
          </div>
          <div>
            <span style="background:rgba(139,92,246,0.2); color:#C084FC; font-weight:800; padding:3px 10px; border-radius:10px; font-size:11.5px; border:1px solid rgba(139,92,246,0.3);">
              1:1 FARM DEDICATED LINK GENERATOR
            </span>
            <h3 id="share-modal-title" style="font-size: 19px; font-weight: 900; color: #FFF; margin-top: 4px;">
              [${currentData.cleanOwner}] 농가 전용 1:1 진단 접속 링크 생성기
            </h3>
          </div>
        </div>
        <button id="btn-close-share-modal" style="background:none; border:none; color:#94A3B8; font-size:20px; cursor:pointer; font-weight:900;">✕</button>
      </div>

      <!-- 진단 농가 대표 성함 입력 패널 -->
      <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 14px; padding: 18px 20px; margin-bottom: 20px;">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px; align-items:center;">
          <div>
            <label style="font-size: 13px; font-weight: 800; color: #38BDF8; display: block; margin-bottom: 6px;">
              👨‍🌾 농가 대표자 성함 (농가명)
            </label>
            <input type="text" id="share-owner-name-input" value="${currentData.cleanOwner}" placeholder="예: 안동현" style="width: 100%; padding: 10px 14px; background: #0F172A; border: 1px solid #38BDF8; color: #FFF; border-radius: 8px; font-size: 14px; font-weight: 800; box-sizing: border-box;" />
          </div>
          <div>
            <label style="font-size: 13px; font-weight: 800; color: #34D399; display: block; margin-bottom: 6px;">
              🌾 작목 및 재배면적
            </label>
            <div style="padding: 10px 14px; background: #0F172A; border: 1px solid rgba(255,255,255,0.15); color: #34D399; border-radius: 8px; font-size: 13.5px; font-weight: 800;">
              ${region} ${cropName} (${formatComma(areaPyung)}평)
            </div>
          </div>
        </div>
      </div>

      <!-- 웹 서버 도메인 설정 입력창 -->
      <div style="margin-bottom: 20px;">
        <label style="font-size: 13px; font-weight: 800; color: #C084FC; display: block; margin-bottom: 6px;">
          🌐 웹 서비스 라이브 도메인 (Vercel 배포 주소)
        </label>
        <input type="text" id="share-domain-input" value="${defaultDomain}" style="width: 100%; padding: 11px 14px; background: #0F172A; border: 1px solid #8B5CF6; color: #FFF; border-radius: 8px; font-size: 13px; font-weight: 700; box-sizing: border-box;" />
      </div>

      <!-- 카카오톡 공유용 전체 문구 텍스트 박스 -->
      <div style="margin-bottom: 24px;">
        <label style="font-size: 13px; font-weight: 800; color: #FBBF24; display: block; margin-bottom: 6px;">
          📱 카카오톡 / 문자 전달용 맞춤 안내 문구 (자동 실시간 조합)
        </label>
        <textarea id="share-kakao-text" rows="7" readonly style="width: 100%; padding: 14px; background: #0F172A; border: 1px solid rgba(255,255,255,0.15); color: #F1F5F9; border-radius: 12px; font-size: 12.5px; line-height: 1.5; font-family: Pretendard, monospace; box-sizing: border-box; resize: none;">${currentData.kakaoMsg}</textarea>
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

  const ownerInput = document.getElementById('share-owner-name-input');
  const domainInput = document.getElementById('share-domain-input');
  const modalTitle = document.getElementById('share-modal-title');
  const kakaoText = document.getElementById('share-kakao-text');

  const updateModalState = () => {
    const ownerVal = ownerInput.value || '안동현';
    const domainVal = domainInput.value || defaultDomain;
    currentData = buildPayloadAndUrls(ownerVal, domainVal);
    modalTitle.textContent = `[${currentData.cleanOwner}] 농가 전용 1:1 진단 접속 링크 생성기`;
    kakaoText.value = currentData.kakaoMsg;
  };

  ownerInput.addEventListener('input', updateModalState);
  domainInput.addEventListener('input', updateModalState);

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
    updateModalState();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentData.kakaoMsg).then(() => {
        alert(`✅ [${currentData.cleanOwner}] 님 전용 카카오톡 안내 문구가 클립보드에 복사되었습니다!\n\n카카오톡이나 문자에 바로 [붙여넣기(Ctrl+V)] 하셔서 농가에 전달해 주세요.`);
        closeModal();
      }).catch(() => {
        prompt('아래 문구를 전체 선택 후 복사하여 전달해 주세요:', currentData.kakaoMsg);
      });
    } else {
      prompt('아래 문구를 전체 선택 후 복사하여 전달해 주세요:', currentData.kakaoMsg);
    }
  });

  // Copy URL Only button
  document.getElementById('btn-copy-url-only').addEventListener('click', () => {
    updateModalState();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentData.shareUrl).then(() => {
        alert(`✅ [${currentData.cleanOwner}] 님 전용 1:1 진단 URL 주소가 클립보드에 복사되었습니다!\n\n🔗 주소: ${currentData.shareUrl}`);
        closeModal();
      }).catch(() => {
        prompt('아래 주소를 복사해 주세요:', currentData.shareUrl);
      });
    } else {
      prompt('아래 주소를 복사해 주세요:', currentData.shareUrl);
    }
  });
}

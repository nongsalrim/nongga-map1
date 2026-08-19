/**
 * @file FarmDraftModal.js
 * @description 💾 농가별 입력 데이터 중간 저장 / 자동 저장 / 불러오기 매니저 (localStorage 기반 100% 보존 엔진)
 */

const DRAFT_STORAGE_KEY = 'NONGGA_FARM_DRAFTS_V2';
const AUTO_SAVE_KEY = 'NONGGA_AUTO_SAVE_V2';

/**
 * 1. 현재 농가 데이터를 명칭과 함께 intermediate draft로 저장
 */
export function saveFarmDraft(farmState, costItemsState, assetsState, loansState, customName = null) {
  try {
    const drafts = getFarmDrafts();
    const timestamp = new Date().toLocaleString('ko-KR');
    const draftName = customName || `[${farmState.region || '지역'}] ${farmState.farmName || '농가'} - ${farmState.cropName || '작목'} (${farmState.areaPyung || 0}평)`;

    const newDraft = {
      id: `draft_${Date.now()}`,
      name: draftName,
      savedAt: timestamp,
      farmState: JSON.parse(JSON.stringify(farmState)),
      costItemsState: JSON.parse(JSON.stringify(costItemsState)),
      assetsState: JSON.parse(JSON.stringify(assetsState)),
      loansState: JSON.parse(JSON.stringify(loansState))
    };

    // Check if an existing draft with same name exists and update it, else prepend
    const existingIdx = drafts.findIndex(d => d.name === draftName);
    if (existingIdx >= 0) {
      drafts[existingIdx] = newDraft;
    } else {
      drafts.unshift(newDraft);
    }

    // Keep max 20 drafts
    if (drafts.length > 20) drafts.pop();

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    return newDraft;
  } catch (err) {
    console.warn('Draft save error:', err);
    return null;
  }
}

/**
 * 2. 저장된 모든 농가 draft 목록 조회
 */
export function getFarmDrafts() {
  try {
    const data = localStorage.getItem(DRAFT_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
}

/**
 * 3. 저장된 특정 draft 삭제
 */
export function deleteFarmDraft(draftId) {
  try {
    let drafts = getFarmDrafts();
    drafts = drafts.filter(d => d.id !== draftId);
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    return drafts;
  } catch (err) {
    return [];
  }
}

/**
 * 4. 자동 중간 저장 (Auto-Save)
 */
export function autoSaveFarmDraft(farmState, costItemsState, assetsState, loansState) {
  try {
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    const autoData = {
      savedAt: timestamp,
      farmState: JSON.parse(JSON.stringify(farmState)),
      costItemsState: JSON.parse(JSON.stringify(costItemsState)),
      assetsState: JSON.parse(JSON.stringify(assetsState)),
      loansState: JSON.parse(JSON.stringify(loansState))
    };
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(autoData));
    return timestamp;
  } catch (err) {
    return null;
  }
}

/**
 * 5. 자동 저장 데이터 불러오기
 */
export function getAutoSaveDraft() {
  try {
    const data = localStorage.getItem(AUTO_SAVE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
}

/**
 * 6. 저장된 농가 목록 불러오기 팝업 모달 렌더링
 */
export function openFarmDraftModal(onLoadDraft, onNewFarm) {
  const existingModal = document.getElementById('farm-draft-modal-overlay');
  if (existingModal) {
    try { document.body.removeChild(existingModal); } catch(e) {}
  }

  const drafts = getFarmDrafts();
  const autoSave = getAutoSaveDraft();

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'farm-draft-modal-overlay';
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(8px);
    z-index: 9999;
    display: flex; justify-content: center; align-items: center;
    padding: 20px; box-sizing: border-box;
  `;

  function renderModalContent() {
    const currentDrafts = getFarmDrafts();
    modalOverlay.innerHTML = `
      <div style="
        background: #1E293B;
        border: 1px solid rgba(16, 185, 129, 0.4);
        border-radius: 20px;
        width: 100%; max-width: 850px;
        max-height: 85vh;
        display: flex; flex-direction: column;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
        overflow: hidden;
        color: #FFF;
        font-family: Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
      ">
        
        <!-- 헤더 영역 -->
        <div style="
          background: linear-gradient(135deg, #0F172A, #1E293B);
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex; justify-content: space-between; align-items: center;
        ">
          <div>
            <span style="background:rgba(16,185,129,0.2); color:#34D399; border:1px solid rgba(16,185,129,0.4); padding:4px 10px; border-radius:10px; font-size:12px; font-weight:700;">
              FARM DRAFT MANAGER
            </span>
            <h2 style="font-size: 20px; font-weight: 900; color: #FFF; margin-top: 4px; display: flex; align-items: center; gap: 8px;">
              📂 농가별 중간 저장 목록 관리 (${currentDrafts.length}개 저장됨)
            </h2>
          </div>

          <div style="display:flex; gap:8px;">
            <button id="draft-btn-new-farm" style="
              background: linear-gradient(135deg, #3B82F6, #1D4ED8);
              color: #FFF; border: none; padding: 8px 14px; border-radius: 8px;
              font-weight: 800; font-size: 13px; cursor: pointer;
            ">
              + 새 농가 작성 (초기화)
            </button>
            <button id="draft-btn-close" style="
              background: rgba(255, 255, 255, 0.1);
              color: #94A3B8; border: none; padding: 8px 14px; border-radius: 8px;
              font-weight: 800; font-size: 13px; cursor: pointer;
            ">
              ✕ 닫기
            </button>
          </div>
        </div>

        <!-- 본문 리스트 영역 -->
        <div style="padding: 20px 24px; overflow-y: auto; flex: 1;">
          
          ${autoSave ? `
            <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 14px 18px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 11px; color: #60A5FA; font-weight: 700;">⚡ 실시간 자동 저장 데이터</span>
                <div style="font-size: 14px; font-weight: 800; color: #FFF; margin-top: 2px;">
                  [${autoSave.farmState.region || ''}] ${autoSave.farmState.farmName || ''} - ${autoSave.farmState.cropName || ''} (${autoSave.farmState.areaPyung || 0}평)
                </div>
                <div style="font-size: 11px; color: #94A3B8; margin-top: 2px;">자동 저장 시각: ${autoSave.savedAt}</div>
              </div>
              <button class="btn-restore-autosave" style="background: #3B82F6; color: #FFF; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 800; cursor: pointer;">
                📥 자동저장 불러오기
              </button>
            </div>
          ` : ''}

          ${currentDrafts.length === 0 ? `
            <div style="text-align: center; padding: 40px 20px; color: #94A3B8;">
              <div style="font-size: 32px; margin-bottom: 10px;">💾</div>
              <div style="font-size: 15px; font-weight: 700;">저장된 농가 중간 데이터가 없습니다.</div>
              <div style="font-size: 12px; margin-top: 4px;">입력 센터 상단의 [💾 현재 농가 데이터 중간 저장] 버튼을 눌러 중간본을 저장해 보세요.</div>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${currentDrafts.map(d => {
                const fs = d.farmState || {};
                return `
                  <div style="
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px; padding: 14px 18px;
                    display: flex; justify-content: space-between; align-items: center;
                    transition: all 0.2s ease;
                  ">
                    <div>
                      <div style="font-size: 15px; font-weight: 800; color: #10B981;">
                        ${d.name}
                      </div>
                      <div style="font-size: 12px; color: #94A3B8; margin-top: 4px; display: flex; gap: 12px;">
                        <span>📍 지역: ${fs.region || '충남'}</span>
                        <span>🌱 작목: ${fs.cropName || '시설딸기'}</span>
                        <span>📐 면적: ${fs.areaPyung || 0}평</span>
                        <span>🕒 저장일: ${d.savedAt}</span>
                      </div>
                    </div>

                    <div style="display: flex; gap: 8px;">
                      <button class="btn-load-draft" data-id="${d.id}" style="
                        background: linear-gradient(135deg, #10B981, #059669);
                        color: #FFF; border: none; padding: 8px 16px; border-radius: 8px;
                        font-weight: 800; font-size: 12px; cursor: pointer;
                        box-shadow: 0 4px 10px rgba(16,185,129,0.3);
                      ">
                        📥 불러오기
                      </button>
                      <button class="btn-del-draft" data-id="${d.id}" style="
                        background: rgba(239, 68, 68, 0.2); color: #F87171;
                        border: 1px solid rgba(239,68,68,0.3); padding: 8px 12px; border-radius: 8px;
                        font-weight: 700; font-size: 12px; cursor: pointer;
                      ">
                        🗑️ 삭제
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}

        </div>
      </div>
    `;

    // Bind event handlers inside modal with e.currentTarget / closest
    const btnClose = modalOverlay.querySelector('#draft-btn-close');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        try { document.body.removeChild(modalOverlay); } catch(e) {}
      });
    }

    const btnNewFarm = modalOverlay.querySelector('#draft-btn-new-farm');
    if (btnNewFarm) {
      btnNewFarm.addEventListener('click', () => {
        try { document.body.removeChild(modalOverlay); } catch(e) {}
        if (onNewFarm) onNewFarm();
      });
    }

    const btnAuto = modalOverlay.querySelector('.btn-restore-autosave');
    if (btnAuto && autoSave) {
      btnAuto.addEventListener('click', () => {
        try { document.body.removeChild(modalOverlay); } catch(e) {}
        if (onLoadDraft) onLoadDraft(autoSave);
      });
    }

    modalOverlay.querySelectorAll('.btn-load-draft').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const btnEl = e.currentTarget || e.target.closest('.btn-load-draft');
        const id = btnEl ? btnEl.getAttribute('data-id') : null;
        const targetDraft = getFarmDrafts().find(d => d.id === id);
        if (targetDraft) {
          try { document.body.removeChild(modalOverlay); } catch(e) {}
          if (onLoadDraft) onLoadDraft(targetDraft);
        }
      });
    });

    modalOverlay.querySelectorAll('.btn-del-draft').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const btnEl = e.currentTarget || e.target.closest('.btn-del-draft');
        const id = btnEl ? btnEl.getAttribute('data-id') : null;
        if (id) {
          deleteFarmDraft(id);
          renderModalContent();
        }
      });
    });
  }

  renderModalContent();
  document.body.appendChild(modalOverlay);
}

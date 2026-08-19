/**
 * @file Header.js
 * @description 상단 네비게이션 모듈 (외부 공유 접속 시 홈페이지 관련 메뉴 전면 제외 및 1:1 진단서 헤더 단독 제공)
 */

import { companyData } from '../data/company.js';

export function renderHeader(activePage = 'home', onNavigate, isAdmin = false, onToggleAdmin) {
  const isSharedLink = typeof window !== 'undefined' && Boolean(new URLSearchParams(window.location.search).get('data'));

  // 외부 전달 전용 1:1 진단서 접속 모드인 경우: 홈페이지 메뉴 전면 제외
  if (isSharedLink) {
    return `
      <header class="site-header" style="background: linear-gradient(135deg, #0F172A, #1E293B); border-bottom: 2px solid rgba(16, 185, 129, 0.4); padding: 14px 0;">
        <div class="container">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="font-size: 26px; background: rgba(16, 185, 129, 0.15); border: 1px solid #10B981; border-radius: 14px; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(16,185,129,0.3);">🌾</div>
              <div>
                <span style="font-size: 11px; font-weight: 800; color: #34D399; letter-spacing: 0.5px; background: rgba(16, 185, 129, 0.15); padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(16,185,129,0.3);">
                  1:1 FARM DEDICATED DIAGNOSIS REPORT
                </span>
                <h1 style="font-size: 18px; font-weight: 900; color: #FFF; margin-top: 2px; letter-spacing: -0.5px;">
                  농가살림연구소(주) 1:1 맞춤 경영진단서
                </h1>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="background: rgba(16, 185, 129, 0.2); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 800; display: flex; align-items: center; gap: 6px;">
                🔒 1:1 전용 보안 열람 모드
              </span>
            </div>
          </div>
        </div>
      </header>
    `;
  }

  // 일반 컨설턴트/내부 모드인 경우 전체 메뉴 표시
  const navItems = [
    { key: 'home', label: 'HOME' },
    { key: 'analysis', label: '⚡ 온라인 경영진단' },
    { key: 'about', label: '연구소소개' },
    { key: 'business', label: '사업분야' },
    { key: 'education', label: '교육' },
    { key: 'consulting', label: '컨설팅 사례' },
    { key: 'research', label: '연구성과' },
    { key: 'track', label: '수행실적' },
    { key: 'notice', label: '공지사항' },
    { key: 'contact', label: '문의하기' }
  ];

  return `
    <header class="site-header">
      <!-- 최상단 공지 핫라인 -->
      <div class="top-bar">
        <div class="container">
          <div class="top-bar-info">
            <span>📞 대표전화: ${companyData.phone}</span>
            <span>📍 ${companyData.address}</span>
          </div>
          <div>
            <span>🏛️ 농업 전문 연구·교육·컨설팅 플랫폼</span>
          </div>
        </div>
      </div>

      <!-- 메인 네비게이션 바 -->
      <div class="container">
        <div class="nav-bar">
          <a href="#" data-page="home" class="logo-area nav-brand">
            <img
              src="./src/assets/logo.png"
              alt="농가살림연구소(주) 로고"
              class="header-logo-img"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            />
            <div class="logo-icon" style="display:none;">🌿</div>
          </a>

          <ul class="nav-menu">
            ${navItems.map(item => `
              <li>
                <a href="#" data-page="${item.key}" class="nav-link ${activePage === item.key ? 'active' : ''}">
                  ${item.label}
                </a>
              </li>
            `).join('')}
          </ul>

          <div style="display: flex; align-items: center; gap: 10px;">
            <button id="admin-mode-toggle" class="admin-toggle-btn">
              ${isAdmin ? '🔒 사용자 모드' : '⚙️ 무코드 관리자'}
            </button>
          </div>
        </div>
      </div>
    </header>
  `;
}

export function setupHeaderListeners(onNavigate, onToggleAdmin) {
  document.querySelectorAll('.nav-link, .nav-brand').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const page = el.getAttribute('data-page');
      if (page) onNavigate(page);
    });
  });

  const adminBtn = document.getElementById('admin-mode-toggle');
  if (adminBtn) {
    adminBtn.addEventListener('click', () => {
      const isSharedLink = typeof window !== 'undefined' && Boolean(new URLSearchParams(window.location.search).get('data'));
      if (isSharedLink) {
        alert('🔒 [보안 헌법 제1조] 외부 전용 공유 링크 접속 시 관리자 권한 변경이 엄격히 금지됩니다.');
        return;
      }
      const pin = prompt('🔒 농가살림연구소(주) 관리자 전용 보안 PIN 번호를 입력하세요:');
      if (pin === '4547') {
        onToggleAdmin();
      } else if (pin !== null) {
        alert('❌ 보안 PIN 번호가 일치하지 않습니다. 관리자 모드 접근이 차단되었습니다.');
      }
    });
  }
}

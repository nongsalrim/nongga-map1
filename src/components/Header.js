/**
 * @file Header.js
 * @description 상단 네비게이션 및 로고, 브랜딩, 관리자 모드 버튼 모듈
 * (2605_농가살림연구소 회사소개자료 정식 데이터)
 */

import { companyData } from '../data/company.js';

export function renderHeader(activePage = 'home', onNavigate, isAdmin = false, onToggleAdmin) {
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
            ${(typeof window !== 'undefined' && Boolean(new URLSearchParams(window.location.search).get('data'))) ? `
              <span style="background: rgba(16, 185, 129, 0.2); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 4px 12px; border-radius: 20px; font-size: 11.5px; font-weight: 800;">
                🔒 1:1 전용 보안 진단 모드
              </span>
            ` : `
              <button id="admin-mode-toggle" class="admin-toggle-btn">
                ${isAdmin ? '🔒 사용자 모드' : '⚙️ 무코드 관리자'}
              </button>
            `}
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
      if (pin === '2605' || pin === '1234') {
        onToggleAdmin();
      } else if (pin !== null) {
        alert('❌ 보안 PIN 번호가 일치하지 않습니다. 관리자 모드 접근이 차단되었습니다.');
      }
    });
  }
}

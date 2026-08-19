/**
 * @file Footer.js
 * @description 하단 푸터 모듈 (외부 공유 접속 시 홈페이지 영업 메뉴 전면 제외 및 1:1 리포트 푸터 제공)
 */

import { companyData } from '../data/company.js';

export function renderFooter(onNavigate) {
  const isSharedLink = typeof window !== 'undefined' && Boolean(new URLSearchParams(window.location.search).get('data'));

  // 외부 전달 전용 1:1 진단서 접속 모드인 경우: 홈페이지 메뉴 전면 제외
  if (isSharedLink) {
    return `
      <footer class="site-footer" style="background: #0F172A; border-top: 1px solid rgba(255,255,255,0.1); padding: 32px 0; color: #94A3B8;">
        <div class="container" style="text-align: center;">
          <div style="font-size: 15px; font-weight: 800; color: #34D399; margin-bottom: 8px;">
            🌾 농가살림연구소(주) | 1:1 맞춤 경영진단 & 원가분석 전용 리포트
          </div>
          <p style="font-size: 13px; color: #64748B; margin-bottom: 12px; line-height: 1.6;">
            본 진단 보고서는 신청 농가의 1:1 맞춤 실적 수치를 바탕으로 독립 편성된 7대 경영진단서입니다.<br/>
            농가의 데이터 보안 및 안전한 열람 환경을 위해 홈페이지 영업 메뉴 접속이 전면 제한된 보안 모드에서 구동됩니다.
          </p>
          <p style="font-size: 12px; color: #475569;">
            © 2026 Nongga Salim Institute Co., Ltd. All Rights Reserved. (전용 보안 열람 모드)
          </p>
        </div>
      </footer>
    `;
  }

  // 일반 컨설턴트/내부 모드인 경우 전체 메뉴 표시
  return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="footer-logo">🌿 ${companyData.name}</div>
            <p style="margin-bottom: 16px; font-size: 0.9rem; line-height: 1.6;">
              "${companyData.slogan}"<br/>
              학술연구용역, 농업 경영컨설팅, 위탁교육 운영 및 농업인 역량강화 아카이빙 플랫폼
            </p>
            <p style="font-size: 0.85rem; color: rgba(255,255,255,0.6); line-height: 1.6;">
              대표이사: ${companyData.ceo} | 설립일: ${companyData.establishedDate}<br/>
              주소: ${companyData.address}
            </p>
          </div>

          <div>
            <h4 style="color: white; margin-bottom: 16px;">주요 메뉴</h4>
            <ul style="list-style: none; line-height: 2;">
              <li><a href="#" data-page="about" class="footer-link">연구소소개</a></li>
              <li><a href="#" data-page="business" class="footer-link">사업분야</a></li>
              <li><a href="#" data-page="education" class="footer-link">교육 아카이브</a></li>
              <li><a href="#" data-page="consulting" class="footer-link">컨설팅 사례</a></li>
            </ul>
          </div>

          <div>
            <h4 style="color: white; margin-bottom: 16px;">자산 플랫폼</h4>
            <ul style="list-style: none; line-height: 2;">
              <li><a href="#" data-page="research" class="footer-link">연구성과</a></li>
              <li><a href="#" data-page="track" class="footer-link">수행실적</a></li>
              <li><a href="#" data-page="notice" class="footer-link">공지사항</a></li>
              <li><a href="#" data-page="contact" class="footer-link">문의하기</a></li>
            </ul>
          </div>

          <div>
            <h4 style="color: white; margin-bottom: 16px;">상담 및 문의</h4>
            <p style="font-size: 1.25rem; font-weight: 800; color: var(--accent-gold); margin-bottom: 8px;">
              ${companyData.phone}
            </p>
            <p style="font-size: 0.85rem;">대표이사 ${companyData.ceo}</p>
            <p style="font-size: 0.85rem; margin-top: 4px;">평일 09:00 ~ 18:00 지원</p>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© 2026 ${companyData.englishName}. All Rights Reserved. Vercel Production Build.</p>
        </div>
      </div>
    </footer>
  `;
}

export function setupFooterListeners(onNavigate) {
  document.querySelectorAll('.footer-link').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const page = el.getAttribute('data-page');
      if (page) onNavigate(page);
    });
  });
}

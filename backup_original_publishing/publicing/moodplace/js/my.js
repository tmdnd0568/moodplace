/**
 * my.js
 * ------------------------------------------------------------------
 * 마이페이지 화면(My Page Screen, STEP 9) 렌더 + 이벤트 처리.
 * `my.html` 독립 페이지 전용 스크립트 (index.html SPA 에는 포함되지 않음).
 *
 * 진입 경로: 하단 탭바의 '마이페이지' 탭 클릭 (main.js / review.js / find.js 의
 *   nav-tab 과 동일 위치) → my.html 로 페이지 이동.
 *
 * 설계 원칙 (React 전환 대비):
 *  - find.js / map.js 와 동일하게 순수 render 함수 + 이벤트 위임 패턴 사용.
 *  - 프로필/통계(MY_PROFILE), 메뉴 목록(ACCOUNT_MENU_ITEMS)은 data.js 의 mock 데이터를
 *    그대로 사용 → React 전환 시 각각 props/초기 state 로 그대로 대응.
 *  - 메뉴 항목 클릭, 로그아웃 버튼은 계획서(STEP 9) 상 데모 범위이므로 자리만 구현.
 * ------------------------------------------------------------------
 */

(function () {
  const { store, MY_PROFILE, ACCOUNT_MENU_ITEMS } = window.MoodPlaceData;

  // ------------------------------
  // Icon set (inline SVG, currentColor 기반)
  // ------------------------------
  const ICONS = {
    back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
    bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1h-.2a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.6v-.2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`,
    editProfile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c0-3.3 2.5-5.5 5.5-5.5 1 0 1.9.2 2.7.7"/><path d="M15.5 15.5a1.9 1.9 0 0 1 2.7 2.7L15 21l-2.7.6.6-2.7z"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9.5 12l1.8 1.8L15 10"/></svg>`,
    help: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.3 9.3a2.7 2.7 0 1 1 3.9 2.4c-.9.5-1.2 1-1.2 2"/><line x1="12" y1="17" x2="12" y2="17.01"/></svg>`,
    chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
    home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/></svg>`,
    map: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15M15 6v15"/></svg>`,
    bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg>`,
  };

  const MENU_ICON_MAP = {
    editProfile: ICONS.editProfile,
    bell: ICONS.bell,
    shield: ICONS.shield,
    help: ICONS.help,
  };

  // 스플래시 화면과 동일한 로고 배지(핀 + 하트 + 컵) — 브랜드 마무리 영역에 재사용
  const BRAND_BADGE_SVG = `
    <svg viewBox="0 0 100 124" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 4C29 4 12 21 12 42c0 28 38 74 38 74s38-46 38-74C88 21 71 4 50 4z" fill="#2D5244" />
      <circle cx="50" cy="42" r="27" fill="#FFFFFF" />
      <path d="M50 29c-2.4-3.4-8-3.4-9.6 0.6-1.4 3.4 1.4 6.4 9.6 11.4 8.2-5 11-8 9.6-11.4-1.6-4-7.2-4-9.6-0.6z" fill="#2D5244" />
      <path d="M35 46h24v8a8 8 0 0 1-8 8h-8a8 8 0 0 1-8-8v-8z" fill="none" stroke="#2D5244" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M59 48h3.5a4 4 0 0 1 0 8H59" fill="none" stroke="#2D5244" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;

  // ------------------------------
  // Pure render functions (component 대응)
  // ------------------------------

  function renderHeader() {
    return `
      <header class="my-header">
        <button class="my-icon-btn" type="button" data-action="go-back" aria-label="뒤로가기">
          <span class="icon">${ICONS.back}</span>
        </button>
        <div class="my-header-actions">
          <button class="my-icon-btn" type="button" data-action="open-notifications" aria-label="알림">
            <span class="icon">${ICONS.bell}</span>
          </button>
          <button class="my-icon-btn" type="button" data-action="open-settings" aria-label="설정">
            <span class="icon">${ICONS.settings}</span>
          </button>
        </div>
      </header>
    `;
  }

  function renderProfile(profile) {
    const avatarStyle = profile.avatarUrl ? `background-image: url('${profile.avatarUrl}');` : '';
    return `
      <section class="my-profile">
        <div class="my-avatar-wrap">
          <div class="my-avatar" style="${avatarStyle}"></div>
          <button class="my-avatar-edit-btn" type="button" data-action="edit-avatar" aria-label="프로필 사진 수정">
            <span class="icon">${ICONS.edit}</span>
          </button>
        </div>
        <p class="my-name">${profile.name}</p>
      </section>
    `;
  }

  function renderStats(stats) {
    const items = [
      { value: stats.saved, label: '저장' },
      { value: stats.reviews, label: '리뷰' },
      { value: stats.visits, label: '방문' },
    ];
    return `
      <div class="my-stats-row">
        ${items
          .map(
            (item) => `
              <div class="my-stat-card">
                <p class="my-stat-value">${item.value}</p>
                <p class="my-stat-label">${item.label}</p>
              </div>
            `
          )
          .join('')}
      </div>
    `;
  }

  function renderMenuSection(items) {
    return `
      <section class="my-section">
        <p class="my-section-label">ACCOUNT &amp; PREFERENCES</p>
        <div class="my-menu-card">
          ${items
            .map(
              (item) => `
                <button type="button" class="my-menu-item" data-action="open-menu-item" data-item-id="${item.id}">
                  <span class="my-menu-item-icon">${MENU_ICON_MAP[item.icon] || ''}</span>
                  <span class="my-menu-item-label">${item.label}</span>
                  <span class="my-menu-item-arrow">${ICONS.chevronRight}</span>
                </button>
              `
            )
            .join('')}
        </div>
      </section>
    `;
  }

  function renderLogout() {
    return `
      <div class="my-logout-row">
        <button type="button" class="my-logout-btn" data-action="logout">Logout</button>
      </div>
    `;
  }

  function renderBrandFooter() {
    return `
      <section class="my-brand-footer" aria-hidden="true">
        <div class="my-brand-badge">${BRAND_BADGE_SVG}</div>
        <div class="my-brand-logo">
          <span class="my-brand-sub">my</span>
          <span class="my-brand-main">MoodPlace</span>
        </div>
        <p class="my-brand-tagline">
          <span class="line"></span>
          <span>당신이 분위기에 맞는 공간을 찾다</span>
          <span class="line"></span>
        </p>
      </section>
    `;
  }

  function renderBottomNav() {
    const tabs = [
      { id: 'home', label: '홈', icon: ICONS.home, href: 'index.html' },
      { id: 'explore', label: '지도', icon: ICONS.map, href: 'find.html' },
      { id: 'bookmarks', label: '북마크', icon: ICONS.bookmark, href: 'keep.html' },
      { id: 'profile', label: '마이페이지', icon: ICONS.user, href: 'my.html' },
    ];

    return `
      <nav class="bottom-nav" aria-label="하단 탭">
        ${tabs
          .map(
            (tab) => `
              <button
                type="button"
                class="nav-tab ${tab.id === 'profile' ? 'is-active' : ''}"
                data-action="go-to-page"
                data-href="${tab.href}"
                aria-label="${tab.label}"
                aria-current="${tab.id === 'profile'}"
              >
                <span class="icon">${tab.icon}</span>
              </button>
            `
          )
          .join('')}
      </nav>
    `;
  }

  // ------------------------------
  // Root render
  // ------------------------------
  function render() {
    const container = document.getElementById('screen-my');
    if (!container) return;

    container.innerHTML = `
      ${renderHeader()}
      ${renderProfile(MY_PROFILE)}
      ${renderStats(MY_PROFILE.stats)}
      ${renderMenuSection(ACCOUNT_MENU_ITEMS)}
      ${renderLogout()}
      ${renderBrandFooter()}
      ${renderBottomNav()}
    `;
  }

  // ------------------------------
  // Event delegation
  // ------------------------------
  function bindEvents() {
    const container = document.getElementById('screen-my');
    if (!container) return;

    container.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;

      switch (action) {
        case 'go-back':
          window.location.href = 'index.html';
          break;

        case 'go-to-page':
          window.location.href = target.dataset.href;
          break;

        case 'open-notifications':
        case 'open-settings':
        case 'edit-avatar':
        case 'open-menu-item':
        case 'logout':
          // NOTE: 데모 범위 — 자리만 마련 (추후 실제 동작 연결)
          break;

        default:
          break;
      }
    });
  }

  function init() {
    bindEvents();
    render();
    // 이 페이지는 화면 전환이 없는 정적 마이페이지이므로, store 구독 없이 최초 1회만 렌더한다.
  }

  window.MoodPlaceMy = { init };
})();

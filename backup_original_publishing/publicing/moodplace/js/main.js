/**
 * main.js
 * ------------------------------------------------------------------
 * 메인 화면(Main Screen) 렌더 + 이벤트 처리.
 *
 * 설계 원칙 (React 전환 대비):
 *  - render*(data) 함수들은 "데이터를 받아 HTML 문자열을 반환"하는 순수 함수.
 *    → 이후 각각 <Header/>, <MoodChips/>, <CafeCard/> 같은 컴포넌트로 1:1 치환 가능.
 *  - 이벤트는 컨테이너(#screen-main)에 위임(delegation)하여 리렌더 후에도 유지.
 *  - store.subscribe 로 상태 변경 시 자동 리렌더 (React의 리렌더와 동일한 흐름).
 * ------------------------------------------------------------------
 */

(function () {
  const { store, MAIN_MOOD_TAGS, THEME_FILTERS, getCuratorMessage } =
    window.MoodPlaceData;

  // ------------------------------
  // Icon set (inline SVG, currentColor 기반)
  // ------------------------------
  const ICONS = {
    bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    sparkle: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z"/><path d="M19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15z"/></svg>`,
    bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    bookmarkFilled: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    coffee: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h14v5a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V9z"/><path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M7 2c0 1-1 1-1 2s1 1 1 2M11 2c0 1-1 1-1 2s1 1 1 2"/></svg>`,
    headphones: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15v-3a9 9 0 0 1 18 0v3"/><rect x="2.5" y="14.5" width="5" height="7" rx="1.8"/><rect x="16.5" y="14.5" width="5" height="7" rx="1.8"/></svg>`,
    sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></svg>`,
    home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/></svg>`,
    map: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15M15 6v15"/></svg>`,
    aiSearch: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg>`,
  };

  const THEME_ICON_MAP = {
    coffee: ICONS.coffee,
    headphones: ICONS.headphones,
    sun: ICONS.sun,
    moon: ICONS.moon,
  };

  // ------------------------------
  // Pure render functions (component 대응)
  // ------------------------------

  function renderHeader() {
    return `
      <header class="main-header">
        <div class="brand-logo">
          <img src="assets/logo_01.png" alt="MoodPlace" class="brand-logo-img" />
        </div>
        <button class="icon-btn" type="button" data-action="open-notifications" aria-label="알림">
          <span class="icon">${ICONS.bell}</span>
          <span class="notif-dot"></span>
        </button>
      </header>
    `;
  }

  function renderMoodChips(state) {
    const chips = MAIN_MOOD_TAGS.map((mood) => {
      const isActive = state.selectedMoods.includes(mood.id);
      return `
        <button
          type="button"
          class="mood-chip ${isActive ? 'is-active' : ''}"
          data-action="toggle-mood"
          data-mood-id="${mood.id}"
          aria-pressed="${isActive}"
        >${mood.label}</button>
      `;
    }).join('');

    return `<div class="mood-chip-row" role="group" aria-label="오늘의 무드 선택">${chips}</div>`;
  }

  function renderSearchBar() {
    return `
      <button type="button" class="ai-search-bar" data-action="open-search-modal">
        <span class="icon-search">${ICONS.search}</span>
        <span class="search-placeholder">오늘은 어떤장소를 찾으시나요</span>
        <span class="icon-sparkle">${ICONS.sparkle}</span>
      </button>
    `;
  }

  function renderCafePhotoStyle(photo) {
    if (photo.image) {
      return `background-image: url('${photo.image}'); background-size: cover; background-position: center;`;
    }
    return `background-image: linear-gradient(160deg, ${photo.from}, ${photo.to});`;
  }

  function renderHeroCard(cafe) {
    return `
      <article class="cafe-card cafe-card--hero" data-cafe-id="${cafe.id}" data-action="open-cafe" role="button" tabindex="0">
        <div class="cafe-photo" style="${renderCafePhotoStyle(cafe.photo)}">
          <span class="match-badge">${cafe.match}% Match</span>
          ${!cafe.photo.image ? `<span class="photo-emoji">${cafe.photo.emoji}</span>` : ''}
        </div>
        <div class="cafe-body">
          <div class="cafe-tag-row">
            ${cafe.tags.map((t) => `<span class="cafe-tag">#${t}</span>`).join('')}
          </div>
          <h3 class="cafe-name">${cafe.name}</h3>
          <p class="cafe-meta">${cafe.location} • ${cafe.description}</p>
        </div>
      </article>
    `;
  }

  function renderListCard(cafe, isBookmarked) {
    return `
      <article class="cafe-card cafe-card--list" data-cafe-id="${cafe.id}" data-action="open-cafe" role="button" tabindex="0">
        <div class="cafe-thumb" style="${renderCafePhotoStyle(cafe.photo)}">${!cafe.photo.image ? cafe.photo.emoji : ''}</div>
        <div class="cafe-info">
          <p class="match-inline">${cafe.match}% Match</p>
          <h3 class="cafe-name">${cafe.name}</h3>
          <p class="cafe-meta">${cafe.description}</p>
        </div>
        <button
          type="button"
          class="bookmark-btn ${isBookmarked ? 'is-bookmarked' : ''}"
          data-action="toggle-bookmark"
          data-cafe-id="${cafe.id}"
          aria-label="북마크"
          aria-pressed="${isBookmarked}"
        >
          <span class="icon">${isBookmarked ? ICONS.bookmarkFilled : ICONS.bookmark}</span>
        </button>
      </article>
    `;
  }

  function renderRecommendSection(state) {
    const cafes = state.cafes;
    const hero = cafes.find((c) => c.hero);
    const listCafes = cafes.filter((c) => !c.hero).slice(0, 2);

    return `
      <section class="recommend-section">
        <div class="section-header">
          <h2>오늘의 추천</h2>
          <button type="button" class="section-link" data-action="view-all">전체보기</button>
        </div>
        ${hero ? renderHeroCard(hero) : ''}
        ${listCafes
          .map((c) => renderListCard(c, state.bookmarkedIds.includes(c.id)))
          .join('')}
      </section>
    `;
  }

  function renderCuratorCard(state) {
    const message = getCuratorMessage(state.selectedMoods);
    return `
      <section class="curator-card">
        <div class="curator-icon">${ICONS.sparkle}</div>
        <div>
          <p class="curator-title">AI 큐레이터 한마디</p>
          <p class="curator-message">"${message}"</p>
        </div>
      </section>
    `;
  }

  function renderThemeGrid(state) {
    return `
      <section class="theme-section">
        <div class="section-header">
          <h2>테마별 탐색</h2>
        </div>
        <div class="theme-grid">
          ${THEME_FILTERS.map(
            (theme) => {
              const isSelected = state.selectedThemes.includes(theme.id);
              return `
                <button
                  type="button"
                  class="theme-card ${isSelected ? 'is-selected' : ''}"
                  data-action="filter-theme"
                  data-theme-id="${theme.id}"
                  aria-pressed="${isSelected}"
                >
                  <span class="icon">${THEME_ICON_MAP[theme.icon] || ''}</span>
                  <span class="theme-label">${theme.label}</span>
                </button>
              `;
            }
          ).join('')}
        </div>
      </section>
    `;
  }

  function renderBottomNav(state) {
    const tabs = [
      { id: 'home', label: '홈', icon: ICONS.home },
      { id: 'explore', label: '지도', icon: ICONS.map },
      { id: 'bookmarks', label: '북마크', icon: ICONS.bookmark },
      { id: 'profile', label: '마이페이지', icon: ICONS.user },
    ];

    return `
      <nav class="bottom-nav" aria-label="하단 탭">
        ${tabs
          .map(
            (tab) => `
              <button
                type="button"
                class="nav-tab ${state.activeTab === tab.id ? 'is-active' : ''}"
                data-action="set-tab"
                data-tab-id="${tab.id}"
                aria-label="${tab.label}"
                aria-current="${state.activeTab === tab.id}"
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
    const state = store.getState();
    const container = document.getElementById('screen-main');
    if (!container) return;

    container.innerHTML = `
      ${renderHeader()}
      <div class="main-content">
        <h1 class="main-headline">지금 어떤 느낌을<br />원하시나요?</h1>
        ${renderMoodChips(state)}
        ${renderSearchBar()}
        ${renderRecommendSection(state)}
        ${renderCuratorCard(state)}
        ${renderThemeGrid(state)}
      </div>
      ${renderBottomNav(state)}
    `;
  }

  // ------------------------------
  // Event delegation (컨테이너 노드는 리렌더되어도 유지되므로 1회만 바인딩)
  // ------------------------------
  function bindEvents() {
    const container = document.getElementById('screen-main');
    if (!container) return;

    container.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;

      switch (action) {
        case 'toggle-mood':
          store.dispatch({ type: 'TOGGLE_MAIN_MOOD', payload: target.dataset.moodId });
          break;

        case 'toggle-bookmark':
          store.dispatch({ type: 'TOGGLE_BOOKMARK', payload: target.dataset.cafeId });
          break;

        case 'open-cafe':
          // 카드 클릭 → 리뷰/장소 상세 화면(STEP 4)으로 이동
          store.dispatch({ type: 'SELECT_CAFE', payload: target.dataset.cafeId });
          break;

        case 'set-tab':
          store.dispatch({ type: 'SET_ACTIVE_TAB', payload: target.dataset.tabId });
          break;

        case 'open-search-modal':
          // NOTE: 무드 탐색 모달(STEP 3)은 다음 단계에서 구현됩니다.
          store.dispatch({ type: 'OPEN_SEARCH_MODAL' });
          break;

        case 'open-notifications':
        case 'view-all':
        case 'filter-theme':
          store.dispatch({ type: 'TOGGLE_THEME', payload: target.dataset.themeId });
          break;

        default:
          break;
      }
    });
  }

  function init() {
    bindEvents();
    render();
    store.subscribe((state, action) => {
      if (action && action.type === 'SET_MOOD_DESCRIPTION') return;
      render();
    });
  }

  window.MoodPlaceMain = { init };
})();

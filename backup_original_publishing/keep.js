/**
 * keep.js
 * ------------------------------------------------------------------
 * 저장한 장소 화면(Keep Screen, STEP 8) 렌더 + 이벤트 처리.
 * `keep.html` 독립 페이지 전용 스크립트 (index.html SPA 에는 포함되지 않음).
 *
 * 진입 경로: 하단 탭바의 '북마크' 탭 클릭, 또는 다른 화면(메인/리뷰/근처 카페 찾기 등)에서
 *   하트·북마크 아이콘을 눌러 저장한 뒤 진입.
 *
 * 설계 원칙 (React 전환 대비):
 *  - find.js / my.js 와 동일하게 순수 render 함수 + 이벤트 위임 패턴 사용.
 *  - 전역 store 의 bookmarkedIds 를 그대로 사용 → 어느 화면에서 저장을 토글하든
 *    이 화면에 동일하게 반영되는 구조 (React 전환 시 Context/전역 상태 공유 지점).
 *  - 카테고리 필터(state.savedFilterCategory)도 store 에 저장 → useState 슬라이스로 대응.
 * ------------------------------------------------------------------
 */

(function () {
  const { store, SAVED_PLACES, SAVED_CATEGORY_FILTERS } = window.MoodPlaceData;

  // ------------------------------
  // Icon set (inline SVG, currentColor 기반)
  // ------------------------------
  const ICONS = {
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg>`,
    heartFilled: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.8 8.6c0 4.6-8.8 10.4-8.8 10.4S3.2 13.2 3.2 8.6a4.9 4.9 0 0 1 8.8-3 4.9 4.9 0 0 1 8.8 3z"/></svg>`,
    home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/></svg>`,
    map: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15M15 6v15"/></svg>`,
    bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  };

  // ------------------------------
  // Pure render functions (component 대응)
  // ------------------------------

  function renderHeader() {
    return `
      <header class="keep-header">
        <div class="keep-logo" aria-hidden="true">
          <span class="keep-logo-sub">my</span>
          <span class="keep-logo-main">MoodPlace</span>
        </div>
        <button class="keep-avatar-btn" type="button" data-action="go-to-profile" aria-label="마이페이지로 이동">
          <span class="icon">${ICONS.user}</span>
        </button>
      </header>
    `;
  }

  function renderTitleSection() {
    return `
      <section class="keep-title-section">
        <h1 class="keep-title">저장한 장소</h1>
        <p class="keep-subtitle">당신이 영감을 받았던 공간들을 확인해보세요.</p>
      </section>
    `;
  }

  function renderFilterRow(activeCategory) {
    return `
      <div class="keep-filter-row" role="tablist" aria-label="카테고리 필터">
        ${SAVED_CATEGORY_FILTERS.map(
          (filter) => `
            <button
              type="button"
              class="keep-filter-chip ${filter.id === activeCategory ? 'is-active' : ''}"
              data-action="set-filter"
              data-filter-id="${filter.id}"
              role="tab"
              aria-selected="${filter.id === activeCategory}"
            >${filter.label}</button>
          `
        ).join('')}
      </div>
    `;
  }

  function renderCard(place) {
    return `
      <article class="keep-card">
        <div class="keep-card-thumb" style="background-image: url('${place.image}');"></div>
        <div class="keep-card-info">
          <p class="keep-card-name">${place.name}</p>
          <p class="keep-card-address">${place.address}</p>
          <div class="keep-card-tag-row">
            <span class="keep-tag keep-tag--pink">${place.tags[0]}</span>
            <span class="keep-tag keep-tag--teal">${place.tags[1]}</span>
          </div>
        </div>
        <button
          class="keep-heart-btn"
          type="button"
          data-action="unsave-place"
          data-place-id="${place.id}"
          aria-label="저장 해제"
        >
          <span class="icon">${ICONS.heartFilled}</span>
        </button>
      </article>
    `;
  }

  function renderList(places) {
    if (!places.length) {
      return `<p class="keep-empty">아직 저장한 장소가 없어요. 마음에 드는 공간을 하트로 저장해보세요.</p>`;
    }
    return `<div class="keep-list">${places.map(renderCard).join('')}</div>`;
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
                class="nav-tab ${tab.id === 'bookmarks' ? 'is-active' : ''}"
                data-action="go-to-page"
                data-href="${tab.href}"
                aria-label="${tab.label}"
                aria-current="${tab.id === 'bookmarks'}"
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
    const container = document.getElementById('screen-keep');
    if (!container) return;

    const savedPlaces = SAVED_PLACES.filter((place) => state.bookmarkedIds.includes(place.id));
    const visiblePlaces =
      state.savedFilterCategory === 'all'
        ? savedPlaces
        : savedPlaces.filter((place) => place.category === state.savedFilterCategory);

    container.innerHTML = `
      ${renderHeader()}
      ${renderTitleSection()}
      ${renderFilterRow(state.savedFilterCategory)}
      ${renderList(visiblePlaces)}
      ${renderBottomNav()}
    `;
  }

  // ------------------------------
  // Event delegation
  // ------------------------------
  function bindEvents() {
    const container = document.getElementById('screen-keep');
    if (!container) return;

    container.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;

      switch (action) {
        case 'set-filter':
          store.dispatch({ type: 'SET_SAVED_FILTER', payload: target.dataset.filterId });
          break;

        case 'unsave-place':
          store.dispatch({ type: 'TOGGLE_BOOKMARK', payload: target.dataset.placeId });
          break;

        case 'go-to-profile':
          window.location.href = 'my.html';
          break;

        case 'go-to-page':
          window.location.href = target.dataset.href;
          break;

        default:
          break;
      }
    });
  }

  function init() {
    bindEvents();
    render();
    store.subscribe(() => render());
  }

  window.MoodPlaceKeep = { init };
})();

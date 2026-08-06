/**
 * find.js
 * ------------------------------------------------------------------
 * 근처 카페 찾기 화면(Find Screen, STEP 7) 렌더 + 이벤트 처리.
 * `find.html` 독립 페이지 전용 스크립트 (index.html SPA 에는 포함되지 않음).
 *
 * 진입 경로: 하단 탭바의 '지도' 탭 클릭 (main.js / review.js 등의 nav-tab 과 동일 위치)
 *   → find.html 로 페이지 이동.
 *
 * 설계 원칙 (React 전환 대비):
 *  - review.js / map.js 와 동일하게 순수 render 함수 + 이벤트 위임 패턴 사용.
 *  - 선택된 마커(state.selectedNearbyPlaceId)는 전역 store 에 저장 →
 *    React 전환 시 useState 슬라이스로 그대로 대응.
 *  - 저장(북마크)은 전역 store 의 bookmarkedIds 를 그대로 사용 → keep.html(STEP 8) 과 데이터 공유.
 *  - "이 장소로 길찾기" 버튼은 계획서(STEP 7) 상 map_rode.html(길찾기 화면)로 이동한다.
 *    상세 경로 프리필 연동은 map_rode.html 을 다시 작업할 때 이어서 연결한다.
 * ------------------------------------------------------------------
 */

(function () {
  const { store, NEARBY_PLACES, NEARBY_TAG_ICON_META, getNearbyPlaceById } = window.MoodPlaceData;

  // ------------------------------
  // Icon set (inline SVG, currentColor 기반)
  // ------------------------------
  const ICONS = {
    menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>`,
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    locate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>`,
    pin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22s7.5-7 7.5-12.5a7.5 7.5 0 1 0-15 0C4.5 15 12 22 12 22z"/></svg>`,
    bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    bookmarkFilled: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/></svg>`,
    map: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15M15 6v15"/></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg>`,
  };

  const TAG_EMOJI = NEARBY_TAG_ICON_META;

  // ------------------------------
  // Static map illustration (map.js 의 배경과 톤을 맞춘 정적 SVG — 실제 지도 SDK 연동 전 임시 대체)
  // ------------------------------
  const MAP_BACKGROUND_SVG = `
    <svg viewBox="0 0 400 340" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="340" fill="#e9efe4" />
      <path d="M-20 50 Q120 10 180 80 T420 60" stroke="#cfe3ee" stroke-width="24" fill="none" opacity="0.7" />
      <circle cx="60" cy="250" r="75" fill="#cfe6c8" opacity="0.55" />
      <circle cx="340" cy="100" r="60" fill="#cfe6c8" opacity="0.45" />
      <circle cx="310" cy="280" r="48" fill="#cfe6c8" opacity="0.4" />
      <g stroke="#ffffff" stroke-width="3" opacity="0.8">
        <path d="M0 150 L400 130" />
        <path d="M0 225 L400 250" />
        <path d="M70 0 L120 340" />
        <path d="M270 0 L240 340" />
        <path d="M340 0 L370 340" />
      </g>
      <g stroke="#dfe6d8" stroke-width="1.5" opacity="0.9">
        <path d="M0 95 L400 100" />
        <path d="M0 180 L400 175" />
        <path d="M170 0 L160 340" />
      </g>
    </svg>
  `;

  // ------------------------------
  // Helpers
  // ------------------------------

  /** 선택된 장소 id 를 가져오되, 아직 선택 전이면 isDefault 장소(없으면 첫 번째)를 사용 */
  function getActivePlace(state) {
    if (state.selectedNearbyPlaceId) {
      const selected = getNearbyPlaceById(state.selectedNearbyPlaceId);
      if (selected) return selected;
    }
    return NEARBY_PLACES.find((p) => p.isDefault) || NEARBY_PLACES[0];
  }

  // ------------------------------
  // Pure render functions (component 대응)
  // ------------------------------

  function renderHeader() {
    return `
      <header class="find-header">
        <button class="find-icon-btn" type="button" data-action="open-menu" aria-label="메뉴">
          <span class="icon">${ICONS.menu}</span>
        </button>
        <button class="find-icon-btn" type="button" data-action="open-search" aria-label="검색">
          <span class="icon">${ICONS.search}</span>
        </button>
      </header>
    `;
  }

  function renderMapCanvas(activePlaceId) {
    const markers = NEARBY_PLACES.map((place) => {
      const isActive = place.id === activePlaceId;
      return `
        <button
          type="button"
          class="find-marker ${isActive ? 'is-active' : ''}"
          style="top: ${place.position.top}; left: ${place.position.left};"
          data-action="select-marker"
          data-place-id="${place.id}"
          aria-label="${place.name} 선택"
          aria-pressed="${isActive}"
        >
          <span class="find-marker-label">${place.name}</span>
          <span class="find-marker-pin">${ICONS.pin}</span>
        </button>
      `;
    }).join('');

    return `
      <div class="find-map-canvas">
        ${MAP_BACKGROUND_SVG}
        ${markers}
        <button class="find-locate-btn" type="button" data-action="locate-me" aria-label="현재 위치로 이동">
          <span class="icon">${ICONS.locate}</span>
        </button>
      </div>
    `;
  }

  function renderTagChip(tag) {
    const emoji = TAG_EMOJI[tag.icon] || '';
    return `<span class="find-tag">${emoji ? `<span aria-hidden="true">${emoji}</span>` : ''}${tag.label}</span>`;
  }

  function renderSheet(place, isSaved) {
    return `
      <div class="find-sheet">
        <div class="find-sheet-handle" aria-hidden="true"></div>

        <div class="find-place-row">
          <h1 class="find-place-name">${place.name}</h1>
          <button
            class="find-save-btn ${isSaved ? 'is-saved' : ''}"
            type="button"
            data-action="toggle-save"
            data-place-id="${place.id}"
            aria-label="저장하기"
            aria-pressed="${isSaved}"
          >
            <span class="icon">${isSaved ? ICONS.bookmarkFilled : ICONS.bookmark}</span>
          </button>
        </div>

        <p class="find-address">${place.address}</p>

        <div class="find-tag-row">
          ${place.tags.map(renderTagChip).join('')}
        </div>

        <div class="find-description-box">
          <p>${place.description}</p>
        </div>

        <div class="find-photo-row">
          ${place.photos
            .map((src) => `<div class="find-photo-thumb" style="background-image: url('${src}');"></div>`)
            .join('')}
        </div>

        <button type="button" class="find-cta-btn" data-action="navigate-to-place" data-place-id="${place.id}">
          이 장소로 길찾기
        </button>
      </div>
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
                class="nav-tab ${tab.id === 'explore' ? 'is-active' : ''}"
                data-action="go-to-page"
                data-href="${tab.href}"
                aria-label="${tab.label}"
                aria-current="${tab.id === 'explore'}"
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
    const container = document.getElementById('screen-find');
    if (!container) return;

    const place = getActivePlace(state);
    const isSaved = state.bookmarkedIds.includes(place.id);

    container.innerHTML = `
      ${renderHeader()}
      ${renderMapCanvas(place.id)}
      ${renderSheet(place, isSaved)}
      ${renderBottomNav()}
    `;
  }

  // ------------------------------
  // Event delegation
  // ------------------------------
  function bindEvents() {
    const container = document.getElementById('screen-find');
    if (!container) return;

    container.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;

      switch (action) {
        case 'select-marker':
          store.dispatch({ type: 'SELECT_NEARBY_PLACE', payload: target.dataset.placeId });
          break;

        case 'toggle-save':
          store.dispatch({ type: 'TOGGLE_BOOKMARK', payload: target.dataset.placeId });
          break;

        case 'navigate-to-place':
          // "이 장소로 길찾기" → 길찾기 화면(map_rode.html)으로 이동.
          // 도착지 프리필 등 상세 연동은 map_rode.html 을 다시 작업할 때 이어서 연결합니다.
          window.location.href = 'map_rode.html';
          break;

        case 'go-to-page':
          window.location.href = target.dataset.href;
          break;

        case 'open-menu':
        case 'open-search':
        case 'locate-me':
          // NOTE: 데모 범위 — 자리만 마련 (추후 실제 동작 연결)
          break;

        default:
          break;
      }
    });
  }

  function init() {
    bindEvents();
    store.subscribe((state) => {
      if (state.screen === 'find') render();
    });
  }

  window.MoodPlaceFind = { init };
})();

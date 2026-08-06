/**
 * map.js
 * ------------------------------------------------------------------
 * 지도 / 길찾기 안내 화면(Map Screen, STEP 6) 렌더 + 이벤트 처리.
 *
 * 진입 경로: 예약 화면(reservation.js)의 위치 지도 썸네일 클릭
 *   → store.dispatch({ type: 'SET_TRAVEL_MODE', payload: 'walk' })
 *   → store.dispatch({ type: 'GO_TO_SCREEN', payload: 'map' })
 *   (선택된 카페 id는 state.selectedCafeId 를 리뷰/예약 화면과 그대로 공유)
 *
 * 설계 원칙 (React 전환 대비):
 *  - review.js / reservation.js 와 동일하게 순수 render 함수 + 이벤트 위임 패턴 사용.
 *  - 이동수단(state.travelMode)과 선택된 경로(state.selectedRouteId)는 전역 store 에 저장 →
 *    React 로 옮길 때 각각 useState 또는 useReducer 의 한 슬라이스로 그대로 대응.
 *  - "안내 시작" 버튼은 계획서(STEP 6) 상 데모 범위이므로 자리만 구현.
 *  - 실제 지도 API(SDK) 연동 전이므로, 지도 영역은 브랜드 톤에 맞춘 정적 SVG 일러스트로 대체.
 * ------------------------------------------------------------------
 */

(function () {
  const { store, getCafeById, TRAVEL_MODES, MAP_ORIGIN_LABEL } = window.MoodPlaceData;

  // ------------------------------
  // Icon set (inline SVG, currentColor 기반)
  // ------------------------------
  const ICONS = {
    back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
    more: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>`,
    pinFilled: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22s7.5-7 7.5-12.5a7.5 7.5 0 1 0-15 0C4.5 15 12 22 12 22z"/></svg>`,
    swap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 10 7 4 3 8"/><line x1="7" y1="4" x2="7" y2="20"/><polyline points="17 14 17 20 21 16"/><line x1="17" y1="4" x2="17" y2="20"/></svg>`,
    walk: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4.5" r="1.8" fill="currentColor" stroke="none"/><path d="M10.5 8l-2 3.5 2.3 1.7-1 6"/><path d="M13.5 9l2.5 2-1 5"/><path d="M10 12.5l-3 1.5-1.5 3.5"/><path d="M15 11l2.5 1.5 2 3"/></svg>`,
    transit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="4" width="15" height="12" rx="2.5"/><line x1="4.5" y1="10" x2="19.5" y2="10"/><circle cx="8" cy="17.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="16" cy="17.5" r="1.3" fill="currentColor" stroke="none"/></svg>`,
    taxi: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15.5l1.5-5A2 2 0 0 1 7.4 9h9.2a2 2 0 0 1 1.9 1.5l1.5 5"/><rect x="3" y="15" width="18" height="4.5" rx="1.5"/><circle cx="7.5" cy="19.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="16.5" cy="19.5" r="1.3" fill="currentColor" stroke="none"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16.5"/><line x1="12" y1="7.5" x2="12" y2="7.51"/></svg>`,
    route: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M6 8.2V13a4 4 0 0 0 4 4h2"/></svg>`,
    chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  };

  // ------------------------------
  // Static map illustration (실제 지도 SDK 연동 전 임시 대체 — 브랜드 톤의 정적 SVG)
  // ------------------------------
  const MAP_BACKGROUND_SVG = `
    <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="320" fill="#e9efe4" />
      <path d="M-20 60 Q120 20 180 90 T420 70" stroke="#cfe3ee" stroke-width="26" fill="none" opacity="0.7" />
      <circle cx="70" cy="230" r="70" fill="#cfe6c8" opacity="0.55" />
      <circle cx="330" cy="90" r="55" fill="#cfe6c8" opacity="0.45" />
      <circle cx="300" cy="260" r="46" fill="#cfe6c8" opacity="0.4" />
      <g stroke="#ffffff" stroke-width="3" opacity="0.8">
        <path d="M0 140 L400 120" />
        <path d="M0 210 L400 235" />
        <path d="M60 0 L110 320" />
        <path d="M260 0 L230 320" />
        <path d="M330 0 L360 320" />
      </g>
      <g stroke="#dfe6d8" stroke-width="1.5" opacity="0.9">
        <path d="M0 90 L400 95" />
        <path d="M0 170 L400 165" />
        <path d="M160 0 L150 320" />
      </g>
    </svg>
  `;

  // ------------------------------
  // Helpers
  // ------------------------------

  /** 선택된 이동수단의 경로 목록을 조회하고, 사용자가 고른 경로를 맨 앞(추천)으로 정렬한다 */
  function getOrderedRoutes(cafe, travelMode, selectedRouteId) {
    const route = cafe.detail && cafe.detail.route;
    const routes = (route && route.routesByMode && route.routesByMode[travelMode]) || [];
    if (!routes.length) return [];

    if (!selectedRouteId) return routes;

    const idx = routes.findIndex((r) => r.id === selectedRouteId);
    if (idx <= 0) return routes;

    const reordered = [...routes];
    const [picked] = reordered.splice(idx, 1);
    reordered.unshift(picked);
    return reordered;
  }

  // ------------------------------
  // Pure render functions (component 대응)
  // ------------------------------

  function renderHeader() {
    return `
      <header class="map-header">
        <button class="map-icon-btn" type="button" data-action="go-back" aria-label="뒤로가기">
          <span class="icon">${ICONS.back}</span>
        </button>
        <div class="map-logo" aria-hidden="true">
          <span class="map-logo-sub">my</span>
          <span class="map-logo-main">MoodPlace</span>
        </div>
        <button class="map-icon-btn" type="button" data-action="open-more" aria-label="더보기">
          <span class="icon">${ICONS.more}</span>
        </button>
      </header>
    `;
  }

  function renderMapCanvas() {
    return `
      <div class="map-canvas">
        ${MAP_BACKGROUND_SVG}
        <div class="map-marker is-origin" style="top: 62%; left: 28%;">
          <span class="map-marker-dot"></span>
        </div>
        <div class="map-marker" style="top: 38%; left: 62%;">
          <span class="map-marker-pin">${ICONS.pinFilled}</span>
        </div>
      </div>
    `;
  }

  function renderRouteInputs(destinationLabel) {
    return `
      <div class="map-route-inputs">
        <div class="map-route-icons">
          <span class="map-marker-dot"></span>
          <span class="map-dashed-line" aria-hidden="true"></span>
          <span class="icon">${ICONS.pinFilled}</span>
        </div>
        <div class="map-route-fields">
          <div class="map-route-field">
            <div class="map-route-field-text">
              <p class="map-route-field-label">출발지</p>
              <p class="map-route-field-value">${MAP_ORIGIN_LABEL}</p>
            </div>
          </div>
          <div class="map-route-field">
            <div class="map-route-field-text">
              <p class="map-route-field-label">도착지</p>
              <p class="map-route-field-value">${destinationLabel}</p>
            </div>
            <button class="map-swap-btn" type="button" data-action="swap-route" aria-label="출발지/도착지 전환">
              <span class="icon">${ICONS.swap}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderModeToggle(activeMode) {
    return `
      <div class="map-mode-toggle" role="tablist" aria-label="이동수단 선택">
        ${TRAVEL_MODES.map(
          (mode) => `
            <button
              type="button"
              class="map-mode-btn ${mode.id === activeMode ? 'is-active' : ''}"
              data-action="set-travel-mode"
              data-mode-id="${mode.id}"
              role="tab"
              aria-selected="${mode.id === activeMode}"
            >
              <span class="icon">${ICONS[mode.icon]}</span>${mode.label}
            </button>
          `
        ).join('')}
      </div>
    `;
  }

  function renderFeaturedRoute(route) {
    const metaParts = [route.distanceLabel, route.metaLabel].filter(Boolean);
    return `
      <article class="map-route-featured">
        <div class="map-route-featured-top">
          ${route.badge ? `<span class="map-route-badge">${route.badge}</span>` : '<span></span>'}
          <div class="map-route-featured-meta">
            ${metaParts.map((m) => `<div>${m}</div>`).join('')}
          </div>
        </div>
        <div class="map-route-featured-time">
          <span class="num">${route.durationMin}</span>
          <span class="unit">분</span>
        </div>
        <div class="map-route-progress">
          <div class="map-route-progress-fill" style="width: ${route.progress || 60}%;"></div>
        </div>
        ${
          route.description
            ? `<p class="map-route-desc"><span class="icon">${ICONS.route}</span>${route.description}</p>`
            : ''
        }
      </article>
    `;
  }

  function renderAltRoute(route) {
    return `
      <article
        class="map-route-alt"
        role="button"
        tabindex="0"
        data-action="select-route"
        data-route-id="${route.id}"
        aria-label="${route.durationMin}분 경로로 변경"
      >
        <div>
          <div class="map-route-alt-time">
            <span class="num">${route.durationMin}</span>
            <span class="unit">분</span>
          </div>
          ${route.metaLabel ? `<p class="map-route-alt-meta">${route.metaLabel}</p>` : ''}
        </div>
        <span class="map-route-alt-arrow">${ICONS.chevronRight}</span>
      </article>
    `;
  }

  function renderRouteSection(cafe, travelMode, selectedRouteId) {
    const routes = getOrderedRoutes(cafe, travelMode, selectedRouteId);

    if (!routes.length) {
      return `
        <section>
          <div class="map-section-header">
            <h2 class="map-section-title">추천 경로</h2>
          </div>
          <p style="font-size: 13.5px; color: var(--color-text-muted);">이 이동수단에 대한 경로 정보가 없어요.</p>
        </section>
      `;
    }

    const [featured, ...alternatives] = routes;

    return `
      <section>
        <div class="map-section-header">
          <h2 class="map-section-title">추천 경로</h2>
          <span class="map-section-hint"><span class="icon">${ICONS.info}</span>실시간 교통상황 반영</span>
        </div>
        ${renderFeaturedRoute(featured)}
        ${alternatives.map(renderAltRoute).join('')}
      </section>
    `;
  }

  function renderSheet(cafe, travelMode, selectedRouteId) {
    const route = cafe.detail && cafe.detail.route;
    const destinationLabel = (route && route.destinationLabel) || cafe.name;

    return `
      <div class="map-sheet">
        <div class="map-sheet-handle" aria-hidden="true"></div>
        ${renderRouteInputs(destinationLabel)}
        ${renderModeToggle(travelMode)}
        ${renderRouteSection(cafe, travelMode, selectedRouteId)}
      </div>
    `;
  }

  function renderCtaBar() {
    return `
      <div class="map-cta-bar">
        <button type="button" class="map-cta-btn" data-action="start-navigation">안내 시작</button>
      </div>
    `;
  }

  // ------------------------------
  // Root render
  // ------------------------------
  function render() {
    const state = store.getState();
    const container = document.getElementById('screen-map');
    if (!container) return;

    const cafe = getCafeById(state.selectedCafeId);

    if (!cafe) {
      container.innerHTML = `
        ${renderHeader()}
        <div style="padding: 96px var(--space-5) 0;">
          <p>길찾기 정보를 불러올 수 없어요.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      ${renderHeader()}
      ${renderMapCanvas()}
      ${renderSheet(cafe, state.travelMode, state.selectedRouteId)}
      ${renderCtaBar()}
    `;
  }

  // ------------------------------
  // Event delegation
  // ------------------------------
  function bindEvents() {
    const container = document.getElementById('screen-map');
    if (!container) return;

    container.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;

      switch (action) {
        case 'go-back':
          store.dispatch({ type: 'GO_TO_SCREEN', payload: 'reservation' });
          break;

        case 'set-travel-mode':
          store.dispatch({ type: 'SET_TRAVEL_MODE', payload: target.dataset.modeId });
          break;

        case 'select-route':
          // 대안 경로 카드 클릭 → 추천 경로 자리로 교체
          store.dispatch({ type: 'SELECT_ROUTE', payload: target.dataset.routeId });
          break;

        case 'open-more':
        case 'swap-route':
        case 'start-navigation':
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
      if (state.screen === 'map') render();
    });
  }

  window.MoodPlaceMap = { init };
})();

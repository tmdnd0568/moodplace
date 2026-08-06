/**
 * review.js
 * ------------------------------------------------------------------
 * 리뷰 / 장소 상세 화면(Review Screen, STEP 4) 렌더 + 이벤트 처리.
 *
 * 진입 경로: 메인 화면(main.js)의 히어로/리스트 카페 카드 클릭
 *   → store.dispatch({ type: 'SELECT_CAFE', payload: cafeId })
 *   → state.selectedCafeId 갱신 + state.screen = 'review'
 *
 * 설계 원칙 (React 전환 대비):
 *  - main.js / search.js 와 동일하게 순수 render 함수 + 이벤트 위임 패턴 사용.
 *  - 선택된 카페(id)는 state.selectedCafeId 에 저장하고, 이 화면은 그 id로
 *    상세 데이터를 조회하는 구조 → React Router 의 `useParams` 대응 지점.
 *  - "돋보기" 아이콘(→ 예약 화면 이동)은 다음 STEP(예약)에서 라우팅을 연결할
 *    지점만 마크업/데이터 속성으로 미리 준비해 둔다 (data-action="open-reservation").
 * ------------------------------------------------------------------
 */

(function () {
  const { store, getCafeById } = window.MoodPlaceData;

  // ------------------------------
  // Icon set (inline SVG, currentColor 기반)
  // ------------------------------
  const ICONS = {
    back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
    heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 8.6c0 4.6-8.8 10.4-8.8 10.4S3.2 13.2 3.2 8.6a4.9 4.9 0 0 1 8.8-3 4.9 4.9 0 0 1 8.8 3z"/></svg>`,
    heartFilled: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.8 8.6c0 4.6-8.8 10.4-8.8 10.4S3.2 13.2 3.2 8.6a4.9 4.9 0 0 1 8.8-3 4.9 4.9 0 0 1 8.8 3z"/></svg>`,
    share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><line x1="8.3" y1="10.7" x2="15.7" y2="6.3"/><line x1="8.3" y1="13.3" x2="15.7" y2="17.7"/></svg>`,
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    star: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.6l-6.1 3.3 1.5-6.8-5.2-4.6 6.9-.7z"/></svg>`,
    clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>`,
    bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/></svg>`,
    map: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15M15 6v15"/></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg>`,
  };

  // ------------------------------
  // Pure render functions (component 대응)
  // ------------------------------

  function renderHeader(isLiked) {
    return `
      <header class="review-header">
        <button class="review-icon-btn" type="button" data-action="go-back" aria-label="뒤로가기">
          <span class="icon">${ICONS.back}</span>
        </button>
        <div class="review-header-actions">
          <button
            class="review-icon-btn ${isLiked ? 'is-liked' : ''}"
            type="button"
            data-action="toggle-like"
            aria-label="찜하기"
            aria-pressed="${isLiked}"
          >
            <span class="icon">${isLiked ? ICONS.heartFilled : ICONS.heart}</span>
          </button>
          <button class="review-icon-btn" type="button" data-action="share" aria-label="공유하기">
            <span class="icon">${ICONS.share}</span>
          </button>
        </div>
      </header>
    `;
  }

  function renderHeroImage(cafe) {
    const bg = cafe.photo.image
      ? `background-image: url('${cafe.photo.image}'); background-size: cover; background-position: center;`
      : `background-image: linear-gradient(160deg, ${cafe.photo.from}, ${cafe.photo.to});`;
    return `<div class="review-hero" style="${bg}"></div>`;
  }

  function renderInfoCard(cafe) {
    const detail = cafe.detail || {};
    const tags = detail.detailTags || cafe.tags || [];
    const description = detail.description || cafe.description || '';
    const rating = detail.rating != null ? detail.rating.toFixed(1) : '-';
    const hoursLabel = detail.hoursLabel || '';

    return `
      <section class="review-info-card">
        <div class="review-tag-row">
          ${tags.map((t) => `<span class="review-tag">${t}</span>`).join('')}
        </div>
        <div class="review-place-row">
          <h1 class="review-place-name">${cafe.name}</h1>
          <button
            class="review-zoom-btn"
            type="button"
            data-action="open-reservation"
            data-cafe-id="${cafe.id}"
            aria-label="예약 정보 보기"
          >
            <span class="icon">${ICONS.search}</span>
          </button>
        </div>
        <p class="review-description">${description}</p>
        <div class="review-info-divider"></div>
        <div class="review-stats-row">
          <span class="review-stat is-rating"><span class="icon">${ICONS.star}</span>${rating}</span>
          <span class="review-stat"><span class="icon">${ICONS.clock}</span>${hoursLabel}</span>
        </div>
      </section>
    `;
  }

  function renderMenuSection(cafe) {
    const menu = (cafe.detail && cafe.detail.menu) || [];

    return `
      <section class="review-section">
        <div class="review-section-header">
          <h2>메뉴</h2>
          <button type="button" class="section-link" data-action="view-all-menu">전체보기</button>
        </div>
        ${
          menu.length
            ? `<div class="menu-list">
                ${menu
                  .map(
                    (item) => `
                      <article class="menu-card">
                        <div class="menu-thumb" style="background-image: url('${item.image}');"></div>
                        <div class="menu-info">
                          <div class="menu-title-row">
                            <span class="menu-name">${item.name}</span>
                            <span class="menu-price">${item.price}</span>
                          </div>
                          <p class="menu-desc">${item.desc}</p>
                        </div>
                      </article>
                    `
                  )
                  .join('')}
              </div>`
            : `<p class="review-empty">등록된 메뉴가 없어요.</p>`
        }
      </section>
    `;
  }

  function renderStars(rating) {
    return Array.from({ length: 5 })
      .map((_, i) => `<span class="icon ${i < rating ? '' : 'is-empty'}">${ICONS.star}</span>`)
      .join('');
  }

  function renderReviewSection(cafe) {
    const detail = cafe.detail || {};
    const reviews = detail.reviews || [];
    const rating = detail.rating != null ? detail.rating.toFixed(1) : '-';
    const reviewCount = detail.reviewCount != null ? detail.reviewCount : reviews.length;

    return `
      <section class="review-section">
        <div class="review-section-header">
          <h2>리뷰</h2>
          <span class="review-section-rating"><span class="icon">${ICONS.star}</span>${rating} (${reviewCount})</span>
        </div>
        ${
          reviews.length
            ? `<div class="review-list">
                ${reviews
                  .map(
                    (r) => `
                      <article class="review-item">
                        <div class="review-item-head">
                          <div class="review-avatar">${r.initial}</div>
                          <div class="review-item-meta">
                            <p class="review-author">${r.author}</p>
                            <div class="review-stars">${renderStars(r.rating)}</div>
                          </div>
                          <span class="review-date">${r.date}</span>
                        </div>
                        <p class="review-text">${r.text}</p>
                        <div class="review-tag-chip-row">
                          ${r.tags.map((t) => `<span class="review-tag-chip">${t}</span>`).join('')}
                        </div>
                      </article>
                    `
                  )
                  .join('')}
              </div>
              <button type="button" class="review-read-all-btn" data-action="view-all-reviews">
                리뷰 ${reviewCount}개 모두 읽기
              </button>`
            : `<p class="review-empty">아직 등록된 리뷰가 없어요.</p>`
        }
      </section>
    `;
  }

  function renderBottomNav() {
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
                class="nav-tab ${tab.id === 'explore' ? 'is-active' : ''}"
                data-action="set-tab"
                data-tab-id="${tab.id}"
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
    const container = document.getElementById('screen-review');
    if (!container) return;

    const cafe = getCafeById(state.selectedCafeId);

    if (!cafe) {
      container.innerHTML = `
        ${renderHeader(false)}
        <div class="review-section" style="margin-top: 80px;">
          <p class="review-empty">장소 정보를 불러올 수 없어요.</p>
        </div>
      `;
      return;
    }

    const isLiked = state.bookmarkedIds.includes(cafe.id);

    container.innerHTML = `
      ${renderHeader(isLiked)}
      ${renderHeroImage(cafe)}
      ${renderInfoCard(cafe)}
      ${renderMenuSection(cafe)}
      ${renderReviewSection(cafe)}
      ${renderBottomNav()}
    `;
  }

  // ------------------------------
  // Event delegation (컨테이너 노드는 리렌더되어도 유지되므로 1회만 바인딩)
  // ------------------------------
  function bindEvents() {
    const container = document.getElementById('screen-review');
    if (!container) return;

    container.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;
      const state = store.getState();

      switch (action) {
        case 'go-back':
          store.dispatch({ type: 'GO_TO_SCREEN', payload: 'main' });
          break;

        case 'toggle-like':
          store.dispatch({ type: 'TOGGLE_BOOKMARK', payload: state.selectedCafeId });
          break;

        case 'set-tab':
          store.dispatch({ type: 'SET_ACTIVE_TAB', payload: target.dataset.tabId });
          break;

        case 'open-reservation':
          // 돋보기 아이콘 클릭 → 예약 화면(STEP 5)으로 이동 (선택된 카페 유지)
          store.dispatch({ type: 'GO_TO_SCREEN', payload: 'reservation' });
          break;

        case 'share':
        case 'view-all-menu':
        case 'view-all-reviews':
          // NOTE: 데모 범위 — 자리만 마련 (추후 실제 동작 연결)
          break;

        default:
          break;
      }
    });
  }

  function init() {
    bindEvents();
    store.subscribe((state, action) => {
      if (state.screen === 'review') render();
    });
  }

  window.MoodPlaceReview = { init };
})();

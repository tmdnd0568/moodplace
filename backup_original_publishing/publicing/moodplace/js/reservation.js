/**
 * reservation.js
 * ------------------------------------------------------------------
 * 예약 화면(Reservation Screen, STEP 5) 렌더 + 이벤트 처리.
 *
 * 진입 경로: 리뷰/장소 상세 화면(review.js)의 장소명 옆 돋보기 아이콘 클릭
 *   → store.dispatch({ type: 'GO_TO_SCREEN', payload: 'reservation' })
 *   (선택된 카페 id는 state.selectedCafeId 를 review 화면과 그대로 공유)
 *
 * 설계 원칙 (React 전환 대비):
 *  - review.js / main.js 와 동일하게 순수 render 함수 + 이벤트 위임 패턴 사용.
 *  - 위치 지도 썸네일 클릭 시 지도/길찾기 화면(STEP 6)으로 이동한다 (data-action="open-map").
 *  - "전화" / "네이버 예약하기" 버튼은 계획서(STEP 5) 상 데모 범위이므로 자리만 구현.
 * ------------------------------------------------------------------
 */

(function () {
  const { store, getCafeById, FACILITY_META } = window.MoodPlaceData;

  // ------------------------------
  // Icon set (inline SVG, currentColor 기반)
  // ------------------------------
  const ICONS = {
    back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
    share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><line x1="8.3" y1="10.7" x2="15.7" y2="6.3"/><line x1="8.3" y1="13.3" x2="15.7" y2="17.7"/></svg>`,
    bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    bookmarkFilled: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    star: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.6l-6.1 3.3 1.5-6.8-5.2-4.6 6.9-.7z"/></svg>`,
    pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/></svg>`,
    pinFilled: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22s7.5-7 7.5-12.5a7.5 7.5 0 1 0-15 0C4.5 15 12 22 12 22z"/></svg>`,
    chevronLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
    chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
    sparkle: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z"/><path d="M19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15z"/></svg>`,
    copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 3a2 2 0 0 1-.4 2.1L8 10.3a16 16 0 0 0 6 6l1.5-1.5a2 2 0 0 1 2.1-.4c1 .4 2 .6 3 .7a2 2 0 0 1 1.7 2z"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2"/><line x1="3" y1="9.5" x2="21" y2="9.5"/><line x1="8" y1="2.5" x2="8" y2="6.5"/><line x1="16" y1="2.5" x2="16" y2="6.5"/></svg>`,
    wifi: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 9a13 13 0 0 1 17 0"/><path d="M6.7 12.6a8.5 8.5 0 0 1 10.6 0"/><path d="M9.9 16.1a4 4 0 0 1 4.2 0"/><circle cx="12" cy="19.2" r="1" fill="currentColor" stroke="none"/></svg>`,
    parking: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M9.5 16.5v-9H13a3 3 0 0 1 0 6H9.5"/></svg>`,
    kids: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5s1.2 2 3.5 2 3.5-2 3.5-2"/><line x1="9" y1="9.5" x2="9" y2="9.51"/><line x1="15" y1="9.5" x2="15" y2="9.51"/></svg>`,
    pet: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6.5" cy="10" r="1.8"/><circle cx="10.5" cy="6.5" r="1.8"/><circle cx="14.5" cy="6.5" r="1.8"/><circle cx="18" cy="10" r="1.8"/><path d="M12 12.3c-3 0-6 2.1-6 4.6 0 1.6 1.4 2.4 3 2 1-.3 2-.7 3-.7s2 .4 3 .7c1.6.4 3-.4 3-2 0-2.5-3-4.6-6-4.6z"/></svg>`,
    group: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8.5" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.4"/><path d="M2.5 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M14.7 15c2.5.3 4.3 2.2 4.3 5"/></svg>`,
    accessible: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="1.8" fill="currentColor" stroke="none"/><path d="M11 8v3l-3.5 2M11 11h6M11 11l1.5 8M8 21a5 5 0 0 0 4.8-6.3"/></svg>`,
  };

  const FACILITY_ICON_MAP = {
    wifi: ICONS.wifi,
    parking: ICONS.parking,
    kids: ICONS.kids,
    pet: ICONS.pet,
    group: ICONS.group,
    accessible: ICONS.accessible,
  };

  // ------------------------------
  // Helpers
  // ------------------------------

  /** "HH:MM - HH:MM" 형태의 문자열을 현재 시각과 비교해 영업 상태를 계산한다 (24:00 = 자정으로 처리) */
  function getOpenStatus(openHours) {
    const parts = openHours.split('-').map((s) => s.trim());
    if (parts.length !== 2) return { isOpen: true, closeLabel: parts[1] || '' };

    const [startStr, endStr] = parts;
    const toParts = (str) => str.split(':').map((n) => parseInt(n, 10));
    const [sh, sm] = toParts(startStr);
    const [ehRaw, em] = toParts(endStr);

    const now = new Date();
    const start = new Date(now);
    start.setHours(sh, sm || 0, 0, 0);

    const end = new Date(now);
    const eh = ehRaw === 24 ? 0 : ehRaw;
    end.setHours(eh, em || 0, 0, 0);
    if (ehRaw === 24 || end <= start) {
      end.setDate(end.getDate() + 1);
    }

    const isOpen = now >= start && now <= end;
    return { isOpen, closeLabel: endStr };
  }

  // ------------------------------
  // Pure render functions (component 대응)
  // ------------------------------

  function renderHeader(isBookmarked) {
    return `
      <header class="rsv-header">
        <button class="rsv-icon-btn" type="button" data-action="go-back" aria-label="뒤로가기">
          <span class="icon">${ICONS.back}</span>
        </button>
        <div class="rsv-header-actions">
          <button class="rsv-icon-btn" type="button" data-action="share" aria-label="공유하기">
            <span class="icon">${ICONS.share}</span>
          </button>
          <button
            class="rsv-icon-btn ${isBookmarked ? 'is-bookmarked' : ''}"
            type="button"
            data-action="toggle-bookmark"
            aria-label="북마크"
            aria-pressed="${isBookmarked}"
          >
            <span class="icon">${isBookmarked ? ICONS.bookmarkFilled : ICONS.bookmark}</span>
          </button>
        </div>
      </header>
    `;
  }

  function renderHeroImage(cafe) {
    const bg = cafe.photo.image
      ? `background-image: url('${cafe.photo.image}'); background-size: cover; background-position: center;`
      : `background-image: linear-gradient(160deg, ${cafe.photo.from}, ${cafe.photo.to});`;
    return `<div class="rsv-hero" style="${bg}"></div>`;
  }

  function renderInfoCard(cafe, rsv) {
    const rating = rsv.rating != null ? rsv.rating.toFixed(1) : '-';
    return `
      <section class="rsv-info-card">
        <div class="rsv-place-row">
          <h1 class="rsv-place-name">${cafe.name}</h1>
          <span class="rsv-rating"><span class="icon">${ICONS.star}</span>${rating}</span>
        </div>
        <div class="rsv-meta-row">
          <span class="rsv-location"><span class="icon">${ICONS.pin}</span>${rsv.addressShort}</span>
          <span class="rsv-review-count">${rsv.reviewCountLabel}</span>
        </div>
      </section>
    `;
  }

  function renderVibeGuideCard(rsv) {
    return `
      <section class="rsv-vibe-card">
        <span class="rsv-vibe-sparkle" aria-hidden="true">${ICONS.sparkle}</span>
        <p class="rsv-vibe-label"><span class="icon">${ICONS.chevronLeft}</span>AI VIBE GUIDE</p>
        <p class="rsv-vibe-quote">"${rsv.vibeGuide}"</p>
      </section>
    `;
  }

  function renderHoursSection(rsv) {
    const status = getOpenStatus(rsv.openHours);
    const statusLabel = status.isOpen ? '영업 중' : '영업 종료';

    return `
      <section class="rsv-section">
        <h2 class="rsv-section-title">운영 정보</h2>
        <div class="rsv-hours-card">
          <div class="rsv-hours-status-row">
            <span class="rsv-hours-status ${status.isOpen ? '' : 'is-closed'}">${statusLabel}</span>
            <span class="rsv-hours-close-time">${status.closeLabel}에 종료</span>
          </div>
          <div class="rsv-hours-row">
            <span class="rsv-hours-label">${rsv.dayLabel}</span>
            <span class="rsv-hours-value">${rsv.openHours}</span>
          </div>
          <div class="rsv-hours-row">
            <span class="rsv-hours-label">라스트오더</span>
            <span class="rsv-hours-value">${rsv.lastOrder}</span>
          </div>
        </div>
      </section>
    `;
  }

  function renderFacilitySection(rsv) {
    const facilities = rsv.facilities || [];
    return `
      <section class="rsv-section">
        <h2 class="rsv-section-title">시설 및 편의</h2>
        <div class="rsv-facility-grid">
          ${facilities
            .map((id) => {
              const meta = FACILITY_META[id];
              if (!meta) return '';
              return `
                <div class="rsv-facility-card">
                  <span class="icon">${FACILITY_ICON_MAP[meta.icon] || ''}</span>
                  <span class="rsv-facility-label">${meta.label}</span>
                </div>
              `;
            })
            .join('')}
        </div>
      </section>
    `;
  }

  function renderLocationSection(cafe, rsv) {
    return `
      <section class="rsv-section">
        <h2 class="rsv-section-title">위치</h2>
        <button
          type="button"
          class="rsv-map-thumb"
          data-action="open-map"
          data-cafe-id="${cafe.id}"
          aria-label="지도에서 위치 보기"
        >
          <span class="rsv-map-pin">${ICONS.pinFilled}</span>
        </button>
        <div class="rsv-address-bar">
          <span class="rsv-address-text">${rsv.addressFull}</span>
          <button
            type="button"
            class="rsv-copy-btn"
            data-action="copy-address"
            data-address="${rsv.addressFull}"
            aria-label="주소 복사"
          >
            <span class="icon">${ICONS.copy}</span>
          </button>
        </div>
      </section>
    `;
  }

  function renderPreviewSection(rsv) {
    const photos = rsv.previewPhotos || [];
    return `
      <section class="rsv-section">
        <div class="rsv-section-title-row">
          <h2 class="rsv-section-title">공간 미리보기</h2>
          <button type="button" class="rsv-more-btn" data-action="view-all-preview" aria-label="더보기">
            <span class="icon">${ICONS.chevronRight}</span>
          </button>
        </div>
        <div class="rsv-preview-scroll">
          ${photos
            .map((src) => `<div class="rsv-preview-thumb" style="background-image: url('${src}');"></div>`)
            .join('')}
        </div>
      </section>
    `;
  }

  function renderActionBar(rsv) {
    return `
      <div class="rsv-action-bar">
        <a class="rsv-phone-btn" href="tel:${rsv.phone}" data-action="call-phone" aria-label="전화하기">
          <span class="icon">${ICONS.phone}</span>
        </a>
        <button type="button" class="rsv-cta-btn" data-action="naver-reservation">
          <span class="icon">${ICONS.calendar}</span>
          네이버 예약하기
        </button>
      </div>
    `;
  }

  // ------------------------------
  // Root render
  // ------------------------------
  function render() {
    const state = store.getState();
    const container = document.getElementById('screen-reservation');
    if (!container) return;

    const cafe = getCafeById(state.selectedCafeId);
    const rsv = cafe && cafe.detail ? cafe.detail.reservation : null;

    if (!cafe || !rsv) {
      container.innerHTML = `
        ${renderHeader(false)}
        <div class="rsv-section" style="margin-top: 80px;">
          <p>예약 정보를 불러올 수 없어요.</p>
        </div>
      `;
      return;
    }

    const isBookmarked = state.bookmarkedIds.includes(cafe.id);

    container.innerHTML = `
      ${renderHeader(isBookmarked)}
      ${renderHeroImage(cafe)}
      ${renderInfoCard(cafe, rsv)}
      ${renderVibeGuideCard(rsv)}
      ${renderHoursSection(rsv)}
      ${renderFacilitySection(rsv)}
      ${renderLocationSection(cafe, rsv)}
      ${renderPreviewSection(rsv)}
      ${renderActionBar(rsv)}
    `;
  }

  // ------------------------------
  // Event delegation
  // ------------------------------
  function bindEvents() {
    const container = document.getElementById('screen-reservation');
    if (!container) return;

    container.addEventListener('click', (e) => {
      // 주소 복사는 재렌더 없이 버튼 상태만 잠깐 바꿔주는 로컬 UI 동작이라 별도 처리.
      const copyBtn = e.target.closest('[data-action="copy-address"]');
      if (copyBtn) {
        const address = copyBtn.dataset.address || '';
        const markCopied = () => {
          copyBtn.classList.add('is-copied');
          copyBtn.innerHTML = `<span class="icon">${ICONS.check}</span>`;
          setTimeout(() => {
            copyBtn.classList.remove('is-copied');
            copyBtn.innerHTML = `<span class="icon">${ICONS.copy}</span>`;
          }, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(address).then(markCopied).catch(markCopied);
        } else {
          markCopied();
        }
        return;
      }

      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;
      const state = store.getState();

      switch (action) {
        case 'go-back':
          store.dispatch({ type: 'GO_TO_SCREEN', payload: 'review' });
          break;

        case 'toggle-bookmark':
          store.dispatch({ type: 'TOGGLE_BOOKMARK', payload: state.selectedCafeId });
          break;

        case 'open-map':
          // 위치 지도 썸네일 클릭 → 지도/길찾기 화면(STEP 6)으로 이동 (선택된 카페 유지, 도보 탭부터 시작)
          store.dispatch({ type: 'SET_TRAVEL_MODE', payload: 'walk' });
          store.dispatch({ type: 'GO_TO_SCREEN', payload: 'map' });
          break;

        case 'call-phone':
          // <a href="tel:..."> 기본 동작 그대로 사용 (별도 처리 불필요)
          break;

        case 'share':
        case 'view-all-preview':
        case 'naver-reservation':
          // NOTE: 데모 범위 — 자리만 마련 (추후 실제 동작 연결)
          e.preventDefault();
          break;

        default:
          break;
      }
    });
  }

  function init() {
    bindEvents();
    store.subscribe((state) => {
      if (state.screen === 'reservation') render();
    });
  }

  window.MoodPlaceReservation = { init };
})();

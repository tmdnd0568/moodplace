/**
 * search.js
 * ------------------------------------------------------------------
 * 무드 탐색 모달(add.html 대응) 렌더 + 이벤트 처리.
 *
 * Flow: 무드 다중 선택 -> 상세 설명 textarea -> "무드 탐색하기"
 *       -> searchPhase: idle -> loading -> result
 *
 * 설계 원칙:
 *  - main.js 와 동일하게 순수 render 함수 + 이벤트 위임 패턴 사용.
 *  - textarea 입력(SET_MOOD_DESCRIPTION) 은 매 키입력마다 전체 재렌더를
 *    하지 않도록 별도 처리 (포커스/커서 유지) — 이 파일과 main.js 양쪽에서 동일하게 가드.
 * ------------------------------------------------------------------
 */

(function () {
  const { store, MOOD_TAGS, mockAiSearch } = window.MoodPlaceData;

  const SEARCH_LOADING_MS = 1400;

  const ICONS = {
    sparkle: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z"/><path d="M19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15z"/></svg>`,
    arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  };

  // ------------------------------
  // Pure render functions
  // ------------------------------

  function renderMoodChipsModal(state) {
    return MOOD_TAGS.map((mood) => {
      const isActive = state.modalSelectedMoods.includes(mood.id);
      return `
        <button
          type="button"
          class="modal-mood-chip ${isActive ? 'is-active' : ''}"
          data-action="toggle-modal-mood"
          data-mood-id="${mood.id}"
          aria-pressed="${isActive}"
        >
          <span class="chip-icon">${mood.icon}</span>${mood.label}
        </button>
      `;
    }).join('');
  }

  function renderFormPhase(state) {
    const hasMood = state.modalSelectedMoods.length > 0;
    const hasDescription = state.moodDescription.trim().length > 0;
    const canSearch = hasMood || hasDescription;

    return `
      <div class="modal-handle"></div>
      <h2 class="modal-title">지금 어떤 느낌을 원하시나요?</h2>
      <p class="modal-subtitle">AI가 당신의 취향에 맞는 완벽한 공간을 찾아드려요.</p>

      <div class="modal-section">
        <p class="modal-label">오늘의 무드 선택</p>
        <div class="modal-mood-grid" role="group" aria-label="오늘의 무드 선택">
          ${renderMoodChipsModal(state)}
        </div>
      </div>

      <div class="modal-section">
        <p class="modal-label"><span class="icon-inline">${ICONS.sparkle}</span>상세 무드 설명</p>
        <textarea
          class="modal-textarea"
          data-action="set-description"
          placeholder="원하는 무드를 구체적으로 설명해주세요 (예: 창밖으로 숲이 보이고 조용한 재즈가 흐르는 곳)"
        >${state.moodDescription}</textarea>
      </div>

      <button type="button" class="modal-cta" data-action="start-search" ${canSearch ? '' : 'disabled'}>
        무드 탐색하기 <span class="icon">${ICONS.arrowRight}</span>
      </button>
    `;
  }

  function renderLoadingPhase() {
    return `
      <div class="modal-loading">
        <div class="loading-spinner" aria-hidden="true"></div>
        <p class="loading-text">AI가 당신의 무드에 어울리는<br />공간을 찾고 있어요...</p>
        <p class="loading-subtext">잠시만 기다려주세요</p>
      </div>
    `;
  }

  function renderResultThumbStyle(photo) {
    if (photo.image) {
      return `background-image: url('${photo.image}'); background-size: cover; background-position: center;`;
    }
    return `background-image: linear-gradient(160deg, ${photo.from}, ${photo.to});`;
  }

  function renderResultCard(cafe) {
    return `
      <article
        class="result-card is-clickable"
        role="button"
        tabindex="0"
        data-action="select-cafe"
        data-cafe-id="${cafe.id}"
        aria-label="${cafe.name} 상세 보기"
      >
        <div class="result-thumb" style="${renderResultThumbStyle(cafe.photo)}">${!cafe.photo.image ? cafe.photo.emoji : ''}</div>
        <div class="result-info">
          <p class="result-match">${cafe.match}% Match</p>
          <h3 class="result-name">${cafe.name}</h3>
          <p class="result-desc">${cafe.location} • ${cafe.description}</p>
        </div>
        <div class="result-card-arrow" aria-hidden="true">${ICONS.arrowRight}</div>
      </article>
    `;
  }

  function renderResultPhase(state) {
    return `
      <div class="modal-handle"></div>
      <div class="modal-result-header">
        <p class="result-label">AI 추천 결과</p>
        <h2 class="modal-title">이런 공간은 어떠세요?</h2>
      </div>
      <div class="modal-result-list">
        ${state.searchResults.map(renderResultCard).join('')}
      </div>
      <button type="button" class="modal-cta" data-action="close-modal">메인에서 확인하기</button>
      <button type="button" class="modal-cta modal-cta--outline" data-action="restart-search">다시 탐색하기</button>
    `;
  }

  // ------------------------------
  // Root render
  // ------------------------------
  function render() {
    const state = store.getState();
    const overlay = document.getElementById('search-modal');
    const sheet = document.getElementById('search-modal-sheet');
    if (!overlay || !sheet) return;

    overlay.classList.toggle('is-open', state.isSearchModalOpen);

    if (state.searchPhase === 'loading') {
      sheet.innerHTML = renderLoadingPhase();
    } else if (state.searchPhase === 'result') {
      sheet.innerHTML = renderResultPhase(state);
    } else {
      sheet.innerHTML = renderFormPhase(state);
    }
  }

  // ------------------------------
  // Search flow
  // ------------------------------
  function handleStartSearch() {
    const state = store.getState();
    store.dispatch({ type: 'START_MOOD_SEARCH' });

    setTimeout(() => {
      const results = mockAiSearch(state.modalSelectedMoods, state.moodDescription);
      store.dispatch({ type: 'RECEIVE_MOOD_SEARCH_RESULT', payload: results });
    }, SEARCH_LOADING_MS);
  }

  // ------------------------------
  // Event delegation
  // ------------------------------
  function bindEvents() {
    const overlay = document.getElementById('search-modal');
    if (!overlay) return;

    overlay.addEventListener('click', (e) => {
      // 배경(오버레이) 클릭 시 닫기 — 시트 자체 클릭은 무시
      if (e.target === overlay) {
        store.dispatch({ type: 'CLOSE_SEARCH_MODAL' });
        return;
      }

      const target = e.target.closest('[data-action]');
      if (!target) return;

      switch (target.dataset.action) {
        case 'toggle-modal-mood':
          store.dispatch({ type: 'TOGGLE_MODAL_MOOD', payload: target.dataset.moodId });
          break;

        case 'start-search':
          handleStartSearch();
          break;

        case 'close-modal':
          store.dispatch({ type: 'CLOSE_SEARCH_MODAL' });
          break;

        case 'select-cafe':
          store.dispatch({ type: 'CLOSE_SEARCH_MODAL' });
          store.dispatch({ type: 'SELECT_CAFE', payload: target.dataset.cafeId });
          break;

        case 'restart-search':
          store.dispatch({ type: 'OPEN_SEARCH_MODAL' });
          break;

        default:
          break;
      }
    });

    overlay.addEventListener('input', (e) => {
      if (e.target.dataset.action === 'set-description') {
        store.dispatch({ type: 'SET_MOOD_DESCRIPTION', payload: e.target.value });
      }
    });

    // 키보드 접근성: Enter/Space 로 카드 선택
    overlay.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const target = e.target.closest('[data-action="select-cafe"]');
      if (!target) return;
      e.preventDefault();
      store.dispatch({ type: 'CLOSE_SEARCH_MODAL' });
      store.dispatch({ type: 'SELECT_CAFE', payload: target.dataset.cafeId });
    });
  }

  function init() {
    bindEvents();
    render();

    // SET_MOOD_DESCRIPTION 는 텍스트 입력 중 포커스/커서가 끊기지 않도록 재렌더를 건너뜀
    store.subscribe((state, action) => {
      if (action && action.type === 'SET_MOOD_DESCRIPTION') return;
      render();
    });
  }

  window.MoodPlaceSearch = { init };
})();

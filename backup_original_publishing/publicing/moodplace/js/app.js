/**
 * app.js
 * ------------------------------------------------------------------
 * SPA 화면 전환(Router) 진입점.
 *
 * 현재 단계(STEP 1 - 스플래시 화면):
 *   splash 로 시작 → 약 1.8초 후 자동으로 main 화면으로 전환.
 * 이후 STEP 3(무드 탐색 모달)이 추가되면 'OPEN_SEARCH_MODAL' 등의
 * 액션 흐름으로 자연스럽게 확장한다.
 * ------------------------------------------------------------------
 */

(function () {
  const { store } = window.MoodPlaceData;

  const SPLASH_DURATION_MS = 1800; // 1.5~2초 사이, 스펙 기준값
  const SPLASH_FADE_MS = 300; // 전환 직전 페이드 아웃 시간

  function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach((el) => {
      el.classList.toggle('is-active', el.dataset.screen === screenName);
    });
  }

  function scheduleSplashExit() {
    const splashEl = document.getElementById('screen-splash');

    setTimeout(() => {
      if (splashEl) splashEl.classList.add('is-leaving');

      setTimeout(() => {
        store.dispatch({ type: 'GO_TO_SCREEN', payload: 'main' });
        if (splashEl) splashEl.classList.remove('is-leaving');
      }, SPLASH_FADE_MS);
    }, SPLASH_DURATION_MS - SPLASH_FADE_MS);
  }

  function init() {
    // splash 화면으로 시작 (index.html 상 기본 is-active 상태와 동일)
    store.dispatch({ type: 'GO_TO_SCREEN', payload: 'splash' });
    showScreen(store.getState().screen);

    store.subscribe((state) => {
      showScreen(state.screen);
    });

    scheduleSplashExit();

    // 화면별 초기화 훅 (각 화면의 JS 모듈이 window.MoodPlaceMain / window.MoodPlaceSearch 로 노출)
    if (window.MoodPlaceMain) {
      window.MoodPlaceMain.init();
    }
    if (window.MoodPlaceSearch) {
      window.MoodPlaceSearch.init();
    }
    if (window.MoodPlaceReview) {
      window.MoodPlaceReview.init();
    }
    if (window.MoodPlaceReservation) {
      window.MoodPlaceReservation.init();
    }
    if (window.MoodPlaceMap) {
      window.MoodPlaceMap.init();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();

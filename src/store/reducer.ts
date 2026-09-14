import type { AppState, AppAction, Cafe } from './types';
import { MOCK_CAFES } from '../data/mockData';

export function rootReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'GO_TO_SCREEN':
      return { ...state, screen: action.payload };

    case 'SELECT_CAFE': {
      const cafeId = action.payload;
      const updatedVisited = Array.from(new Set([...(state.visitedCafeIds || []), cafeId]));
      try {
        const userEmail = sessionStorage.getItem('moodplace_user_email') || '';
        const suffix = userEmail ? `_${userEmail}` : '';
        localStorage.setItem(`moodplace_visited_cafe_ids${suffix}`, JSON.stringify(updatedVisited));
      } catch (e) {}
      return {
        ...state,
        selectedCafeId: cafeId,
        screen: 'review',
        visitedCafeIds: updatedVisited,
      };
    }

    case 'SELECT_CAFE_ENTITY': {
      // Kakao 카페 전체 객체를 보존 (실제 좌표를 MapPage까지 전달하기 위해)
      const cafe = action.payload;
      const updatedVisited = Array.from(new Set([...(state.visitedCafeIds || []), cafe.id]));
      return {
        ...state,
        selectedCafeId: cafe.id,
        selectedCafe: cafe,
        visitedCafeIds: updatedVisited,
      };
    }

    case 'RECORD_VISIT': {
      const cafeId = action.payload;
      const updatedVisited = Array.from(new Set([...(state.visitedCafeIds || []), cafeId]));
      try {
        const userEmail = sessionStorage.getItem('moodplace_user_email') || '';
        const suffix = userEmail ? `_${userEmail}` : '';
        localStorage.setItem(`moodplace_visited_cafe_ids${suffix}`, JSON.stringify(updatedVisited));
      } catch (e) {}
      return {
        ...state,
        visitedCafeIds: updatedVisited,
      };
    }

    case 'SET_TRAVEL_MODE':
      return { ...state, travelMode: action.payload, selectedRouteId: null };

    case 'SELECT_ROUTE':
      return { ...state, selectedRouteId: action.payload };

    case 'SELECT_NEARBY_PLACE':
      return { ...state, selectedNearbyPlaceId: action.payload };

    case 'OPEN_SEARCH_MODAL':
      return {
        ...state,
        isSearchModalOpen: true,
        modalSelectedMoods: [...state.selectedMoods],
        moodDescription: '',
        searchPhase: 'idle',
        searchResults: [],
      };

    case 'CLOSE_SEARCH_MODAL':
      return { ...state, isSearchModalOpen: false };

    case 'TOGGLE_MAIN_MOOD': {
      const id = action.payload;
      const exists = state.selectedMoods.includes(id);
      return {
        ...state,
        selectedMoods: exists
          ? state.selectedMoods.filter((m) => m !== id)
          : [...state.selectedMoods, id],
      };
    }

    case 'TOGGLE_MODAL_MOOD': {
      const id = action.payload;
      const exists = state.modalSelectedMoods.includes(id);
      return {
        ...state,
        modalSelectedMoods: exists
          ? state.modalSelectedMoods.filter((m) => m !== id)
          : [...state.modalSelectedMoods, id],
      };
    }

    case 'SET_MOOD_DESCRIPTION':
      return { ...state, moodDescription: action.payload };

    case 'START_MOOD_SEARCH':
      return { ...state, searchPhase: 'loading' };

    case 'RECEIVE_MOOD_SEARCH_RESULT': {
      const existingIds = new Set(state.cafes.map((c) => c.id));
      // AI 추천 결과 + Kakao 전체 리스트(지도 마커용) 병합
      const allNewItems = [
        ...(action.payload || []),
        ...((action.allKakaoCafes || []).map((c: any) => ({
          // Kakao 데이터를 Cafe 변환 - 실제 좌표/전화번호/URL 보존
          id: c.id,
          name: c.name,
          location: c.address || c.location || '',
          description: c.description || '',
          match: c.match || 70,
          tags: c.tags || [],
          mood: c.mood || [],
          bookmarked: false,
          hero: false,
          photo: { type: 'color', from: '#2D5244', to: '#4a7c5e', emoji: '☕️', image: (c.photos || ['/assets/caffe_001.jpg'])[0] },
          detail: c.detail || { detailTags: [], description: '', rating: null, hoursLabel: null, reviewCount: null, menu: [], reviews: [] },
          // Kakao 실제 장소 데이터 보존 (coords는 길찾기에 필수)
          coords: c.coords,
          phone: c.phone,
          placeUrl: c.placeUrl,
          kakaoPlaceId: c.kakaoPlaceId || (c.id?.startsWith('kakao-') ? c.id.replace('kakao-ext-', '').replace('kakao-', '') : undefined),
        })))
      ];
      const newCafes = allNewItems.filter((c) => !existingIds.has(c.id));
      return {
        ...state,
        searchPhase: 'result',
        searchResults: action.payload,
        cafes: newCafes.length > 0 ? [...state.cafes, ...newCafes] : state.cafes,
        selectedMoods:
          state.modalSelectedMoods.length > 0
            ? [...state.modalSelectedMoods]
            : state.selectedMoods,
      };
    }

    case 'TOGGLE_BOOKMARK': {
      const id = action.payload;
      const exists = state.bookmarkedIds.includes(id);
      const nextBookmarks = exists
        ? state.bookmarkedIds.filter((b) => b !== id)
        : [...state.bookmarkedIds, id];

      const nextEntities = { ...state.savedCafeEntities };

      if (exists) {
        delete nextEntities[id];
      } else {
        const targetCafe =
          action.cafe ||
          state.searchResults.find((c: Cafe) => c.id === id) ||
          state.cafes.find((c: Cafe) => c.id === id) ||
          MOCK_CAFES.find((c: Cafe) => c.id === id);

        if (targetCafe) {
          nextEntities[id] = targetCafe;
        }
      }

      try {
        const userEmail = sessionStorage.getItem('moodplace_user_email') || '';
        const suffix = userEmail ? `_${userEmail}` : '';
        localStorage.setItem(`moodplace_bookmarked_ids${suffix}`, JSON.stringify(nextBookmarks));
        localStorage.setItem(`moodplace_saved_cafe_entities${suffix}`, JSON.stringify(nextEntities));
      } catch (e) {}

      return {
        ...state,
        bookmarkedIds: nextBookmarks,
        savedCafeEntities: nextEntities,
      };
    }

    case 'SET_USER_LOCATION':
      return { ...state, userLocation: action.payload };

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    case 'TOGGLE_THEME': {
      const id = action.payload;
      const exists = state.selectedThemes.includes(id);
      return {
        ...state,
        selectedThemes: exists
          ? state.selectedThemes.filter((t) => t !== id)
          : [...state.selectedThemes, id],
      };
    }

    case 'SET_SAVED_FILTER':
      return { ...state, savedFilterCategory: action.payload };

    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };

    case 'ADD_REVIEW': {
      const { cafeId, review } = action.payload;
      return {
        ...state,
        cafes: state.cafes.map((cafe) => {
          if (cafe.id === cafeId) {
            const updatedReviews = [review, ...cafe.detail.reviews];
            const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
            const newRating = parseFloat((totalRating / updatedReviews.length).toFixed(1));
            return {
              ...cafe,
              detail: {
                ...cafe.detail,
                reviews: updatedReviews,
                reviewCount: updatedReviews.length,
                rating: newRating
              }
            };
          }
          return cafe;
        })
      };
    }

    case 'TOGGLE_REVIEW_LIKE': {
      const { cafeId, reviewId } = action.payload;
      return {
        ...state,
        cafes: state.cafes.map((cafe) => {
          if (cafe.id === cafeId) {
            return {
              ...cafe,
              detail: {
                ...cafe.detail,
                reviews: cafe.detail.reviews.map((review) => {
                  if (review.id === reviewId) {
                    const liked = !review.likedByUser;
                    const currentLikes = review.likes || 0;
                    return {
                      ...review,
                      likedByUser: liked,
                      likes: liked ? currentLikes + 1 : Math.max(0, currentLikes - 1)
                    };
                  }
                  return review;
                })
              }
            };
          }
          return cafe;
        })
      };
    }
    case 'SHOW_TOAST':
      return { ...state, toastMessage: action.payload };

    case 'HIDE_TOAST':
      return { ...state, toastMessage: null };

    case 'RESET_SEARCH':
      return {
        ...state,
        searchPhase: 'idle',
        searchResults: [],
        selectedMoods: [],
        modalSelectedMoods: [],
        selectedThemes: []
      };

    default:
      return state;
  }
}

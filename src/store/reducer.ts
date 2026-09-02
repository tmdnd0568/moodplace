import type { AppState, AppAction } from './types';

export function rootReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'GO_TO_SCREEN':
      return { ...state, screen: action.payload };

    case 'SELECT_CAFE':
      return { ...state, selectedCafeId: action.payload, screen: 'review' };

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
      const newCafes = action.payload.filter((c) => !existingIds.has(c.id));
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
      return {
        ...state,
        bookmarkedIds: exists
          ? state.bookmarkedIds.filter((b) => b !== id)
          : [...state.bookmarkedIds, id],
      };
    }

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
    case 'RESET_SEARCH':
      return {
        ...state,
        searchPhase: 'idle',
        searchResults: [],
        selectedMoods: [],
        modalSelectedMoods: []
      };

    default:
      return state;
  }
}

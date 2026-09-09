import type { AppState } from './types';
import { MOCK_CAFES } from '../data/mockData';

const getSavedVisitedCafeIds = (): string[] => {
  try {
    const saved = localStorage.getItem('moodplace_visited_cafe_ids');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const initialState: AppState = {
  screen: 'splash',
  isSearchModalOpen: false,
  selectedCafeId: null,
  selectedMoods: ['cozy'],
  modalSelectedMoods: [],
  moodDescription: '',
  searchPhase: 'idle',
  cafes: MOCK_CAFES,
  searchResults: [],
  bookmarkedIds: ['forest-lounge', 'urban-nest'], // 기본적으로 북마크된 아이템 데모로 추가
  visitedCafeIds: getSavedVisitedCafeIds(),
  activeTab: 'home',
  selectedThemes: [],
  travelMode: 'walk',
  selectedRouteId: null,
  selectedNearbyPlaceId: null,
  savedFilterCategory: 'all',
  darkMode: false,
  toastMessage: null,
};

import type { AppState } from './types';
import { MOCK_CAFES } from '../data/mockData';

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
  activeTab: 'home',
  selectedThemes: [],
  travelMode: 'walk',
  selectedRouteId: null,
  selectedNearbyPlaceId: null,
  savedFilterCategory: 'all',
  darkMode: false,
};

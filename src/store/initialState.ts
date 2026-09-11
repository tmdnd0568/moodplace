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

const getSavedBookmarkedIds = (): string[] => {
  try {
    const saved = localStorage.getItem('moodplace_bookmarked_ids');
    return saved ? JSON.parse(saved) : ['forest-lounge', 'urban-nest'];
  } catch {
    return ['forest-lounge', 'urban-nest'];
  }
};

const getSavedCafeEntities = (): Record<string, any> => {
  try {
    const saved = localStorage.getItem('moodplace_saved_cafe_entities');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
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
  bookmarkedIds: getSavedBookmarkedIds(),
  savedCafeEntities: getSavedCafeEntities(),
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

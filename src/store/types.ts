export interface Photo {
  type: string;
  image?: string;
  from: string;
  to: string;
  emoji: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: string;
  desc: string;
  image: string;
}

export interface Review {
  id: string;
  author: string;
  initial: string;
  rating: number;
  date: string;
  text: string;
  tags: string[];
  likes?: number;
  likedByUser?: boolean;
}

export interface RouteItem {
  id: string;
  badge?: string;
  durationMin: number;
  distanceLabel?: string;
  metaLabel?: string;
  progress?: number;
  description?: string;
}

export interface CafeRoute {
  destinationLabel: string;
  routesByMode: {
    walk: RouteItem[];
    transit: RouteItem[];
    taxi: RouteItem[];
  };
}

export interface CafeDetail {
  detailTags: string[];
  description: string;
  rating: number;
  hoursLabel: string;
  reviewCount: number;
  menu: MenuItem[];
  reviews: Review[];
  reservation?: {
    rating: number;
    reviewCountLabel: string;
    description: string;
    facilities: string[];
    notice: string;
  };
  route?: CafeRoute; // 원본 길찾기 데이터 모델 이식
}

export interface Cafe {
  id: string;
  name: string;
  location: string;
  description: string;
  match: number;
  tags: string[];
  mood: string[];
  bookmarked: boolean;
  hero: boolean;
  photo: Photo;
  detail: CafeDetail;
}

export interface NearbyPlace {
  id: string;
  name: string;
  address: string;
  tags: Array<{ icon: string; label: string }>;
  description: string;
  photos: string[];
  position: { top: string; left: string };
  isDefault?: boolean;
}

export interface SavedPlace {
  id: string;
  category: 'cafe' | 'restaurant' | 'bar';
  name: string;
  address: string;
  image: string;
  tags: string[];
}

export interface AppState {
  screen: 'splash' | 'main' | 'review' | 'reservation' | 'map' | 'find' | 'my' | 'keep';
  isSearchModalOpen: boolean;
  selectedCafeId: string | null;
  selectedMoods: string[];
  modalSelectedMoods: string[];
  moodDescription: string;
  searchPhase: 'idle' | 'loading' | 'result';
  cafes: Cafe[];
  searchResults: Cafe[];
  bookmarkedIds: string[];
  activeTab: string;
  selectedThemes: string[];
  travelMode: 'walk' | 'transit' | 'taxi';
  selectedRouteId: string | null;
  selectedNearbyPlaceId: string | null;
  savedFilterCategory: string;
  darkMode: boolean;
}

export type AppAction =
  | { type: 'GO_TO_SCREEN'; payload: 'splash' | 'main' | 'review' | 'reservation' | 'map' | 'find' | 'my' | 'keep' }
  | { type: 'SELECT_CAFE'; payload: string }
  | { type: 'SET_TRAVEL_MODE'; payload: 'walk' | 'transit' | 'taxi' }
  | { type: 'SELECT_ROUTE'; payload: string }
  | { type: 'SELECT_NEARBY_PLACE'; payload: string }
  | { type: 'OPEN_SEARCH_MODAL' }
  | { type: 'CLOSE_SEARCH_MODAL' }
  | { type: 'TOGGLE_MAIN_MOOD'; payload: string }
  | { type: 'TOGGLE_MODAL_MOOD'; payload: string }
  | { type: 'SET_MOOD_DESCRIPTION'; payload: string }
  | { type: 'START_MOOD_SEARCH' }
  | { type: 'RECEIVE_MOOD_SEARCH_RESULT'; payload: Cafe[] }
  | { type: 'TOGGLE_BOOKMARK'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'TOGGLE_THEME'; payload: string }
  | { type: 'SET_SAVED_FILTER'; payload: string }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'ADD_REVIEW'; payload: { cafeId: string; review: Review } }
  | { type: 'TOGGLE_REVIEW_LIKE'; payload: { cafeId: string; reviewId: string } }
  | { type: 'RESET_SEARCH' };

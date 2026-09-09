import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/StoreContext';
import { NEARBY_PLACES, REGIONAL_MOCK_CAFES, EXTRA_LOCAL_CAFES } from '../data/mockData';
import { BottomNav } from '../components/BottomNav';
import { Icon } from '../components/icons/Icons';



// Haversine 두 좌표 간 거리 계산 (km)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const REAL_ATMOSPHERE_PHOTOS = [
  '/assets/grandpa_factory.jpg',
  '/assets/daelim_changgo.jpg',
  '/assets/matchacha.jpg',
  '/assets/peaches_dowone.jpg',
  '/assets/onion_seongsu.jpg',
  '/assets/center_coffee.jpg',
  '/assets/cafe_calm_forest.jpg',
  '/assets/cafe_forest_lounge.jpg',
  '/assets/cafe_quiet_tea_room.jpg',
  '/assets/cafe_urban_nest.jpg',
  '/assets/cafe_vivid_garden.jpg',
  '/assets/cafe_brick_atelier.jpg',
  '/assets/caffe_001.jpg',
  '/assets/caffa_001.jpg',
  '/assets/caffa_002.jpg',
  '/assets/caffa_003.jpg',
  '/assets/caffa_004.jpg',
  '/assets/tea_001.jpg',
];

const REAL_MENU_PHOTOS = [
  '/assets/menu_onion_coffee.jpg',
  '/assets/menu_onion_pandoro.jpg',
  '/assets/menu_onion_saltbread.jpg',
  '/assets/menu_center_geisha.jpg',
  '/assets/menu_center_scone.jpg',
  '/assets/menu_center_mugwort.jpg',
  '/assets/menu_daelim_cream.jpg',
  '/assets/menu_daelim_tart.jpg',
  '/assets/menu_matcha_latte.jpg',
  '/assets/menu_matchacha_dessert.jpg',
  '/assets/menu_matcha_tea.jpg',
  '/assets/menu_grandpa_einspanner.jpg',
  '/assets/menu_grandpa_cake.jpg',
  '/assets/menu_grandpa_pasta.jpg',
  '/assets/menu_peaches_coffee.jpg',
  '/assets/menu_knotted_donut.jpg',
  '/assets/menu_peaches_soda.jpg',
  '/assets/menu_brick_coffee.jpg',
  '/assets/menu_croffle.jpg',
  '/assets/menu_earlgrey_cake.jpg',
  '/assets/menu_einspanner.jpg',
  '/assets/menu_flat_white.jpg',
  '/assets/menu_forest_latte.jpg',
  '/assets/menu_grapefruit_ade.jpg',
  '/assets/menu_pavlova.jpg',
  '/assets/menu_scone.jpg',
  '/assets/menu_tart.jpg',
  '/assets/menu_tea_dessert.jpg',
  '/assets/menu_wood_americano.jpg',
  '/assets/cake_001.jpg',
];

function getUniqueHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// 탐색된 모든 카페마다 완전히 고유한 실사 분위기 1장 + 대표 메뉴 1장 이미지 매핑
function getAIImagesForCafe(name: string, _tags: Array<{ label: string }>, id?: string, placePhotos?: string[]) {
  const seed = id || name;
  const hash = getUniqueHash(seed);

  let atmoUrl = '';
  let menuUrl = '';

  if (placePhotos && placePhotos.length > 0) {
    if (placePhotos[0]) atmoUrl = placePhotos[0];
    if (placePhotos[1]) menuUrl = placePhotos[1];
  }

  if (!atmoUrl) {
    atmoUrl = REAL_ATMOSPHERE_PHOTOS[hash % REAL_ATMOSPHERE_PHOTOS.length];
  }

  if (!menuUrl) {
    menuUrl = REAL_MENU_PHOTOS[(hash * 13 + 7) % REAL_MENU_PHOTOS.length];
  }

  return [atmoUrl, menuUrl];
}

export const FindPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('calm-forest');
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(true);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'terrain'>('standard');
  const [showTraffic, setShowTraffic] = useState<boolean>(false);
  const [showBicycle, setShowBicycle] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  // 내 실시간 위치 및 반경 3km 설정
  const [userCoords, setUserCoords] = useState<[number, number]>([36.3537, 127.3872]); // 기본 대전/GPS 중심
  const [radiusKm, setRadiusKm] = useState<number>(3.0); // 반경 3km (기본)
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Drag Gesture States for Bottom Sheet
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startYRef = React.useRef<number>(0);

  // Search States
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>(window.localStorage.getItem('searchQuery') || '');

  // 위치 탐색 (GPS 및 IP 기반 감지)
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords([lat, lng]);
        },
        () => {
          setUserCoords([36.3537, 127.3872]);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // 60개 이상의 전방 반경 3km 내 모든 카페 통합 데이터베이스 (mockData에서 불러옴)

  // 전체 카페 정보 통합 리스트 (현재 위치 userCoords 주변 반경 0.1km ~ 2.8km 촘촘하게 핀 배치)
  const allCafes = React.useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      address: string;
      description: string;
      photos: string[];
      tags: Array<{ icon: string; label: string }>;
      coords: [number, number];
    }> = [];

    const seen = new Set<string>();

    // 1. 기본 장소 (NEARBY_PLACES)
    NEARBY_PLACES.forEach((p, idx) => {
      seen.add(p.id);
      
      const angle = (idx * 55 + 20) * (Math.PI / 180);
      const radiusOffset = 0.002 + (idx % 4) * 0.0035; // ~200m ~ 1.6km
      const latOffset = Math.sin(angle) * radiusOffset;
      const lngOffset = Math.cos(angle) * radiusOffset;
      const coords: [number, number] = [
        userCoords[0] + latOffset,
        userCoords[1] + lngOffset
      ];

      list.push({
        id: p.id,
        name: p.name,
        address: p.address,
        description: p.description,
        photos: p.photos,
        tags: p.tags,
        coords,
      });
    });

    // 2. 전체 카페 및 AI 추천 카페 리스트 (state.cafes, state.searchResults)
    const storeCafes = [...state.cafes, ...state.searchResults];
    storeCafes.forEach((c, idx) => {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        
        const angle = ((idx + 3) * 75) * (Math.PI / 180);
        const radiusOffset = 0.0018 + (idx % 5) * 0.0038; // ~180m ~ 2.1km
        const latOffset = Math.sin(angle) * radiusOffset;
        const lngOffset = Math.cos(angle) * radiusOffset;
        const coords: [number, number] = [
          userCoords[0] + latOffset,
          userCoords[1] + lngOffset
        ];

        list.push({
          id: c.id,
          name: c.name,
          address: c.location || '내 주변 추천 카페',
          description: c.detail?.description || `${c.name} - 감성 무드 맞춤 추천 카페`,
          photos: (c.photo.type === 'image' && c.photo.image) ? [c.photo.image] : ['/assets/caffe_001.jpg'],
          tags: c.mood.map((m) => ({ icon: 'warm', label: m })),
          coords,
        });
      }
    });

    // 3. 둔산동/유성/대전 브랜드 & 주변 인기 카페 (EXTRA_LOCAL_CAFES) 18종 촘촘히 배치
    EXTRA_LOCAL_CAFES.forEach((c, idx) => {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        
        // 내 위치 중심 0.15km ~ 2.7km 반경 내에 피보나치 나선형으로 골고루 수놓기
        const phi = (1 + Math.sqrt(5)) / 2;
        const angle = 2 * Math.PI * idx / phi;
        const radiusOffset = 0.0015 + (idx / EXTRA_LOCAL_CAFES.length) * 0.021; // 150m ~ 2.7km
        
        const latOffset = Math.sin(angle) * radiusOffset;
        const lngOffset = Math.cos(angle) * radiusOffset;
        const coords: [number, number] = [
          userCoords[0] + latOffset,
          userCoords[1] + lngOffset
        ];

        list.push({
          id: c.id,
          name: c.name,
          address: c.address,
          description: c.description,
          photos: c.photos,
          tags: c.tags,
          coords,
        });
      }
    });

    // 4. 전국 주요 도시 대표 카페 (REGIONAL_MOCK_CAFES) 통합 (서울, 대전, 부산, 제주 등)
    Object.entries(REGIONAL_MOCK_CAFES).forEach(([regionName, cafeList]) => {
      cafeList.forEach((c, idx) => {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          
          let coords: [number, number];
          if (regionName === '대전') {
            coords = [36.3537 + (idx * 0.004), 127.3872 + (idx * 0.003)];
          } else if (regionName === '부산') {
            coords = [35.1587 + (idx * 0.005), 129.1604 + (idx * 0.004)];
          } else if (regionName === '제주') {
            coords = [33.4996 + (idx * 0.006), 126.5312 + (idx * 0.005)];
          } else {
            coords = [37.5665 + (idx * 0.004), 126.9780 + (idx * 0.003)];
          }

          list.push({
            id: c.id,
            name: c.name,
            address: c.location || `${regionName} 추천 카페`,
            description: c.description || c.detail?.description || `${c.name} - ${regionName} 감성 핫플`,
            photos: (c.photo.type === 'image' && c.photo.image) ? [c.photo.image] : ['/assets/caffe_001.jpg'],
            tags: c.tags ? c.tags.map((t) => ({ icon: 'warm', label: t.replace('#', '') })) : [{ icon: 'warm', label: regionName }],
            coords,
          });
        }
      });
    });

    return list;
  }, [state.cafes, state.searchResults, EXTRA_LOCAL_CAFES, userCoords]);

  // 내 위치 기준 모든 카페 거리 계산
  const cafesWithDistance = React.useMemo(() => {
    return allCafes.map((cafe) => {
      const distKm = getDistanceFromLatLonInKm(
        userCoords[0],
        userCoords[1],
        cafe.coords[0],
        cafe.coords[1]
      );
      const distText = distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`;
      return {
        ...cafe,
        distKm,
        distText,
      };
    });
  }, [allCafes, userCoords]);

  // km 반경 내 카페 필터링 (radiusKm >= 20 이면 '전체' 전국 카페 검색 모드)
  const cafesWithin3km = React.useMemo(() => {
    if (radiusKm >= 20) {
      return [...cafesWithDistance].sort((a, b) => a.distKm - b.distKm);
    }
    return cafesWithDistance
      .filter((c) => c.distKm <= radiusKm)
      .sort((a, b) => a.distKm - b.distKm);
  }, [cafesWithDistance, radiusKm]);

  const selectedPlace = cafesWithin3km.find((p) => p.id === selectedPlaceId) || cafesWithin3km[0] || cafesWithDistance[0];

  const selectedCafePhotos = React.useMemo(() => {
    if (!selectedPlace) return [];
    return getAIImagesForCafe(selectedPlace.name, selectedPlace.tags, selectedPlace.id, selectedPlace.photos);
  }, [selectedPlace]);

  const handleOfflineDownload = () => {
    if (downloadProgress !== null) return;
    setDownloadProgress(0);
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          dispatch({ type: 'SHOW_TOAST', payload: '주변 오프라인 지도가 저장되었습니다!' });
          return null;
        }
        return prev + 20;
      });
    }, 250);
  };

  const handleNaverMapRedirect = () => {
    const naverMapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(selectedPlace.name)}`;
    window.open(naverMapUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDragStart = (clientY: number) => {
    if (!isSheetOpen) return;
    startYRef.current = clientY;
    setIsDragging(true);
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging) return;
    const deltaY = clientY - startYRef.current;
    if (deltaY > 0) {
      // 최대 120px까지만 드래그 허용 - 네비바와 시트 사이 빈 공간 방지
      setDragOffset(Math.min(deltaY, 120));
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 80) {
      setIsSheetOpen(false);
    }
    setDragOffset(0);
  };



  const mapRef = React.useRef<any>(null);
  const markersRef = React.useRef<Record<string, any>>({});
  const circleRef = React.useRef<any>(null);
  const tileLayerRef = React.useRef<any>(null);
  const trafficLayerRef = React.useRef<any>(null);
  const bikeLayerRef = React.useRef<any>(null);

  // 1. GPU 하드웨어 가속 Leaflet Map 엔진 초기화
  React.useEffect(() => {
    const L = (window as any).L;
    if (!L) return;

    const map = L.map('find-map-api', {
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      inertiaDeceleration: 3000
    }).setView(userCoords, 14);

    const standardLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      updateWhenZooming: false,
      updateWhenIdle: true,
      keepBuffer: 3
    }).addTo(map);
    tileLayerRef.current = standardLayer;

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          // ignore leaflet teardown race
        }
        mapRef.current = null;
      }
    };
  }, []);

  // 지도 유형 (기본 지도 / 위성 지도 / 지형 지도) 실시간 레이어 스위칭
  React.useEffect(() => {
    const L = (window as any).L;
    const map = mapRef.current;
    if (!L || !map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let maxZoom = 19;

    if (mapType === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 18;
    } else if (mapType === 'terrain') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 18;
    }

    const newLayer = L.tileLayer(tileUrl, {
      maxZoom,
      updateWhenZooming: false,
      updateWhenIdle: true,
      keepBuffer: 3
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [mapType]);

  // 실시간 교통 흐름 레이어 토글
  React.useEffect(() => {
    const L = (window as any).L;
    const map = mapRef.current;
    if (!L || !map) return;

    if (showTraffic) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          opacity: 0.95
        });
      }
      trafficLayerRef.current.addTo(map);
    } else {
      if (trafficLayerRef.current) {
        map.removeLayer(trafficLayerRef.current);
      }
    }
  }, [showTraffic]);

  // 자전거 도로 레이어 토글
  React.useEffect(() => {
    const L = (window as any).L;
    const map = mapRef.current;
    if (!L || !map) return;

    if (showBicycle) {
      if (!bikeLayerRef.current) {
        bikeLayerRef.current = L.tileLayer('https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png', {
          maxZoom: 18,
          opacity: 0.85
        });
      }
      bikeLayerRef.current.addTo(map);
    } else {
      if (bikeLayerRef.current) {
        map.removeLayer(bikeLayerRef.current);
      }
    }
  }, [showBicycle]);

  // 2. 3km 반경 원(Circle) 및 마커 생성 (반경 변경 시에만 고성능 재렌더링)
  const userCoordsKey = userCoords.join(',');
  React.useEffect(() => {
    const L = (window as any).L;
    const map = mapRef.current;
    if (!L || !map) return;

    // 기존 원 및 마커 제거
    if (circleRef.current) circleRef.current.remove();
    Object.values(markersRef.current).forEach((m: any) => m.remove());
    markersRef.current = {};

    // 반경 원 오버레이 렌더링
    const circle = L.circle(userCoords, {
      radius: radiusKm * 1000,
      color: '#2d5244',
      fillColor: '#2d5244',
      fillOpacity: 0.08,
      weight: 2,
      dashArray: '6, 6'
    }).addTo(map);
    circleRef.current = circle;

    // 마커 생성 및 핑 등록
    cafesWithin3km.forEach((place) => {
      const pinSvg = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;

      const customIcon = L.divIcon({
        className: 'leaflet-custom-marker-container',
        html: `
          <div class="custom-marker ${place.id === selectedPlaceId ? 'is-active' : ''}">
            <span class="marker-label">${place.name} (${place.distText})</span>
            <span class="marker-pin">${pinSvg}</span>
          </div>
        `,
        iconSize: [140, 50],
        iconAnchor: [70, 48]
      });

      const marker = L.marker(place.coords, { icon: customIcon }).addTo(map);
      marker.on('click', () => {
        handlePlaceSelect(place.id);
        map.panTo(place.coords, { animate: true, duration: 0.25 });
      });

      markersRef.current[place.id] = marker;
    });

  }, [userCoordsKey, radiusKm, cafesWithin3km]);

  // 3. 선택된 카페 핀 클래스 토글 (전체 마커 파괴 없이 0ms 즉시 하이라이트)
  React.useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement();
      if (el) {
        const child = el.querySelector('.custom-marker');
        if (child) {
          if (id === selectedPlaceId) {
            child.classList.add('is-active');
          } else {
            child.classList.remove('is-active');
          }
        }
      }
    });

    const activeCafe = cafesWithin3km.find((c) => c.id === selectedPlaceId);
    if (activeCafe && mapRef.current) {
      mapRef.current.panTo(activeCafe.coords, { animate: true, duration: 0.25 });
    }
  }, [selectedPlaceId]);

  const handlePlaceSelect = (id: string) => {
    setSelectedPlaceId(id);
    dispatch({ type: 'SELECT_NEARBY_PLACE', payload: id });
    setIsSheetOpen(true);
  };

  const handleBookmarkToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_BOOKMARK', payload: id });
  };

  const handleGoToRoute = () => {
    const cafeId = selectedPlace?.id || 'forest-lounge';
    dispatch({ type: 'SELECT_CAFE', payload: cafeId });
    dispatch({ type: 'SET_TRAVEL_MODE', payload: 'walk' });
    navigate(`/map/${cafeId}`);
  };

  const handleBottomTabChange = (tabId: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId });
    if (tabId === 'home') {
      navigate('/main');
    } else if (tabId === 'profile') {
      navigate('/my');
    } else if (tabId === 'bookmarks') {
      navigate('/keep');
    }
  };

  const userMarkerRef = React.useRef<any>(null);

  const handleLocateClick = () => {
    const map = mapRef.current;
    const L = (window as any).L;

    const showLocation = (lat: number, lng: number) => {
      setUserCoords([lat, lng]);
      if (map && L) {
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
        }

        const blueDotIcon = L.divIcon({
          className: 'leaflet-user-location-dot',
          html: `<div class="user-gps-dot"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        userMarkerRef.current = L.marker([lat, lng], { icon: blueDotIcon }).addTo(map);
        map.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          showLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('GPS location error, falling back:', error);
          showLocation(userCoords[0], userCoords[1]);
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    } else {
      showLocation(userCoords[0], userCoords[1]);
    }
  };

  const isBookmarked = state.bookmarkedIds.includes(selectedPlace.id);

  return (
    <PageContainer id="screen-find" className="screen is-active">
      {/* 1) Header */}
      <FindHeader className="find-header">
        {!isSearchActive ? (
          <>
            <FindIconBtn type="button" onClick={() => setIsMenuOpen(true)} aria-label="메뉴">
              <Icon name="menu" className="icon" />
            </FindIconBtn>

            {/* 메뉴 버튼과 검색 버튼 사이에 정렬된 km 반경 검색 필터 */}
            <RadiusInfoFloatingBar>
              <RadiusFilterChips>
                <RadiusChipBtn type="button" $active={radiusKm === 1.0} onClick={() => setRadiusKm(1.0)}>1km</RadiusChipBtn>
                <RadiusChipBtn type="button" $active={radiusKm === 3.0} onClick={() => setRadiusKm(3.0)}>3km</RadiusChipBtn>
                <RadiusChipBtn type="button" $active={radiusKm === 20.0} onClick={() => setRadiusKm(20.0)}>전체</RadiusChipBtn>
              </RadiusFilterChips>
            </RadiusInfoFloatingBar>

            <FindIconBtn type="button" onClick={() => setIsSearchActive(true)} aria-label="검색">
              <Icon name="search" className="icon" />
            </FindIconBtn>
          </>
        ) : (
          <SearchWrapper>
            <SearchInput
              type="text"
              placeholder="장소 이름 또는 주소 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <FindIconBtn type="button" onClick={() => { setIsSearchActive(false); setSearchQuery(''); }} aria-label="검색 닫기">
              <Icon name="close" className="icon" />
            </FindIconBtn>
          </SearchWrapper>
        )}

        {/* 검색 결과 드롭다운 박스 제거 - 지도 마커 자동 필터링만 사용 */}
      </FindHeader>

      {/* 2) Map Canvas */}
      <MapCanvas className="find-map-canvas">
        <div id="find-map-api" style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }} />
      </MapCanvas>

      {/* 3) Bottom sheet with Drag Gestures */}
      <PlaceDetailSheet 
        className="find-sheet" 
        $isOpen={isSheetOpen}
        style={{
          transform: isSheetOpen 
            ? `translateY(${Math.min(dragOffset, 100)}px)` 
            : 'translateY(calc(100% + 80px))',
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
        onTouchEnd={handleDragEnd}
        onMouseMove={(e) => handleDragMove(e.clientY)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* 내 위치 확인 버튼 - 카페 정보 박스 바로 위 (바텀시트 상단) */}
        <FindLocateBtn
          type="button"
          onClick={handleLocateClick}
          aria-label="현재 위치로 이동"
        >
          <Icon name="locate" className="icon" />
        </FindLocateBtn>

        <SheetHandleWrapper 
          type="button" 
          aria-label="상세정보 접기"
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          onMouseDown={(e) => handleDragStart(e.clientY)}
          onClick={() => setIsSheetOpen(!isSheetOpen)}
        >
          <SheetHandle className="find-sheet-handle" aria-hidden="true" />
        </SheetHandleWrapper>

        <PlaceRow className="find-place-row">
          <PlaceName className="find-place-name">
            {selectedPlace.name}
            <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#2d5244', marginLeft: '8px' }}>
              📍 내 위치에서 {selectedPlace.distText}
            </span>
          </PlaceName>
          <BookmarkBtn
            type="button"
            className={`find-save-btn ${isBookmarked ? 'is-saved' : ''}`}
            onClick={(e) => handleBookmarkToggle(selectedPlace.id, e)}
            aria-label="저장하기"
            aria-pressed={isBookmarked}
          >
            <Icon name={isBookmarked ? 'bookmarkFilled' : 'bookmark'} className="icon" />
          </BookmarkBtn>
        </PlaceRow>

        <PlaceAddress className="find-address">{selectedPlace.address}</PlaceAddress>

        <TagRow className="find-tag-row">
          {selectedPlace.tags.map((tag, i) => {
            const iconName = tag.icon === 'warm' ? 'sun' : (tag.icon === 'leaf' ? 'leaf' : (tag.icon === 'quiet' ? 'quiet' : (tag.icon === 'camera' ? 'camera' : (tag.icon === 'tea' ? 'tea' : (tag.icon === 'group' ? 'group' : 'sun')))));
            return (
              <PlaceTag key={i} className="find-tag">
                <TagIconWrapper>
                  <Icon name={iconName} />
                </TagIconWrapper>
                <TagText>#{tag.label}</TagText>
              </PlaceTag>
            );
          })}
        </TagRow>

        <DescBox className="find-description-box">
          <p>{selectedPlace.description}</p>
        </DescBox>

        <PhotoRow className="find-photo-row">
          {selectedCafePhotos.map((photo, i) => (
            <PhotoThumb
              key={i}
              className="find-photo-thumb"
              style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => setPreviewPhotoUrl(photo)}
            >
              <img
                src={photo}
                alt={i === 0 ? '카페 분위기' : '대표 메뉴'}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = i === 0 ? '/assets/caffe_001.jpg' : '/assets/menu_croffle.jpg';
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <PhotoLabelBadge>{i === 0 ? '카페 분위기' : '대표 메뉴'}</PhotoLabelBadge>
            </PhotoThumb>
          ))}
        </PhotoRow>

        <NavigateBtn
          type="button"
          className="find-cta-btn"
          onClick={handleGoToRoute}
        >
          이 장소로 길찾기
        </NavigateBtn>
      </PlaceDetailSheet>

      {/* 카페 사진 원본 크게보기 라이트박스 모달 */}
      {previewPhotoUrl && (
        <PhotoModalOverlay onClick={() => setPreviewPhotoUrl(null)}>
          <PhotoModalContent onClick={(e) => e.stopPropagation()}>
            <PhotoModalImg src={previewPhotoUrl} alt="카페 이미지 크게보기" />
            <PhotoModalCloseBtn type="button" onClick={() => setPreviewPhotoUrl(null)}>
              <Icon name="close" />
            </PhotoModalCloseBtn>
          </PhotoModalContent>
        </PhotoModalOverlay>
      )}

      {/* 8) Left Side Menu Drawer */}
      {isMenuOpen && <Overlay onClick={() => setIsMenuOpen(false)} />}
      <LeftDrawer className={isMenuOpen ? 'is-open' : ''}>
        <DrawerHeader>
          <DrawerTitle>지도 설정</DrawerTitle>
          <CloseBtn type="button" onClick={() => setIsMenuOpen(false)}>
            <Icon name="close" />
          </CloseBtn>
        </DrawerHeader>
        
        <DrawerContent>
          <DrawerSection>
            <SectionLabel>지도 유형</SectionLabel>
            <ButtonGroup>
              <TypeBtn className={mapType === 'standard' ? 'is-active' : ''} onClick={() => setMapType('standard')}>기본 지도</TypeBtn>
              <TypeBtn className={mapType === 'satellite' ? 'is-active' : ''} onClick={() => setMapType('satellite')}>위성 지도</TypeBtn>
              <TypeBtn className={mapType === 'terrain' ? 'is-active' : ''} onClick={() => setMapType('terrain')}>지형 지도</TypeBtn>
            </ButtonGroup>
          </DrawerSection>

          <DrawerSection>
            <SectionLabel>교통 및 도로 정보</SectionLabel>
            <CheckboxRow onClick={() => setShowTraffic(!showTraffic)}>
              <span>실시간 교통 흐름 표시</span>
              <ToggleSwitch className={showTraffic ? 'is-active' : ''} />
            </CheckboxRow>
            <CheckboxRow onClick={() => setShowBicycle(!showBicycle)}>
              <span>자전거 도로 표시</span>
              <ToggleSwitch className={showBicycle ? 'is-active' : ''} />
            </CheckboxRow>
          </DrawerSection>

          <DrawerSection>
            <SectionLabel>지도 관리</SectionLabel>
            <MenuLinkItem type="button" onClick={handleOfflineDownload}>
              <span>{downloadProgress !== null ? `다운로드 중... (${downloadProgress}%)` : '오프라인 지도 다운로드'}</span>
              <Icon name="chevronRight" className="chevron" />
            </MenuLinkItem>
            <MenuLinkItem type="button" onClick={handleNaverMapRedirect}>
              <span>네이버 지도 앱으로 연결</span>
              <Icon name="chevronRight" className="chevron" />
            </MenuLinkItem>
          </DrawerSection>
        </DrawerContent>
      </LeftDrawer>

      <BottomNav activeTab="explore" onChangeTab={handleBottomTabChange} />
    </PageContainer>
  );
};

const PageContainer = styled.section`
  background: ${({ theme }) => theme.colors.bg};
  position: relative;
  height: 100vh;
  height: 100dvh;
  width: 100%;
  overflow: hidden;
`;

const FindHeader = styled.header`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[4]};
`;

const FindIconBtn = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }

  .icon {
    width: 22px;
    height: 22px;
    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.9));
  }
`;

const MapCanvas = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  background: #e9efe4;

  .leaflet-container {
    width: 100%;
    height: 100%;
  }

  .leaflet-pane {
    z-index: 1 !important;
  }
  .leaflet-top, .leaflet-bottom {
    z-index: 2 !important;
  }

  .leaflet-custom-marker-container {
    overflow: visible !important;
  }

  .custom-marker {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    transform: translate(0, -10px);
    transition: all 0.2s ease;
  }

  .marker-label {
    white-space: nowrap;
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 999px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    margin-bottom: 4px;
    transition: all 0.2s ease;
    border: 0.5px solid ${({ theme }) => theme.colors.border};
  }

  .marker-pin {
    width: 28px;
    height: 28px;
    color: ${({ theme }) => theme.colors.textMuted};
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    transition: all 0.2s ease;
  }

  .custom-marker.is-active {
    z-index: 99;
    .marker-label {
      background: ${({ theme }) => theme.colors.primary};
      color: #ffffff;
      border-color: ${({ theme }) => theme.colors.primary};
      transform: scale(1.08);
      box-shadow: 0 4px 12px rgba(45, 82, 68, 0.3);
    }
    .marker-pin {
      color: ${({ theme }) => theme.colors.primary};
      transform: scale(1.15);
    }
  }

  .leaflet-user-location-dot {
    overflow: visible !important;
  }

  .user-gps-dot {
    width: 14px;
    height: 14px;
    background: #007aff;
    border: 3px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(0, 122, 255, 0.6);
    animation: gpsPulse 2s infinite;
  }

  @keyframes gpsPulse {
    0% {
      box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.7);
    }
    70% {
      box-shadow: 0 0 0 8px rgba(0, 122, 255, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(0, 122, 255, 0);
    }
  }
`;

const RadiusInfoFloatingBar = styled.div`
  position: static;
  transform: none;
  z-index: 10;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 0 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(45, 82, 68, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RadiusFilterChips = styled.div`
  display: flex;
  gap: 0;
`;

const RadiusChipBtn = styled.button<{ $active?: boolean }>`
  flex: 1;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: ${({ $active, theme }) => ($active ? theme.colors.text : theme.colors.textMuted)};
  border: none;
  border-bottom: 2px solid ${({ $active, theme }) => ($active ? theme.colors.text : 'transparent')};
  border-radius: 0;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.2s ease, border-bottom-color 0.2s ease;

  ${({ $active }) => $active && `
    font-weight: 800;
  `}

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const FindLocateBtn = styled.button`
  position: absolute;
  top: -54px;
  right: 16px;
  z-index: 20;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: #ffffff;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  .icon {
    width: 22px;
    height: 22px;
    color: ${({ theme }) => theme.colors.primary};
  }

  &:hover {
    transform: scale(1.06);
    box-shadow: 0 6px 20px rgba(45, 82, 68, 0.25);
  }

  &:active {
    transform: scale(0.94);
  }
`;

const PlaceDetailSheet = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  bottom: calc(60px + env(safe-area-inset-bottom)); /* Sits exactly above the BottomNav */
  left: 0;
  right: 0;
  z-index: 10;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 24px 24px 0 0;
  padding: 0 ${({ theme }) => theme.space[5]} ${({ theme }) => theme.space[6]};
  box-shadow: 0 -4px 16px rgba(26, 26, 26, 0.08);
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform: translateY(${({ $isOpen }) => ($isOpen ? '0' : '100%')});
  max-height: calc(75vh - 60px - env(safe-area-inset-bottom));
  overflow-y: auto;
`;

const SheetHandleWrapper = styled.button`
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 12px 0 20px;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 11;
`;

const SheetHandle = styled.div`
  width: 40px;
  height: 4px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.border};
`;

const PlaceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]};
  margin-bottom: ${({ theme }) => theme.space[2]};
`;

const PlaceName = styled.h1`
  font-size: 21px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text};
  letter-spacing: -0.3px;
`;

const BookmarkBtn = styled.button`
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;

  .icon {
    width: 18px;
    height: 18px;
  }

  &.is-saved {
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primaryLight};
  }
`;

const PlaceAddress = styled.p`
  font-size: 13.5px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.space[4]};
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: ${({ theme }) => theme.space[4]};
`;

const PlaceTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #2b4c3f;
  background: rgba(43, 76, 63, 0.06);
  border: 1px solid rgba(43, 76, 63, 0.14);
  padding: 5px 12px;
  border-radius: 999px;
  letter-spacing: -0.2px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(43, 76, 63, 0.12);
  }
`;

const TagIconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 13px;
  color: #2b4c3f;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const TagText = styled.span`
  line-height: 1;
`;

const DescBox = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.space[4]};
  margin-bottom: ${({ theme }) => theme.space[4]};

  p {
    font-size: 13.5px;
    line-height: 1.65;
    color: ${({ theme }) => theme.colors.text};
  }
`;

const PhotoRow = styled.div`
  display: flex;
  width: 100%;
  gap: 10px;
  margin-bottom: ${({ theme }) => theme.space[5]};
  box-sizing: border-box;
  padding: 0 2px;
`;

const PhotoThumb = styled.div`
  flex: 1;
  min-width: 0;
  height: 140px;
  border-radius: ${({ theme }) => theme.radius.md};
  background-size: cover;
  background-position: center;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 6px 16px rgba(45, 82, 68, 0.22);
  }
`;

const PhotoLabelBadge = styled.span`
  position: absolute;
  bottom: 6px;
  left: 6px;
  background: rgba(0, 0, 0, 0.65);
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 8px;
  backdrop-filter: blur(4px);
  pointer-events: none;
`;

const PhotoModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const PhotoModalContent = styled.div`
  position: relative;
  max-width: 90%;
  max-height: 80vh;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
`;

const PhotoModalImg = styled.img`
  width: 100%;
  max-height: 80vh;
  object-fit: contain;
  display: block;
`;

const PhotoModalCloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(4px);

  &:hover {
    background: rgba(0, 0, 0, 0.85);
  }
`;

const NavigateBtn = styled.button`
  width: 100%;
  height: 52px;
  border: 1.5px solid ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: 15px;
  font-weight: 700;
  transition: background 0.15s ease, color 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ theme }) => theme.colors.text};
    color: #ffffff;
  }
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 99;
  backdrop-filter: blur(2px);
`;

const LeftDrawer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 280px;
  background: ${({ theme }) => theme.colors.surface};
  z-index: 100;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &.is-open {
    transform: translateX(0);
  }
`;

const DrawerHeader = styled.div`
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[5]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const DrawerTitle = styled.h2`
  font-size: 17px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text};
`;

const CloseBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;

  svg {
    width: 20px;
    height: 20px;
  }
`;

const DrawerContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.space[5]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[6]};
`;

const DrawerSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
`;

const SectionLabel = styled.p`
  font-size: 12px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
`;

const TypeBtn = styled.button`
  width: 100%;
  height: 40px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &.is-active {
    background: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
    color: #ffffff;
    font-weight: 700;
  }
`;

const CheckboxRow = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  padding: ${({ theme }) => theme.space[1]} 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
  cursor: pointer;
`;

const ToggleSwitch = styled.div`
  width: 38px;
  height: 22px;
  border-radius: 99px;
  background: ${({ theme }) => theme.colors.border};
  position: relative;
  transition: background 0.2s ease;

  &::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    transition: transform 0.2s ease;
  }

  &.is-active {
    background: ${({ theme }) => theme.colors.primary};
    &::before {
      transform: translateX(16px);
    }
  }
`;

const MenuLinkItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  padding: ${({ theme }) => theme.space[2]} 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
  cursor: pointer;
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.border};

  .chevron {
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 99px;
  padding: 2px 4px 2px 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  background: none;
  font-size: 16px; /* Prevent iOS & Mobile browser auto-zoom on input focus */
  color: #1a1a1a;
  outline: none;
  padding: 4px 0;
  font-family: inherit;

  &:focus,
  &:focus-visible,
  &:active {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
  }

  &::placeholder {
    color: #999999;
    font-size: 14px;
  }
`;






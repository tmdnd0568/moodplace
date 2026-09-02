import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/StoreContext';
import { NEARBY_PLACES, NEARBY_TAG_ICON_META } from '../data/mockData';
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
  const [userLocationName, setUserLocationName] = useState<string>('내 현재 위치 (대전 둔산동)');

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
          if (lat >= 36.2 && lat <= 36.5 && lng >= 127.2 && lng <= 127.5) {
            setUserLocationName('내 현재 위치 (대전광역시)');
          } else {
            setUserLocationName('내 현재 위치 (실시간 GPS)');
          }
        },
        () => {
          setUserCoords([36.3537, 127.3872]);
          setUserLocationName('내 현재 위치 (대전 둔산동)');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // 전체 카페 정보 통합 리스트 (현재 위치 userCoords 주변 반경 0.2km ~ 2.5km 분포)
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
      
      // 내 위치 userCoords 기준 반경 0.3km ~ 2.2km 이내에 자연스럽게 배치
      const angle = (idx * 137.5 + 45) * (Math.PI / 180);
      const radiusOffset = 0.003 + (idx % 4) * 0.0045; // ~300m ~ 2.2km
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
        
        // 내 위치 기준 반경 0.2km ~ 2.6km 이내 골고루 배치
        const angle = ((idx + 5) * 115) * (Math.PI / 180);
        const radiusOffset = 0.0025 + (idx % 6) * 0.0035; // ~250m ~ 2.4km
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

    return list;
  }, [state.cafes, state.searchResults, userCoords]);

  // 내 위치 기준 모든 카페 거리 계산 및 3km 반경 필터링
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

  // 3km 반경 내 카페 필터링 (가까운 순 정렬)
  const cafesWithin3km = React.useMemo(() => {
    return cafesWithDistance
      .filter((c) => c.distKm <= radiusKm)
      .sort((a, b) => a.distKm - b.distKm);
  }, [cafesWithDistance, radiusKm]);

  const selectedPlace = cafesWithin3km.find((p) => p.id === selectedPlaceId) || cafesWithin3km[0] || cafesWithDistance[0];

  const handleOfflineDownload = () => {
    if (downloadProgress !== null) return;
    setDownloadProgress(0);
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          alert('주변 오프라인 지도가 성공적으로 저장되었습니다!');
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
      setDragOffset(deltaY);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 100) {
      setIsSheetOpen(false);
    }
    setDragOffset(0);
  };

  const filteredPlaces = cafesWithin3km.filter((place) =>
    place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    place.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchResultSelect = (id: string) => {
    handlePlaceSelect(id);
    setIsSearchActive(false);
    setSearchQuery('');
  };

  const mapRef = React.useRef<any>(null);
  const markersRef = React.useRef<Record<string, any>>({});
  const circleRef = React.useRef<any>(null);
  const tileLayerRef = React.useRef<any>(null);

  // 1. GPU 하드웨어 가속 Leaflet Map 엔진 초기화
  React.useEffect(() => {
    const L = (window as any).L;
    if (!L) return;

    const map = L.map('find-map-api', {
      preferCanvas: true, // GPU 하드웨어 가속 캔버스 렌더러로 렉 제거
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      inertiaDeceleration: 3000
    }).setView(userCoords, 14);

    const standardLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      updateWhenZooming: false, // 줌 줌 시 타일 재렌더링 렉 방지
      updateWhenIdle: true,     // 드래그 멈췄을 때만 타일 업데이트
      keepBuffer: 3             // 렉 없는 매끄러운 스크롤을 위한 버퍼 유지
    }).addTo(map);
    tileLayerRef.current = standardLayer;

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

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
    if (!map) return;

    const L = (window as any).L;
    if (!L) return;

    const showLocation = (lat: number, lng: number) => {
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
      map.flyTo([lat, lng], 16);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          showLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('GPS location error, falling back to mock:', error);
          showLocation(37.5408, 127.0514);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      showLocation(37.5408, 127.0514);
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

        {/* Search Results Dropdown */}
        {isSearchActive && searchQuery.trim() !== '' && (
          <SearchResultsCard>
            {filteredPlaces.map((place) => (
              <ResultItem key={place.id} onClick={() => handleSearchResultSelect(place.id)}>
                <Icon name="pin" className="pin-icon" />
                <span>{place.name}</span>
              </ResultItem>
            ))}
            {filteredPlaces.length === 0 && <NoResults>검색 결과가 없습니다.</NoResults>}
          </SearchResultsCard>
        )}
      </FindHeader>

      {/* 2) Map Canvas */}
      <MapCanvas className="find-map-canvas">
        <div id="find-map-api" style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }} />
        
        {/* 3km 반경 카페 탐색 상단 플로팅 바 */}
        <RadiusInfoFloatingBar>
          <RadiusBadgeText>
            📍 <strong>{userLocationName}</strong> 기준 반경 <strong>{radiusKm}km</strong> 이내 <strong>{cafesWithin3km.length}개</strong> 카페 탐색됨
          </RadiusBadgeText>
          <RadiusFilterChips>
            <RadiusChipBtn type="button" $active={radiusKm === 1.0} onClick={() => setRadiusKm(1.0)}>1km</RadiusChipBtn>
            <RadiusChipBtn type="button" $active={radiusKm === 3.0} onClick={() => setRadiusKm(3.0)}>3km (추천)</RadiusChipBtn>
            <RadiusChipBtn type="button" $active={radiusKm === 5.0} onClick={() => setRadiusKm(5.0)}>5km</RadiusChipBtn>
            <RadiusChipBtn type="button" $active={radiusKm === 20.0} onClick={() => setRadiusKm(20.0)}>전체</RadiusChipBtn>
          </RadiusFilterChips>
        </RadiusInfoFloatingBar>
      </MapCanvas>

      <FindLocateBtn type="button" $isSheetOpen={isSheetOpen} onClick={handleLocateClick} aria-label="현재 위치로 이동">
        <Icon name="locate" className="icon" />
      </FindLocateBtn>

      {/* 3) Bottom sheet with Drag Gestures */}
      <PlaceDetailSheet 
        className="find-sheet" 
        $isOpen={isSheetOpen}
        style={{
          transform: isSheetOpen 
            ? `translateY(${dragOffset}px)` 
            : 'translateY(100%)',
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
        onTouchEnd={handleDragEnd}
        onMouseMove={(e) => handleDragMove(e.clientY)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
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
            const emoji = NEARBY_TAG_ICON_META[tag.icon] || '';
            return (
              <PlaceTag key={i} className="find-tag">
                {emoji && <span aria-hidden="true" style={{ marginRight: '4px' }}>{emoji}</span>}
                {tag.label}
              </PlaceTag>
            );
          })}
        </TagRow>

        <DescBox className="find-description-box">
          <p>{selectedPlace.description}</p>
        </DescBox>

        <PhotoRow className="find-photo-row">
          {selectedPlace.photos.map((photo, i) => (
            <PhotoThumb
              key={i}
              className="find-photo-thumb"
              style={{ backgroundImage: `url('${photo}')` }}
            />
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
  background: rgba(255, 255, 255, 0.9);
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(26, 26, 26, 0.12);
  flex-shrink: 0;
  transition: background 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, #ffffff 0%, #cfe6c8 100%);
    box-shadow: 0 4px 12px rgba(45, 82, 68, 0.2);
    transform: scale(1.05);
  }

  .icon {
    width: 19px;
    height: 19px;
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
  position: absolute;
  top: 72px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: calc(100% - 32px);
  max-width: 380px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  padding: 10px 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(45, 82, 68, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`;

const RadiusBadgeText = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
  text-align: center;

  strong {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 800;
  }
`;

const RadiusFilterChips = styled.div`
  display: flex;
  gap: 6px;
`;

const RadiusChipBtn = styled.button<{ $active?: boolean }>`
  background: ${({ $active, theme }) => ($active ? theme.colors.primary : 'rgba(45, 82, 68, 0.08)')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#2d5244')};
  border: none;
  border-radius: 12px;
  padding: 3px 10px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
  }
`;

const FindLocateBtn = styled.button<{ $isSheetOpen: boolean }>`
  position: absolute;
  bottom: ${({ $isSheetOpen }) => ($isSheetOpen ? 'calc(260px + env(safe-area-inset-bottom))' : 'calc(80px + env(safe-area-inset-bottom))')};
  right: ${({ theme }) => theme.space[4]};
  z-index: 4;
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 10px rgba(26, 26, 26, 0.2);
  transition: bottom 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  .icon {
    width: 19px;
    height: 19px;
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
  gap: 6px;
  margin-bottom: ${({ theme }) => theme.space[4]};
`;

const PlaceTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primaryDark};
  background: ${({ theme }) => theme.colors.primaryLight};
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radius.pill};
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
  gap: ${({ theme }) => theme.space[3]};
  margin-bottom: ${({ theme }) => theme.space[5]};
`;

const PhotoThumb = styled.div`
  flex: 1;
  height: 120px;
  border-radius: ${({ theme }) => theme.radius.md};
  background-size: cover;
  background-position: center;
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
  font-size: 13.5px;
  color: #1a1a1a;
  outline: none;
  padding: 4px 0;
  font-family: inherit;

  &::placeholder {
    color: #999999;
  }
`;

const SearchResultsCard = styled.div`
  position: absolute;
  top: 60px;
  left: ${({ theme }) => theme.space[4]};
  right: ${({ theme }) => theme.space[4]};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ theme }) => theme.shadow.float};
  border: 1px solid ${({ theme }) => theme.colors.border};
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  display: flex;
  flex-direction: column;
  padding: 6px 0;
`;

const ResultItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  padding: 10px 16px;
  background: none;
  border: none;
  text-align: left;
  font-size: 13.5px;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.03);
  }

  .pin-icon {
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const NoResults = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  padding: 16px 0;
`;




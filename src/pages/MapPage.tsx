import React from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/StoreContext';
import { getCafeById, TRAVEL_MODES, MAP_ORIGIN_LABEL } from '../data/mockData';
import { Icon } from '../components/icons/Icons';

const CAFE_COORDS: Record<string, [number, number]> = {
  'forest-lounge': [37.54457, 127.05761],
  'urban-nest': [37.54316, 127.04179],
  'calm-forest': [37.54117, 127.05594],
  'vivid-garden': [37.54181, 127.05645],
  'quiet-tea-room': [37.54341, 127.04167],
  'brick-atelier': [37.54145, 127.06208],
};

export const MapPage: React.FC = () => {
  const cafeId = useParams<{ cafeId: string }>().cafeId || 'forest-lounge';
  const navigate = useNavigate();
  const { state, dispatch } = useStore();

  const cafe =
    state.cafes.find((c) => c.id === cafeId) ||
    state.searchResults.find((c) => c.id === cafeId) ||
    getCafeById(cafeId);
  const [isSwapped, setIsSwapped] = React.useState<boolean>(false);
  const [isMoreOpen, setIsMoreOpen] = React.useState<boolean>(false);
  const [routeOption, setRouteOption] = React.useState<string>('optimum');
  const [isSavedRoute, setIsSavedRoute] = React.useState<boolean>(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState<boolean>(false);
  const [feedbackText, setFeedbackText] = React.useState<string>('');
  const [isNavigating, setIsNavigating] = React.useState<boolean>(false);

  const mapRef = React.useRef<any>(null);

  React.useEffect(() => {
    const L = (window as any).L;
    if (!L) return;

    const getCoords = (id: string, location: string = ''): [number, number] => {
      if (CAFE_COORDS[id]) return CAFE_COORDS[id];
      const loc = (location || '').toLowerCase();
      if (loc.includes('대전') || loc.includes('둔산')) return [36.3537, 127.3872];
      if (loc.includes('부산') || loc.includes('해운대')) return [35.1587, 129.1604];
      if (loc.includes('제주')) return [33.4996, 126.5312];
      if (loc.includes('강남')) return [37.4979, 127.0276];
      if (loc.includes('홍대') || loc.includes('마포')) return [37.5563, 126.9226];
      if (loc.includes('대구')) return [35.8714, 128.6014];
      if (loc.includes('광주')) return [35.1595, 126.8526];
      if (loc.includes('수원')) return [37.2636, 127.0286];
      return [37.5446, 127.0560];
    };

    const origin: [number, number] = [37.5408, 127.0514];
    const destination: [number, number] = getCoords(cafeId, cafe?.location);

    // Initialize Map
    const map = L.map('route-map-api', {
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    mapRef.current = map;

    // Manhattan grid streets representation dynamically changing by routeOption
    let path: [number, number][] = [];
    if (cafeId === 'urban-nest') {
      if (routeOption === 'shortest') {
        path = [origin, destination];
      } else if (routeOption === 'free') {
        path = [origin, [origin[0], 127.0500], [destination[0], 127.0500], destination];
      } else if (routeOption === 'main') {
        path = [origin, [37.5420, origin[1]], [37.5420, destination[1]], destination];
      } else {
        path = [origin, [37.5420, origin[1]], [37.5420, destination[1]], destination];
      }
    } else {
      if (routeOption === 'shortest') {
        path = [origin, destination];
      } else if (routeOption === 'free') {
        path = [origin, [37.5390, origin[1]], [37.5390, destination[1]], destination];
      } else if (routeOption === 'main') {
        path = [origin, [origin[0], destination[1]], destination];
      } else {
        path = [origin, [37.5420, origin[1]], [37.5420, destination[1]], destination];
      }
    }

    const dotIcon = L.divIcon({
      className: 'leaflet-custom-marker-dot',
      html: `<div class="origin-dot"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const pinIcon = L.divIcon({
      className: 'leaflet-custom-marker-pin',
      html: `
        <div class="dest-pin">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    const startPoint = isSwapped ? destination : origin;
    const endPoint = isSwapped ? origin : destination;

    L.marker(startPoint, { icon: isSwapped ? pinIcon : dotIcon }).addTo(map);
    L.marker(endPoint, { icon: isSwapped ? dotIcon : pinIcon }).addTo(map);

    L.polyline(path, {
      color: '#2d5244',
      weight: 5,
      dashArray: '8, 8',
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    const bounds = L.latLngBounds([origin, destination]);
    map.fitBounds(bounds.pad(0.2));

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [cafeId, isSwapped, routeOption, state.travelMode]);

  if (!cafe) {
    return (
      <ErrorContainer>
        <p>카페 정보를 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/main')}>메인으로 이동</button>
      </ErrorContainer>
    );
  }

  const handleBack = () => {
    navigate(-1);
  };

  const handleTravelModeChange = (mode: 'walk' | 'transit' | 'taxi') => {
    dispatch({ type: 'SET_TRAVEL_MODE', payload: mode });
  };



  const handleSwap = () => {
    setIsSwapped(!isSwapped);
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

  const travelMode = state.travelMode;
  const rawRoutes = cafe.detail.route?.routesByMode[travelMode] || [];

  const activeRouteId = state.selectedRouteId || rawRoutes[0]?.id || '';

  const getOrderedRoutes = () => {
    if (!rawRoutes.length) return [];
    if (!activeRouteId) return rawRoutes;
    const idx = rawRoutes.findIndex((r) => r.id === activeRouteId);
    if (idx <= 0) return rawRoutes;
    const reordered = [...rawRoutes];
    const [picked] = reordered.splice(idx, 1);
    reordered.unshift(picked);
    return reordered;
  };

  const orderedRoutes = getOrderedRoutes();
  const [featuredRoute] = orderedRoutes;
  const destinationLabel = cafe.detail.route?.destinationLabel || cafe.name;

  return (
    <PageContainer id="screen-map" className="screen is-active">
      {/* 1) Header */}
      <MapHeader className="map-header">
        <MapIconBtn type="button" className="map-icon-btn" onClick={handleBack} aria-label="뒤로가기">
          <Icon name="back" className="icon" />
        </MapIconBtn>
        <MapLogoImg src="/assets/logo_01.png" alt="MoodPlace" />
        <MapIconBtn type="button" className="map-icon-btn" onClick={() => setIsMoreOpen(true)} aria-label="더보기">
          <svg viewBox="0 0 24 24" fill="currentColor" className="icon-more">
            <circle cx="12" cy="5" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="12" cy="19" r="1.8" />
          </svg>
        </MapIconBtn>
      </MapHeader>

      {/* 2) Map Canvas - 상단 메인 지도가 배경 100% 채움 */}
      <MapArea className="map-canvas">
        <div id="route-map-api" style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }} />
        <MapLocateBtn type="button" onClick={handleLocateClick} aria-label="내 위치 확인">
          <Icon name="locate" className="icon" />
        </MapLocateBtn>
      </MapArea>

      {/* 3) 길찾기 패널 - 모바일 프레임 최하단(bottom: 0) 고정 */}
      <MapSheet className="map-sheet">

        {/* 4) 출발지 / 도착지 입력행 */}
        <MapRouteInputs className="map-route-inputs">
          <MapRouteIcons className="map-route-icons">
            <span className="map-marker-dot dot" />
            <span className="map-dashed-line line" aria-hidden="true" />
            <Icon name="pinFilled" className="pin" />
          </MapRouteIcons>
          <MapRouteFields className="map-route-fields">
            <MapRouteField className="map-route-field">
              <FieldTextWrap className="map-route-field-text">
                <FieldLabel className="map-route-field-label">출발지</FieldLabel>
                <FieldValue className="map-route-field-value">
                  {isSwapped ? destinationLabel : MAP_ORIGIN_LABEL}
                </FieldValue>
              </FieldTextWrap>
            </MapRouteField>
            <MapRouteField className="map-route-field">
              <FieldTextWrap className="map-route-field-text">
                <FieldLabel className="map-route-field-label">도착지</FieldLabel>
                <FieldValue className="map-route-field-value">
                  {isSwapped ? MAP_ORIGIN_LABEL : destinationLabel}
                </FieldValue>
              </FieldTextWrap>
              <MapSwapBtn type="button" className="map-swap-btn" onClick={handleSwap} aria-label="출발지/도착지 전환">
                <Icon name="swap" className="icon" />
              </MapSwapBtn>
            </MapRouteField>
          </MapRouteFields>
        </MapRouteInputs>

        {/* 5) 이동수단 토글 */}
        <MapModeToggle className="map-mode-toggle" role="tablist" aria-label="이동수단 선택">
          {TRAVEL_MODES.map((mode) => {
            const isActive = mode.id === travelMode;
            return (
              <MapModeBtn
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`map-mode-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => handleTravelModeChange(mode.id as 'walk' | 'transit' | 'taxi')}
              >
                <Icon name={mode.icon} className="icon" />
                <span>{mode.label}</span>
              </MapModeBtn>
            );
          })}
        </MapModeToggle>

        {/* 6) 추천 및 대안 경로 리스트 */}
        <RoutesSection>
          {featuredRoute ? (
            <>
              <SectionHeader className="map-section-header">
                <SectionTitle className="map-section-title">추천 경로</SectionTitle>
                <SectionHint className="map-section-hint">
                  <Icon name="info" className="icon" />
                  <span>실시간 교통상황 반영</span>
                </SectionHint>
              </SectionHeader>

              {/* 최상단 추천 경로 카드 */}
              <RouteFeatured className="map-route-featured">
                <RouteFeaturedTop className="map-route-featured-top">
                  {featuredRoute.badge ? (
                    <RouteBadge className="map-route-badge">{featuredRoute.badge}</RouteBadge>
                  ) : (
                    <span />
                  )}
                  <RouteFeaturedMeta className="map-route-featured-meta">
                    {featuredRoute.distanceLabel && <div>{featuredRoute.distanceLabel}</div>}
                    {featuredRoute.metaLabel && <div>{featuredRoute.metaLabel}</div>}
                  </RouteFeaturedMeta>
                </RouteFeaturedTop>
                <RouteFeaturedTime className="map-route-featured-time">
                  <span className="num">{featuredRoute.durationMin}</span>
                  <span className="unit">분</span>
                </RouteFeaturedTime>
                <RouteProgress className="map-route-progress">
                  <RouteProgressFill className="map-route-progress-fill" $width={featuredRoute.progress || 60} />
                </RouteProgress>
                {featuredRoute.description && (
                  <RouteDesc className="map-route-desc">
                    <Icon name="route" className="icon" />
                    <span>{featuredRoute.description}</span>
                  </RouteDesc>
                )}

                {/* 1. 안내 시작 버튼을 추천 경로 카드 내부로 통합 */}
                <MapCtaBtn type="button" className="map-cta-btn" onClick={() => setIsNavigating(true)}>
                  안내 시작
                </MapCtaBtn>
              </RouteFeatured>
            </>
          ) : (
            <NoRoutesText>이 이동수단에 대한 경로 정보가 없습니다.</NoRoutesText>
          )}
        </RoutesSection>
      </MapSheet>

      {/* 실시간 길안내 모달 페이지 */}
      {isNavigating && (
        <NavModalOverlay onClick={() => setIsNavigating(false)}>
          <NavModalCard onClick={(e) => e.stopPropagation()}>
            <NavHeaderRow>
              <NavBadge>안내 중</NavBadge>
              <NavTitle>실시간 길안내 서비스</NavTitle>
            </NavHeaderRow>

            <NavInstructionCard>
              <NavSignIcon>
                <Icon name="chevronLeft" style={{ transform: 'rotate(90deg)' }} />
              </NavSignIcon>
              <NavSignText>
                <div className="meters">300m 앞</div>
                <div className="action">성수이로 사거리에서 좌회전 후 150m 직진</div>
              </NavSignText>
            </NavInstructionCard>

            <NavStatsRow>
              <NavStatItem>
                <div className="label">남은 시간</div>
                <div className="value" style={{ color: '#2D5244' }}>{featuredRoute?.durationMin || 12}분</div>
              </NavStatItem>
              <NavStatItem>
                <div className="label">남은 거리</div>
                <div className="value">{featuredRoute?.distanceLabel || '850m'}</div>
              </NavStatItem>
              <NavStatItem>
                <div className="label">도착 예정</div>
                <div className="value">오전 10:28</div>
              </NavStatItem>
            </NavStatsRow>

            <NavEndBtn type="button" onClick={() => setIsNavigating(false)}>
              안내 종료
            </NavEndBtn>
          </NavModalCard>
        </NavModalOverlay>
      )}

      {/* 8) More Options Bottom Sheet */}
      {isMoreOpen && (
        <>
          <MapOverlay onClick={() => setIsMoreOpen(false)} />
          <MoreBottomSheet>
            <MoreHeader>
              <MoreTitle>길찾기 옵션</MoreTitle>
              <MoreCloseBtn type="button" onClick={() => setIsMoreOpen(false)}>
                <Icon name="close" />
              </MoreCloseBtn>
            </MoreHeader>

            <MoreContent>
              <OptionSection>
                <OptionLabel>경로 조건 설정</OptionLabel>
                <OptionGrid>
                  <OptionBtn className={routeOption === 'optimum' ? 'is-active' : ''} onClick={() => { setRouteOption('optimum'); alert('최적 경로 검색 조건이 반영되었습니다.'); setIsMoreOpen(false); }}>
                    <strong>최적 경로</strong>
                    <span>시간/거리 최적화</span>
                  </OptionBtn>
                  <OptionBtn className={routeOption === 'shortest' ? 'is-active' : ''} onClick={() => { setRouteOption('shortest'); alert('최단 거리 조건이 반영되었습니다.'); setIsMoreOpen(false); }}>
                    <strong>최단 거리</strong>
                    <span>가장 짧은 코스 우선</span>
                  </OptionBtn>
                  <OptionBtn className={routeOption === 'free' ? 'is-active' : ''} onClick={() => { setRouteOption('free'); alert('무료 도로 조건이 반영되었습니다.'); setIsMoreOpen(false); }}>
                    <strong>무료 우선</strong>
                    <span>통행료 없는 경로</span>
                  </OptionBtn>
                  <OptionBtn className={routeOption === 'main' ? 'is-active' : ''} onClick={() => { setRouteOption('main'); alert('큰길 우선 조건이 반영되었습니다.'); setIsMoreOpen(false); }}>
                    <strong>큰길 우선</strong>
                    <span>안전한 대로변 위주</span>
                  </OptionBtn>
                </OptionGrid>
              </OptionSection>

              <MoreDivider />

              <ActionList>
                <ActionItem type="button" onClick={() => { setIsSavedRoute(!isSavedRoute); alert(isSavedRoute ? '경로 저장이 해제되었습니다.' : '경로가 보관함에 저장되었습니다.'); }}>
                  <Icon name={isSavedRoute ? 'bookmarkFilled' : 'bookmark'} className="icon" />
                  <span>{isSavedRoute ? '이 경로 저장 해제' : '이 경로 보관함에 저장'}</span>
                </ActionItem>

                <ActionItem type="button" onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('경로 공유 링크가 클립보드에 복사되었습니다!');
                  setIsMoreOpen(false);
                }}>
                  <Icon name="share" className="icon" />
                  <span>현재 길찾기 경로 공유</span>
                </ActionItem>

                <ActionItem type="button" onClick={() => {
                  setIsMoreOpen(false);
                  setIsFeedbackOpen(true);
                }}>
                  <Icon name="editProfile" className="icon" />
                  <span>지도 정보 오류 신고</span>
                </ActionItem>
              </ActionList>
            </MoreContent>
          </MoreBottomSheet>
        </>
      )}

      {/* 9) Feedback Modal */}
      {isFeedbackOpen && (
        <FeedbackOverlay onClick={() => setIsFeedbackOpen(false)}>
          <FeedbackModal onClick={(e) => e.stopPropagation()}>
            <FeedbackTitle>지도 정보 오류 신고</FeedbackTitle>
            <FeedbackTextarea
              placeholder="예: 도로 공사, 지도 핀 위치 오류 등 제보하실 내용을 입력해 주세요."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
            <FeedbackActions>
              <FeedbackCancelBtn onClick={() => setIsFeedbackOpen(false)}>취소</FeedbackCancelBtn>
              <FeedbackSubmitBtn onClick={() => {
                if (!feedbackText.trim()) {
                  alert('내용을 입력해주세요.');
                  return;
                }
                alert('소중한 피드백 감사드립니다! 개발팀에 정상 전달되었습니다.');
                setFeedbackText('');
                setIsFeedbackOpen(false);
              }}>
                제출하기
              </FeedbackSubmitBtn>
            </FeedbackActions>
          </FeedbackModal>
        </FeedbackOverlay>
      )}
    </PageContainer>
  );
};

const PageContainer = styled.section`
  background: ${({ theme }) => theme.colors.bg};
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: ${({ theme }) => theme.space[4]};
`;

const MapHeader = styled.header`
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

const MapIconBtn = styled.button`
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
    background: linear-gradient(135deg, #ffffff 0%, #cfe6cb 100%);
    box-shadow: 0 4px 12px rgba(45, 82, 68, 0.2);
    transform: scale(1.05);
  }

  .icon {
    width: 19px;
    height: 19px;
  }
  
  .icon-more {
    width: 19px;
    height: 19px;
  }
`;

const MapLogoImg = styled.img`
  height: 32px;
  object-fit: contain;
`;

const MapArea = styled.div`
  width: 100%;
  height: 100%;
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #e9efe4;
  z-index: 1;

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

  /* Custom marker designs */
  .origin-dot {
    width: 14px;
    height: 14px;
    background: ${({ theme }) => theme.colors.primary};
    border: 3px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  }

  .dest-pin {
    width: 32px;
    height: 32px;
    color: #e2574c;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 32px;
      height: 32px;
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

const MapLocateBtn = styled.button`
  position: absolute;
  top: 68px;
  right: ${({ theme }) => theme.space[4]};
  z-index: 10;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(26, 26, 26, 0.15);
  backdrop-filter: blur(4px);
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;

  .icon {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.primary};
  }

  &:hover {
    background: #ffffff;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(45, 82, 68, 0.2);
  }
`;

const MapSheet = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 10;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 24px 24px 0 0;
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[5]};
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.12);
  box-sizing: border-box;
`;

const MapRouteInputs = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[3]};
  margin-bottom: ${({ theme }) => theme.space[5]};
`;

const MapRouteIcons = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 4px;

  .dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary};
    border: 3px solid #ffffff;
    box-shadow: 0 2px 6px rgba(26, 26, 26, 0.25);
  }

  .line {
    flex: 1;
    width: 0;
    min-height: 28px;
    border-left: 1.5px dashed ${({ theme }) => theme.colors.border};
    margin: 6px 0;
  }

  .pin {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const MapRouteFields = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
`;

const MapRouteField = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]};
`;

const FieldTextWrap = styled.div`
  flex: 1;
  min-width: 0;
`;

const FieldLabel = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 2px;
`;

const FieldValue = styled.p`
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MapSwapBtn = styled.button`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;

  .icon {
    width: 15px;
    height: 15px;
  }
`;

const MapModeToggle = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[6]};
`;

const MapModeBtn = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 44px;
  border-radius: 50px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  font-weight: 700;
  transition: all 0.2s ease;

  .icon {
    width: 17px;
    height: 17px;
  }

  &.is-active {
    background: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
    color: #ffffff;
  }
`;

const RoutesSection = styled.div`
  /* padding no longer needed separately because map-sheet already has padding */
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.space[4]};
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text};
`;

const SectionHint = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};

  .icon {
    width: 13px;
    height: 13px;
  }
`;

const RouteFeatured = styled.article`
  border: 1.5px solid ${({ theme }) => theme.colors.primary};
  border-radius: 16px;
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[5]};
  margin-bottom: ${({ theme }) => theme.space[3]};
  background: ${({ theme }) => theme.colors.surface};
`;

const RouteFeaturedTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.space[3]};
`;

const RouteBadge = styled.span`
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primaryDark};
  background: ${({ theme }) => theme.colors.primaryLight};
  padding: 4px 12px;
  border-radius: 50px;
`;

const RouteFeaturedMeta = styled.div`
  text-align: right;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.5;
`;

const RouteFeaturedTime = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: ${({ theme }) => theme.space[3]};

  .num {
    font-size: 34px;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.text};
    letter-spacing: -0.5px;
  }

  .unit {
    font-size: 15px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const RouteProgress = styled.div`
  height: 6px;
  border-radius: 50px;
  background: ${({ theme }) => theme.colors.bg};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.space[3]};
`;

const RouteProgressFill = styled.div<{ $width: number }>`
  height: 100%;
  background: ${({ theme }) => theme.colors.primary};
  width: ${({ $width }) => $width}%;
  border-radius: 50px;
`;

const RouteDesc = styled.p`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.textMuted};

  .icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    margin-top: 2px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;



const NoRoutesText = styled.p`
  font-size: 13.5px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  padding: 40px 0;
`;

const MapCtaBtn = styled.button`
  width: 100%;
  height: 50px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.primary};
  color: #ffffff;
  font-size: 15.5px;
  font-weight: 700;
  margin-top: 16px;
  transition: background 0.15s ease, transform 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
    transform: translateY(-1px);
  }
`;

const MapOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 100;
  backdrop-filter: blur(3px);
  animation: fadeIn 0.25s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const MoreBottomSheet = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 200;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  max-height: 75vh;
  overflow-y: auto;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
`;

const MoreHeader = styled.div`
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[5]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const MoreTitle = styled.h2`
  font-size: 16px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text};
`;

const MoreCloseBtn = styled.button`
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

const MoreContent = styled.div`
  padding: ${({ theme }) => theme.space[5]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[5]};
  overflow-y: auto;
`;

const OptionSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
`;

const OptionLabel = styled.p`
  font-size: 12.5px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const OptionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space[3]};
`;

const OptionBtn = styled.button`
  padding: ${({ theme }) => theme.space[3]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.bg};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;

  strong {
    font-size: 13.5px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 2px;
  }

  span {
    font-size: 11px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &.is-active {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primaryLight};
    strong {
      color: ${({ theme }) => theme.colors.primaryDark};
    }
  }
`;

const MoreDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
`;

const ActionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
`;

const ActionItem = styled.button`
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  padding: 0 ${({ theme }) => theme.space[2]};
  border-radius: ${({ theme }) => theme.radius.sm};
  transition: background 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.03);
  }

  .icon {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const FeedbackOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 101;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.space[5]};
  backdrop-filter: blur(2px);
`;

const FeedbackModal = styled.div`
  width: 100%;
  max-width: 380px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.space[5]};
  box-shadow: ${({ theme }) => theme.shadow.float};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`;

const FeedbackTitle = styled.h3`
  font-size: 16px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.text};
`;

const FeedbackTextarea = styled.textarea`
  width: 100%;
  height: 120px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => theme.space[3]};
  font-size: 13.5px;
  line-height: 1.5;
  resize: none;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const FeedbackActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[3]};
  justify-content: flex-end;
`;

const FeedbackCancelBtn = styled.button`
  padding: 8px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.pill};
  background: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
`;

const FeedbackSubmitBtn = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.primary};
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
`;

/* ─── 실시간 길안내 모달 스타일 ─── */
const NavModalOverlay = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: ${({ theme }) => theme.layout.appMaxWidth || '403px'};
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
`;

const NavModalCard = styled.div`
  width: 100%;
  background: #ffffff;
  border-radius: 20px;
  padding: 24px 20px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25);
  max-height: 80vh;
  max-height: 80dvh;
  display: flex;
  flex-direction: column;
  animation: popCenter 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  box-sizing: border-box;

  @keyframes popCenter {
    from { transform: scale(0.92); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

const NavHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
`;

const NavBadge = styled.span`
  background: #e2574c;
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 4px;
  animation: pulse 1.5s infinite;

  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
`;

const NavTitle = styled.h2`
  font-size: 16px;
  font-weight: 800;
  color: #1a1a1a;
`;

const NavInstructionCard = styled.div`
  background: linear-gradient(135deg, #2D5244 0%, #1e3b30 100%);
  border-radius: 16px;
  padding: 20px;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  box-shadow: 0 8px 20px rgba(45, 82, 68, 0.2);
`;

const NavSignIcon = styled.div`
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  svg {
    width: 28px;
    height: 28px;
    color: #ffffff;
  }
`;

const NavSignText = styled.div`
  flex: 1;

  .meters {
    font-size: 14px;
    font-weight: 500;
    opacity: 0.85;
    margin-bottom: 2px;
  }

  .action {
    font-size: 18px;
    font-weight: 800;
    line-height: 1.3;
  }
`;

const NavStatsRow = styled.div`
  display: flex;
  justify-content: space-around;
  border-top: 1.5px solid #f1f4f0;
  border-bottom: 1.5px solid #f1f4f0;
  padding: 16px 0;
  margin-bottom: 24px;
`;

const NavStatItem = styled.div`
  text-align: center;

  .label {
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
  }

  .value {
    font-size: 18px;
    font-weight: 800;
    color: #1a1a1a;
  }
`;

const NavEndBtn = styled.button`
  width: 100%;
  height: 52px;
  border: 1px solid #ff4d6d;
  background: transparent;
  color: #ff4d6d;
  font-size: 15.5px;
  font-weight: 700;
  border-radius: 26px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #fff5f6;
  }
`;




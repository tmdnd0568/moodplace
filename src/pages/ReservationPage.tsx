import React, { useState } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/StoreContext';
import { getCafeById, FACILITY_META } from '../data/mockData';
import { SubHeader } from '../components/SubHeader';
import { Icon } from '../components/icons/Icons';

const CAFE_COORDS: Record<string, [number, number]> = {
  'forest-lounge': [37.54457, 127.05761],
  'urban-nest': [37.54316, 127.04179],
  'calm-forest': [37.54117, 127.05594],
  'vivid-garden': [37.54181, 127.05645],
  'quiet-tea-room': [37.54341, 127.04167],
  'brick-atelier': [37.54145, 127.06208],
};

function getCoordsForCafe(id: string, location: string = ''): [number, number] {
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
}

export const ReservationPage: React.FC = () => {
  const { cafeId } = useParams<{ cafeId: string }>();
  const navigate = useNavigate();
  const { state } = useStore();

  const cafe =
    state.cafes.find((c) => c.id === cafeId) ||
    state.searchResults.find((c) => c.id === cafeId) ||
    getCafeById(cafeId || '');

  const [selectedDate, setSelectedDate] = useState('2026-08-05');
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [isCopied, setIsCopied] = useState(false);

  const mapRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!cafe) return;
    const L = (window as any).L;
    if (!L) return;

    const coords = getCoordsForCafe(cafe.id, cafe.location);

    // Initialize Map
    const map = L.map('preview-map-api', {
      zoomControl: false,
      attributionControl: false
    }).setView(coords, 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    mapRef.current = map;

    // Custom marker pin
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

    L.marker(coords, { icon: pinIcon }).addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [cafe]);

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

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(`${cafe.location} 특정 주소 (데모)`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleGoToMap = () => {
    navigate(`/map/${cafe.id}`);
  };

  const userMarkerRef = React.useRef<any>(null);

  const handleLocateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      map.flyTo([lat, lng], 17);
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

  const handleNaverReservation = () => {
    const naverUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(cafe.name + ' 예약')}`;
    window.open(naverUrl, '_blank', 'noopener,noreferrer');
  };

  const status = { text: '영업 중', color: '#2d5244' };
  const facilitiesList = cafe.detail.reservation?.facilities || ['wifi', 'parking', 'group', 'accessible'];

  return (
    <PageContainer>
      <SubHeader onBack={handleBack} title="예약 정보 및 위치" />

      <ContentScroll>
        <MapPreviewSection>
          <div id="preview-map-api" style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }} />
          <MapOverlayBadge onClick={handleGoToMap}>
            <Icon name="map" className="icon" />
            <span>길찾아보기</span>
          </MapOverlayBadge>
          <MapLocateBtn type="button" onClick={handleLocateClick} aria-label="내 위치 확인">
            <Icon name="locate" className="icon" />
          </MapLocateBtn>
        </MapPreviewSection>

        <InfoCard>
          <InfoTitleRow>
            <InfoCafeName>{cafe.name}</InfoCafeName>
            <InfoStatus style={{ color: status.color, borderColor: status.color }}>
              {status.text}
            </InfoStatus>
          </InfoTitleRow>
          
          <RatingLine>
            <Icon name="star" className="star-icon" />
            <RatingScore>{cafe.detail.rating}</RatingScore>
            <ReviewCount>({cafe.detail.reservation?.reviewCountLabel || '리뷰 100+'})</ReviewCount>
          </RatingLine>

          {cafe.detail.reservation?.description && (
            <ResDescription>{cafe.detail.reservation.description}</ResDescription>
          )}

          <LocationRow>
            <Icon name="pin" className="pin-icon" />
            <AddressText>{cafe.location}</AddressText>
            <CopyBtn type="button" onClick={handleCopyAddress}>
              <Icon name={isCopied ? 'check' : 'copy'} />
              <span>{isCopied ? '복사됨' : '복사'}</span>
            </CopyBtn>
          </LocationRow>
        </InfoCard>

        <Section>
          <SectionTitle>네이버 예약 일정</SectionTitle>
          <DateTimeRow>
            <Icon name="calendar" className="cal-icon" />
            <DateInput
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <TimeInput
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            />
          </DateTimeRow>
        </Section>

        <Section>
          <SectionTitle>시설 및 편의정보</SectionTitle>
          <FacilityGrid>
            {facilitiesList.map((facKey) => {
              const meta = FACILITY_META[facKey];
              if (!meta) return null;
              return (
                <FacilityItem key={facKey}>
                  <FacilityIconWrapper>
                    <Icon name={meta.icon} />
                  </FacilityIconWrapper>
                  <FacilityLabel>{meta.label}</FacilityLabel>
                </FacilityItem>
              );
            })}
          </FacilityGrid>
        </Section>

        {cafe.detail.reservation?.notice && (
          <Section>
            <SectionTitle>예약 유의사항</SectionTitle>
            <NoticeText>{cafe.detail.reservation.notice}</NoticeText>
          </Section>
        )}
      </ContentScroll>

      <FixedFooter>
        <FootCallBtn href="tel:02-1234-5678" aria-label="전화걸기">
          <Icon name="phone" />
        </FootCallBtn>
        <PrimaryFootBtn onClick={handleNaverReservation}>
          네이버 예약 신청하기
        </PrimaryFootBtn>
      </FixedFooter>
    </PageContainer>
  );
};

const PageContainer = styled.section`
  background: ${({ theme }) => theme.colors.bg};
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: ${({ theme }) => theme.space[4]};
`;

const ContentScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px;
`;

const MapPreviewSection = styled.div`
  height: 180px;
  background: #e2e1dd;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.border};
  z-index: 1;

  .leaflet-container {
    width: 100%;
    height: 100%;
  }

  .leaflet-pane {
    z-index: 1 !important;
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
    width: 12px;
    height: 12px;
    background: #007aff;
    border: 2px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(0, 122, 255, 0.6);
    animation: gpsPulse 2s infinite;
  }

  @keyframes gpsPulse {
    0% {
      box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.7);
    }
    70% {
      box-shadow: 0 0 0 6px rgba(0, 122, 255, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(0, 122, 255, 0);
    }
  }
`;

const MapOverlayBadge = styled.button`
  position: absolute;
  bottom: ${({ theme }) => theme.space[3]};
  right: ${({ theme }) => theme.space[3]};
  background: transparent;
  color: #000000;
  border: 1px solid #000000;
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  z-index: 10;
  cursor: pointer;
  backdrop-filter: blur(2px);

  .icon {
    width: 14px;
    height: 14px;
    color: #000000;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

const MapLocateBtn = styled.button`
  position: absolute;
  bottom: 44px; /* Positioned directly above the MapOverlayBadge (지도 보기) badge */
  right: ${({ theme }) => theme.space[3]};
  z-index: 10;
  width: 36px;
  height: 36px;
  border: 1px solid #000000;
  border-radius: 50%;
  background: transparent;
  color: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(2px);

  .icon {
    width: 16px;
    height: 16px;
    color: #000000;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
`;

const InfoCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-bottom-left-radius: ${({ theme }) => theme.radius.lg};
  border-bottom-right-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.space[5]};
  margin-bottom: ${({ theme }) => theme.space[3]};
  box-shadow: ${({ theme }) => theme.shadow.card};
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.border};
`;

const InfoTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const InfoCafeName = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

const InfoStatus = styled.span`
  font-size: 11px;
  font-weight: 700;
  border: 1px solid;
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const RatingLine = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: ${({ theme }) => theme.space[4]};

  .star-icon {
    width: 14px;
    height: 14px;
    color: #f59e0b;
  }
`;

const RatingScore = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

const ReviewCount = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ResDescription = styled.p`
  font-size: 14px;
  color: #4a4a4a;
  line-height: 1.5;
  margin-bottom: ${({ theme }) => theme.space[4]};
`;

const LocationRow = styled.div`
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.bg};
  padding: ${({ theme }) => theme.space[3]};
  border-radius: ${({ theme }) => theme.radius.md};
  gap: ${({ theme }) => theme.space[2]};
  border: 0.5px solid ${({ theme }) => theme.colors.border};

  .pin-icon {
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const AddressText = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CopyBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const Section = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.space[5]};
  margin-bottom: ${({ theme }) => theme.space[3]};
  box-shadow: ${({ theme }) => theme.shadow.card};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
`;

const SectionTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[4]};
`;

const DateTimeRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  
  .cal-icon {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const DateInput = styled.input`
  flex: 1.2;
  height: 40px;
  background: ${({ theme }) => theme.colors.bg};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 0 ${({ theme }) => theme.space[2]};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
`;

const TimeInput = styled.input`
  flex: 0.8;
  height: 40px;
  background: ${({ theme }) => theme.colors.bg};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 0 ${({ theme }) => theme.space[2]};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
`;

const FacilityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.space[3]};
`;

const FacilityItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: ${({ theme }) => theme.space[1]};
`;

const FacilityIconWrapper = styled.span`
  width: 42px;
  height: 42px;
  background: #f1f4f0;
  color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0.5px solid rgba(45, 82, 68, 0.15);

  svg {
    width: 20px;
    height: 20px;
  }
`;

const FacilityLabel = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
`;

const NoticeText = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.6;
  white-space: pre-line;
`;

const FixedFooter = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 72px;
  background: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  padding: 0 ${({ theme }) => theme.space[4]};
  gap: ${({ theme }) => theme.space[3]};
  z-index: 10;
`;

const FootCallBtn = styled.a`
  width: 48px;
  height: 48px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
  }
`;

const PrimaryFootBtn = styled.button`
  flex: 1;
  height: 48px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(45, 82, 68, 0.15);
`;



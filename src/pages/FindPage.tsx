import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/StoreContext';
import { NEARBY_PLACES, NEARBY_TAG_ICON_META, REGIONAL_MOCK_CAFES } from '../data/mockData';
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

  // 60개 이상의 전방 반경 3km 내 모든 카페 통합 데이터베이스 (검증된 실사 포토 경로 매핑)
  const EXTRA_LOCAL_CAFES = React.useMemo(() => [
    { id: 'starbucks-dunsan', name: '스타벅스 대전둔산점', address: '대전 서구 둔산남로 86', description: '넓고 쾌적한 프리미엄 리저브 매장, 공부하기 좋은 창가 석', photos: ['/assets/caffa_004.jpg', '/assets/menu_wood_americano.jpg'], tags: [{ icon: 'warm', label: '모던' }, { icon: 'warm', label: '스터디' }] },
    { id: 'twosome-cityhall', name: '투썸플레이스 대전시청점', address: '대전 서구 둔산중로 40', description: '시청 앞 파노라마 뷰와 맛있는 프리미엄 케이크 디저트 카페', photos: ['/assets/cafe_urban_nest.jpg', '/assets/cake_001.jpg'], tags: [{ icon: 'warm', label: '디저트' }, { icon: 'warm', label: '뷰맛집' }] },
    { id: 'hollys-galleria', name: '할리스 대전둔산 갤러리아점', address: '대전 서구 대덕대로 211', description: '24시간 아늑하게 이용 가능한 스터디존 내장 브랜드 카페', photos: ['/assets/cafe_calm_forest.jpg', '/assets/menu_einspanner.jpg'], tags: [{ icon: 'warm', label: '24시' }, { icon: 'warm', label: '아늑한' }] },
    { id: 'ediya-galma', name: '이디야커피 대전갈마점', address: '대전 서구 갈마로 42', description: '부담없이 들러 커피와 스틱케이크를 즐길 수 있는 코지 카페', photos: ['/assets/caffe_001.jpg', '/assets/menu_croffle.jpg'], tags: [{ icon: 'warm', label: '가성비' }, { icon: 'warm', label: '편안한' }] },
    { id: 'paulbassett-dunsan', name: '폴바셋 대전둔산타워점', address: '대전 서구 대덕대로 226', description: '고소한 룽고와 시그니처 상하목장 아이스크림 라떼 맛집', photos: ['/assets/caffa_002.jpg', '/assets/menu_flat_white.jpg'], tags: [{ icon: 'warm', label: '스페셜티' }, { icon: 'warm', label: '아이스크림' }] },
    { id: 'galma-bakery', name: '갈마동 아뜰리에 & 베이커리', address: '대전 서구 갈마역로 18', description: '매일 아침 직접 구워내는 따끈따끈한 수제 소금빵 & 크루아상', photos: ['/assets/cafe_brick_atelier.jpg', '/assets/menu_onion_saltbread.jpg'], tags: [{ icon: 'warm', label: '베이커리' }, { icon: 'warm', label: '갓구운' }] },
    { id: 'flatwhite-tanbang', name: '탄방동 플랫화이트 랩', address: '대전 서구 문정로 60', description: '호주식 다크 로스팅 원두와 진한 플랫화이트 시그니처 에스프레소 바', photos: ['/assets/caffa_001.jpg', '/assets/menu_flat_white.jpg'], tags: [{ icon: 'warm', label: '에스프레소' }, { icon: 'warm', label: '힙한' }] },
    { id: 'yuseong-spa-terrace', name: '유성 온천 테라스 가든', address: '대전 유성구 온천로 55', description: '온천 공원 앞 야외 야자수 테라스와 프라이빗 가든 뷰', photos: ['/assets/cafe_vivid_garden.jpg', '/assets/menu_grapefruit_ade.jpg'], tags: [{ icon: 'warm', label: '야외테라스' }, { icon: 'warm', label: '힐링' }] },
    { id: 'central-teahouse', name: '월평동 센트럴 티하우스', address: '대전 서구 청사로 120', description: '조용한 거문고 음악과 은은한 수제 잎차 한 잔의 명상 공간', photos: ['/assets/tea_001.jpg', '/assets/menu_tea_dessert.jpg'], tags: [{ icon: 'warm', label: '전통찻집' }, { icon: 'warm', label: '조용한' }] },
    { id: 'mannyeon-espresso', name: '만년동 에스프레소 클럽', address: '대전 서구 만년남로 30', description: '이탈리아 스탠딩 바 감성의 깊고 진한 쇼콜라또 에스프레소', photos: ['/assets/caffa_002.jpg', '/assets/menu_einspanner.jpg'], tags: [{ icon: 'warm', label: '이탈리아' }, { icon: 'warm', label: '감성' }] },
    { id: 'yongmun-vintage', name: '용문동 빈티지 오르간', address: '대전 서구 용문로 77', description: '클래식 LP 레코드 음악과 빈티지 우드 가구의 잔잔한 분위기', photos: ['/assets/daelim_changgo.jpg', '/assets/menu_croffle.jpg'], tags: [{ icon: 'warm', label: '레트로' }, { icon: 'warm', label: 'LP음악' }] },
    { id: 'goejeong-dessert', name: '괴정동 갓파티 디저트', address: '대전 서구 도솔로 110', description: '프랑스 버터로 만든 딸기 타르트와 달콤한 바닐라 슈크림', photos: ['/assets/cafe_calm_forest.jpg', '/assets/menu_tart.jpg'], tags: [{ icon: 'warm', label: '디저트맛집' }, { icon: 'warm', label: '달콤한' }] },
    { id: 'government-greengarden', name: '대전정부청사 그린가든', address: '대전 서구 청사서로 15', description: '정부청사 푸른 산책로를 감상할 수 있는 햇살 통창 카페', photos: ['/assets/grandpa_factory.jpg', '/assets/menu_forest_latte.jpg'], tags: [{ icon: 'warm', label: '햇살맛집' }, { icon: 'warm', label: '산책' }] },
    { id: 'seogu-gallery-cafe', name: '서구청 갤러리 앤 커피', address: '대전 서구 둔산서로 25', description: '매달 새로운 미디어 아트 전시회가 열리는 문화 예술 공간', photos: ['/assets/daelim_changgo.jpg', '/assets/menu_daelim_cream.jpg'], tags: [{ icon: 'warm', label: '전시회' }, { icon: 'warm', label: '갤러리' }] },
    { id: 'dunsan-rooftop', name: '대전 둔산 루프탑 테라스', address: '대전 서구 대덕대로 195', description: '도심 속 야경이 한눈에 보이는 최상층 루프탑 & 칵테일 바', photos: ['/assets/caffa_003.jpg', '/assets/menu_peaches_soda.jpg'], tags: [{ icon: 'warm', label: '루프탑' }, { icon: 'warm', label: '야경' }] },
    { id: 'doan-minimal', name: '도안동 미니멀 포토스튜디오', address: '대전 서구 도안북로 40', description: '인스타그램 인플루언서들이 사랑하는 올화이트 미니멀 포토존', photos: ['/assets/center_coffee.jpg', '/assets/menu_center_geisha.jpg'], tags: [{ icon: 'warm', label: '인스타감성' }, { icon: 'warm', label: '포토존' }] },
    { id: 'mannyeon-skyview', name: '선사유적지 스카이뷰 카페', address: '대전 서구 만년로 68', description: '선사유적지 공원 숲 뷰가 파노라마로 펼쳐지는 파노라마 뷰', photos: ['/assets/cafe_urban_nest.jpg', '/assets/menu_flat_white.jpg'], tags: [{ icon: 'warm', label: '파노라마뷰' }, { icon: 'warm', label: '창가' }] },
    { id: 'bluebottle-popup', name: '블루보틀 대전 팝업스토어', address: '대전 서구 둔산로 100', description: '드립 마스터가 정성껏 내려주는 깔끔한 싱글 오리진 로스팅 핸드드립', photos: ['/assets/caffa_004.jpg', '/assets/menu_wood_americano.jpg'], tags: [{ icon: 'warm', label: '핸드드립' }, { icon: 'warm', label: '팝업' }] },
    { id: 'tomntoms-dunsan', name: '탐앤탐스 대전둔산점', address: '대전 서구 둔산중로 50', description: '갓 구운 프레즐과 허니버터 브레드가 맛있는 베이커리 브런치', photos: ['/assets/onion_seongsu.jpg', '/assets/menu_onion_pandoro.jpg'], tags: [{ icon: 'warm', label: '프레즐' }, { icon: 'warm', label: '브런치' }] },
    { id: 'droptop-cityhall', name: '드롭탑 대전시청역점', address: '대전 서구 둔산남로 100', description: '시원한 에어컨과 넓은 좌석이 완비된 시청역 대표 카페', photos: ['/assets/cafe_forest_lounge.jpg', '/assets/menu_einspanner.jpg'], tags: [{ icon: 'warm', label: '쾌적한' }, { icon: 'warm', label: '넓은좌석' }] },
    { id: 'pascucci-galleria', name: '파스쿠찌 대전갤러리아점', address: '대전 서구 대덕대로 215', description: '진한 이탈리아 아메리카노와 달콤한 젤라또 그라니따 전문점', photos: ['/assets/caffa_001.jpg', '/assets/menu_pavlova.jpg'], tags: [{ icon: 'warm', label: '젤라또' }, { icon: 'warm', label: '이탈리안' }] },
    { id: 'angelinus-dunsan', name: '엔제리너스 대전둔산역점', address: '대전 서구 둔산로 32', description: '은은한 천사 조명과 고급스러운 아메리치노 스페셜', photos: ['/assets/caffa_002.jpg', '/assets/menu_einspanner.jpg'], tags: [{ icon: 'warm', label: '아메리치노' }, { icon: 'warm', label: '은은한' }] },
    { id: 'paik-dunsan', name: '빽다방 대전둔산남로점', address: '대전 서구 둔산남로 75', description: '빅사이즈 아이스 아메리카노와 달콤한 아샵라 대표 가성비', photos: ['/assets/caffe_001.jpg', '/assets/menu_wood_americano.jpg'], tags: [{ icon: 'warm', label: '빅사이즈' }, { icon: 'warm', label: '가성비' }] },
    { id: 'mega-galma', name: '메가MGC커피 대전갈마점', address: '대전 서구 갈마역로 25', description: '상큼한 손흥민 스페셜 에이드와 퐁크러시 디저트 음료', photos: ['/assets/caffe_001.jpg', '/assets/menu_grapefruit_ade.jpg'], tags: [{ icon: 'warm', label: '퐁크러시' }, { icon: 'warm', label: '음료맛집' }] },
    { id: 'compose-tanbang', name: '컴포즈커피 대전탄방점', address: '대전 서구 문정로 72', description: '신선한 100% 아라비카 고소한 로스팅 아메리카노 픽업존', photos: ['/assets/caffe_001.jpg', '/assets/menu_wood_americano.jpg'], tags: [{ icon: 'warm', label: '아라비카' }, { icon: 'warm', label: '빠른픽업' }] },
    { id: 'theventi-yongmun', name: '더벤티 대전용문역점', address: '대전 서구 용문로 50', description: '보라색 힙한 감성과 아인슈페너 디저트 커피 전문점', photos: ['/assets/peaches_dowone.jpg', '/assets/menu_einspanner.jpg'], tags: [{ icon: 'warm', label: '아인슈페너' }, { icon: 'warm', label: '힙한' }] },
    { id: 'mammoth-dunsan', name: '매머드익스프레스 대전둔산점', address: '대전 서구 대덕대로 180', description: '초저가 고품질 스페셜티 3샷 아메리카노 테이크아웃 전문', photos: ['/assets/caffa_004.jpg', '/assets/menu_wood_americano.jpg'], tags: [{ icon: 'warm', label: '테이크아웃' }, { icon: 'warm', label: '스페셜티' }] },
    { id: 'banapresso-dunsan', name: '바나프레소 대전둔산타워점', address: '대전 서구 대덕대로 230', description: '오늘의 운세 커스텀 라벨이 나오는 유니크 분홍색 카페', photos: ['/assets/peaches_dowone.jpg', '/assets/menu_knotted_donut.jpg'], tags: [{ icon: 'warm', label: '운세라벨' }, { icon: 'warm', label: '핑크감성' }] },
    { id: 'coffeebean-timeworld', name: '커피빈 대전타임월드점', address: '대전 서구 대덕대로 211', description: '진정한 헤이즐넛 아메리카노와 자작나무 숲 감성 카페', photos: ['/assets/cafe_calm_forest.jpg', '/assets/menu_brick_coffee.jpg'], tags: [{ icon: 'warm', label: '헤이즐넛' }, { icon: 'warm', label: '자작나무' }] },
    { id: 'hollys-dunsancentral', name: '할리스 둔산중앙점', address: '대전 서구 둔산중로 60', description: '넓은 테이블과 쾌적한 1인 공부 석이 준비된 프라이빗 카페', photos: ['/assets/cafe_forest_lounge.jpg', '/assets/menu_wood_americano.jpg'], tags: [{ icon: 'warm', label: '1인석' }, { icon: 'warm', label: '스터디' }] },
    { id: 'outstanding-roasters', name: '아웃스탠딩 로스터스 둔산', address: '대전 서구 둔산남로 110', description: '세계 챔피언 바리스타가 직접 볶은 스페셜티 원두 테이스팅 룸', photos: ['/assets/caffa_001.jpg', '/assets/menu_center_geisha.jpg'], tags: [{ icon: 'warm', label: '바리스타' }, { icon: 'warm', label: '스페셜티' }] },
    { id: 'coffieni-walpyeong', name: '커피니 대전월평점', address: '대전 서구 월평로 35', description: '수제 케이크와 아늑한 인테리어가 어우러진 동네 소담 카페', photos: ['/assets/cafe_calm_forest.jpg', '/assets/cake_001.jpg'], tags: [{ icon: 'warm', label: '동네카페' }, { icon: 'warm', label: '아늑한' }] },
    { id: 'cafe-dreaming', name: '카페 드리밍 둔산', address: '대전 서구 둔산서로 30', description: '구름 모양 솜사탕 라떼와 로맨틱한 핑크 조명 포토존', photos: ['/assets/peaches_dowone.jpg', '/assets/menu_pavlova.jpg'], tags: [{ icon: 'warm', label: '솜사탕라떼' }, { icon: 'warm', label: '포토존' }] },
    { id: 'attic-in-forest', name: '숲속의 다락방 갈마', address: '대전 서구 갈마로 65', description: '다락방 침상 석에서 편안하게 책을 읽을 수 있는 북카페', photos: ['/assets/grandpa_factory.jpg', '/assets/menu_center_scone.jpg'], tags: [{ icon: 'warm', label: '북카페' }, { icon: 'warm', label: '다락방' }] },
    { id: 'dunsan-antique-espresso', name: '둔산 앤틱 에스프레소 룸', address: '대전 서구 둔산중로 80', description: '앤틱 스탠드 조명 아래 느끼는 진한 쇼콜라또 커피 타임', photos: ['/assets/caffa_002.jpg', '/assets/menu_einspanner.jpg'], tags: [{ icon: 'warm', label: '앤틱' }, { icon: 'warm', label: '조명맛집' }] },
    { id: 'yuseong-arboretum', name: '유성 수목원 가든 카페', address: '대전 유성구 수목원로 12', description: '수목원 식물원 통창 뷰와 생화 플라워 향기가 가득한 곳', photos: ['/assets/cafe_vivid_garden.jpg', '/assets/menu_matcha_tea.jpg'], tags: [{ icon: 'warm', label: '식물원' }, { icon: 'warm', label: '플라워' }] },
    { id: 'galmari-craft-coffee', name: '갈마리 크래프트 로스터스', address: '대전 서구 갈마역로 30', description: '직접 핸드드립 원두를 그라인딩하여 내려주는 정성 어린 커피', photos: ['/assets/caffa_001.jpg', '/assets/menu_center_geisha.jpg'], tags: [{ icon: 'warm', label: '핸드드립' }, { icon: 'warm', label: '로스터리' }] },
    { id: 'bongmyeong-stream-terrace', name: '봉명동 하천 테라스 카페', address: '대전 유성구 봉명로 88', description: '하천 산책로 맑은 물소리를 들으며 즐기는 스페셜 에이드', photos: ['/assets/caffa_003.jpg', '/assets/menu_grapefruit_ade.jpg'], tags: [{ icon: 'warm', label: '하천뷰' }, { icon: 'warm', label: '테라스' }] },
    { id: 'dunsan-study-24h', name: '둔산 24시 몰입 스터디카페', address: '대전 서구 둔산로 120', description: '독서실형 1인 룸과 무소음 키보드 존이 완비된 몰입형 스터디 공간', photos: ['/assets/cafe_urban_nest.jpg', '/assets/menu_wood_americano.jpg'], tags: [{ icon: 'warm', label: '24시' }, { icon: 'warm', label: '몰입스터디' }] },
    { id: 'mannyeon-panorama-garden', name: '만년동 파노라마 가든', address: '대전 서구 만년남로 45', description: '한밭수목원이 한눈에 바라보이는 파노라마 유리 통창 인테리어', photos: ['/assets/center_coffee.jpg', '/assets/menu_center_geisha.jpg'], tags: [{ icon: 'warm', label: '수목원뷰' }, { icon: 'warm', label: '통창' }] },
    { id: 'yongmun-vintage-room', name: '용문동 빈티지 룸', address: '대전 서구 용문로 90', description: '빈티지 가구와 오르골 소리가 울려 펴지는 힐링 아지트', photos: ['/assets/daelim_changgo.jpg', '/assets/menu_croffle.jpg'], tags: [{ icon: 'warm', label: '빈티지' }, { icon: 'warm', label: '아지트' }] },
    { id: 'goejeong-tart-bakery', name: '괴정동 타르트 베이커리 룸', address: '대전 서구 도솔로 125', description: '에그타르트, 청포도 타르트, 무화과 타르트 전문 수제 베이커리', photos: ['/assets/cafe_brick_atelier.jpg', '/assets/menu_tart.jpg'], tags: [{ icon: 'warm', label: '타르트' }, { icon: 'warm', label: '베이커리' }] },
    { id: 'government-outdoor-cafe', name: '대전정부청사 야외 파라솔', address: '대전 서구 청사서로 20', description: '야외 파라솔 아래 푸른 들판을 바라보며 마시는 시원한 아메리카노', photos: ['/assets/grandpa_factory.jpg', '/assets/menu_grapefruit_ade.jpg'], tags: [{ icon: 'warm', label: '파라솔' }, { icon: 'warm', label: '야외석' }] },
    { id: 'tanbang-tea-room', name: '탄방동 아늑한 차 다방', address: '대전 서구 문정로 85', description: '보이차, 쌍화차, 오미자 에이드를 정성스럽게 끓여내는 은은한 다방', photos: ['/assets/tea_001.jpg', '/assets/menu_tea_dessert.jpg'], tags: [{ icon: 'warm', label: '쌍화차' }, { icon: 'warm', label: '전통' }] },
    { id: 'walpyeong-espresso-room', name: '월평동 에스프레소 룸', address: '대전 서구 청사로 135', description: '진한 초콜릿 파우더가 올려진 에스프레소 콘파냐 명가', photos: ['/assets/caffa_002.jpg', '/assets/menu_einspanner.jpg'], tags: [{ icon: 'warm', label: '콘파냐' }, { icon: 'warm', label: '에스프레소' }] },
    { id: 'galleria-dessert-lab', name: '둔산 갤러리아 디저트 랩', address: '대전 서구 대덕대로 220', description: '파티시에가 직접 시연하는 프리미엄 케이크 & 타르트 쿠킹 룸', photos: ['/assets/cafe_brick_atelier.jpg', '/assets/menu_earlgrey_cake.jpg'], tags: [{ icon: 'warm', label: '디저트쿠킹' }, { icon: 'warm', label: '파티시에' }] },
    { id: 'yuseong-footspa-terrace', name: '유성 족욕 공원 테라스', address: '대전 유성구 온천로 70', description: '온천 족욕 체험 후 들러 마시는 시원한 천연 에이드 전문점', photos: ['/assets/cafe_vivid_garden.jpg', '/assets/menu_grapefruit_ade.jpg'], tags: [{ icon: 'warm', label: '족욕공원' }, { icon: 'warm', label: '에이드' }] },
    { id: 'galma-retro-lp', name: '갈마동 레트로 LP 뮤직카페', address: '대전 서구 갈마로 80', description: '7080 팝송부터 최신 LP 판까지 신청곡을 틀어주는 레트로 카페', photos: ['/assets/daelim_changgo.jpg', '/assets/menu_croffle.jpg'], tags: [{ icon: 'warm', label: '신청곡' }, { icon: 'warm', label: 'LP뮤직' }] },
    { id: 'goejeong-croissant-room', name: '괴정동 수제 크루아상 룸', address: '대전 서구 도솔로 140', description: '앙버터 크루아상과 초코 크로플이 유명한 디저트 핫플', photos: ['/assets/cafe_brick_atelier.jpg', '/assets/menu_onion_saltbread.jpg'], tags: [{ icon: 'warm', label: '크로플' }, { icon: 'warm', label: '앙버터' }] },
    { id: 'seogu-plant-garden', name: '서구청 플랜테리어 정원', address: '대전 서구 둔산서로 40', description: '희귀 관엽식물과 대형 몬스테라가 가득한 도심 속 식물원 카페', photos: ['/assets/cafe_vivid_garden.jpg', '/assets/menu_forest_latte.jpg'], tags: [{ icon: 'warm', label: '관엽식물' }, { icon: 'warm', label: '플랜테리어' }] },
    { id: 'doan-sunshine-brunch', name: '도안동 햇살 브런치 룸', address: '대전 서구 도안북로 60', description: '아보카도 오픈 샌드위치와 따뜻한 단호박 스프 브런치 전문점', photos: ['/assets/center_coffee.jpg', '/assets/menu_grandpa_pasta.jpg'], tags: [{ icon: 'warm', label: '샌드위치' }, { icon: 'warm', label: '브런치' }] },
    { id: 'cityhall-view-terrace', name: '대전시청 뷰 테라스 라운지', address: '대전 서구 둔산중로 90', description: '시청 광장 초록 잔디를 내려다보며 disfrutando 마시는 아이스 라떼', photos: ['/assets/caffa_003.jpg', '/assets/menu_flat_white.jpg'], tags: [{ icon: 'warm', label: '시청뷰' }, { icon: 'warm', label: '라운지' }] },
    { id: 'mannyeon-hanbat-garden', name: '만년동 한밭수목원 정원', address: '대전 서구 만년로 80', description: '한밭수목원 열대식물원 옆 아늑한 파라솔 야외 커피 룸', photos: ['/assets/grandpa_factory.jpg', '/assets/menu_matcha_latte.jpg'], tags: [{ icon: 'warm', label: '한밭수목원' }, { icon: 'warm', label: '야외파라솔' }] },
    { id: 'yongmun-sandwich-room', name: '용문동 감성 샌드위치 룸', address: '대전 서구 용문로 105', description: '수제 햄치즈 클럽 샌드위치와 바질 페스토 파니니 브런치', photos: ['/assets/cafe_urban_nest.jpg', '/assets/menu_grandpa_pasta.jpg'], tags: [{ icon: 'warm', label: '파니니' }, { icon: 'warm', label: '샌드위치' }] },
    { id: 'tanbang-specialty-bar', name: '탄방동 스페셜티 픽업 바', address: '대전 서구 문정로 95', description: '원두 5종 선택 가능한 초스피드 스페셜티 픽업 바', photos: ['/assets/caffa_001.jpg', '/assets/menu_center_geisha.jpg'], tags: [{ icon: 'warm', label: '원두선택' }, { icon: 'warm', label: '스페셜티' }] },
    { id: 'dunsan-drip-club', name: '둔산중앙 핸드드립 클럽', address: '대전 서구 둔산로 140', description: '에티오피아 예가체프와 파나마 게이샤 핸드드립 시음 회', photos: ['/assets/caffa_001.jpg', '/assets/menu_center_geisha.jpg'], tags: [{ icon: 'warm', label: '게이샤' }, { icon: 'warm', label: '핸드드립' }] },
    { id: 'yuseong-rooftop-pub', name: '유성 봉명동 루프탑 펍 앤 카페', address: '대전 유성구 봉명로 110', description: '낮에는 브런치 카페, 밤에는 감성 루프탑 펍으로 변신하는 핫플', photos: ['/assets/caffa_003.jpg', '/assets/menu_peaches_soda.jpg'], tags: [{ icon: 'warm', label: '루프탑' }, { icon: 'warm', label: '핫플레이스' }] }
  ], []);

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
      </MapCanvas>

      {/* 3) Bottom sheet with Drag Gestures */}
      <PlaceDetailSheet 
        className="find-sheet" 
        $isOpen={isSheetOpen}
        style={{
          transform: isSheetOpen 
            ? `translateY(${dragOffset}px)` 
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
  position: static;
  transform: none;
  z-index: 10;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  padding: 4px 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(45, 82, 68, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RadiusFilterChips = styled.div`
  display: flex;
  gap: 6px;
`;

const RadiusChipBtn = styled.button<{ $active?: boolean }>`
  background: ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#4a5568')};
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};
  border-radius: 50px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $active, theme }) => ($active ? theme.colors.primary : 'rgba(45, 82, 68, 0.08)')};
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
  width: 100%;
  gap: 12px;
  margin-bottom: ${({ theme }) => theme.space[5]};
  box-sizing: border-box;
`;

const PhotoThumb = styled.div`
  flex: 1;
  min-width: 0;
  height: 115px;
  border-radius: ${({ theme }) => theme.radius.md};
  background-size: cover;
  background-position: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(45, 82, 68, 0.2);
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

  &::placeholder {
    color: #999999;
    font-size: 14px;
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




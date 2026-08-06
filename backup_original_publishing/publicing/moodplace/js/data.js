/**
 * data.js
 * ------------------------------------------------------------------
 * Mock data + a tiny centralized store (pub/sub pattern).
 *
 * React 전환을 고려한 설계 노트:
 *  - MOCK_CAFES / MOOD_TAGS / THEME_FILTERS 는 그대로 초기 상태(props/초기 state)로 사용 가능.
 *  - store 는 useReducer + useContext 로 그대로 옮길 수 있도록
 *    { state, dispatch(action), subscribe(listener) } 형태로 구성.
 *  - action 은 { type, payload } 형태의 순수 객체 (Redux/useReducer 호환).
 * ------------------------------------------------------------------
 */

// ------------------------------
// 1. Static Mock Data
// ------------------------------

/** 오늘의 무드 선택 칩 (메인 화면 상단 4개 + 모달 확장 7개) */
const MOOD_TAGS = [
  { id: 'cozy', label: 'Cozy', icon: '☕' },
  { id: 'calm', label: 'Calm', icon: '🌿' },
  { id: 'energetic', label: 'Energetic', icon: '⚡' },
  { id: 'dreamy', label: 'Dreamy', icon: '✨' },
  { id: 'minimal', label: 'Minimal', icon: '◻' },
  { id: 'vintage', label: 'Vintage', icon: '📻' },
  { id: 'warm', label: 'Warm', icon: '☀' },
];

/** 메인 화면에 노출되는 4개 기본 무드 (모달의 전체 7개 중 서브셋) */
const MAIN_MOOD_TAGS = MOOD_TAGS.slice(0, 4);

/** 테마별 탐색 그리드 (2x2) */
const THEME_FILTERS = [
  { id: 'reading', label: '독서하기 좋은', icon: 'coffee' },
  { id: 'music', label: '음악이 맛있는', icon: 'headphones' },
  { id: 'sunlight', label: '채광이 가득한', icon: 'sun' },
  { id: 'night', label: '밤의 무드', icon: 'moon' },
];

/** 예약 화면(STEP 5) — 시설 및 편의 아이콘/라벨 메타데이터 (id 로 각 카페의 facilities 배열과 매핑) */
const FACILITY_META = {
  wifi: { label: '무선 인터넷', icon: 'wifi' },
  parking: { label: '대형 주차장', icon: 'parking' },
  kids: { label: '키즈존', icon: 'kids' },
  pet: { label: '반려동물 동반', icon: 'pet' },
  group: { label: '단체석 완비', icon: 'group' },
  accessible: { label: '장애인 편의', icon: 'accessible' },
};

/** 지도/길찾기 화면(STEP 6) — 이동수단 토글 메타데이터 */
const TRAVEL_MODES = [
  { id: 'walk', label: '도보', icon: 'walk' },
  { id: 'transit', label: '대중교통', icon: 'transit' },
  { id: 'taxi', label: '택시', icon: 'taxi' },
];

/** 지도/길찾기 화면(STEP 6) — 출발지는 데모 범위에서 고정된 현재 위치를 사용 */
const MAP_ORIGIN_LABEL = '현 위치 (서울시 종로구)';

/** 근처 카페 찾기 화면(STEP 7) — 무드 태그 칩 아이콘 메타데이터 */
const NEARBY_TAG_ICON_META = {
  warm: '☀',
  leaf: '🌿',
  quiet: '🤫',
  sun: '🔆',
  camera: '📷',
  tea: '🍵',
  group: '👥',
};

/** 근처 카페 찾기 화면(STEP 7) — 지도 위에 표시되는 주변 무드 플레이스 mock 데이터
 *  (메인/리뷰/예약 흐름의 MOCK_CAFES 와는 별개의 탐색 전용 데이터셋)
 *  position 은 find.js 의 정적 지도 캔버스(0~100%) 위 마커 좌표.
 */
const NEARBY_PLACES = [
  {
    id: 'calm-forest',
    name: '온화한 숲',
    address: '서울 성동구 성수동2가 321-1',
    tags: [
      { icon: 'warm', label: '포근한' },
      { icon: 'leaf', label: '자연친화적' },
      { icon: 'quiet', label: '조용한' },
    ],
    description:
      '따뜻한 나무 소재와 풍성한 식물들이 조화를 이루는 공간입니다. 깊은 숲속에 들어온 듯한 안정감을 주며, 나만의 시간을 갖기에 최적화된 차분한 무드를 제공합니다.',
    photos: ['assets/caffa_001.jpg', 'assets/caffa_002.jpg'],
    position: { top: '55%', left: '40%' },
    isDefault: true,
  },
  {
    id: 'vivid-garden',
    name: '비비드 가든',
    address: '서울 성동구 성수동1가 668',
    tags: [
      { icon: 'sun', label: '화사한' },
      { icon: 'leaf', label: '플랜테리어' },
      { icon: 'camera', label: '포토스팟' },
    ],
    description:
      '컬러풀한 화초와 큰 창으로 쏟아지는 햇살이 어우러진 비비드한 무드의 온실 카페입니다. 사진 찍기 좋은 포인트가 곳곳에 있어요.',
    photos: ['assets/caffa_002.jpg', 'assets/caffa_003.jpg'],
    position: { top: '22%', left: '62%' },
  },
  {
    id: 'quiet-tea-room',
    name: '고요다반',
    address: '서울 성동구 연무장길 45',
    tags: [
      { icon: 'quiet', label: '조용한' },
      { icon: 'tea', label: '티하우스' },
      { icon: 'warm', label: '아늑한' },
    ],
    description: '전통차와 다과를 즐기며 조용히 사색할 수 있는 한옥 스타일의 티하우스입니다.',
    photos: ['assets/caffa_003.jpg', 'assets/caffa_001.jpg'],
    position: { top: '70%', left: '68%' },
  },
  {
    id: 'brick-atelier',
    name: '브릭 아틀리에',
    address: '서울 성동구 뚝섬로 12길 8',
    tags: [
      { icon: 'sun', label: '채광좋은' },
      { icon: 'group', label: '단체석' },
      { icon: 'camera', label: '포토스팟' },
    ],
    description: '붉은 벽돌과 큰 창이 어우러진 갤러리형 카페로, 그룹 모임이나 사진 촬영에도 좋아요.',
    photos: ['assets/caffa_001.jpg', 'assets/caffa_003.jpg'],
    position: { top: '38%', left: '20%' },
  },
];

/** 마이페이지 화면(STEP 9) — 프로필/통계 mock 데이터
 *  stats.saved 은 데모 목적의 정적 수치이며, 실제 서비스에서는 전역 bookmarkedIds.length 와 연동될 지점.
 */
const MY_PROFILE = {
  name: '승우',
  avatarUrl: null, // null 이면 빈 아바타 원형 표시
  stats: {
    saved: 124,
    reviews: 38,
    visits: 12,
  },
};

/** 마이페이지 화면(STEP 9) — ACCOUNT & PREFERENCES 메뉴 리스트 (데모 범위에서는 클릭 자리만 구현) */
const ACCOUNT_MENU_ITEMS = [
  { id: 'edit-profile', label: '프로필수정', icon: 'editProfile' },
  { id: 'notifications', label: '알림설정', icon: 'bell' },
  { id: 'privacy', label: '개인정보 및 보안', icon: 'shield' },
  { id: 'support', label: '문의 및 공지사항', icon: 'help' },
];

/** 저장한 장소 화면(STEP 8) — 카테고리 필터 칩 */
const SAVED_CATEGORY_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'cafe', label: '카페' },
  { id: 'food', label: '맛집' },
  { id: 'date', label: '데이트' },
];

/** 저장한 장소 화면(STEP 8) — mock 데이터
 *  전역 store 의 bookmarkedIds 에 id 가 포함되어 있을 때만 "저장한 장소" 목록에 노출된다.
 */
const SAVED_PLACES = [
  {
    id: 'urban-leaf-cafe',
    name: '어반리프 카페',
    address: '대전 서구 둔산로 11',
    category: 'cafe',
    tags: ['Quiet', 'Study'],
    image: 'assets/caffa_001.jpg',
  },
  {
    id: 'teddys-brunch',
    name: "Teddy's Brunch",
    address: '대전 유성구 대학로 55',
    category: 'food',
    tags: ['Mood', 'Brunch'],
    image: 'assets/caffa_002.jpg',
  },
  {
    id: 'cozy-place',
    name: '코지플레이스',
    address: '대전 중구 중앙로 23',
    category: 'date',
    tags: ['Date', 'Comfort'],
    image: 'assets/caffa_003.jpg',
  },
  {
    id: 'morning-bliss',
    name: '모닝 블리스',
    address: '대전 서구 둔산중로 45',
    category: 'cafe',
    tags: ['Bakery', 'Aesthetic'],
    image: 'assets/caffa_001.jpg',
  },
];

/** 카페(무드 플레이스) mock 데이터 */
const MOCK_CAFES = [
  {
    id: 'forest-lounge',
    name: '포레스트 인 더 시티',
    location: '서울 성수동',
    description: '도심 속 숲의 평온함',
    match: 98,
    tags: ['Cozy', 'Jazz'],
    mood: ['cozy', 'calm'],
    bookmarked: false,
    hero: true,
    photo: { type: 'image', image: 'assets/caffa_003.jpg', from: '#6b8f71', to: '#2d5244', emoji: '🌿' },
    // ---- 리뷰/장소 상세 화면(STEP 4) 전용 데이터 ----
    detail: {
      detailTags: ['고요한 숲', '성수동'],
      description:
        '도심 속에서 찾은 작은 숲속의 휴식처. 정교하게 큐레이션된 식물들과 따뜻한 우드 톤의 인테리어가 어우러져 최상의 고요함을 선사합니다.',
      rating: 4.9,
      hoursLabel: '10:00 - 21:00',
      reviewCount: 128,
      menu: [
        {
          id: 'forest-lounge-m1',
          name: '시그니처 숲 라떼',
          price: '7,500원',
          desc: '직접 로스팅한 원두의 고소함과 수제 쑥 크림의 달콤함이 조화를 이루는 시그니처 메뉴',
          image: 'assets/caffa_001.jpg',
        },
        {
          id: 'forest-lounge-m2',
          name: '얼그레이 쉬폰 케이크',
          price: '8,000원',
          desc: '향긋한 얼그레이 향이 가득한 폭신한 시트와 가벼운 생크림의 조화',
          image: 'assets/caffa_002.jpg',
        },
        {
          id: 'forest-lounge-m3',
          name: '청사과 민트 티',
          price: '6,500원',
          desc: '직접 담근 청사과청과 생민트를 우려내 청량함이 돋보이는 허브티',
          image: 'assets/caffa_003.jpg',
        },
      ],
      reviews: [
        {
          id: 'forest-lounge-r1',
          author: '김지수',
          initial: 'K',
          rating: 5,
          date: '2일 전',
          text: '인테리어가 정말 예뻐요. 조용하게 작업하기 좋고 커피도 맛있습니다. 특히 시그니처 라떼 강력추천해요!',
          tags: ['#작업하기좋은', '#커피맛집'],
        },
        {
          id: 'forest-lounge-r2',
          author: 'Minho Park',
          initial: 'M',
          rating: 4,
          date: '1주일 전',
          text: '주말엔 사람이 좀 많지만 평일 낮에 오면 최고의 힐링 공간입니다. 음악 선곡도 브랜드 무드랑 너무 잘 어울려요.',
          tags: ['#감성적인', '#LP음악'],
        },
      ],
      // ---- 예약 화면(STEP 5) 전용 데이터 ----
      reservation: {
        rating: 4.8,
        reviewCountLabel: '리뷰 1,240+',
        addressShort: '경기 용인시 기흥구',
        addressFull: '경기 용인시 기흥구 공세로 19',
        vibeGuide:
          '울창한 숲속 온실에서 즐기는 듯한 평온한 분위기와 건축미가 돋보이는 럭셔리 힐링 공간입니다.',
        dayLabel: '매일',
        openHours: '10:00 - 21:00',
        closeTime: '21:00',
        lastOrder: '20:30',
        facilities: ['wifi', 'parking', 'kids', 'pet', 'group', 'accessible'],
        previewPhotos: ['assets/caffa_001.jpg', 'assets/caffa_002.jpg', 'assets/caffa_003.jpg'],
        phone: '02-1234-5678',
      },
      // ---- 지도/길찾기 화면(STEP 6) 전용 데이터 ----
      route: {
        destinationLabel: '도심 속의 숲 (서울숲)',
        routesByMode: {
          walk: [
            {
              id: 'forest-lounge-walk-1',
              badge: '최단시간',
              durationMin: 12,
              distanceLabel: '840m',
              metaLabel: '소모 칼로리 45kcal',
              progress: 65,
              description: '숲길 우선 경로: 성수동 카페거리를 경유합니다.',
            },
            { id: 'forest-lounge-walk-2', durationMin: 15, metaLabel: '1.2km · 큰길 우선' },
            { id: 'forest-lounge-walk-3', durationMin: 18, metaLabel: '1.5km · 조용한 골목길' },
          ],
          transit: [
            {
              id: 'forest-lounge-transit-1',
              badge: '최적환승',
              durationMin: 9,
              metaLabel: '버스 1회 환승',
              progress: 70,
              description: '뚝섬역에서 버스 2213번으로 환승합니다.',
            },
            { id: 'forest-lounge-transit-2', durationMin: 14, metaLabel: '도보 포함 · 환승 없음' },
          ],
          taxi: [
            {
              id: 'forest-lounge-taxi-1',
              badge: '가장 빠름',
              durationMin: 6,
              metaLabel: '예상 요금 6,500원',
              progress: 80,
              description: '강변북로를 경유하는 최단 경로입니다.',
            },
            { id: 'forest-lounge-taxi-2', durationMin: 8, metaLabel: '예상 요금 5,800원 · 일반도로' },
          ],
        },
      },
    },
  },
  {
    id: 'seogyo-quiet',
    name: '서교동의 고요함',
    location: '서울 서교동',
    description: '몰입하기 좋은 1인 작업실 컨셉',
    match: 92,
    tags: ['Minimal', 'Focus'],
    mood: ['minimal', 'calm'],
    bookmarked: false,
    hero: false,
    photo: { type: 'image', image: 'assets/caffa_002.jpg', from: '#3a3a3a', to: '#1a1a1a', emoji: '📚' },
    detail: {
      detailTags: ['미니멀', '서교동'],
      description:
        '불필요한 소음과 장식을 덜어낸 1인 작업실 컨셉의 공간. 은은한 간접조명과 넉넉한 좌석 간격이 몰입을 돕습니다.',
      rating: 4.7,
      hoursLabel: '09:00 - 22:00',
      reviewCount: 64,
      menu: [
        {
          id: 'seogyo-quiet-m1',
          name: '드립 커피',
          price: '6,000원',
          desc: '매일 아침 직접 내리는 핸드드립 원두 커피',
          image: 'assets/caffa_002.jpg',
        },
        {
          id: 'seogyo-quiet-m2',
          name: '레몬 바질 에이드',
          price: '6,500원',
          desc: '상큼한 레몬과 바질 향이 어우러진 논카페인 음료',
          image: 'assets/caffa_003.jpg',
        },
      ],
      reviews: [
        {
          id: 'seogyo-quiet-r1',
          author: '이서연',
          initial: 'L',
          rating: 5,
          date: '3일 전',
          text: '조용히 집중하기 정말 좋아요. 콘센트도 넉넉하고 와이파이도 빨라요.',
          tags: ['#작업하기좋은', '#콘센트많음'],
        },
      ],
      reservation: {
        rating: 4.7,
        reviewCountLabel: '리뷰 640+',
        addressShort: '서울 마포구 서교동',
        addressFull: '서울 마포구 서교동 371-14',
        vibeGuide: '군더더기 없는 미니멀한 온실에서 오롯이 몰입할 수 있는 조용한 작업 공간입니다.',
        dayLabel: '매일',
        openHours: '09:00 - 22:00',
        closeTime: '22:00',
        lastOrder: '21:30',
        facilities: ['wifi', 'group'],
        previewPhotos: ['assets/caffa_002.jpg', 'assets/caffa_003.jpg'],
        phone: '02-2345-6789',
      },
      route: {
        destinationLabel: '서교동의 고요함 (합정 인근)',
        routesByMode: {
          walk: [
            {
              id: 'seogyo-quiet-walk-1',
              badge: '최단시간',
              durationMin: 10,
              distanceLabel: '650m',
              metaLabel: '소모 칼로리 32kcal',
              progress: 55,
              description: '조용한 골목길을 지나는 경로입니다.',
            },
            { id: 'seogyo-quiet-walk-2', durationMin: 13, metaLabel: '900m · 큰길 우선' },
          ],
          transit: [
            {
              id: 'seogyo-quiet-transit-1',
              badge: '환승 없음',
              durationMin: 8,
              metaLabel: '버스 1정거장',
              progress: 60,
              description: '합정역에서 도보 5분 거리입니다.',
            },
          ],
          taxi: [
            {
              id: 'seogyo-quiet-taxi-1',
              badge: '가장 빠름',
              durationMin: 5,
              metaLabel: '예상 요금 4,500원',
              progress: 75,
              description: '양화로를 경유하는 최단 경로입니다.',
            },
          ],
        },
      },
    },
  },
  {
    id: 'atrium-hannam',
    name: '아트리움 한남',
    location: '서울 한남동',
    description: '밝고 활기찬 영감을 주는 공간',
    match: 89,
    tags: ['Energetic', 'Bright'],
    mood: ['energetic', 'warm'],
    bookmarked: false,
    hero: false,
    photo: { type: 'image', image: 'assets/caffa_001.jpg', from: '#e8a33d', to: '#c97b2e', emoji: '☀' },
    detail: {
      detailTags: ['채광 맛집', '한남동'],
      description:
        '큰 창으로 쏟아지는 햇살과 높은 층고가 만드는 개방감 있는 공간. 밝은 에너지를 주는 브런치 카페입니다.',
      rating: 4.6,
      hoursLabel: '08:30 - 20:00',
      reviewCount: 201,
      menu: [
        {
          id: 'atrium-hannam-m1',
          name: '아보카도 토스트',
          price: '12,000원',
          desc: '통밀 사워도우 위에 신선한 아보카도와 수란을 올린 브런치 메뉴',
          image: 'assets/caffa_001.jpg',
        },
        {
          id: 'atrium-hannam-m2',
          name: '오렌지 스무디',
          price: '7,000원',
          desc: '제철 오렌지를 그대로 갈아낸 상큼한 스무디',
          image: 'assets/caffa_003.jpg',
        },
      ],
      reviews: [
        {
          id: 'atrium-hannam-r1',
          author: '박준혁',
          initial: 'P',
          rating: 4,
          date: '5일 전',
          text: '햇살이 정말 좋아요. 브런치 먹으면서 사진 찍기 딱 좋은 공간입니다.',
          tags: ['#브런치', '#포토스팟'],
        },
      ],
      reservation: {
        rating: 4.6,
        reviewCountLabel: '리뷰 980+',
        addressShort: '서울 용산구 한남동',
        addressFull: '서울 용산구 한남대로 27길 12',
        vibeGuide: '높은 층고와 큰 창으로 쏟아지는 햇살이 만드는 개방감 있는 브런치 공간입니다.',
        dayLabel: '매일',
        openHours: '08:30 - 20:00',
        closeTime: '20:00',
        lastOrder: '19:30',
        facilities: ['wifi', 'parking', 'kids', 'group'],
        previewPhotos: ['assets/caffa_001.jpg', 'assets/caffa_003.jpg'],
        phone: '02-3456-7890',
      },
      route: {
        destinationLabel: '아트리움 한남 (한남동)',
        routesByMode: {
          walk: [
            {
              id: 'atrium-hannam-walk-1',
              badge: '최단시간',
              durationMin: 14,
              distanceLabel: '980m',
              metaLabel: '소모 칼로리 52kcal',
              progress: 60,
              description: '한강진역 방향 대로변 경로입니다.',
            },
            { id: 'atrium-hannam-walk-2', durationMin: 17, metaLabel: '1.3km · 골목길 경유' },
          ],
          transit: [
            {
              id: 'atrium-hannam-transit-1',
              badge: '최적환승',
              durationMin: 11,
              metaLabel: '지하철 1회 환승',
              progress: 65,
              description: '한강진역 2번 출구에서 도보 3분입니다.',
            },
          ],
          taxi: [
            {
              id: 'atrium-hannam-taxi-1',
              badge: '가장 빠름',
              durationMin: 7,
              metaLabel: '예상 요금 5,200원',
              progress: 78,
              description: '이태원로를 경유하는 최단 경로입니다.',
            },
          ],
        },
      },
    },
  },
  {
    id: 'dreamy-attic',
    name: '드리미 애틱',
    location: '서울 연남동',
    description: '구름 위에 있는 듯한 파스텔 무드',
    match: 87,
    tags: ['Dreamy', 'Pastel'],
    mood: ['dreamy', 'warm'],
    bookmarked: false,
    hero: false,
    photo: { type: 'gradient', from: '#b9a3d9', to: '#7d6bb0', emoji: '☁' },
    detail: {
      detailTags: ['파스텔 무드', '연남동'],
      description:
        '구름 위에 떠 있는 듯한 파스텔 톤 인테리어와 폭신한 소품들로 채운 몽환적인 다락방 공간입니다.',
      rating: 4.8,
      hoursLabel: '11:00 - 23:00',
      reviewCount: 152,
      menu: [
        {
          id: 'dreamy-attic-m1',
          name: '라벤더 라떼',
          price: '7,000원',
          desc: '은은한 라벤더 시럽이 더해진 부드러운 라떼',
          image: 'assets/caffa_002.jpg',
        },
        {
          id: 'dreamy-attic-m2',
          name: '베리 판나코타',
          price: '7,500원',
          desc: '새콤달콤한 베리 소스를 곁들인 부드러운 판나코타',
          image: 'assets/caffa_003.jpg',
        },
      ],
      reviews: [
        {
          id: 'dreamy-attic-r1',
          author: '최유나',
          initial: 'C',
          rating: 5,
          date: '1일 전',
          text: '인테리어가 너무 예뻐서 사진만 백장 찍었어요. 디저트도 맛있어요!',
          tags: ['#감성카페', '#디저트맛집'],
        },
      ],
      reservation: {
        rating: 4.8,
        reviewCountLabel: '리뷰 1,050+',
        addressShort: '서울 마포구 연남동',
        addressFull: '서울 마포구 연남동 227-4',
        vibeGuide: '구름 위에 떠 있는 듯한 파스텔 톤 다락방에서 즐기는 몽환적인 티타임 공간입니다.',
        dayLabel: '매일',
        openHours: '11:00 - 23:00',
        closeTime: '23:00',
        lastOrder: '22:30',
        facilities: ['wifi', 'pet', 'group'],
        previewPhotos: ['assets/caffa_002.jpg', 'assets/caffa_003.jpg'],
        phone: '02-4567-8901',
      },
      route: {
        destinationLabel: '드리미 애틱 (연남동)',
        routesByMode: {
          walk: [
            {
              id: 'dreamy-attic-walk-1',
              badge: '최단시간',
              durationMin: 11,
              distanceLabel: '760m',
              metaLabel: '소모 칼로리 40kcal',
              progress: 58,
              description: '연남동 경의선숲길을 따라가는 경로입니다.',
            },
            { id: 'dreamy-attic-walk-2', durationMin: 14, metaLabel: '1.0km · 큰길 우선' },
          ],
          transit: [
            {
              id: 'dreamy-attic-transit-1',
              badge: '환승 없음',
              durationMin: 9,
              metaLabel: '버스 1정거장',
              progress: 62,
              description: '홍대입구역 3번 출구에서 도보 4분입니다.',
            },
          ],
          taxi: [
            {
              id: 'dreamy-attic-taxi-1',
              badge: '가장 빠름',
              durationMin: 6,
              metaLabel: '예상 요금 5,000원',
              progress: 76,
              description: '성산로를 경유하는 최단 경로입니다.',
            },
          ],
        },
      },
    },
  },
  {
    id: 'vintage-record',
    name: '빈티지 레코드',
    location: '서울 을지로',
    description: '턴테이블 사운드가 흐르는 옛 다락방',
    match: 85,
    tags: ['Vintage', 'Music'],
    mood: ['vintage', 'calm'],
    bookmarked: false,
    hero: false,
    photo: { type: 'gradient', from: '#8a5a3b', to: '#5c3a24', emoji: '🎙' },
    detail: {
      detailTags: ['LP 음악', '을지로'],
      description:
        '오래된 턴테이블에서 흘러나오는 LP 사운드와 빈티지 가구가 어우러진 을지로의 숨은 다락방 공간입니다.',
      rating: 4.7,
      hoursLabel: '13:00 - 24:00',
      reviewCount: 98,
      menu: [
        {
          id: 'vintage-record-m1',
          name: '핸드드립 원두커피',
          price: '6,500원',
          desc: '매주 바뀌는 원두로 내리는 핸드드립 커피',
          image: 'assets/caffa_002.jpg',
        },
        {
          id: 'vintage-record-m2',
          name: '위스키 초콜릿 케이크',
          price: '8,500원',
          desc: '진한 다크초콜릿에 위스키 향을 더한 케이크',
          image: 'assets/caffa_001.jpg',
        },
      ],
      reviews: [
        {
          id: 'vintage-record-r1',
          author: '정다은',
          initial: 'J',
          rating: 5,
          date: '4일 전',
          text: '틀어주는 LP 음악 선곡이 취향저격이었어요. 밤에 가기 좋은 곳!',
          tags: ['#LP음악', '#밤에가기좋은'],
        },
      ],
      reservation: {
        rating: 4.7,
        reviewCountLabel: '리뷰 510+',
        addressShort: '서울 중구 을지로',
        addressFull: '서울 중구 을지로 157-3',
        vibeGuide: 'LP 사운드와 빈티지 가구가 어우러진 을지로 골목 안 숨은 다락방 공간입니다.',
        dayLabel: '매일',
        openHours: '13:00 - 24:00',
        closeTime: '24:00',
        lastOrder: '23:30',
        facilities: ['wifi', 'group'],
        previewPhotos: ['assets/caffa_001.jpg', 'assets/caffa_002.jpg'],
        phone: '02-5678-9012',
      },
      route: {
        destinationLabel: '빈티지 레코드 (을지로)',
        routesByMode: {
          walk: [
            {
              id: 'vintage-record-walk-1',
              badge: '최단시간',
              durationMin: 13,
              distanceLabel: '900m',
              metaLabel: '소모 칼로리 48kcal',
              progress: 57,
              description: '을지로 골목 상권을 지나는 경로입니다.',
            },
            { id: 'vintage-record-walk-2', durationMin: 16, metaLabel: '1.2km · 큰길 우선' },
          ],
          transit: [
            {
              id: 'vintage-record-transit-1',
              badge: '환승 없음',
              durationMin: 10,
              metaLabel: '지하철 1정거장',
              progress: 63,
              description: '을지로3가역 8번 출구에서 도보 3분입니다.',
            },
          ],
          taxi: [
            {
              id: 'vintage-record-taxi-1',
              badge: '가장 빠름',
              durationMin: 7,
              metaLabel: '예상 요금 4,800원',
              progress: 74,
              description: '을지로를 경유하는 최단 경로입니다.',
            },
          ],
        },
      },
    },
  },
];

/** AI 큐레이터 멘트 (무드별로 다르게 노출 - 데모용 매핑) */
const CURATOR_MESSAGES = {
  default:
    '오늘은 조금 정적인 시간이 필요해보이네요. 복잡한 생각은 잠시 접어두고, 성수동의 \'포레스트 라운지\'에서 재즈 선율과 함께 따뜻한 차 한 잔 어떠신가요?',
  cozy: '따뜻하고 편안한 공간이 필요한 하루네요. 포근한 조명과 편안한 좌석이 있는 곳을 골라봤어요.',
  calm: '차분하게 몰입할 수 있는 조용한 공간을 찾으시는군요. 소음이 적고 여백이 많은 곳들이에요.',
  energetic: '활기를 채워줄 공간이 필요하시군요! 밝고 생동감 있는 분위기의 장소들을 준비했어요.',
  dreamy: '몽환적이고 감성적인 분위기를 원하시네요. 파스텔 톤과 부드러운 조명의 공간을 골라봤어요.',
};

// ------------------------------
// 2. Initial State Shape
// ------------------------------
/**
 * 앱 전역 state 스키마 (React useReducer 초기값으로 그대로 사용 가능)
 */
const initialState = {
  screen: 'splash', // 'splash' | 'main' | 'review' | 'reservation' | 'map'
  isSearchModalOpen: false, // add.html(무드 탐색 모달) 오픈 여부
  selectedCafeId: null, // 리뷰/장소 상세 화면(STEP 4)에 표시할 선택된 카페 id
  selectedMoods: ['cozy'], // 메인 화면에서 선택된 무드 (다중 선택)
  modalSelectedMoods: [], // 모달 내부에서 선택된 무드 (다중 선택)
  moodDescription: '', // 모달의 상세 무드 설명 textarea
  searchPhase: 'idle', // 'idle' | 'loading' | 'result'
  cafes: MOCK_CAFES,
  searchResults: [], // AI 탐색 결과로 채워지는 카페 목록
  // 데모 목적으로 저장한 장소(화면 8) 데이터를 기본 저장 상태로 초기화한다.
  bookmarkedIds: SAVED_PLACES.map((place) => place.id),
  savedFilterCategory: 'all', // 저장한 장소 화면(STEP 8) — 'all' | 'cafe' | 'food' | 'date'
  activeTab: 'home', // 하단 탭바 활성 탭
  selectedThemes: [], // 테마별 탐색 다중 선택
  travelMode: 'walk', // 지도 화면(STEP 6) — 'walk' | 'transit' | 'taxi'
  selectedRouteId: null, // 지도 화면(STEP 6) — 사용자가 고른 추천 경로 id (null 이면 기본 1번 경로)
  selectedNearbyPlaceId: null, // 근처 카페 찾기 화면(STEP 7) — 지도에서 선택된 마커 id (null 이면 기본 장소)
};

// ------------------------------
// 3. Tiny Store (pub/sub) — reducer 패턴
// ------------------------------
function createStore(reducer, initial) {
  let state = initial;
  const listeners = new Set();

  function getState() {
    return state;
  }

  function dispatch(action) {
    state = reducer(state, action);
    listeners.forEach((listener) => listener(state, action));
    return action;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getState, dispatch, subscribe };
}

/**
 * reducer — React 로 옮길 때 이 함수를 그대로 useReducer(reducer, initialState) 에 사용.
 */
function rootReducer(state, action) {
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

    case 'SET_SAVED_FILTER':
      return { ...state, savedFilterCategory: action.payload };

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
      return { ...state, isSearchModalOpen: false, searchPhase: 'idle' };

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

    case 'RECEIVE_MOOD_SEARCH_RESULT':
      return {
        ...state,
        searchPhase: 'result',
        searchResults: action.payload,
        selectedMoods:
          state.modalSelectedMoods.length > 0
            ? [...state.modalSelectedMoods]
            : state.selectedMoods,
      };

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

    default:
      return state;
  }
}

const store = createStore(rootReducer, initialState);

// ------------------------------
// 4. Helpers
// ------------------------------

/** id 로 카페(무드 플레이스) 단건을 조회 (리뷰/예약/지도 화면 공용) */
function getCafeById(id) {
  return MOCK_CAFES.find((cafe) => cafe.id === id) || null;
}

/** id 로 근처 카페 찾기(STEP 7) mock 장소 단건을 조회 */
function getNearbyPlaceById(id) {
  return NEARBY_PLACES.find((place) => place.id === id) || null;
}

/** 선택된 무드 id 배열을 기준으로 큐레이터 멘트를 고른다 */
function getCuratorMessage(moodIds) {
  for (const id of moodIds) {
    if (CURATOR_MESSAGES[id]) return CURATOR_MESSAGES[id];
  }
  return CURATOR_MESSAGES.default;
}

/**
 * 선택된 무드 + 텍스트 설명을 바탕으로 결과를 계산하는 모의 AI 매칭 로직.
 * (실제 서비스에서는 API 호출로 대체될 지점)
 */
function mockAiSearch(moodIds, description) {
  let results = MOCK_CAFES.filter((cafe) =>
    moodIds.length === 0 ? true : cafe.mood.some((m) => moodIds.includes(m))
  );

  if (results.length === 0) results = [...MOCK_CAFES];

  // 설명 텍스트가 있으면 살짝 다른 정렬/매치율 보정 (데모용)
  const seed = description.length % 5;
  results = results
    .map((c, i) => ({ ...c, match: Math.max(80, c.match - i * 2 - seed) }))
    .sort((a, b) => b.match - a.match);

  return results;
}

// 브라우저 전역에서 접근 가능하도록 노출 (모듈 시스템 없이 script 태그 로드)
window.MoodPlaceData = {
  MOOD_TAGS,
  MAIN_MOOD_TAGS,
  THEME_FILTERS,
  FACILITY_META,
  TRAVEL_MODES,
  MAP_ORIGIN_LABEL,
  NEARBY_TAG_ICON_META,
  NEARBY_PLACES,
  MY_PROFILE,
  ACCOUNT_MENU_ITEMS,
  SAVED_CATEGORY_FILTERS,
  SAVED_PLACES,
  MOCK_CAFES,
  CURATOR_MESSAGES,
  store,
  getCuratorMessage,
  mockAiSearch,
  getCafeById,
  getNearbyPlaceById,
};

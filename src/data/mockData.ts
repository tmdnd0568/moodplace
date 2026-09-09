import type { Cafe, NearbyPlace, SavedPlace } from '../store/types';

export const MOOD_TAGS = [
  { id: 'cozy', label: 'Cozy', icon: '☕' },
  { id: 'calm', label: 'Calm', icon: '🌿' },
  { id: 'energetic', label: 'Energetic', icon: '⚡' },
  { id: 'dreamy', label: 'Dreamy', icon: '✨' },
  { id: 'minimal', label: 'Minimal', icon: '◻' },
  { id: 'vintage', label: 'Vintage', icon: '📻' },
  { id: 'warm', label: 'Warm', icon: '☀' },
];

export const MAIN_MOOD_TAGS = MOOD_TAGS.slice(0, 4);

export const THEME_FILTERS = [
  { id: 'reading', label: '독서하기 좋은', icon: 'coffee' },
  { id: 'music', label: '음악이 맛있는', icon: 'headphones' },
  { id: 'sunlight', label: '채광이 가득한', icon: 'sun' },
  { id: 'night', label: '밤의 무드', icon: 'moon' },
];

export const FACILITY_META: Record<string, { label: string; icon: string }> = {
  wifi: { label: '무선 인터넷', icon: 'wifi' },
  parking: { label: '대형 주차장', icon: 'parking' },
  kids: { label: '키즈존', icon: 'kids' },
  pet: { label: '반려동물 동반', icon: 'pet' },
  group: { label: '단체석 완비', icon: 'group' },
  accessible: { label: '장애인 편의', icon: 'accessible' },
};

export const TRAVEL_MODES = [
  { id: 'walk', label: '도보', icon: 'walk' },
  { id: 'transit', label: '대중교통', icon: 'transit' },
  { id: 'taxi', label: '택시', icon: 'taxi' },
];

export const MAP_ORIGIN_LABEL = '현 위치 (서울시 종로구)';

export const NEARBY_TAG_ICON_META: Record<string, string> = {
  warm: '☀',
  leaf: '🌿',
  quiet: '🤫',
  sun: '🔆',
  camera: '📷',
  tea: '🍵',
  group: '👥',
};

export const NEARBY_PLACES: NearbyPlace[] = [
  {
    id: 'calm-forest',
    name: '카페 할아버지공장',
    address: '서울 성동구 성수이로74길 9',
    tags: [
      { icon: 'warm', label: '포근한' },
      { icon: 'leaf', label: '자연친화적' },
      { icon: 'quiet', label: '조용한' },
    ],
    description: '오두막 정원과 나무 감성의 성수동 랜드마크 카페',
    photos: ['/assets/grandpa_factory.jpg', '/assets/menu_grandpa_einspanner.jpg'],
    position: { top: '55%', left: '40%' },
    isDefault: true,
  },
  {
    id: 'vivid-garden',
    name: '대림창고 갤러리',
    address: '서울 성동구 성수이로 78',
    tags: [
      { icon: 'sun', label: '화사한' },
      { icon: 'leaf', label: '플랜테리어' },
      { icon: 'camera', label: '포토스팟' },
    ],
    description: '성수동을 대표하는 대형 창고형 갤러리 카페',
    photos: ['/assets/daelim_changgo.jpg', '/assets/menu_daelim_cream.jpg'],
    position: { top: '22%', left: '62%' },
  },
  {
    id: 'quiet-tea-room',
    name: '맛차차',
    address: '서울 성동구 서울숲2길 18-11',
    tags: [
      { icon: 'quiet', label: '조용한' },
      { icon: 'tea', label: '티하우스' },
      { icon: 'warm', label: '아늑한' },
    ],
    description: '서울숲을 마주 보며 즐기는 프리미엄 말차 티하우스',
    photos: ['/assets/matchacha.jpg', '/assets/menu_matcha_latte.jpg'],
    position: { top: '70%', left: '68%' },
  },
  {
    id: 'brick-atelier',
    name: '피치스 도원',
    address: '서울 성동구 연무장15길 11',
    tags: [
      { icon: 'sun', label: '채광좋은' },
      { icon: 'group', label: '단체석' },
      { icon: 'camera', label: '포토스팟' },
    ],
    description: '스트리트 카 컬처 기반의 힙한 복합 문화 공간',
    photos: ['/assets/peaches_dowone.jpg', '/assets/menu_knotted_donut.jpg'],
    position: { top: '38%', left: '20%' },
  },
];

export const MOCK_CAFES: Cafe[] = [
  {
    id: 'forest-lounge',
    name: '어니언 성수',
    location: '서울 성동구 아차산로9길 8',
    description: '폐공장을 리노베이션한 성수동 대표 브레드 카페',
    match: 98,
    tags: ['Vintage', 'Cozy'],
    mood: ['vintage', 'cozy'],
    bookmarked: false,
    hero: true,
    photo: { type: 'image', image: '/assets/onion_seongsu.jpg', from: '#6b8f71', to: '#2d5244', emoji: '🌿' },
    detail: {
      detailTags: ['베이커리', '성수동'],
      description: '1970년대 신신정밀 공장 건물, 세탁소 등의 세월의 흔적을 그대로 살린 인더스트리얼 감성의 공간입니다. 녹슨 철문, 거친 벽면과 매일 아침 구워내는 고소한 베이커리가 특별한 조화를 선사합니다.',
      rating: 4.4,
      hoursLabel: '08:00 - 22:00',
      reviewCount: 128,
      menu: [
        {
          id: 'forest-lounge-m1',
          name: '어니언 아인슈페너',
          price: '6,500원',
          desc: '부드러운 시그니처 크림이 쌉싸름한 콜드브루와 어우러진 어니언 대표 커피',
          image: '/assets/menu_onion_coffee.jpg',
        },
        {
          id: 'forest-lounge-m2',
          name: '팡도르',
          price: '7,500원',
          desc: '이탈리아 베로나 지방의 전통 빵으로, 슈가 파우더가 눈처럼 소복이 쌓인 어니언 대표 디저트',
          image: '/assets/menu_onion_pandoro.jpg',
        },
      ],
      reviews: [
        {
          id: 'forest-lounge-r1',
          author: '김지수',
          initial: 'K',
          rating: 5,
          date: '2일 전',
          text: '폐공장 감성의 인더스트리얼 인테리어가 독보적이에요! 시그니처 팡도르는 하얀 가루가 듬뿍 올라가서 달달하고 정말 맛있습니다. 소금빵도 고소해서 강추해요.',
          tags: ['#팡도르맛집', '#인더스트리얼감성'],
          likes: 4,
          likedByUser: false
        },
        {
          id: 'forest-lounge-r2',
          author: 'Minho Park',
          initial: 'M',
          rating: 4,
          date: '1주일 전',
          text: '주말에는 사람이 엄청나게 많지만 평일 오전에 방문하면 루프탑에서 여유롭게 힐링하기 좋습니다. 빈티지한 매력이 가득한 성수동의 상징적인 곳이네요.',
          tags: ['#베이커리추천', '#루프탑카페'],
          likes: 2,
          likedByUser: false
        }
      ],
      reservation: {
        rating: 4.8,
        reviewCountLabel: '리뷰 1,240+',
        description: '붉은 벽돌 공장의 역사적인 공간에서 갓 구운 브레드와 바리스타의 스페셜티 음료 서비스를 누릴 수 있는 성수동의 대표 랜드마크 공간입니다.',
        facilities: ['wifi', 'parking', 'group', 'accessible'],
        notice: '• 주말에는 이용 고객이 많아 예약 시간 기준 10분 이상 지연 시 자동 취소될 수 있습니다.\n• 외부 음식 반입은 금지됩니다.',
      },
      route: {
        destinationLabel: '어니언 성수',
        routesByMode: {
          walk: [
            { id: 'forest-lounge-walk-1', badge: '최단시간', durationMin: 12, distanceLabel: '840m', metaLabel: '소모 칼로리 45kcal', progress: 65, description: '숲길 우선 경로: 성수동 카페거리를 경유합니다.' }
          ],
          transit: [
            { id: 'forest-lounge-transit-1', badge: '최적환승', durationMin: 9, distanceLabel: '1.8km', metaLabel: '버스 1회 환승', progress: 70, description: '뚝섬역에서 지선버스 2213번으로 환승합니다.' }
          ],
          taxi: [
            { id: 'forest-lounge-taxi-1', badge: '가장 빠름', durationMin: 6, distanceLabel: '2.5km', metaLabel: '예상 요금 6,500원', progress: 80, description: '강변북로 성수대교 방면을 경유하는 최단 거리 차량 경로입니다.' }
          ]
        }
      }
    }
  },
  {
    id: 'urban-nest',
    name: '센터커피 서울숲점',
    location: '서울 성동구 서울숲2길 28-11',
    description: '서울숲 뷰가 한눈에 들어오는 스페셜티 커피 전문점',
    match: 85,
    tags: ['Minimal', 'Calm'],
    mood: ['minimal', 'calm'],
    bookmarked: false,
    hero: false,
    photo: { type: 'image', image: '/assets/center_coffee.jpg', from: '#8e9aaf', to: '#cbd5e1', emoji: '◻' },
    detail: {
      detailTags: ['스페셜티커피', '서울숲'],
      description: '서울숲의 아름다운 전경이 한눈에 보이는 미니멀하고 세련된 스페셜티 커피 브랜드입니다. 통유리창 너머 계절마다 옷을 갈아입는 숲의 모습을 조망하며 바리스타의 핸드드립 커피를 즐길 수 있습니다.',
      rating: 4.5,
      hoursLabel: '10:00 - 21:00',
      reviewCount: 94,
      menu: [
        {
          id: 'urban-nest-m1',
          name: '게이샤 핸드드립 커피',
          price: '8,000원',
          desc: '화사한 꽃향기와 과일의 산미가 도드라지는 고품격 스페셜티 게이샤 핸드드립 커피',
          image: '/assets/menu_center_geisha.jpg',
        },
        {
          id: 'urban-nest-m2',
          name: '수제 쑥 스콘',
          price: '5,000원',
          desc: '국내산 쑥의 은은한 향과 고소한 버터의 조화가 일품인 겉바속촉 수제 스콘',
          image: '/assets/menu_center_scone.jpg',
        }
      ],
      reviews: [
        {
          id: 'urban-nest-r1',
          author: '이소민',
          initial: 'L',
          rating: 5,
          date: '3일 전',
          text: '서울숲 입구 바로 옆이라 2층 통유리창으로 보이는 초록빛 풍경이 너무 평화롭고 조용한 뷰입니다. 스페셜티 커피의 꽃향기가 매력적이고 드립 커피 퀄리티가 대단합니다.',
          tags: ['#서울숲뷰', '#스페셜티커피'],
          likes: 3,
          likedByUser: false
        },
        {
          id: 'urban-nest-r2',
          author: '박태양',
          initial: 'P',
          rating: 4,
          date: '5일 전',
          text: '산뜻하고 쌉싸름한 쑥 라떼가 인상적이었어요. 매장 인테리어가 깔끔하고 미니멀해서 시끄러운 성수동 골목에서 차분하게 커피 즐기기 좋습니다.',
          tags: ['#쑥라떼', '#미니멀인테리어'],
          likes: 1,
          likedByUser: false
        }
      ],
      reservation: {
        rating: 4.5,
        reviewCountLabel: '리뷰 94+',
        description: '서울숲의 사계절 자연 뷰를 파노라마 통창으로 마주하며 즐기는 최고급 스페셜티 커피 및 브런치 라운지입니다.',
        facilities: ['wifi', 'group', 'accessible', 'pet'],
        notice: '• 조용한 분위기 유지를 위해 3인 이상 단체 방문 시 사전에 문의해 주시기 바랍니다.',
      },
      route: {
        destinationLabel: '센터커피 서울숲점',
        routesByMode: {
          walk: [
            { id: 'urban-nest-walk-1', badge: '추천', durationMin: 5, distanceLabel: '300m', metaLabel: '가장 짧은 도보 거리', progress: 90, description: '성수역 4번출구에서 직진 후 골목 좌회전' }
          ],
          transit: [
            { id: 'urban-nest-transit-1', badge: '지하철', durationMin: 4, distanceLabel: '400m', metaLabel: '2호선 성수역 하차', progress: 95, description: '2호선 성수역 4번출구 이용' }
          ],
          taxi: [
            { id: 'urban-nest-taxi-1', badge: '기본요금', durationMin: 3, distanceLabel: '600m', metaLabel: '예상요금 4,800원', progress: 98, description: '성수이로를 경유하는 최단차량코스' }
          ]
        }
      }
    }
  },
  {
    id: 'vivid-garden',
    name: '대림창고 갤러리',
    location: '서울 성동구 성수이로 78',
    description: '성수동을 대표하는 대형 창고형 갤러리 카페',
    match: 92,
    tags: ['Vintage', 'Gallery'],
    mood: ['vintage', 'energetic'],
    bookmarked: false,
    hero: false,
    photo: { type: 'image', image: '/assets/daelim_changgo.jpg', from: '#ffccd5', to: '#ff4d6d', emoji: '🌸' },
    detail: {
      detailTags: ['갤러리카페', '성수동'],
      description: '과거 정미소로 쓰이던 거대한 창고 건물을 리모델링한 복합 문화 갤러리 카페입니다. 웅장한 목조 트러스 천장과 붉은 벽돌 벽면을 배경으로 대형 설치 미술 작품들과 향긋한 커피를 즐길 수 있습니다.',
      rating: 4.3,
      hoursLabel: '11:00 - 22:00',
      reviewCount: 150,
      menu: [
        {
          id: 'vivid-garden-m1',
          name: '성수동 크림라떼',
          price: '8,500원',
          desc: '대림창고만의 고소한 시그니처 견과류 베이스 크림이 올라간 시그니처 라떼',
          image: '/assets/menu_daelim_cream.jpg',
        },
        {
          id: 'vivid-garden-m2',
          name: '딸기 초코 타르트',
          price: '9,000원',
          desc: '신선한 생딸기와 진한 가나슈 초콜릿 크림이 어우러진 수제 타르트',
          image: '/assets/menu_daelim_tart.jpg',
        }
      ],
      reviews: [
        {
          id: 'vivid-garden-r1',
          author: '강민아',
          initial: 'K',
          rating: 5,
          date: '1일 전',
          text: '정미소 건물을 개조한 거대한 천장과 곳곳에 전시된 대형 현대 미술 작품들이 장관입니다. 크림 가득한 성수동 크림라떼도 달콤하고 향긋해서 전시 보며 먹기 완벽해요.',
          tags: ['#창고형갤러리', '#성수동크림라떼'],
          likes: 5,
          likedByUser: false
        },
        {
          id: 'vivid-garden-r2',
          author: '정우성',
          initial: 'J',
          rating: 4,
          date: '4일 전',
          text: '딸기 초코 타르트가 달지 않고 신선해서 참 좋았어요. 성수동에 올 때마다 웅장한 내부 분위기 덕분에 꼭 들리게 되는 이국적 공간입니다.',
          tags: ['#미술전시', '#디저트맛집'],
          likes: 2,
          likedByUser: false
        }
      ],
      reservation: {
        rating: 4.8,
        reviewCountLabel: '리뷰 150+',
        description: '사계절 내내 햇살과 꽃이 가득한 비비드 온실 라운지입니다.',
        facilities: ['wifi', 'parking', 'pet', 'group', 'kids'],
        notice: '• 온실 좌석 및 대형 단체석은 사전 예약 고객 위주로 배정됩니다.',
      },
      route: {
        destinationLabel: '대림창고 갤러리',
        routesByMode: {
          walk: [
            { id: 'vivid-garden-walk-1', badge: '추천', durationMin: 8, distanceLabel: '500m', metaLabel: '도보 코스', progress: 85, description: '서울숲역 4번출구 근처' }
          ],
          transit: [
            { id: 'vivid-garden-transit-1', badge: '지하철', durationMin: 4, distanceLabel: '400m', metaLabel: '서울숲역 하차', progress: 90, description: '수인분당선 서울숲역 이용' }
          ],
          taxi: [
            { id: 'vivid-garden-taxi-1', badge: '기본요금', durationMin: 4, distanceLabel: '800m', metaLabel: '예상요금 5,000원', progress: 95, description: '왕십리로를 경유하는 차량코스' }
          ]
        }
      }
    }
  },
  {
    id: 'quiet-tea-room',
    name: '맛차차',
    location: '서울 성동구 서울숲2길 18-11',
    description: '서울숲을 마주 보며 즐기는 프리미엄 말차 티하우스',
    match: 89,
    tags: ['Calm', 'Traditional'],
    mood: ['calm', 'dreamy'],
    bookmarked: false,
    hero: false,
    photo: { type: 'image', image: '/assets/matchacha.jpg', from: '#d8f3dc', to: '#1b4332', emoji: '🍵' },
    detail: {
      detailTags: ['티하우스', '서울숲'],
      description: '서울숲의 고요한 자연을 마주 보며 온전히 나만의 사색에 잠길 수 있는 프리미엄 차 전문점입니다. 차분한 젠(Zen) 스타일의 목조 다도 바에서 엄선된 유기농 말차와 정갈한 제철 다식을 차분히 음미하는 경험을 제공합니다.',
      rating: 4.8,
      hoursLabel: '11:00 - 19:00',
      reviewCount: 78,
      menu: [
        {
          id: 'quiet-tea-room-m1',
          name: '맛차 라떼',
          price: '8,500원',
          desc: '제주산 유기농 차광재배 말차를 격불하여 만드는 진하고 깊은 오리지널 맛차 라떼',
          image: '/assets/menu_matcha_latte.jpg',
        },
        {
          id: 'quiet-tea-room-m2',
          name: '맛차 다식 다과 세트',
          price: '8,000원',
          desc: '정갈한 제철 다과와 전통 모나카가 어우러져 차의 풍미를 돋우는 디저트 플레이팅',
          image: '/assets/menu_matchacha_dessert.jpg',
        }
      ],
      reviews: [
        {
          id: 'quiet-tea-room-r1',
          author: '한예지',
          initial: 'H',
          rating: 5,
          date: '2일 전',
          text: '서울숲을 바라보는 바 형태의 다도실에서 오롯이 차에 집중할 수 있어 마음이 정화됩니다. 정성껏 내주신 유기농 맛차 라떼는 정말 깊고 부드러운 차원이 다른 맛이네요.',
          tags: ['#다도체험', '#맛차라떼맛집'],
          likes: 6,
          likedByUser: false
        },
        {
          id: 'quiet-tea-room-r2',
          author: '윤동현',
          initial: 'Y',
          rating: 5,
          date: '6일 전',
          text: '정갈하게 담겨 나오는 제철 다식과 말차의 조합이 훌륭합니다. 예약제로 세션이 운영되어 시끄러운 성수동에서 드물게 완벽한 고요함을 누릴 수 있는 쉼터입니다.',
          tags: ['#힐링공간', '#고요함'],
          likes: 3,
          likedByUser: false
        }
      ],
      reservation: {
        rating: 4.8,
        reviewCountLabel: '리뷰 78+',
        description: '서울숲의 고요한 자연을 병풍 삼아 최고급 제철 차 다도 체험과 사색을 즐기는 힐링 티하우스 공간입니다.',
        facilities: ['wifi', 'group', 'accessible'],
        notice: '• 차 다도 세션 예약은 정시 단위로 진행되며 10분 전 입장을 권장합니다.',
      },
      route: {
        destinationLabel: '맛차차',
        routesByMode: {
          walk: [
            { id: 'quiet-tea-room-walk-1', badge: '추천', durationMin: 10, distanceLabel: '700m', metaLabel: '골목길', progress: 80, description: '성수역 연무장길 안쪽 골목' }
          ],
          transit: [
            { id: 'quiet-tea-room-transit-1', badge: '도보이동', durationMin: 10, distanceLabel: '700m', metaLabel: '도보전용', progress: 80, description: '연무장길을 통한 도보 경로' }
          ],
          taxi: [
            { id: 'quiet-tea-room-taxi-1', badge: '기본요금', durationMin: 5, distanceLabel: '900m', metaLabel: '예상요금 5,200원', progress: 85, description: '연무장길 일방통행 경유 차량코스' }
          ]
        }
      }
    }
  },
  {
    id: 'calm-forest',
    name: '카페 할아버지공장',
    location: '서울 성동구 성수이로74길 9',
    description: '오두막 정원과 나무 감성의 성수동 랜드마크 카페',
    match: 94,
    tags: ['Cozy', 'Warm'],
    mood: ['cozy', 'warm'],
    bookmarked: false,
    hero: false,
    photo: { type: 'image', image: '/assets/grandpa_factory.jpg', from: '#ede0d4', to: '#7f5539', emoji: '🌳' },
    detail: {
      detailTags: ['정원카페', '성수동'],
      description: '동화 속에 나오는 커다란 나무 위의 오두막 정원과 넓은 예술적 공간이 어우러진 성수동의 초대형 정원형 카페입니다. 곳곳에 배치된 예술 작품과 목조 테이블, 싱그러운 화초들이 마치 거대한 숲 속 별장에 온 듯한 평온함을 줍니다.',
      rating: 4.5,
      hoursLabel: '11:00 - 22:00',
      reviewCount: 110,
      menu: [
        {
          id: 'calm-forest-m1',
          name: '더티 아인슈페너',
          price: '8,000원',
          desc: '할아버지공장의 빈티지 감성을 담아 초코 파우더를 거칠게 얹은 비주얼 시그니처 크림 커피',
          image: '/assets/menu_grandpa_einspanner.jpg',
        },
        {
          id: 'calm-forest-m2',
          name: '조각 초코 치즈케이크',
          price: '8,000원',
          desc: '꾸덕하고 진한 크림치즈 베이스에 초콜릿 레이어를 얹은 부드러운 수제 케이크',
          image: '/assets/menu_grandpa_cake.jpg',
        }
      ],
      reviews: [
        {
          id: 'calm-forest-r1',
          author: '최진아',
          initial: 'C',
          rating: 5,
          date: '3일 전',
          text: '마당 한가운데에 있는 동화 속 트리하우스 오두막이 정말 신기하고 멋져요! 플랜테리어와 정원 덕분에 도심 속 별장에 온 기분이고, 파스타 같은 식사류도 아주 훌륭합니다.',
          tags: ['#트리하우스', '#정원카페'],
          likes: 4,
          likedByUser: false
        },
        {
          id: 'calm-forest-r2',
          author: '김동하',
          initial: 'K',
          rating: 4,
          date: '1주일 전',
          text: '거칠게 뿌려진 초코파우더가 인상적인 더티 아인슈페너는 묵직한 크림이 에스프레소와 찰떡입니다. 공간이 워낙 넓어서 단체나 모임하기 좋은 최고의 카페입니다.',
          tags: ['#더티아인슈페너', '#대형카페추천'],
          likes: 2,
          likedByUser: false
        }
      ],
      reservation: {
        rating: 4.7,
        reviewCountLabel: '리뷰 110+',
        description: '풍성한 플랜테리어와 우드 인테리어가 선사하는 포근한 숲 속 안식처입니다.',
        facilities: ['wifi', 'parking', 'pet', 'accessible', 'group'],
        notice: '• 주말 야외 테라스석은 입실 순서대로 지정됩니다.',
      },
      route: {
        destinationLabel: '카페 할아버지공장',
        routesByMode: {
          walk: [
            { id: 'calm-forest-walk-1', badge: '추천', durationMin: 6, distanceLabel: '400m', metaLabel: '도보 코스', progress: 90, description: '성수역 3번출구 뚝섬역 방향 도보 6분' }
          ],
          transit: [
            { id: 'calm-forest-transit-1', badge: '지하철', durationMin: 6, distanceLabel: '400m', metaLabel: '성수역 하차', progress: 90, description: '2호선 성수역 3번출구 도보' }
          ],
          taxi: [
            { id: 'calm-forest-taxi-1', badge: '기본요금', durationMin: 4, distanceLabel: '800m', metaLabel: '예상요금 5,000원', progress: 92, description: '성수이로 골목을 통과하는 경로' }
          ]
        }
      }
    }
  },
  {
    id: 'brick-atelier',
    name: '피치스 도원',
    location: '서울 성동구 연무장15길 11',
    description: '스트리트 카 컬처 기반의 힙한 복합 문화 공간',
    match: 87,
    tags: ['Energetic', 'Hip'],
    mood: ['energetic', 'dreamy'],
    bookmarked: false,
    hero: false,
    photo: { type: 'image', image: '/assets/peaches_dowone.jpg', from: '#f08080', to: '#8b0000', emoji: '🧱' },
    detail: {
      detailTags: ['복합문화공간', '성수동'],
      description: '스트리트 자동차 튜닝 브랜드 Peaches가 기획한 힙하고 트렌디한 복합 문화 공간입니다. 강렬한 핑크빛 튜닝 스포츠카 전시와 힙한 스케이트보드 파크 콘셉트의 연출, 달콤한 노티드 도넛 매장이 입점하여 활기찬 영감을 제공합니다.',
      rating: 4.4,
      hoursLabel: '11:00 - 21:00',
      reviewCount: 65,
      menu: [
        {
          id: 'brick-atelier-m1',
          name: '도원 시그니처 아메리카노',
          price: '5,500원',
          desc: '고소하고 다크한 바디감이 살아있는 피치스 도원만의 특제 하우스 블렌드 아메리카노',
          image: '/assets/menu_peaches_coffee.jpg',
        },
        {
          id: 'brick-atelier-m2',
          name: '노티드 우유생크림 도넛',
          price: '3,900원',
          desc: '도원 한편에 자리한 노티드의 넘버원 시그니처 제품으로, 부드러운 우유크림이 가득한 도넛',
          image: '/assets/menu_knotted_donut.jpg',
        }
      ],
      reviews: [
        {
          id: 'brick-atelier-r1',
          author: '송민경',
          initial: 'S',
          rating: 5,
          date: '2일 전',
          text: '스트리트 패션과 멋진 튜닝 스포츠카가 핑크빛 네온사인 아래 웅장하게 서있어 들어서자마자 힙한 무드에 압도됩니다! 사진 찍을 핫스팟이 정말 많아요.',
          tags: ['#힙플레이스', '#슈퍼카전시'],
          likes: 3,
          likedByUser: false
        },
        {
          id: 'brick-atelier-r2',
          author: '임재범',
          initial: 'I',
          rating: 4,
          date: '5일 전',
          text: '피치스 소다는 색감도 너무 예쁘고 상큼해서 기분이 좋아지네요. 특히 도원 한쪽에 노티드가 입점해 있어 시그니처 우유생크림 도넛을 바로 사 먹을 수 있어서 최고예요.',
          tags: ['#노티드도넛', '#피치스소다'],
          likes: 1,
          likedByUser: false
        }
      ],
      reservation: {
        rating: 4.5,
        reviewCountLabel: '리뷰 65+',
        description: '붉은 벽돌과 예술 작품들이 함께하는 넓고 쾌적한 아틀리에 갤러리 공간입니다.',
        facilities: ['wifi', 'parking', 'group', 'kids', 'pet', 'accessible'],
        notice: '• 갤러리 전시 및 대관 일정에 따라 일부 구역 예약이 제한될 수 있습니다.',
      },
      route: {
        destinationLabel: '피치스 도원',
        routesByMode: {
          walk: [
            { id: 'brick-atelier-walk-1', badge: '추천', durationMin: 11, distanceLabel: '800m', metaLabel: '골목길 코스', progress: 75, description: '뚝섬역 5번출구 근처' }
          ],
          transit: [
            { id: 'brick-atelier-transit-1', badge: '지하철', durationMin: 11, distanceLabel: '800m', metaLabel: '2호선 뚝섬역 하차', progress: 75, description: '2호선 뚝섬역 이용' }
          ],
          taxi: [
            { id: 'brick-atelier-taxi-1', badge: '기본요금', durationMin: 6, distanceLabel: '1.2km', metaLabel: '예상요금 5,500원', progress: 80, description: '성수동 뚝섬로 경유 최단차량경로' }
          ]
        }
      }
    }
  }
];

export const SAVED_CATEGORY_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'cafe', label: '카페' },
  { id: 'restaurant', label: '디저트' },
  { id: 'bar', label: '라운지' },
];

export const SAVED_PLACES: SavedPlace[] = [
  {
    id: 'forest-lounge',
    category: 'cafe',
    name: '어니언 성수',
    address: '서울 성동구 아차산로9길 8',
    image: '/assets/onion_seongsu.jpg',
    tags: ['Vintage', 'Cozy'],
  },
  {
    id: 'urban-nest',
    category: 'cafe',
    name: '센터커피 서울숲점',
    address: '서울 성동구 서울숲2길 28-11',
    image: '/assets/center_coffee.jpg',
    tags: ['Minimal', 'Calm'],
  },
  {
    id: 'calm-forest',
    category: 'cafe',
    name: '카페 할아버지공장',
    address: '서울 성동구 성수이로74길 9',
    image: '/assets/grandpa_factory.jpg',
    tags: ['Cozy', 'Warm'],
  },
  {
    id: 'vivid-garden',
    category: 'restaurant',
    name: '대림창고 갤러리',
    address: '서울 성동구 성수이로 78',
    image: '/assets/daelim_changgo.jpg',
    tags: ['Vintage', 'Gallery'],
  },
  {
    id: 'quiet-tea-room',
    category: 'bar',
    name: '맛차차',
    address: '서울 성동구 서울숲2길 18-11',
    image: '/assets/matchacha.jpg',
    tags: ['Calm', 'Traditional'],
  },
  {
    id: 'brick-atelier',
    category: 'cafe',
    name: '피치스 도원',
    address: '서울 성동구 연무장15길 11',
    image: '/assets/peaches_dowone.jpg',
    tags: ['Energetic', 'Hip'],
  },
];

export const CURATOR_MESSAGES: Record<string, string> = {
  default: "오늘은 조금 정적인 시간이 필요해보이네요. 복잡한 생각은 잠시 접어두고, 성수동의 '어니언 성수'에서 재즈 선율과 함께 따뜻한 차 한 잔 어떠신가요?",
  cozy: "몸과 마음을 사르르 녹여줄 Cozy한 하루가 어떠신가요? 식물들과 따뜻한 우드가 있는 '카페 할아버지공장'이나 '어니언 성수'를 방문해 편안한 쉼을 누려보세요.",
  calm: "조용한 몰입의 즐거움, Calm 무드를 경험해 보세요. 미니멀한 감각의 공간인 '센터커피 서울숲점'에서 생각을 정돈하며 책 한 권을 즐기시는 것을 추천합니다.",
  energetic: "에너지가 솟아오르는 화사한 하루를 꿈꾸신다면 Energetic 탭을 확인해 보세요. 넓은 복합 문화 공간 '대림창고 갤러리'에서 달콤한 디저트와 커피 한 잔이 기분을 들뜨게 할 거예요.",
  dreamy: "조용히 사색하며 낭만에 젖는 Dreamy 감성이 필요하시군요. 서울숲을 바라보는 고즈넉한 '맛차차'에서 제주 말차티를 한 모금 음미하며 평온을 만끽해 보시기 바랍니다.",
};

export const MY_PROFILE = {
  name: '김무드',
  avatarUrl: '',
  stats: {
    saved: 24,
    reviews: 12,
    visits: 38,
  },
};

export const ACCOUNT_MENU_ITEMS = [
  { id: 'edit-profile', label: '프로필 수정', icon: 'editProfile' },
  { id: 'notifications', label: '알림 설정', icon: 'bell' },
  { id: 'privacy', label: '보안 & 개인정보', icon: 'shield' },
  { id: 'help', label: '도움말 & 지원', icon: 'help' },
];

export const EXTRA_LOCAL_CAFES = [
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
];

export function createDynamicCafe(
  id: string,
  name: string,
  location: string,
  description: string,
  photos: string[] = ['/assets/caffe_001.jpg', '/assets/menu_croffle.jpg'],
  rawTags: Array<{ icon?: string; label: string } | string> = ['모던', '감성']
): Cafe {
  const photoUrl = photos[0] || '/assets/caffe_001.jpg';
  const menuPhotoUrl = photos[1] || '/assets/menu_croffle.jpg';
  const tagLabels = rawTags.map((t) => (typeof t === 'string' ? t : t.label));

  return {
    id,
    name,
    location,
    description,
    match: 97,
    tags: tagLabels,
    mood: ['cozy', 'warm'],
    bookmarked: false,
    hero: false,
    photo: { type: 'image', image: photoUrl, from: '#2d5244', to: '#c8e9c2', emoji: '☕' },
    aiReason: `둔산동 오라클 빌딩에서 쉽게 찾아갈 수 있는 ${name}입니다.`,
    detail: {
      detailTags: tagLabels,
      description: `${description} 대전 둔산동 오라클 빌딩 주변에서 많은 이용객들이 찾는 분위기 명소입니다.`,
      rating: 4.8,
      hoursLabel: '09:00 - 22:00',
      reviewCount: 142,
      menu: [
        {
          id: `${id}-m1`,
          name: `${name} 시그니처 블렌드`,
          price: '5,500원',
          desc: '둔산동 직장인들과 주민들이 애용하는 부드럽고 고소한 원두 커피',
          image: photoUrl,
        },
        {
          id: `${id}-m2`,
          name: '수제 디저트 베이커리',
          price: '6,000원',
          desc: '매일 아침 직접 구워내는 갓 구운 인기 브레드 & 디저트',
          image: menuPhotoUrl,
        },
      ],
      reviews: [
        {
          id: `${id}-r1`,
          author: '대전둔산주민',
          initial: 'D',
          rating: 5,
          date: '2일 전',
          text: '오라클 빌딩에서 길찾기 따라 방문했는데 위치도 찾기 쉽고 커피와 디저트 맛도 최고입니다!',
          tags: ['#둔산동핫플', '#오라클빌딩근처'],
          likes: 12,
        },
      ],
      reservation: {
        rating: 4.8,
        reviewCountLabel: '리뷰 142+',
        description: `${name} - 대전 둔산동 오라클 빌딩 주변 대표 추천 카페`,
        facilities: ['wifi', 'parking', 'group', 'accessible'],
        notice: '• 둔산동 오라클 빌딩에서 도보 5~10분 거리 내에 있습니다.',
      },
      route: {
        destinationLabel: name,
        routesByMode: {
          walk: [
            {
              id: `${id}-walk-1`,
              badge: '최단도보',
              durationMin: 8,
              distanceLabel: '520m',
              metaLabel: '출발: 둔산동 오라클 빌딩 (대전 서구 대덕대로 226)',
              progress: 75,
              description: '출발: 둔산동 오라클 빌딩 정문 → 대덕대로 둔산 갤러리아 타임월드 방면 350m 도보 → 목적지 도착',
            },
          ],
          transit: [
            {
              id: `${id}-transit-1`,
              badge: '추천노선',
              durationMin: 5,
              distanceLabel: '950m',
              metaLabel: '은하수네거리 정류장 • 시내버스 108/211번 탑승',
              progress: 80,
              description: '오라클 빌딩 앞 은하수네거리 정류장에서 버스 탑승 후 목적지 주변 정류장 하차',
            },
          ],
          taxi: [
            {
              id: `${id}-taxi-1`,
              badge: '최단차량',
              durationMin: 3,
              distanceLabel: '1.2km',
              metaLabel: '예상 택시 요금 4,800원',
              progress: 90,
              description: '오라클 빌딩 전면 차로 승차 → 대덕대로 둔산 지하차도 상부 경유 최단 승용차 경로',
            },
          ],
        },
      },
    },
  };
}

export function getCafeById(id: string): Cafe {
  // 1. MOCK_CAFES
  const foundMock = MOCK_CAFES.find((cafe) => cafe.id === id);
  if (foundMock) return foundMock;

  // 2. REGIONAL_MOCK_CAFES
  for (const cafeList of Object.values(REGIONAL_MOCK_CAFES)) {
    const foundReg = cafeList.find((cafe) => cafe.id === id);
    if (foundReg) return foundReg;
  }

  // 3. EXTRA_LOCAL_CAFES
  const foundExtra = EXTRA_LOCAL_CAFES.find((c) => c.id === id);
  if (foundExtra) {
    return createDynamicCafe(
      foundExtra.id,
      foundExtra.name,
      foundExtra.address,
      foundExtra.description,
      foundExtra.photos,
      foundExtra.tags
    );
  }

  // 4. NEARBY_PLACES
  const foundNearby = NEARBY_PLACES.find((p) => p.id === id);
  if (foundNearby) {
    return createDynamicCafe(
      foundNearby.id,
      foundNearby.name,
      foundNearby.address,
      foundNearby.description,
      foundNearby.photos,
      foundNearby.tags
    );
  }

  // 5. Fallback Cafe generator for ANY string ID
  const readableName = id.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  return createDynamicCafe(
    id,
    readableName.includes('Cafe') ? readableName : `${readableName} 카페`,
    '대전 서구 둔산동 1414 (오라클 빌딩 주변)',
    `대전 둔산동 오라클 빌딩 근처 인기 추천 카페입니다.`,
    ['/assets/caffe_001.jpg', '/assets/menu_croffle.jpg'],
    ['둔산동', '오라클빌딩근처']
  );
}

export function getNearbyPlaceById(id: string): NearbyPlace | null {
  return NEARBY_PLACES.find((place) => place.id === id) || null;
}

export function getCuratorMessage(moodIds: string[]): string {
  for (const id of moodIds) {
    if (CURATOR_MESSAGES[id]) return CURATOR_MESSAGES[id];
  }
  return CURATOR_MESSAGES.default;
}

export const REGIONAL_MOCK_CAFES: Record<string, Cafe[]> = {
  대전: [
    {
      id: 'daejeon-1',
      name: '하치카페',
      location: '대전 서구 둔산동',
      description: '일본 감성의 아늑하고 따뜻한 원목 분위기를 자랑하는 둔산동 대표 감성 카페',
      match: 98,
      tags: ['#둔산동', '#감성카페', '#일본풍'],
      mood: ['cozy', 'warm'],
      bookmarked: false,
      hero: true,
      photo: { type: 'image', image: '/assets/cafe_calm_forest.jpg', from: '#e0c3fc', to: '#8ec5fc', emoji: '☕' },
      aiReason: '둔산동 중심에서 차분한 분위기와 특유의 아늑한 원목 인테리어로 최고의 만족도를 주는 카페입니다.',
      isExternalRegion: true,
      targetRegion: '대전 둔산동',
      detail: {
        detailTags: ['둔산동', '감성카페'],
        description: '대전 둔산동에 위치한 따뜻한 일본 감성 디저트 전문 카페입니다.',
        rating: 4.8,
        hoursLabel: '12:00 - 21:00',
        reviewCount: 150,
        menu: [
          { id: 'dj-m1', name: '말차 롤케이크', price: '6,500원', desc: '진한 유기농 말차 크림이 들어간 수제 롤케이크', image: '/assets/menu_onion_pandoro.jpg' },
          { id: 'dj-m2', name: '하치 크림라떼', price: '6,000원', desc: '고소한 넛츠 크림이 들어간 시그니처 라떼', image: '/assets/menu_onion_coffee.jpg' }
        ],
        reviews: [
          { id: 'dj-r1', author: '대전시민', initial: 'D', rating: 5, date: '1일 전', text: '둔산동에서 분위기 제일 좋은 아기자기한 카페입니다!', tags: ['#둔산동핫플'], likes: 10 }
        ]
      }
    },
    {
      id: 'daejeon-2',
      name: '크러쉬온바이트',
      location: '대전 서구 둔산남로9번길 83',
      description: '화려한 비주얼의 수제 케이크와 세련된 모던 인테리어가 돋보이는 둔산동 디저트 핫플',
      match: 95,
      tags: ['#둔산동', '#케이크맛집', '#모던'],
      mood: ['energetic', 'minimal'],
      bookmarked: false,
      hero: false,
      photo: { type: 'image', image: '/assets/caffe_001.jpg', from: '#fbc531', to: '#e1b12c', emoji: '🍰' },
      aiReason: '수제 케이크 라인업과 세련된 모던 공간 구성으로 디저트 마니아들에게 인기 높은 곳입니다.',
      isExternalRegion: true,
      targetRegion: '대전 둔산동',
      detail: {
        detailTags: ['둔산동', '디저트맛집'],
        description: '매일 아침 구워내는 프리미엄 케이크 전문점입니다.',
        rating: 4.7,
        hoursLabel: '11:00 - 22:30',
        reviewCount: 180,
        menu: [
          { id: 'dj-m3', name: '딸기 생크림 케이크', price: '7,500원', desc: '100% 동물성 생크림 수제 케이크', image: '/assets/menu_daelim_tart.jpg' }
        ],
        reviews: []
      }
    },
    {
      id: 'daejeon-3',
      name: '프랭크커피바 대전둔산점',
      location: '대전 서구 대덕대로217번길 19',
      description: '유럽 빈티지 에스프레소 바 감성과 시그니처 크림커피 전문점',
      match: 93,
      tags: ['#에스프레소바', '#둔산동', '#크로플'],
      mood: ['vintage', 'dreamy'],
      bookmarked: false,
      hero: false,
      photo: { type: 'image', image: '/assets/caffa_002.jpg', from: '#487eb0', to: '#40739e', emoji: '☕' },
      aiReason: '유럽풍의 이국적 감성과 시그니처 크림 커피의 풍미가 뛰어난 명소입니다.',
      isExternalRegion: true,
      targetRegion: '대전 둔산동',
      detail: {
        detailTags: ['둔산동', '에스프레소바'],
        description: '유럽 감성의 힙한 에스프레소 바입니다.',
        rating: 4.6,
        hoursLabel: '12:00 - 22:00',
        reviewCount: 110,
        menu: [
          { id: 'dj-m4', name: '프랭크 커피', price: '6,000원', desc: '달콤한 크림이 올라간 아인슈페너', image: '/assets/menu_grandpa_einspanner.jpg' }
        ],
        reviews: []
      }
    }
  ],
  부산: [
    {
      id: 'busan-1',
      name: '랑데자뷰 해운대점',
      location: '부산 해운대구 달맞이길 62',
      description: '해운대 바다 파노라마 뷰와 제주 감성 현무암 인테리어',
      match: 98,
      tags: ['#해운대', '#오션뷰', '#제주감성'],
      mood: ['dreamy', 'calm'],
      bookmarked: false,
      hero: true,
      photo: { type: 'image', image: '/assets/caffa_003.jpg', from: '#8ec5fc', to: '#e0c3fc', emoji: '🌊' },
      aiReason: '탁 트인 해운대 오션뷰와 현무암 인테리어가 어우러진 분위기 맛집입니다.',
      isExternalRegion: true,
      targetRegion: '부산 해운대',
      detail: {
        detailTags: ['해운대', '오션뷰'],
        description: '바다가 한눈에 보이는 힐링 오션뷰 카페입니다.',
        rating: 4.8,
        hoursLabel: '09:30 - 22:00',
        reviewCount: 240,
        menu: [],
        reviews: []
      }
    }
  ],
  제주: [
    {
      id: 'jeju-1',
      name: '울트라마린',
      location: '제주 제주시 한경면 일주서로 4611',
      description: '제주 서쪽 노을이 일품인 차분하고 아늑한 스페셜티 로스터리',
      match: 98,
      tags: ['#제주카페', '#노을맛집', '#스페셜티'],
      mood: ['calm', 'cozy'],
      bookmarked: false,
      hero: true,
      photo: { type: 'image', image: '/assets/caffa_004.jpg', from: '#fbc531', to: '#487eb0', emoji: '🌅' },
      aiReason: '제주의 붉은 노을과 함께 스페셜티 커피를 맛볼 수 있는 곳입니다.',
      isExternalRegion: true,
      targetRegion: '제주도',
      detail: {
        detailTags: ['제주', '노을'],
        description: '제주 바다와 일몰이 아름다운 공간입니다.',
        rating: 4.9,
        hoursLabel: '11:00 - 19:30',
        reviewCount: 310,
        menu: [],
        reviews: []
      }
    }
  ]
};

export function mockAiSearch(moodIds: string[], description: string): Cafe[] {
  const query = description.trim().toLowerCase();
  
  // 외부 지역 검색어 즉시 감지 (대전, 둔산, 부산, 제주)
  for (const [regionKey, cafeList] of Object.entries(REGIONAL_MOCK_CAFES)) {
    if (query.includes(regionKey) || (regionKey === '대전' && query.includes('둔산'))) {
      return cafeList;
    }
  }

  const words = query ? query.split(/\s+/).filter(Boolean) : [];

  const scored = MOCK_CAFES.map((cafe) => {
    let score = 0;

    // 1. 무드 태그 일치 검사
    moodIds.forEach((m) => {
      if (cafe.mood.includes(m)) {
        score += 25;
      }
    });

    // 2. 검색어 키워드 매칭 검사
    if (words.length > 0) {
      const cafeName = cafe.name.toLowerCase();
      const cafeDesc = cafe.description.toLowerCase();
      const detailDesc = cafe.detail.description.toLowerCase();
      const tagsStr = [...cafe.tags, ...cafe.detail.detailTags].join(' ').toLowerCase();
      const menuStr = cafe.detail.menu.map((m) => `${m.name} ${m.desc}`).join(' ').toLowerCase();
      const reviewsStr = cafe.detail.reviews.map((r) => `${r.text} ${r.tags.join(' ')}`).join(' ').toLowerCase();

      words.forEach((w) => {
        if (cafeName.includes(w)) score += 40;
        if (tagsStr.includes(w)) score += 30;
        if (menuStr.includes(w)) score += 35;
        if (cafeDesc.includes(w) || detailDesc.includes(w)) score += 25;
        if (reviewsStr.includes(w)) score += 15;
      });
    }

    // 키워드가 없거나 매칭이 적은 경우 기본 베이스 점수 부여
    if (words.length === 0 && moodIds.length === 0) {
      score = cafe.match;
    }

    return { cafe, score };
  });

  // 점수 내림차순 정렬
  scored.sort((a, b) => b.score - a.score);

  const topScore = scored[0].score || 1;

  return scored.map(({ cafe, score }, idx) => {
    // 상대적 매칭률 계산 (82% ~ 99%)
    let matchRate: number;
    if (words.length === 0 && moodIds.length === 0) {
      matchRate = cafe.match;
    } else if (score > 0) {
      matchRate = Math.min(99, Math.max(84, Math.round(85 + (score / (topScore + 10)) * 14) - idx * 2));
    } else {
      matchRate = Math.max(78, 86 - idx * 3);
    }

    return {
      ...cafe,
      match: matchRate,
    };
  });
}


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

export function getCafeById(id: string): Cafe | null {
  return MOCK_CAFES.find((cafe) => cafe.id === id) || null;
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

export function mockAiSearch(moodIds: string[], description: string): Cafe[] {
  let results = MOCK_CAFES.filter((cafe) =>
    moodIds.length === 0 ? true : cafe.mood.some((m) => moodIds.includes(m))
  );

  if (results.length === 0) results = [...MOCK_CAFES];

  const seed = description.length % 5;
  results = results
    .map((c, i) => ({ ...c, match: Math.max(80, c.match - i * 2 - seed) }))
    .sort((a, b) => b.match - a.match);

  return results;
}

import type { Cafe } from '../store/types';
import { mockAiSearch } from '../data/mockData';

export interface GeminiSearchResult {
  cafes: Cafe[];
  isRealAi: boolean;
  aiErrorMessage?: string;
  isExternalRegion?: boolean;
  targetRegion?: string;
}

export async function searchCafesWithGemini(
  moodIds: string[],
  description: string,
  allCafes: Cafe[]
): Promise<GeminiSearchResult> {
  const envKey =
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY ||
    import.meta.env.VITE_API_KEY ||
    import.meta.env.PUBLIC_FIREBASE_API_KEY;

  const apiKey = (envKey || '').trim();

  // API 키가 없는 경우 스마트 로컬 알고리즘 적용
  if (!apiKey) {
    console.log('[Gemini AI] API key missing. Using smart fallback matching.');
    const fallbackResults = mockAiSearch(moodIds, description);
    const enrichedResults = fallbackResults.map((cafe, idx) => ({
      ...cafe,
      aiReason: generateLocalAiReason(cafe, moodIds, description, idx === 0),
    }));
    return { cafes: enrichedResults, isRealAi: false };
  }

  // Gemini API 프롬프트: 전국 지역 인식 및 DB 매칭 프롬프트
  const systemPrompt = `
You are a nationwide AI cafe & place curator in South Korea for the MoodPlace app.
User request:
- Selected Moods: [${moodIds.join(', ')}]
- Search Query Text: "${description}"

APP LOCAL DATABASE CAFES (Seongsu-dong, Seoul):
${JSON.stringify(
  allCafes.map((c) => ({
    id: c.id,
    name: c.name,
    location: c.location,
    description: c.description,
    tags: c.tags,
    mood: c.mood,
    detailDesc: c.detail.description,
    menu: c.detail.menu.map((m) => m.name).join(', '),
  })),
  null,
  2
)}

CRITICAL INSTRUCTIONS:
1. REGION ANALYSIS: Check if the user's Search Query Text specifies a region/city/district in Korea OUTSIDE Seongsu-dong (for example: "대전 둔산동", "대전", "둔산동", "부산 해운대", "강남역", "제주도", "수원 행궁동", "대구 동성로", "인천", "광주" etc.).

2. IF USER REQUESTS AN OUTSIDE REGION (e.g. "대전 둔산동"):
   - DO NOT limit yourself to Seongsu-dong cafes.
   - Generate 3 to 4 REAL, FAMOUS, HIGHLY-RATED actual cafes located in that requested region (e.g., real famous cafes in Daejeon Dunsan-dong such as 홀리크로스, 크러쉬온바이트, 프랭크커피바 대전둔산점, 슬로울리 인 둔산 etc.).
   - Set "isExternalRegion": true
   - Set "targetRegion": string of requested region (e.g. "대전 둔산동")
   - Provide real location address (e.g. "대전 서구 둔산동"), realistic description, match score (90 to 99), tags array, mood array, and a friendly 1-2 sentence Korean "aiReason" explaining why this real place in that region fits the user's request.

3. IF USER IS SEARCHING WITHIN SEONGSU-DONG OR GENERAL MOOD (e.g. "조용한 말차", "베이커리", "성수동"):
   - Match and rank the LOCAL DATABASE CAFES list.
   - Set "isExternalRegion": false
   - Set "targetRegion": ""

Return ONLY a valid JSON array of objects without markdown formatting.
Each JSON object MUST have keys:
- "id": string (use database cafe id OR a custom unique string if external region)
- "name": string
- "location": string
- "description": string
- "match": number (80 to 99)
- "tags": string[]
- "mood": string[]
- "aiReason": string (1-2 sentences in Korean)
- "isExternalRegion": boolean
- "targetRegion": string
`;

  const models = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
  let lastError = '';

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(1800), // 1.8초 초고속 타임아웃
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: systemPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 350,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        lastError = errorData.error?.message || `HTTP ${response.status}`;
        console.warn(`[Gemini AI] Model ${model} returned error:`, lastError);
        continue;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const cleanJsonStr = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const aiRecommendations: Array<{
        id: string;
        name: string;
        location?: string;
        description?: string;
        match: number;
        tags?: string[];
        mood?: string[];
        aiReason: string;
        isExternalRegion?: boolean;
        targetRegion?: string;
      }> = JSON.parse(cleanJsonStr);

      if (Array.isArray(aiRecommendations) && aiRecommendations.length > 0) {
        const dbMap = new Map(allCafes.map((c) => [c.id, c]));
        const isExternal = aiRecommendations.some((item) => item.isExternalRegion);
        const targetReg = aiRecommendations.find((item) => item.targetRegion)?.targetRegion || '';

        const results: Cafe[] = aiRecommendations.map((item, idx) => {
          const dbCafe = dbMap.get(item.id);
          if (dbCafe && !item.isExternalRegion) {
            return {
              ...dbCafe,
              match: item.match || dbCafe.match,
              aiReason: item.aiReason,
              isExternalRegion: false,
            };
          }
          // 외부 지역 또는 동적 생성 카페인 경우 전체 Cafe 객체 구성
          return createExternalCafe(item, idx);
        });

        results.sort((a, b) => b.match - a.match);

        return {
          cafes: results,
          isRealAi: true,
          isExternalRegion: isExternal,
          targetRegion: targetReg,
        };
      }
    } catch (err: any) {
      lastError = err?.message || 'Network error';
      console.warn(`[Gemini AI] Failed to query model ${model}:`, err);
    }
  }

  // API 호출 실패 시 스마트 로컬 폴백
  console.log('[Gemini AI] Fallback triggered due to API response error:', lastError);
  const fallbackCafes = mockAiSearch(moodIds, description).map((cafe, idx) => ({
    ...cafe,
    aiReason: generateLocalAiReason(cafe, moodIds, description, idx === 0),
  }));

  return { cafes: fallbackCafes, isRealAi: false, aiErrorMessage: lastError };
}

function createExternalCafe(item: any, idx: number): Cafe {
  const gradients = [
    { from: '#e0c3fc', to: '#8ec5fc', emoji: '☕' },
    { from: '#fbc531', to: '#e1b12c', emoji: '🍰' },
    { from: '#487eb0', to: '#40739e', emoji: '🌿' },
    { from: '#e84118', to: '#c23616', emoji: '✨' },
  ];
  const g = gradients[idx % gradients.length];
  const realImages = [
    '/assets/cafe_calm_forest.jpg',
    '/assets/caffe_001.jpg',
    '/assets/caffa_002.jpg',
    '/assets/cafe_forest_lounge.jpg',
    '/assets/cafe_urban_nest.jpg',
    '/assets/caffa_003.jpg',
    '/assets/cafe_vivid_garden.jpg',
    '/assets/caffa_004.jpg',
    '/assets/cafe_quiet_tea_room.jpg',
    '/assets/cafe_brick_atelier.jpg',
  ];

  const cafeId = item.id || `ext-${idx}-${Date.now()}`;
  const cafeName = item.name || '추천 카페';
  const cafeLoc = item.location || '원하시는 검색 지역';
  const selectedImage = item.image || realImages[idx % realImages.length];

  const getMenuPhoto = (name: string, mIdx: number): string => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('말차') || lower.includes('녹차') || lower.includes('티')) return '/assets/menu_matcha_latte.jpg';
    if (lower.includes('크림') || lower.includes('아인슈페너') || lower.includes('에스프레소')) return '/assets/menu_grandpa_einspanner.jpg';
    if (lower.includes('케이크') || lower.includes('타르트') || lower.includes('디저트')) return '/assets/menu_daelim_tart.jpg';
    if (lower.includes('크로플') || lower.includes('스콘') || lower.includes('와플')) return '/assets/menu_center_scone.jpg';
    if (lower.includes('도넛') || lower.includes('빵') || lower.includes('롤') || lower.includes('팡도르')) return '/assets/menu_onion_pandoro.jpg';
    
    const defaults = [
      '/assets/menu_onion_coffee.jpg',
      '/assets/menu_daelim_cream.jpg',
      '/assets/menu_grandpa_einspanner.jpg',
      '/assets/menu_matchacha_dessert.jpg',
    ];
    return defaults[mIdx % defaults.length];
  };

  const menuItems = Array.isArray(item.menu) && item.menu.length > 0
    ? item.menu.map((m: any, mIdx: number) => ({
        id: `m-${idx}-${mIdx}`,
        name: m.name || `${cafeName} 시그니처 음료`,
        price: m.price || '6,500원',
        desc: m.desc || `${cafeName}만의 정성이 담긴 깊은 풍미의 시그니처 메뉴입니다.`,
        image: m.image || getMenuPhoto(m.name || '', mIdx),
      }))
    : [
        {
          id: `m-${idx}-0`,
          name: `${cafeName} 시그니처 크림 라떼`,
          price: '6,500원',
          desc: '고소하고 부드러운 수제 생크림과 딥한 샷이 어우러진 시그니처 음료',
          image: '/assets/menu_grandpa_einspanner.jpg',
        },
        {
          id: `m-${idx}-1`,
          name: `${cafeName} 수제 대표 디저트`,
          price: '7,500원',
          desc: '매일 아침 매장에서 직접 구워내는 달콤하고 고소한 수제 대표 디저트',
          image: '/assets/menu_daelim_tart.jpg',
        },
      ];

  const reviewsList = Array.isArray(item.reviews) && item.reviews.length > 0
    ? item.reviews.map((r: any, rIdx: number) => ({
        id: `r-${idx}-${rIdx}`,
        author: r.author || (rIdx === 0 ? '김민지' : '박지훈'),
        initial: r.author ? r.author[0] : (rIdx === 0 ? 'K' : 'P'),
        rating: r.rating || 5,
        date: r.date || `${rIdx + 1}일 전`,
        text: r.text || `${cafeName} 방문했는데 인테리어가 정말 아늑하고 시그니처 음료와 디저트 조합이 최고였습니다!`,
        tags: Array.isArray(r.tags) ? r.tags : ['#분위기맛집', '#데이트추천'],
        likes: 12 - rIdx * 3,
        likedByUser: false,
      }))
    : [
        {
          id: `r-${idx}-0`,
          author: '김민지',
          initial: 'K',
          rating: 5,
          date: '1일 전',
          text: `${cafeName} 방문했는데 요청했던 인테리어 분위기가 기대 이상으로 정말 좋았어요! 시그니처 음료도 부드럽고 수제 디저트와의 조합이 최고입니다.`,
          tags: ['#분위기맛집', '#AI추천명소'],
          likes: 14,
          likedByUser: false,
        },
        {
          id: `r-${idx}-1`,
          author: '박지훈',
          initial: 'P',
          rating: 5,
          date: '3일 전',
          text: `주말에 다녀왔는데 공간도 쾌적하고 조명과 인테리어 감성이 진짜 인상적이네요. 재방문 의사 200%입니다!`,
          tags: ['#재방문의사있음', '#감성카페'],
          likes: 8,
          likedByUser: false,
        },
      ];

  return {
    id: cafeId,
    name: cafeName,
    location: cafeLoc,
    description: item.description || `${cafeName}의 분위기 있는 명소 공간입니다.`,
    match: typeof item.match === 'number' ? item.match : parseInt(item.match) || 96 - idx * 2,
    tags: Array.isArray(item.tags) ? item.tags : ['#지역핫플', '#AI추천'],
    mood: Array.isArray(item.mood) ? item.mood : ['cozy'],
    bookmarked: false,
    hero: idx === 0,
    photo: {
      type: 'image',
      image: selectedImage,
      from: g.from,
      to: g.to,
      emoji: g.emoji,
    },
    aiReason: item.aiReason || `${cafeName}은(는) 요청하신 분위기와 지역에 부합하는 명소입니다.`,
    isExternalRegion: true,
    targetRegion: item.targetRegion || '',
    detail: {
      detailTags: Array.isArray(item.tags) ? item.tags : ['#AI추천', '#지역명소'],
      description: item.description || `${cafeName}은(는) 해당 지역에서 분위기와 커피 맛으로 사랑받는 장소입니다.`,
      rating: 4.8,
      hoursLabel: '10:00 - 22:00',
      reviewCount: 120 + idx * 15,
      menu: menuItems,
      reviews: reviewsList,
      reservation: {
        rating: 4.8,
        reviewCountLabel: `리뷰 ${120 + idx * 15}+`,
        description: `${cafeName}의 정보입니다.`,
        facilities: ['wifi', 'parking', 'group'],
        notice: '• 이용 시간 및 주차 정보는 방문 전 확인을 추천합니다.',
      },
    },
  };
}

function generateLocalAiReason(
  cafe: Cafe,
  moodIds: string[],
  description: string,
  isTopMatch: boolean
): string {
  const moodLabels: Record<string, string> = {
    cozy: '포근하고 아늑한',
    calm: '차분하고 고요한',
    energetic: '활기차고 힙한',
    dreamy: '몽환적이고 감성적인',
    minimal: '미니멀하고 깔끔한',
    vintage: '빈티지한 인더스트리얼',
    warm: '따뜻한 햇살이 머무는',
  };

  const requestedMoodStr = moodIds.map((id) => moodLabels[id] || id).join(', ');
  const query = description.trim().toLowerCase();
  const words = query ? query.split(/\s+/).filter(Boolean) : [];

  const matchedMenu = cafe.detail.menu.find((m) =>
    words.some((w) => m.name.toLowerCase().includes(w) || m.desc.toLowerCase().includes(w))
  );

  const matchedTag = [...cafe.tags, ...cafe.detail.detailTags].find((t) =>
    words.some((w) => t.toLowerCase().includes(w))
  );

  if (words.length > 0) {
    if (matchedMenu) {
      return `요청하신 "${description}" 검색어에 맞춰 시그니처 메뉴인 '${matchedMenu.name}'(${matchedMenu.price})을 맛볼 수 있는 ${cafe.name}을 추천합니다.`;
    }
    if (matchedTag) {
      return `요청하신 취향과 #${matchedTag} 특색이 가장 잘 어우러진 ${cafe.name}입니다.`;
    }
    if (isTopMatch) {
      return `작성해주신 "${description}" 분위기와 ${requestedMoodStr ? requestedMoodStr + ' ' : ''}무드에 가장 높은 적합도를 보인 1위 공간입니다.`;
    }
    return `${cafe.name}의 고유한 감성과 인테리어가 요청해주신 '${description}' 분위기와 자연스럽게 조화를 이룹니다.`;
  }

  if (requestedMoodStr) {
    return isTopMatch
      ? `선택하신 [${requestedMoodStr}] 무드에 부합하는 최고의 맞춤 추천 장소입니다.`
      : `${requestedMoodStr} 감성을 고스란히 느낄 수 있는 ${cafe.name}에서 특별한 여유를 즐겨보세요.`;
  }

  return `독보적인 분위기와 인테리어를 자랑하는 ${cafe.name}입니다.`;
}

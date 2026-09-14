import type { Cafe } from '../src/store/types';

export interface GeminiSearchResult {
  cafes: Cafe[];          // Gemini AI 추천 결과 (= 사용자 무드에 적합한 상위 카페)
  allKakaoCafes?: Cafe[]; // Kakao API가 확보한 전체 실제 카페 (지도 마커용)
  isRealAi: boolean;
  aiErrorMessage?: string;
  isExternalRegion?: boolean;
  targetRegion?: string;
}

interface GroundedCafeItem {
  id: string;
  name: string;
  address: string;
  mapsUrl: string | null;
  description: string;
  moodTags: string[];
  matchScore: number;
  reason: string;
  rating: number | null;
  reviewCount: number | null;
  hoursLabel: string | null;
}

const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.7-flash'];

const MOOD_LABELS: Record<string, string> = {
  cozy: '조용한',
  sensual: '감성적인',
  view: '뷰가 좋은',
  work: '작업하기 좋은',
  desert: '디저트가 맛있는',
  terrace: '테라스가 있는',
};

const PLACEHOLDER_IMAGES = [
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

function getPlaceholder(idx: number): string {
  return PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length];
}

function deduplicateKakaoCafes(rawCafes: any[]): any[] {
  const seenIds = new Set<string>();
  const seenNameAddr = new Set<string>();
  const seenNameCoords = new Set<string>();
  const result: any[] = [];

  for (const c of rawCafes) {
    const id = String(c.id || c.kakaoPlaceId || '');
    const name = (c.place_name || c.name || '').trim();
    const addr = (c.road_address_name || c.address_name || c.address || c.location || '').trim();
    const x = String(c.x || (c.coords ? c.coords[1] : ''));
    const y = String(c.y || (c.coords ? c.coords[0] : ''));

    const nameAddrKey = `${name}|${addr}`;
    const nameCoordsKey = `${name}|${y},${x}`;

    if (id && seenIds.has(id)) continue;
    if (addr && seenNameAddr.has(nameAddrKey)) continue;
    if (x && y && seenNameCoords.has(nameCoordsKey)) continue;

    if (id) seenIds.add(id);
    if (addr) seenNameAddr.add(nameAddrKey);
    if (x && y) seenNameCoords.add(nameCoordsKey);

    result.push(c);
  }

  return result;
}

function isDirectImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    return /\.(jpg|jpeg|png|webp|gif)(\?|$)/.test(path);
  } catch {
    return false;
  }
}

function extractImageUrlsFromChunks(chunks: any[]): { imageUrl: string; sourceUrl: string } | null {
  if (!Array.isArray(chunks)) return null;

  for (const chunk of chunks) {
    const uri: string = chunk?.web?.uri || '';
    if (!uri) continue;
    if (isDirectImageUrl(uri)) {
      return { imageUrl: uri, sourceUrl: uri };
    }
  }

  const firstWebUri = chunks.find((c) => c?.web?.uri)?.web?.uri;
  if (firstWebUri) {
    return { imageUrl: '', sourceUrl: firstWebUri };
  }

  return null;
}

function parseImageUrlFromText(text: string): string {
  const imgPattern = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?/gi;
  const matches = text.match(imgPattern);
  if (matches && matches.length > 0) {
    return matches[0];
  }
  return '';
}

function extractSearchKeywords(cafeName: string, cafeAddress: string) {
  const branchMatch = cafeName.match(/([가-힣a-zA-Z0-9]+점)$/);
  const branchName = branchMatch ? branchMatch[1] : '';

  const regionMatches = cafeAddress.match(/([가-힣]+(?:동|구|시|군|읍|면))/g) || [];
  const mainRegion = regionMatches.length > 0 ? regionMatches[regionMatches.length - 1] : '';
  const cityRegion = regionMatches.length > 1 ? regionMatches[0] : '';

  return { branchName, mainRegion, cityRegion };
}

function verifyImageLocationMatch(
  cafeName: string,
  cafeAddress: string,
  chunks: any[],
  parsedText: string
): boolean {
  const { branchName, mainRegion, cityRegion } = extractSearchKeywords(cafeName, cafeAddress);

  const cleanCafeName = cafeName.replace(/\s/g, '').toLowerCase();
  const coreName = cleanCafeName.replace(/(카페|cafe|점)$/g, '');

  const allChunkTitles = chunks.map((c) => (c?.web?.title || '').toLowerCase()).join(' ');
  const allChunkUris = chunks.map((c) => (c?.web?.uri || '').toLowerCase()).join(' ');
  const fullText = (parsedText + ' ' + allChunkTitles + ' ' + allChunkUris).toLowerCase();

  const containsName = fullText.includes(coreName.slice(0, 3));
  if (!containsName) return false;

  if (branchName) {
    const branchKey = branchName.replace(/\s/g, '').toLowerCase();
    if (fullText.includes('점') && !fullText.includes(branchKey)) {
      return false;
    }
  }

  if (mainRegion) {
    const regionKey = mainRegion.replace(/(동|구|시)$/, '').toLowerCase();
    const hasRegionMatch = fullText.includes(regionKey) || (cityRegion && fullText.includes(cityRegion.toLowerCase()));
    if (!hasRegionMatch && chunks.length > 0) {
      return false;
    }
  }

  return true;
}

function detectExternalRegion(description: string): boolean {
  if (!description || description.trim() === '') return false;
  const lowerDesc = description.trim().toLowerCase();

  const externalKeywords = [
    '대전', '둔산', '둔산동', '부산', '해운대', '서면', '광안리',
    '제주', '제주시', '서귀포', '강남', '강남역', '홍대', '홍대입구',
    '연남동', '마포', '망원', '이태원', '한남동', '대구', '동성로',
    '광주', '수원', '인천', '송도', '판교', '분당', '경주', '전주',
    '강릉', '속초', '여수',
  ];

  return externalKeywords.some((kw) => lowerDesc.includes(kw));
}

function extractRegion(description: string): string {
  const regions: Record<string, string> = {
    '대전 둔산': '대전 서구 둔산동',
    '대전둔산': '대전 서구 둔산동',
    '둔산동': '대전 서구 둔산동',
    '대전': '대전광역시',
    '부산': '부산광역시',
    '해운대': '부산 해운대구',
    '제주': '제주특별자치도',
    '강남': '서울 강남구',
    '홍대': '서울 마포구 홍대',
    '대구': '대구광역시',
    '광주': '광주광역시',
    '수원': '수원시',
  };

  for (const [key, value] of Object.entries(regions)) {
    if (description.includes(key)) return value;
  }
  return '해당';
}

// ─────────────────────────────────────────────────────────────
// Vercel Serverless Function Handler
// ─────────────────────────────────────────────────────────────
export default async function handler(req: any, res: any) {
  // CORS & Method Check
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  const { moodIds = [], description = '', allCafes = [] } = req.body || {};

  if (!apiKey) {
    console.warn('[Vercel Gemini API] GEMINI_API_KEY missing on server.');
    return res.status(200).json({
      cafes: [],
      isRealAi: false,
      aiErrorMessage: 'GEMINI_API_KEY missing on server',
    });
  }

  const isExternalRegionQuery = detectExternalRegion(description);

  if (!isExternalRegionQuery) {
    const result = await searchLocalCafes(moodIds, description, allCafes, apiKey, 'Seongsu-dong, Seoul');
    // 비외부지역의 경우, allCafes가 이미 Kakao로 확보된 전체 목록
    return res.status(200).json({ ...result, allKakaoCafes: allCafes });
  } else {
    const targetRegion = extractRegion(description);
    const result = await searchExternalRegionWithKakao(apiKey, targetRegion, description, moodIds);
    return res.status(200).json(result);
  }
}

// ─────────────────────────────────────────────────────────────
// 로컬 DB 카페 매칭 (성수동 내부)
// ─────────────────────────────────────────────────────────────
async function searchLocalCafes(
  moodIds: string[],
  description: string,
  allCafes: any[],
  apiKey: string,
  region: string = 'Seongsu-dong, Seoul'
): Promise<GeminiSearchResult> {
  const systemPrompt = `
You are a cafe curator AI for MoodPlace app (${region}).
User request:
- Selected Moods: [${moodIds.join(', ')}]
- Search Query Text: "${description}"

APP LOCAL DATABASE CAFES (${region}):
${JSON.stringify(
    allCafes.map((c) => ({
      id: c.id,
      name: c.name,
      location: c.location || c.address,
      description: c.description || '',
      tags: c.tags || [],
      mood: c.mood || [],
      detailDesc: c.detail?.description || '',
      menu: c.detail?.menu?.map((m: any) => m.name).join(', ') || '',
    })),
    null,
    2
  )}

INSTRUCTIONS:
- Match and rank the LOCAL DATABASE CAFES based on the user's mood and query.
- Return ONLY a valid JSON array, no markdown.
- Each object MUST have:
  - "id": string (database cafe id)
  - "name": string
  - "match": number (80 to 99)
  - "aiReason": string (1-2 sentences in Korean explaining why this cafe fits)
- Do NOT generate cafes not in the database.
`;

  const models = GEMINI_MODELS;
  let lastError = '';

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 400 },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        lastError = (errorData as any).error?.message || `HTTP ${response.status}`;
        continue;
      }

      const data = await response.json();
      const rawText = (data as any).candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

      const aiRecs: Array<{ id: string; name: string; match: number; aiReason: string }> =
        JSON.parse(cleanJson);

      if (Array.isArray(aiRecs) && aiRecs.length > 0) {
        const dbMap = new Map(allCafes.map((c) => [c.id, c]));
        const results: Cafe[] = aiRecs.reduce<Cafe[]>((acc, item) => {
          const dbCafe = dbMap.get(item.id);
          if (!dbCafe) return acc;
          acc.push({ ...dbCafe, match: item.match || dbCafe.match || 80, aiReason: item.aiReason });
          return acc;
        }, []);

        results.sort((a, b) => b.match - a.match);
        return { cafes: results, isRealAi: true, isExternalRegion: region !== 'Seongsu-dong, Seoul', targetRegion: region !== 'Seongsu-dong, Seoul' ? region : '' };
      }
    } catch (err: any) {
      lastError = err?.message || 'Network error';
    }
  }

  return { cafes: [], isRealAi: false, aiErrorMessage: lastError };
}

// ─────────────────────────────────────────────────────────────
// Kakao Local API 활용 외부 지역 검색 및 Gemini 랭킹
// ─────────────────────────────────────────────────────────────
async function searchExternalRegionWithKakao(
  geminiApiKey: string,
  targetRegion: string,
  description: string,
  moodIds: string[]
): Promise<GeminiSearchResult> {
  const kakaoApiKey = (process.env.KAKAO_REST_API_KEY || '').trim();
  if (!kakaoApiKey) {
    console.warn('[Gemini API] KAKAO_REST_API_KEY is missing for external region search.');
    return { cafes: [], allKakaoCafes: [], isRealAi: false, aiErrorMessage: 'KAKAO_REST_API_KEY missing' };
  }

  try {
    const allCafes: any[] = [];
    const query = `${targetRegion} 카페`;

    // 1. Kakao API로 최대 50개 카페 가져오기 (Keyword Search)
    for (let page = 1; page <= 4; page++) {
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&category_group_code=CE7&sort=accuracy&size=15&page=${page}`,
        {
          headers: { Authorization: `KakaoAK ${kakaoApiKey}` },
        }
      );
      if (!res.ok) break;
      const data = await res.json();
      if (data.documents) {
        allCafes.push(...data.documents);
      }
      if (data.meta?.is_end || allCafes.length >= 50) break;
    }


    if (allCafes.length === 0) {
      return { cafes: [], allKakaoCafes: [], isRealAi: false, aiErrorMessage: 'No cafes found in Kakao API' };
    }

    // 중복 제거 (1. Kakao place id, 2. 이름 + 주소, 3. 이름 + 좌표)
    const uniqueRaw = deduplicateKakaoCafes(allCafes);

    // FindPage/Store가 인식하는 형식으로 매핑 (전체 리스트)
    const allKakaoCafes: any[] = uniqueRaw.slice(0, 50).map((place: any) => ({
      id: `kakao-ext-${place.id}`,
      name: place.place_name || '카페',
      address: place.road_address_name || place.address_name || '주소 없음',
      roadAddress: place.road_address_name || '',
      description: place.category_name || 'Kakao Local 검색으로 발견된 카페입니다.',
      photos: ['/assets/caffe_001.jpg'],
      tags: [{ icon: 'warm', label: place.category_name?.split(' > ').pop() || '카페' }],
      coords: [Number(place.y), Number(place.x)],
      phone: place.phone || '',
      placeUrl: place.place_url || '',
      kakaoPlaceId: String(place.id || ''),
      location: place.road_address_name || place.address_name,
      distance: Number(place.distance || 0),
      mood: [],
      detail: { description: '', menu: [], detailTags: [] },
    }));

    const aiResult = await searchLocalCafes(moodIds, description, allKakaoCafes, geminiApiKey, targetRegion);

    // Gemini 추천 결과를 Kakao 원본 기준으로 검증 (없는 카페 제거)
    const kakaoIdSet = new Set(allKakaoCafes.map((c) => c.id));
    const verifiedAiCafes = aiResult.cafes.filter((c) => kakaoIdSet.has(c.id));

    return {
      cafes: verifiedAiCafes,         // AI 추천 (Kakao 목록 안에서만)
      allKakaoCafes,                  // 전체 Kakao 카페 (지도 마커용)
      isRealAi: aiResult.isRealAi,
      isExternalRegion: true,
      targetRegion,
    };

  } catch (err: any) {
    console.error('searchExternalRegionWithKakao error:', err);
    return { cafes: [], allKakaoCafes: [], isRealAi: false, aiErrorMessage: err.message };
  }
}

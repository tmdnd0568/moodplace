import type { Cafe } from '../src/store/types';

export interface GeminiSearchResult {
  cafes: Cafe[];
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
    const result = await searchLocalCafes(moodIds, description, allCafes, apiKey);
    return res.status(200).json(result);
  } else {
    const targetRegion = extractRegion(description);
    const moodLabel =
      moodIds.length > 0
        ? moodIds.map((id: string) => MOOD_LABELS[id] || id).join(', ')
        : '감성적인';

    const result = await searchWithGrounding(apiKey, targetRegion, moodLabel, description, moodIds);
    return res.status(200).json(result);
  }
}

// ─────────────────────────────────────────────────────────────
// 로컬 DB 카페 매칭 (성수동 내부)
// ─────────────────────────────────────────────────────────────
async function searchLocalCafes(
  moodIds: string[],
  description: string,
  allCafes: Cafe[],
  apiKey: string
): Promise<GeminiSearchResult> {
  const systemPrompt = `
You are a cafe curator AI for MoodPlace app (Seongsu-dong, Seoul).
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
          acc.push({ ...dbCafe, match: item.match || dbCafe.match, aiReason: item.aiReason } as Cafe);
          return acc;
        }, []);

        results.sort((a, b) => b.match - a.match);
        return { cafes: results, isRealAi: true, isExternalRegion: false, targetRegion: '' };
      }
    } catch (err: any) {
      lastError = err?.message || 'Network error';
    }
  }

  return { cafes: [], isRealAi: false, aiErrorMessage: lastError };
}

// ─────────────────────────────────────────────────────────────
// Google Search Grounding (Step1, Step2, Step3)
// ─────────────────────────────────────────────────────────────
async function searchWithGrounding(
  apiKey: string,
  targetRegion: string,
  moodLabel: string,
  description: string,
  moodIds: string[]
): Promise<GeminiSearchResult> {
  const step1Prompt = `
한국 ${targetRegion} 지역에서 "${moodLabel}" 분위기에 잘 맞는 감성 카페를 3~4곳 찾아주세요.
검색 쿼리: "${description}"

Google 검색 결과를 활용해서 실제로 존재하는 카페만 추천하세요.
각 카페에 대해 다음 정보를 알려주세요:
- 카페 이름 (정확한 상호명)
- 주소 (정확한 도로명 또는 지번 주소)
- Google Maps URL (있다면)
- 카페 분위기/특징 설명
- 영업시간 (실제 확인된 경우만, 모르면 "정보 없음"이라고 하세요)
- 평점 (실제 확인된 경우만, 모르면 "정보 없음"이라고 하세요)

중요: 실제로 존재하지 않는 카페나 주소를 절대 만들어내지 마세요.
실제 검색 결과에 기반해서만 답변하세요.
`;

  const buildStep2Prompt = (groundedText: string) => `
다음은 Google 검색으로 확인된 ${targetRegion} 지역의 실제 카페 정보입니다:

---
${groundedText}
---

위 정보를 바탕으로, 사용자 요청에 맞는 카페 추천 결과를 JSON 배열로 출력해주세요.

사용자 무드: [${moodIds.join(', ')}] (${moodLabel})
사용자 검색어: "${description}"

중요 규칙:
1. 위 검색 결과에 실제로 언급된 카페만 포함하세요.
2. 검색 결과에 없는 카페를 새로 만들어내지 마세요.
3. rating, hoursLabel, reviewCount는 검색 결과에서 실제로 확인된 경우만 값을 넣으세요.
   확인되지 않으면 반드시 null로 처리하세요.
4. mapsUrl은 검색 결과에서 실제 Google Maps URL이 확인된 경우만 포함하세요.
   없으면 null로 처리하세요.
5. moodTags, matchScore, reason은 Gemini가 분석해서 생성해도 됩니다.

반드시 아래 JSON 배열 형식으로만 출력하세요 (마크다운 없이):
[
  {
    "id": "cafe_id_lowercase_underscore",
    "name": "카페 이름",
    "address": "실제 주소",
    "mapsUrl": "Google Maps URL 또는 null",
    "description": "카페 분위기 및 특징 설명 (2-3문장)",
    "moodTags": ["#태그1", "#태그2", "#태그3"],
    "matchScore": 85,
    "reason": "이 카페를 추천하는 이유 (1-2문장 한국어)",
    "rating": 4.3,
    "reviewCount": null,
    "hoursLabel": "10:00 - 22:00"
  }
]
`;

  const models = GEMINI_MODELS;
  let lastError = '';

  for (const model of models) {
    try {
      const step1Response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(12000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: step1Prompt }] }],
            tools: [{ google_search: {} }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1200 },
          }),
        }
      );

      if (!step1Response.ok) {
        const errorData = await step1Response.json().catch(() => ({}));
        lastError = (errorData as any).error?.message || `HTTP ${step1Response.status}`;
        continue;
      }

      const step1Data = await step1Response.json();
      const groundedText: string =
        (step1Data as any).candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!groundedText || groundedText.length < 50) {
        lastError = 'Insufficient grounding result';
        continue;
      }

      const step2Response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildStep2Prompt(groundedText) }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1200 },
          }),
        }
      );

      if (!step2Response.ok) {
        const errorData = await step2Response.json().catch(() => ({}));
        lastError = (errorData as any).error?.message || `HTTP ${step2Response.status}`;
        continue;
      }

      const step2Data = await step2Response.json();
      const rawJson: string =
        (step2Data as any).candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();

      let groundedItems: GroundedCafeItem[] = JSON.parse(cleanJson);
      if (!Array.isArray(groundedItems) || groundedItems.length === 0) {
        lastError = 'Empty recommendations from Step2';
        continue;
      }

      groundedItems = groundedItems.filter((item) => {
        const nameSlice = item.name.replace(/\s/g, '').slice(0, 3);
        return groundedText.includes(nameSlice);
      });

      if (groundedItems.length === 0) {
        lastError = 'All recommended cafes not verified in grounding';
        continue;
      }

      const imageResults = await Promise.allSettled(
        groundedItems.map(async (item) => {
          const [rep, interior, exterior, realMenuInfos] = await Promise.all([
            fetchCafeImageWithGrounding(apiKey, model, item.name, item.address),
            fetchCafeInteriorImagesWithGrounding(apiKey, model, item.name, item.address),
            fetchCafeExteriorImagesWithGrounding(apiKey, model, item.name, item.address),
            fetchCafeRealMenuWithGrounding(apiKey, model, item.name, item.address),
          ]);

          const menuItemsWithImages = await Promise.all(
            realMenuInfos.map(async (m, mIdx) => {
              const imgData = await fetchMenuItemImageWithGrounding(apiKey, model, item.name, item.address, m.name);
              return {
                id: `menu-real-${mIdx}-${Date.now()}`,
                name: m.name,
                price: m.price,
                desc: m.desc || `${item.name}의 대표 메뉴`,
                image: imgData?.imageUrl || '/assets/cafe_calm_forest.jpg',
                imageSourceUrl: imgData?.sourceUrl || undefined,
              };
            })
          );

          return { rep, interior, exterior, menuItems: menuItemsWithImages };
        })
      );

      const results: Cafe[] = groundedItems.map((item, idx) => {
        const imgResult = imageResults[idx];
        const spaceData = imgResult.status === 'fulfilled' ? imgResult.value : null;

        return buildGroundedCafe(
          item,
          idx,
          targetRegion,
          spaceData?.rep,
          spaceData?.interior,
          spaceData?.exterior,
          spaceData?.menuItems
        );
      });

      results.sort((a, b) => b.match - a.match);

      return {
        cafes: results,
        isRealAi: true,
        isExternalRegion: true,
        targetRegion,
      };
    } catch (err: any) {
      lastError = err?.message || 'Network error';
    }
  }

  return { cafes: [], isRealAi: false, aiErrorMessage: lastError };
}

async function fetchCafeImageWithGrounding(
  apiKey: string,
  model: string,
  cafeName: string,
  cafeAddress: string
): Promise<{ imageUrl: string; sourceUrl: string } | null> {
  const { branchName, mainRegion, cityRegion } = extractSearchKeywords(cafeName, cafeAddress);
  const regionLabel = [cityRegion, mainRegion].filter(Boolean).join(' ');

  const query1 = `${cafeName} ${cafeAddress}`.trim();
  const query2 = `${cafeName} ${regionLabel} cafe`.trim();
  const query3 = branchName ? `${cafeName} ${branchName}`.trim() : `${cafeName} ${mainRegion}`.trim();

  const searchPrompt = `
카페 대표 이미지 1장 검색:
대상 카페: "${cafeName}"
주소: "${cafeAddress}"

다음 순차적 검색 쿼리를 활용해 이 정확한 카페의 실제 대표 이미지(외관/인테리어) URL을 찾아주세요:
1. ${query1}
2. ${query2}
3. ${query3}

규칙:
1. 다른 지역이나 다른 지점의 이미지는 절대 사용하지 마세요.
2. 이미지 URL은 .jpg, .jpeg, .png, .webp 확장자여야 합니다.
3. 정확히 일치하는 실제 이미지를 찾은 경우에만 해당 이미지 URL을 작성하세요.
4. 불확실하면 NOT_FOUND를 출력하세요. 절대 이미지를 스스로 생성하지 마세요.

형식:
IMAGE_URL: https://...
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: searchPrompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.0, maxOutputTokens: 300 },
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const candidate = (data as any).candidates?.[0];
    const text: string = candidate?.content?.parts?.[0]?.text || '';
    const chunks: any[] = candidate?.groundingMetadata?.groundingChunks || [];

    if (!verifyImageLocationMatch(cafeName, cafeAddress, chunks, text)) return null;

    const chunkResult = extractImageUrlsFromChunks(chunks);
    if (chunkResult && chunkResult.imageUrl) return chunkResult;

    if (!text.includes('NOT_FOUND')) {
      const parsedUrl = parseImageUrlFromText(text);
      if (parsedUrl && parsedUrl.startsWith('http')) {
        return { imageUrl: parsedUrl, sourceUrl: chunkResult?.sourceUrl || parsedUrl };
      }
    }

    if (chunkResult && chunkResult.sourceUrl) {
      return { imageUrl: '', sourceUrl: chunkResult.sourceUrl };
    }

    return null;
  } catch {
    return null;
  }
}

async function fetchCafeInteriorImagesWithGrounding(
  apiKey: string,
  model: string,
  cafeName: string,
  cafeAddress: string
): Promise<{ images: string[]; sourceUrls: string[] }> {
  const { branchName, mainRegion, cityRegion } = extractSearchKeywords(cafeName, cafeAddress);
  const regionLabel = [cityRegion, mainRegion].filter(Boolean).join(' ');

  const query1 = `${cafeName} ${regionLabel} interior`.trim();
  const query2 = branchName ? `${cafeName} ${branchName} 내부` : `${cafeName} 내부 공간`;
  const query3 = `${cafeName} ${cafeAddress} 인테리어`.trim();

  const prompt = `
"${cafeName}" 카페의 실제 실내/인테리어/좌석 공간 사진 검색:
위치: "${cafeAddress}"

다음 쿼리를 참조하여 이 카페의 실제 내부 공간 사진 URL을 찾아주세요:
1. ${query1}
2. ${query2}
3. ${query3}

규칙:
1. 반드시 실내/인테리어/좌석 사진만 선택하세요.
2. 음식, 디저트, 커피잔, 메뉴판 단독 사진은 절대 제외하세요.
3. 다른 지역이나 다른 지점의 사진은 절대 제외하세요.
4. 실제 확인된 사진만 최대 2개까지 알려주세요.
5. 없거나 불확실하면 NOT_FOUND라고 답하세요.

출력 형식:
INTERIOR_URL: https://...
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.0, maxOutputTokens: 300 },
        }),
      }
    );

    if (!response.ok) return { images: [], sourceUrls: [] };

    const data = await response.json();
    const candidate = (data as any).candidates?.[0];
    const text: string = candidate?.content?.parts?.[0]?.text || '';
    const chunks: any[] = candidate?.groundingMetadata?.groundingChunks || [];

    if (!verifyImageLocationMatch(cafeName, cafeAddress, chunks, text)) {
      return { images: [], sourceUrls: [] };
    }

    const imgUrls: string[] = [];
    const srcUrls: string[] = [];

    for (const chunk of chunks) {
      const uri = chunk?.web?.uri;
      if (uri && isDirectImageUrl(uri) && imgUrls.length < 2) {
        imgUrls.push(uri);
        srcUrls.push(uri);
      }
    }

    if (imgUrls.length < 2 && !text.includes('NOT_FOUND')) {
      const imgPattern = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?/gi;
      const matches = text.match(imgPattern) || [];
      for (const m of matches) {
        if (!imgUrls.includes(m) && imgUrls.length < 2) {
          imgUrls.push(m);
          srcUrls.push(chunks[0]?.web?.uri || m);
        }
      }
    }

    return { images: imgUrls, sourceUrls: srcUrls };
  } catch {
    return { images: [], sourceUrls: [] };
  }
}

async function fetchCafeExteriorImagesWithGrounding(
  apiKey: string,
  model: string,
  cafeName: string,
  cafeAddress: string
): Promise<{ images: string[]; sourceUrls: string[] }> {
  const { branchName, mainRegion, cityRegion } = extractSearchKeywords(cafeName, cafeAddress);
  const regionLabel = [cityRegion, mainRegion].filter(Boolean).join(' ');

  const query1 = `${cafeName} ${regionLabel} exterior`.trim();
  const query2 = branchName ? `${cafeName} ${branchName} 외관` : `${cafeName} 매장 외관`;
  const query3 = `${cafeName} ${cafeAddress} entrance`.trim();

  const prompt = `
"${cafeName}" 카페의 실제 외관/건물/출입구 사진 검색:
위치: "${cafeAddress}"

다음 쿼리를 참조하여 이 카페의 실제 외관 사진 URL을 찾아주세요:
1. ${query1}
2. ${query2}
3. ${query3}

규칙:
1. 반드시 매장 외관, 건물 전경, 출입구, 간판 사진만 선택하세요.
2. 실내, 음식, 메뉴판 사진은 제외하세요.
3. 다른 지역이나 다른 지점의 외관 사진은 절대 제외하세요.
4. 실제 확인된 사진만 최대 1개 알려주세요.
5. 없거나 불확실하면 NOT_FOUND라고 답하세요.

출력 형식:
EXTERIOR_URL: https://...
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.0, maxOutputTokens: 300 },
        }),
      }
    );

    if (!response.ok) return { images: [], sourceUrls: [] };

    const data = await response.json();
    const candidate = (data as any).candidates?.[0];
    const text: string = candidate?.content?.parts?.[0]?.text || '';
    const chunks: any[] = candidate?.groundingMetadata?.groundingChunks || [];

    if (!verifyImageLocationMatch(cafeName, cafeAddress, chunks, text)) {
      return { images: [], sourceUrls: [] };
    }

    const imgUrls: string[] = [];
    const srcUrls: string[] = [];

    for (const chunk of chunks) {
      const uri = chunk?.web?.uri;
      if (uri && isDirectImageUrl(uri) && imgUrls.length < 1) {
        imgUrls.push(uri);
        srcUrls.push(uri);
      }
    }

    if (imgUrls.length < 1 && !text.includes('NOT_FOUND')) {
      const imgPattern = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?/gi;
      const matches = text.match(imgPattern) || [];
      for (const m of matches) {
        if (!imgUrls.includes(m) && imgUrls.length < 1) {
          imgUrls.push(m);
          srcUrls.push(chunks[0]?.web?.uri || m);
        }
      }
    }

    return { images: imgUrls, sourceUrls: srcUrls };
  } catch {
    return { images: [], sourceUrls: [] };
  }
}

interface GroundedMenuItemInfo {
  name: string;
  price: string | null;
  desc: string;
}

async function fetchCafeRealMenuWithGrounding(
  apiKey: string,
  model: string,
  cafeName: string,
  cafeAddress: string
): Promise<GroundedMenuItemInfo[]> {
  const prompt = `
"${cafeName}" (${cafeAddress}) 카페의 실제 확인 가능한 대표 메뉴 2~3개를 찾아주세요.

규칙:
1. 실제로 판매가 확인되는 대표 메뉴만 2~3개 추출하세요.
2. 메뉴명을 임의로 생성하지 마세요. 불확실하면 출력하지 마세요.
3. 가격은 실제 확인된 경우만 "6,000원" 형식으로 적고, 확인할 수 없으면 null로 처리하세요. 가격을 지어내지 마세요.
4. 반드시 JSON 배열로만 출력하세요 (마크다운 없이).

형식:
[
  { "name": "실제 메뉴명", "price": "6,000원 또는 null", "desc": "메뉴 간단 설명" }
]
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.0, maxOutputTokens: 300 },
        }),
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const candidate = (data as any).candidates?.[0];
    const text: string = candidate?.content?.parts?.[0]?.text || '';
    const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    const parsed: GroundedMenuItemInfo[] = JSON.parse(cleanJson);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 3);
    }
    return [];
  } catch {
    return [];
  }
}

async function fetchMenuItemImageWithGrounding(
  apiKey: string,
  model: string,
  cafeName: string,
  cafeAddress: string,
  menuName: string
): Promise<{ imageUrl: string; sourceUrl: string } | null> {
  const { branchName, mainRegion, cityRegion } = extractSearchKeywords(cafeName, cafeAddress);
  const regionLabel = [cityRegion, mainRegion].filter(Boolean).join(' ');

  const query1 = branchName ? `${cafeName} ${branchName} ${menuName}` : `${cafeName} ${mainRegion} ${menuName}`;
  const query2 = `${cafeName} ${regionLabel} ${menuName}`;
  const query3 = `${cafeName} ${menuName} menu`;

  const prompt = `
"${cafeName}" 카페의 실제 메뉴 "${menuName}" 사진 검색:
위치: "${cafeAddress}"

다음 쿼리를 순차 참조하여 실제 "${menuName}" 음식/음료 사진 URL을 찾아주세요:
1. ${query1}
2. ${query2}
3. ${query3}

규칙:
1. 반드시 해당 메뉴("${menuName}")의 음식/음료 사진만 선택하세요.
2. 실내 공간, 매장 외관, 메뉴판 전체, 사람 얼굴, AI 생성 이미지는 절대 제외하세요.
3. 타 카페나 타 브랜드의 메뉴 사진은 절대 제외하세요.
4. 이미지 URL(.jpg, .png, .webp)이 확인되면 1개만 출력하고, 없으면 NOT_FOUND라고 답하세요.

형식:
MENU_IMAGE_URL: https://...
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.0, maxOutputTokens: 300 },
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const candidate = (data as any).candidates?.[0];
    const text: string = candidate?.content?.parts?.[0]?.text || '';
    const chunks: any[] = candidate?.groundingMetadata?.groundingChunks || [];

    if (!verifyImageLocationMatch(cafeName, cafeAddress, chunks, text)) return null;

    const chunkResult = extractImageUrlsFromChunks(chunks);
    if (chunkResult && chunkResult.imageUrl) return chunkResult;

    if (!text.includes('NOT_FOUND')) {
      const parsedUrl = parseImageUrlFromText(text);
      if (parsedUrl && parsedUrl.startsWith('http')) {
        return { imageUrl: parsedUrl, sourceUrl: chunkResult?.sourceUrl || parsedUrl };
      }
    }

    if (chunkResult && chunkResult.sourceUrl) {
      return { imageUrl: '', sourceUrl: chunkResult.sourceUrl };
    }

    return null;
  } catch {
    return null;
  }
}

function buildGroundedCafe(
  item: GroundedCafeItem,
  idx: number,
  targetRegion: string,
  imgData?: { imageUrl: string; sourceUrl: string } | null,
  interiorData?: { images: string[]; sourceUrls: string[] } | null,
  exteriorData?: { images: string[]; sourceUrls: string[] } | null,
  menuItems?: Array<{ id: string; name: string; price: string | null; desc: string; image: string; imageSourceUrl?: string }> | null
): Cafe {
  const gradients = [
    { from: '#e0c3fc', to: '#8ec5fc', emoji: '☕' },
    { from: '#fbc531', to: '#e1b12c', emoji: '🍰' },
    { from: '#487eb0', to: '#40739e', emoji: '🌿' },
    { from: '#e84118', to: '#c23616', emoji: '✨' },
  ];

  const g = gradients[idx % gradients.length];
  const cafeId = item.id || `grounded-${idx}-${Date.now()}`;
  const cafeName = item.name || '추천 카페';
  const cafeAddr = item.address || targetRegion;

  const resolvedImageUrl =
    imgData && imgData.imageUrl && imgData.imageUrl.length > 10
      ? imgData.imageUrl
      : getPlaceholder(idx);

  const imageSourceUrl = imgData?.sourceUrl || undefined;

  const safeRating: number | null =
    item.rating != null && typeof item.rating === 'number' && item.rating > 0
      ? item.rating
      : null;

  const safeReviewCount: number | null =
    item.reviewCount != null && typeof item.reviewCount === 'number' && item.reviewCount > 0
      ? item.reviewCount
      : null;

  const safeHoursLabel: string | null =
    item.hoursLabel &&
    item.hoursLabel.trim() !== '' &&
    item.hoursLabel !== '정보 없음' &&
    item.hoursLabel !== 'null'
      ? item.hoursLabel
      : null;

  return {
    id: cafeId,
    name: cafeName,
    location: cafeAddr,
    description: item.description || `${cafeName}의 분위기 있는 공간입니다.`,
    match: typeof item.matchScore === 'number' ? item.matchScore : 85 - idx * 3,
    tags: Array.isArray(item.moodTags) ? item.moodTags : ['#AI추천', '#지역명소'],
    mood: ['cozy'],
    bookmarked: false,
    hero: idx === 0,
    photo: {
      type: 'image',
      image: resolvedImageUrl,
      from: g.from,
      to: g.to,
      emoji: g.emoji,
    },
    aiReason: item.reason || `${cafeName}은(는) ${targetRegion}에서 추천하는 카페입니다.`,
    isExternalRegion: true,
    targetRegion,
    mapsUrl: item.mapsUrl || undefined,
    imageSourceUrl,
    interiorImages: interiorData?.images || [],
    interiorSourceUrls: interiorData?.sourceUrls || [],
    exteriorImages: exteriorData?.images || [],
    exteriorSourceUrls: exteriorData?.sourceUrls || [],
    detail: {
      detailTags: Array.isArray(item.moodTags) ? item.moodTags : ['#AI추천', '#지역명소'],
      description: item.description || `${cafeName}은(는) ${targetRegion}에서 분위기와 커피로 사랑받는 카페입니다.`,
      rating: safeRating,
      hoursLabel: safeHoursLabel,
      reviewCount: safeReviewCount,
      menu: menuItems && menuItems.length > 0 ? menuItems : [],
      reviews: [],
      reservation: {
        rating: safeRating,
        reviewCountLabel: safeReviewCount ? `리뷰 ${safeReviewCount}+` : '상세 정보 확인',
        description: `${cafeName}의 정보입니다. 방문 전 Google Maps에서 최신 정보를 확인하세요.`,
        facilities: ['wifi'],
        notice: '• 영업시간 및 주차 정보는 방문 전 Google Maps에서 확인을 추천합니다.',
      },
    },
  };
}

import type { Cafe } from '../store/types';
import { mockAiSearch } from '../data/mockData';

export interface GeminiSearchResult {
  cafes: Cafe[];
  isRealAi: boolean;
  aiErrorMessage?: string;
  isExternalRegion?: boolean;
  targetRegion?: string;
}

// Grounding 응답에서 파싱되는 카페 구조 (Gemini가 실제 장소 기반으로 출력)
interface GroundedCafeItem {
  id: string;
  name: string;
  address: string;
  mapsUrl: string | null;
  description: string;
  moodTags: string[];
  matchScore: number;
  reason: string;
  // 실제 확인 불가 항목 → null 허용
  rating: number | null;
  reviewCount: number | null;
  hoursLabel: string | null;
}

// ─────────────────────────────────────────────────────────────
// 세션 이미지 캐시 (카페이름+주소 → { imageUrl, sourceUrl })
// 새 파일/복잡한 상태관리 없이 서비스 내부 Map으로 처리
// ─────────────────────────────────────────────────────────────
const imageCache = new Map<string, { imageUrl: string; sourceUrl: string }>();

function makeCacheKey(name: string, address: string): string {
  return `${name.trim()}::${address.trim()}`;
}

// 로컬 placeholder 이미지 목록 (이미지 검색 실패 시 사용)
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

// 이미지 URL 유효성 검사 (직접 이미지 파일 URL인지 확인)
function isDirectImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    return /\.(jpg|jpeg|png|webp|gif)(\?|$)/.test(path);
  } catch {
    return false;
  }
}

// Grounding 응답의 groundingChunks에서 이미지 URL 추출
function extractImageUrlsFromChunks(chunks: any[]): { imageUrl: string; sourceUrl: string } | null {
  if (!Array.isArray(chunks)) return null;

  for (const chunk of chunks) {
    const uri: string = chunk?.web?.uri || '';
    if (!uri) continue;

    // 직접 이미지 파일 URL인 경우 바로 사용
    if (isDirectImageUrl(uri)) {
      return { imageUrl: uri, sourceUrl: uri };
    }
  }

  // 직접 이미지 URL이 없으면 첫 번째 웹 URI를 sourceUrl로만 기록
  const firstWebUri = chunks.find(c => c?.web?.uri)?.web?.uri;
  if (firstWebUri) {
    return { imageUrl: '', sourceUrl: firstWebUri };
  }

  return null;
}

// Gemini 응답 텍스트에서 이미지 URL 파싱 (Gemini가 텍스트로 알려준 경우)
function parseImageUrlFromText(text: string): string {
  // https://...jpg / png / webp / jpeg 패턴 추출
  const imgPattern = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?/gi;
  const matches = text.match(imgPattern);
  if (matches && matches.length > 0) {
    return matches[0];
  }
  return '';
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

  // 외부 지역 여부 판단
  const isExternalRegionQuery = detectExternalRegion(description);

  // 성수동 내부 검색이거나 무드만 선택한 경우 → 기존 로컬 DB 매칭
  if (!isExternalRegionQuery) {
    return searchLocalCafes(moodIds, description, allCafes, apiKey);
  }

  // 외부 지역 검색: Google Search Grounding 2-Step + 이미지 검색 방식
  const targetRegion = extractRegion(description);
  const moodLabel = moodIds.length > 0
    ? moodIds.map(id => MOOD_LABELS[id] || id).join(', ')
    : '감성적인';

  return searchWithGrounding(apiKey, targetRegion, moodLabel, description, moodIds);
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

  const models = ['gemini-1.5-flash', 'gemini-1.5-pro'];
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
        console.warn(`[Gemini AI] Model ${model} returned error:`, lastError);
        continue;
      }

      const data = await response.json();
      const rawText = (data as any).candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

      const aiRecs: Array<{ id: string; name: string; match: number; aiReason: string }> =
        JSON.parse(cleanJson);

      if (Array.isArray(aiRecs) && aiRecs.length > 0) {
        const dbMap = new Map(allCafes.map((c) => [c.id, c]));
        const results: Cafe[] = aiRecs
          .reduce<Cafe[]>((acc, item) => {
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
      console.warn(`[Gemini AI] Failed to query model ${model}:`, err);
    }
  }

  // 폴백
  const fallbackCafes = mockAiSearch(moodIds, description).map((cafe, idx) => ({
    ...cafe,
    aiReason: generateLocalAiReason(cafe, moodIds, description, idx === 0),
  }));
  return { cafes: fallbackCafes, isRealAi: false, aiErrorMessage: lastError };
}

// ─────────────────────────────────────────────────────────────
// Google Search Grounding 2-Step + Step3 이미지 검색
// Step 1: Grounding으로 실제 카페 목록 검색
// Step 2: Grounding 결과 기반으로 JSON 구조화
// Step 3: 카페별 이미지 Grounding 검색 (병렬)
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

  const models = ['gemini-1.5-flash', 'gemini-1.5-pro'];
  let lastError = '';

  for (const model of models) {
    try {
      // Step 1: Google Search Grounding으로 실제 카페 검색
      const step1Response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(12000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: step1Prompt }] }],
            tools: [{ google_search: {} }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 1200,
            },
          }),
        }
      );

      if (!step1Response.ok) {
        const errorData = await step1Response.json().catch(() => ({}));
        lastError = (errorData as any).error?.message || `HTTP ${step1Response.status}`;
        console.warn(`[Gemini Grounding] Step1 model ${model} error:`, lastError);
        continue;
      }

      const step1Data = await step1Response.json();
      const groundedText: string =
        (step1Data as any).candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!groundedText || groundedText.length < 50) {
        lastError = 'Insufficient grounding result';
        console.warn(`[Gemini Grounding] Step1 returned insufficient text for model ${model}`);
        continue;
      }

      console.log(
        `[Gemini Grounding] Step1 success (${model}). Text length: ${groundedText.length}`
      );

      // Step 2: Grounding 결과 기반으로 JSON 구조화
      const step2Response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildStep2Prompt(groundedText) }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 1200,
            },
          }),
        }
      );

      if (!step2Response.ok) {
        const errorData = await step2Response.json().catch(() => ({}));
        lastError = (errorData as any).error?.message || `HTTP ${step2Response.status}`;
        console.warn(`[Gemini Grounding] Step2 model ${model} error:`, lastError);
        continue;
      }

      const step2Data = await step2Response.json();
      const rawJson: string =
        (step2Data as any).candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();

      let groundedItems: GroundedCafeItem[] = JSON.parse(cleanJson);

      if (!Array.isArray(groundedItems) || groundedItems.length === 0) {
        lastError = 'Empty recommendations from Step2';
        console.warn(`[Gemini Grounding] Step2 returned empty array for model ${model}`);
        continue;
      }

      // 검증: Grounding 텍스트에 카페 이름이 실제로 언급되었는지 확인
      groundedItems = groundedItems.filter((item) => {
        const nameSlice = item.name.replace(/\s/g, '').slice(0, 3);
        const verified = groundedText.includes(nameSlice);
        if (!verified) {
          console.warn(`[Gemini Grounding] Filtered: "${item.name}" not found in grounded text`);
        }
        return verified;
      });

      if (groundedItems.length === 0) {
        lastError = 'All recommended cafes not verified in grounding';
        console.warn(`[Gemini Grounding] All items filtered. Trying next model.`);
        continue;
      }

      // Step 3: 확정된 카페별 이미지 Grounding 검색 (1단계 대표 + 2단계 공간 + 3단계 메뉴)
      const imageResults = await Promise.allSettled(
        groundedItems.map(async (item) => {
          const [rep, interior, exterior, realMenuInfos] = await Promise.all([
            fetchCafeImageWithGrounding(apiKey, model, item.name, item.address),
            fetchCafeInteriorImagesWithGrounding(apiKey, model, item.name, item.address),
            fetchCafeExteriorImagesWithGrounding(apiKey, model, item.name, item.address),
            fetchCafeRealMenuWithGrounding(apiKey, model, item.name, item.address),
          ]);

          // 메뉴 개별 이미지 검색
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
      console.warn(`[Gemini Grounding] Failed model ${model}:`, err);
    }
  }

  // 모든 모델 실패 시 로컬 폴백
  console.log('[Gemini Grounding] All models failed. Falling back to local data. Error:', lastError);
  const fallbackCafes = mockAiSearch(moodIds, description).map((cafe, idx) => ({
    ...cafe,
    aiReason: generateLocalAiReason(cafe, moodIds, description, idx === 0),
  }));
  return { cafes: fallbackCafes, isRealAi: false, aiErrorMessage: lastError };
}

// ─────────────────────────────────────────────────────────────
// Step 3: 카페 대표 이미지 1장 Grounding 검색 (1단계)
// - 다중 순차 검색어 (1차: 이름+주소, 2차: 이름+지역명+cafe, 3차: 이름+지점명)
// - 엄격한 검증: 카페 이름, 주소, 지역명, 지점명이 일치하는지 확인
// - 일치 불확실 시 잘못된 이미지 대신 null (Fallback placeholder) 사용
// ─────────────────────────────────────────────────────────────

// 주소/이름에서 검증 키워드 추출
function extractSearchKeywords(cafeName: string, cafeAddress: string) {
  // 지점명 추출 (예: "스타벅스 둔산점" -> "둔산점")
  const branchMatch = cafeName.match(/([가-힣a-zA-Z0-9]+점)$/);
  const branchName = branchMatch ? branchMatch[1] : '';

  // 주요 지역명 추출 (동/구/시)
  const regionMatches = cafeAddress.match(/([가-힣]+(?:동|구|시|군|읍|면))/g) || [];
  const mainRegion = regionMatches.length > 0 ? regionMatches[regionMatches.length - 1] : '';
  const cityRegion = regionMatches.length > 1 ? regionMatches[0] : '';

  return {
    branchName,
    mainRegion,
    cityRegion,
  };
}

// 이미지 결과 context가 실제 대상 카페와 동일한 장소인지 엄격 검증
function verifyImageLocationMatch(
  cafeName: string,
  cafeAddress: string,
  chunks: any[],
  parsedText: string
): boolean {
  const { branchName, mainRegion, cityRegion } = extractSearchKeywords(cafeName, cafeAddress);
  
  // 1. 카페 이름 검증 (공백 제거 후 최소 2자 일치)
  const cleanCafeName = cafeName.replace(/\s/g, '').toLowerCase();
  const coreName = cleanCafeName.replace(/(카페|cafe|점)$/g, '');
  
  const allChunkTitles = chunks.map(c => (c?.web?.title || '').toLowerCase()).join(' ');
  const allChunkUris = chunks.map(c => (c?.web?.uri || '').toLowerCase()).join(' ');
  const fullText = (parsedText + ' ' + allChunkTitles + ' ' + allChunkUris).toLowerCase();

  const containsName = fullText.includes(coreName.slice(0, 3));
  if (!containsName) {
    console.warn(`[Image Verify Failed] Cafe name "${coreName}" not found in grounding context.`);
    return false;
  }

  // 2. 지점명이 있는 경우 타지역 다른 지점 혼동 방지 (예: 둔산점 검색 시 강남점/홍대점 결과 배제)
  if (branchName) {
    const branchKey = branchName.replace(/\s/g, '').toLowerCase();
    if (fullText.includes('점') && !fullText.includes(branchKey)) {
      // 다른 지점일 가능성이 높음
      console.warn(`[Image Verify Failed] Branch mismatch. Expected "${branchName}".`);
      return false;
    }
  }

  // 3. 지역명/주소 검증 (주소의 주요 동/구/시가 검색 결과 맥락에 포함되는지)
  if (mainRegion) {
    const regionKey = mainRegion.replace(/(동|구|시)$/, '').toLowerCase();
    const hasRegionMatch = fullText.includes(regionKey) || (cityRegion && fullText.includes(cityRegion.toLowerCase()));
    if (!hasRegionMatch && chunks.length > 0) {
      console.warn(`[Image Verify Failed] Region mismatch. Expected "${mainRegion}".`);
      return false;
    }
  }

  return true;
}

async function fetchCafeImageWithGrounding(
  apiKey: string,
  model: string,
  cafeName: string,
  cafeAddress: string
): Promise<{ imageUrl: string; sourceUrl: string } | null> {
  // 세션 캐시 확인 (카페 이름 + 주소)
  const cacheKey = makeCacheKey(cafeName, cafeAddress);
  if (imageCache.has(cacheKey)) {
    console.log(`[Image Search] Cache hit for: ${cafeName}`);
    return imageCache.get(cacheKey)!;
  }

  const { branchName, mainRegion, cityRegion } = extractSearchKeywords(cafeName, cafeAddress);
  const regionLabel = [cityRegion, mainRegion].filter(Boolean).join(' ');

  // 3가지 검색어 생성 (순차 활용)
  // 1차: "정확한 카페 이름 + 정확한 주소"
  // 2차: "정확한 카페 이름 + 지역명 + cafe"
  // 3차: "정확한 카페 이름 + 지점명"
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
1. 다른 지역이나 다른 지점의 이미지는 절대 사용하지 마세요. (예: "${branchName || mainRegion}" 지역이 일치해야 함)
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
          generationConfig: {
            temperature: 0.0,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn(`[Image Search] HTTP ${response.status} for "${cafeName}"`);
      return null;
    }

    const data = await response.json();
    const candidate = (data as any).candidates?.[0];
    const text: string = candidate?.content?.parts?.[0]?.text || '';
    const chunks: any[] = candidate?.groundingMetadata?.groundingChunks || [];

    // 위치/이름 엄격 검증
    const isValidMatch = verifyImageLocationMatch(cafeName, cafeAddress, chunks, text);
    if (!isValidMatch) {
      console.log(`[Image Search] Exact location match verification failed for: ${cafeName}. Using fallback.`);
      return null;
    }

    // 1순위: groundingChunks에서 직접 이미지 URL 추출 (공식사이트/SNS/지도 링크 우선)
    const chunkResult = extractImageUrlsFromChunks(chunks);
    if (chunkResult && chunkResult.imageUrl) {
      console.log(`[Image Search] Verified direct image URL for: ${cafeName}`);
      imageCache.set(cacheKey, chunkResult);
      return chunkResult;
    }

    // 2순위: Gemini 텍스트에서 이미지 URL 파싱 및 검증
    if (!text.includes('NOT_FOUND')) {
      const parsedUrl = parseImageUrlFromText(text);
      if (parsedUrl && parsedUrl.startsWith('http')) {
        const sourceUrl = chunkResult?.sourceUrl || parsedUrl;
        const result = { imageUrl: parsedUrl, sourceUrl };
        console.log(`[Image Search] Verified image URL from text for: ${cafeName} → ${parsedUrl}`);
        imageCache.set(cacheKey, result);
        return result;
      }
    }

    // 3순위: chunks에 sourceUrl(원문 페이지)만 검색된 경우
    if (chunkResult && chunkResult.sourceUrl) {
      const result = { imageUrl: '', sourceUrl: chunkResult.sourceUrl };
      imageCache.set(cacheKey, result);
      return result;
    }

    console.log(`[Image Search] No verified image found for: ${cafeName}`);
    return null;
  } catch (err: any) {
    console.warn(`[Image Search] Error for "${cafeName}":`, err?.message || err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Step 3-B (2단계): Cafe Interior (실내/인테리어 공간) 이미지 Grounding 검색
// - 최대 2장, 음식/메뉴판/커피잔 단독 이미지 철저 배제
// ─────────────────────────────────────────────────────────────
async function fetchCafeInteriorImagesWithGrounding(
  apiKey: string,
  model: string,
  cafeName: string,
  cafeAddress: string
): Promise<{ images: string[]; sourceUrls: string[] }> {
  const cacheKey = makeCacheKey(cafeName, cafeAddress) + '::interior';
  if (imageCache.has(cacheKey)) {
    const cached = imageCache.get(cacheKey)!;
    return {
      images: cached.imageUrl ? [cached.imageUrl] : [],
      sourceUrls: cached.sourceUrl ? [cached.sourceUrl] : [],
    };
  }

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

    // chunks에서 유효한 공간 이미지 추출
    for (const chunk of chunks) {
      const uri = chunk?.web?.uri;
      if (uri && isDirectImageUrl(uri) && imgUrls.length < 2) {
        imgUrls.push(uri);
        srcUrls.push(uri);
      }
    }

    // text에서 파싱
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

// ─────────────────────────────────────────────────────────────
// Step 3-C (2단계): Cafe Exterior (매장 외관/출입구) 이미지 Grounding 검색
// - 최대 1장, 타 매장/타 지점 배제
// ─────────────────────────────────────────────────────────────
async function fetchCafeExteriorImagesWithGrounding(
  apiKey: string,
  model: string,
  cafeName: string,
  cafeAddress: string
): Promise<{ images: string[]; sourceUrls: string[] }> {
  const cacheKey = makeCacheKey(cafeName, cafeAddress) + '::exterior';
  if (imageCache.has(cacheKey)) {
    const cached = imageCache.get(cacheKey)!;
    return {
      images: cached.imageUrl ? [cached.imageUrl] : [],
      sourceUrls: cached.sourceUrl ? [cached.sourceUrl] : [],
    };
  }

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

// ─────────────────────────────────────────────────────────────
// Step 3-D (3단계): 카페 실제 메뉴 및 메뉴 이미지 Grounding 검색 & 검증
// - 1차: 카페/지점의 실제 메뉴명 및 가격(확인된 경우만) 수집
// - 2차: 확인된 실제 메뉴명으로 순차 이미지 검색 (1차: 카페명+지점명+메뉴명, 2차: 카페명+지역명+메뉴명)
// - 3차: 메뉴 이미지 엄격 검증 및 원본 출처 저장 (가짜 메뉴/가짜 사진 금지)
// ─────────────────────────────────────────────────────────────

interface GroundedMenuItemInfo {
  name: string;
  price: string | null;
  desc: string;
}

// 1. 실제 카페 메뉴명 & 가격 확인
async function fetchCafeRealMenuWithGrounding(
  apiKey: string,
  model: string,
  cafeName: string,
  cafeAddress: string
): Promise<GroundedMenuItemInfo[]> {
  const cacheKey = makeCacheKey(cafeName, cafeAddress) + '::menu_info';
  if (imageCache.has(cacheKey)) {
    const raw = imageCache.get(cacheKey)!;
    try {
      return JSON.parse(raw.imageUrl);
    } catch {
      return [];
    }
  }

  const { branchName, mainRegion, cityRegion } = extractSearchKeywords(cafeName, cafeAddress);
  const regionLabel = [cityRegion, mainRegion].filter(Boolean).join(' ');

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
      imageCache.set(cacheKey, { imageUrl: JSON.stringify(parsed), sourceUrl: '' });
      return parsed.slice(0, 3);
    }
    return [];
  } catch {
    return [];
  }
}

// 2. 실제 메뉴명의 이미지 검색 & 검증
async function fetchMenuItemImageWithGrounding(
  apiKey: string,
  model: string,
  cafeName: string,
  cafeAddress: string,
  menuName: string
): Promise<{ imageUrl: string; sourceUrl: string } | null> {
  const cacheKey = makeCacheKey(cafeName, cafeAddress) + `::menu_img::${menuName}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  const { branchName, mainRegion, cityRegion } = extractSearchKeywords(cafeName, cafeAddress);
  const regionLabel = [cityRegion, mainRegion].filter(Boolean).join(' ');

  // 1차: 카페명 + 지점명 + 메뉴명
  // 2차: 카페명 + 지역명 + 메뉴명
  // 3차: 카페명 + 메뉴명 + menu
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

    if (!verifyImageLocationMatch(cafeName, cafeAddress, chunks, text)) {
      return null;
    }

    const chunkResult = extractImageUrlsFromChunks(chunks);
    if (chunkResult && chunkResult.imageUrl) {
      imageCache.set(cacheKey, chunkResult);
      return chunkResult;
    }

    if (!text.includes('NOT_FOUND')) {
      const parsedUrl = parseImageUrlFromText(text);
      if (parsedUrl && parsedUrl.startsWith('http')) {
        const result = { imageUrl: parsedUrl, sourceUrl: chunkResult?.sourceUrl || parsedUrl };
        imageCache.set(cacheKey, result);
        return result;
      }
    }

    if (chunkResult && chunkResult.sourceUrl) {
      const result = { imageUrl: '', sourceUrl: chunkResult.sourceUrl };
      imageCache.set(cacheKey, result);
      return result;
    }

    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Grounded 카페 아이템 → Cafe 객체 변환
// imgData가 있으면 실제 이미지 URL 사용, 없으면 placeholder
// ─────────────────────────────────────────────────────────────
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

  // 이미지 결정: 실제 이미지 URL > placeholder
  const resolvedImageUrl =
    imgData && imgData.imageUrl && imgData.imageUrl.length > 10
      ? imgData.imageUrl
      : getPlaceholder(idx);

  const imageSourceUrl = imgData?.sourceUrl || undefined;

  // rating: 실제 확인된 경우만, 0 이하이거나 null이면 null
  const safeRating: number | null =
    item.rating != null && typeof item.rating === 'number' && item.rating > 0
      ? item.rating
      : null;

  // reviewCount: 실제 확인된 경우만, 0 이하이거나 null이면 null
  const safeReviewCount: number | null =
    item.reviewCount != null && typeof item.reviewCount === 'number' && item.reviewCount > 0
      ? item.reviewCount
      : null;

  // hoursLabel: 실제 확인된 경우만, 빈 문자열·'정보 없음'이면 null
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
      image: resolvedImageUrl,   // 실제 이미지 URL 또는 placeholder
      from: g.from,
      to: g.to,
      emoji: g.emoji,
    },
    aiReason: item.reason || `${cafeName}은(는) ${targetRegion}에서 추천하는 카페입니다.`,
    isExternalRegion: true,
    targetRegion,
    mapsUrl: item.mapsUrl || undefined,
    imageSourceUrl,              // 이미지 출처 웹페이지 URL (Google 정책 준수)
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
      menu: menuItems && menuItems.length > 0 ? menuItems : [],  // 실제 확인된 메뉴만 포함 (지어내기 안 함)
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

// ─────────────────────────────────────────────────────────────
// 외부 지역 감지 유틸
// ─────────────────────────────────────────────────────────────
function detectExternalRegion(description: string): boolean {
  if (!description || description.trim() === '') return false;
  const lowerDesc = description.trim().toLowerCase();

  const seongsuKeywords = ['성수', 'seongsu', '성수동'];
  if (seongsuKeywords.some((k) => lowerDesc.includes(k))) return false;

  const externalPatterns = [
    /대전|daejeon/,
    /부산|busan/,
    /대구|daegu/,
    /인천|incheon/,
    /광주|gwangju/,
    /수원|suwon/,
    /전주|jeonju/,
    /제주|jeju/,
    /강남|gangnam/,
    /홍대|hongdae/,
    /합정|hapjeong/,
    /연남동|yeonnam/,
    /이태원|itaewon/,
    /경리단|gyeongridan/,
    /마포|mapo/,
    /둔산|dunsan/,
    /해운대|haeundae/,
    /동성로|dongseongro/,
    /행궁동|haenggungdong/,
    /서울 [가-힣]+동/,
    /[가-힣]+시 [가-힣]+구/,
    /[가-힣]+구 [가-힣]+동/,
  ];

  return externalPatterns.some((pattern) => pattern.test(lowerDesc));
}

function extractRegion(description: string): string {
  const match = description.match(/([가-힣a-z\s]+(?:구|동|시|군|읍|면|로|대로|길))/i);
  return match ? match[0].trim() : description.trim();
}

// ─────────────────────────────────────────────────────────────
// 로컬 로직 폴백용 AI Reason 생성
// ─────────────────────────────────────────────────────────────
const MOOD_LABELS: Record<string, string> = {
  cozy: '포근하고 아늑한',
  calm: '차분하고 고요한',
  energetic: '활기차고 힙한',
  dreamy: '몽환적이고 감성적인',
  minimal: '미니멀하고 깔끔한',
  vintage: '빈티지한 인더스트리얼',
  warm: '따뜻한 햇살이 머무는',
};

function generateLocalAiReason(
  cafe: Cafe,
  moodIds: string[],
  description: string,
  isTopMatch: boolean
): string {
  const requestedMoodStr = moodIds.map((id) => MOOD_LABELS[id] || id).join(', ');
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
import type { Cafe } from '../store/types';
import { mockAiSearch } from '../data/mockData';

export interface GeminiSearchResult {
  cafes: Cafe[];
  isRealAi: boolean;
  aiErrorMessage?: string;
  isExternalRegion?: boolean;
  targetRegion?: string;
}

const MOOD_LABELS: Record<string, string> = {
  cozy: '조용한',
  sensual: '감성적인',
  view: '뷰가 좋은',
  work: '작업하기 좋은',
  desert: '디저트가 맛있는',
  terrace: '테라스가 있는',
};

// ─────────────────────────────────────────────────────────────
// 클라이언트 Gemini 서비스
// - 브라우저에서 Gemini API Key를 직간접적으로 노출하지 않습니다.
// - Vercel Serverless Function (/api/gemini)으로 안전하게 요청합니다.
// - 서버 실패/API Key 미설정 시 mockAiSearch 스마트 폴백을 적용합니다.
// ─────────────────────────────────────────────────────────────
export async function searchCafesWithGemini(
  moodIds: string[],
  description: string,
  allCafes: Cafe[]
): Promise<GeminiSearchResult> {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moodIds,
        description,
        allCafes,
      }),
    });

    if (response.ok) {
      const data: GeminiSearchResult = await response.json();
      if (data && Array.isArray(data.cafes) && data.cafes.length > 0) {
        return data;
      }
    }
  } catch (err: any) {
    console.warn('[Gemini Service] Serverless API call failed, using local fallback:', err?.message || err);
  }

  // API 호출 실패 / 키 미설정 / 서버 오류 시 스마트 로컬 폴백
  console.log('[Gemini Service] Using smart fallback matching.');
  const fallbackResults = mockAiSearch(moodIds, description);
  const enrichedResults = fallbackResults.map((cafe, idx) => ({
    ...cafe,
    aiReason: generateLocalAiReason(cafe, moodIds, description, idx === 0),
  }));

  return { cafes: enrichedResults, isRealAi: false };
}

// 로컬 폴백용 추천 이유 생성
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
    words.some((w) => m.name.toLowerCase().includes(w) || (m.desc && m.desc.toLowerCase().includes(w)))
  );

  const matchedTag = [...cafe.tags, ...cafe.detail.detailTags].find((t) =>
    words.some((w) => t.toLowerCase().includes(w))
  );

  if (words.length > 0) {
    if (matchedMenu) {
      return `요청하신 "${description}" 검색어에 맞춰 시그니처 메뉴인 '${matchedMenu.name}'(${matchedMenu.price || '추천'})을 맛볼 수 있는 ${cafe.name}을 추천합니다.`;
    }
    if (matchedTag) {
      return `요청하신 취향과 #${matchedTag} 특색이 가장 잘 어우러진 ${cafe.name}입니다.`;
    }
  }

  if (requestedMoodStr) {
    return isTopMatch
      ? `선택하신 '${requestedMoodStr}' 분위기와 가장 완벽하게 어우러지는 MoodPlace 대표 공간입니다.`
      : `'${requestedMoodStr}' 감성을 고스란히 담고 있어 편안한 시간을 보내기 좋습니다.`;
  }

  return `${cafe.name}은(는) 성수동 고유의 인상적인 분위기와 아늑함을 지닌 매력적인 장소입니다.`;
}
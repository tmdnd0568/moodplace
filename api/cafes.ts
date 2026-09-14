export default async function handler(req: any, res: any) {
  const { lat, lng } = req.query;
  const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;

  if (!KAKAO_REST_API_KEY) {
    return res.status(500).json({ error: 'Kakao API key is not configured' });
  }

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng parameters are required' });
  }

  const KAKAO_API_URL = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=CE7&x=${lng}&y=${lat}&sort=distance&size=15`;

  try {
    const allCafes: any[] = [];
    
    // 최대 4페이지 조회 (최대 60개 중 50개 확보)
    for (let page = 1; page <= 4; page++) {
      const response = await fetch(`${KAKAO_API_URL}&page=${page}`, {
        headers: {
          Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
        },
      });

      if (!response.ok) {
        // 첫 페이지에서 실패하면 에러 반환, 중간 페이지에서 실패하면 확보된 것만 반환
        if (page === 1) {
           return res.status(response.status).json({ error: `Kakao API fetch failed: ${response.statusText}` });
        }
        break;
      }

      const data = await response.json();
      if (data.documents && Array.isArray(data.documents)) {
        allCafes.push(...data.documents);
      }

      if (data.meta?.is_end || allCafes.length >= 50) {
        break;
      }
    }

    // 중복 제거 (1. Kakao place id, 2. 이름 + 주소, 3. 이름 + 좌표)
    const seenIds = new Set<string>();
    const seenNameAddr = new Set<string>();
    const seenNameCoords = new Set<string>();
    const uniqueCafes: any[] = [];

    for (const c of allCafes) {
      const id = String(c.id || '');
      const name = (c.place_name || '').trim();
      const addr = (c.road_address_name || c.address_name || '').trim();
      const x = String(c.x || '');
      const y = String(c.y || '');

      const nameAddrKey = `${name}|${addr}`;
      const nameCoordsKey = `${name}|${y},${x}`;

      if (id && seenIds.has(id)) continue;
      if (addr && seenNameAddr.has(nameAddrKey)) continue;
      if (x && y && seenNameCoords.has(nameCoordsKey)) continue;

      if (id) seenIds.add(id);
      if (addr) seenNameAddr.add(nameAddrKey);
      if (x && y) seenNameCoords.add(nameCoordsKey);

      uniqueCafes.push(c);
    }

    // 정확히 최대 50개 제한
    const slicedCafes = uniqueCafes.slice(0, 50);

    return res.status(200).json({ cafes: slicedCafes });
  } catch (error: any) {
    console.error('[API Error] Failed to fetch cafes from Kakao:', error);
    return res.status(500).json({ error: 'Failed to fetch cafes', details: error.message });
  }
}

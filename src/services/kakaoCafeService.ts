export async function fetchKakaoCafes(lat: number, lng: number) {
  try {
    const response = await fetch(`/api/cafes?lat=${lat}&lng=${lng}`);
    if (!response.ok) {
      throw new Error(`Kakao API request failed: ${response.status}`);
    }
    const data = await response.json();
    
    if (data.cafes && Array.isArray(data.cafes)) {
      console.log(`[KAKAO CAFE] total: ${data.cafes.length}`);
      return data.cafes.map((place: any) => {
        return {
          id: `kakao-${place.id}`,
          name: place.place_name || '카카오 카페',
          address: place.road_address_name || place.address_name || '주소 없음',
          roadAddress: place.road_address_name || '',
          description: 'Kakao Local 검색으로 발견된 카페입니다.',
          photos: ['/assets/caffe_001.jpg'],
          tags: [{ icon: 'warm', label: place.category_name?.split(' > ').pop() || '카페' }],
          coords: [Number(place.y), Number(place.x)] as [number, number],
          phone: place.phone || '',
          placeUrl: place.place_url || '',
          kakaoPlaceId: String(place.id || ''),
          distance: Number(place.distance || 0)
        };
      });
    }
    return [];
  } catch (error) {
    console.warn('[KAKAO CAFE] Failed to fetch cafes from Kakao:', error);
    return [];
  }
}

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'

const apiFallbackPlugin = () => ({
  name: 'api-fallback',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url?.startsWith('/api/cafes')) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const lat = url.searchParams.get('lat');
        const lng = url.searchParams.get('lng');
        const env = loadEnv('', process.cwd(), '');
        const apiKey = env.KAKAO_REST_API_KEY;

        res.setHeader('Content-Type', 'application/json');

        if (!apiKey) {
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: 'Kakao API key is not configured' }));
        }

        if (!lat || !lng) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'lat and lng parameters are required' }));
        }

        try {
          const allCafes: any[] = [];
          for (let page = 1; page <= 4; page++) {
            const apiRes = await fetch(`https://dapi.kakao.com/v2/local/search/category.json?category_group_code=CE7&x=${lng}&y=${lat}&sort=distance&size=15&page=${page}`, {
              headers: { Authorization: `KakaoAK ${apiKey}` }
            });
            if (!apiRes.ok) {
              if (page === 1) {
                res.statusCode = apiRes.status;
                return res.end(JSON.stringify({ error: `Kakao API fetch failed: ${apiRes.statusText}` }));
              }
              break;
            }
            const data = await apiRes.json();
            if (data.documents) allCafes.push(...data.documents);
            if (data.meta?.is_end || allCafes.length >= 50) break;
          }
          const uniqueCafes = Array.from(new Map(allCafes.map((c: any) => [c.id, c])).values());
          res.statusCode = 200;
          res.end(JSON.stringify({ cafes: uniqueCafes.slice(0, 50) }));
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to fetch cafes' }));
        }
        return;
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiFallbackPlugin()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'PUBLIC_'],
})

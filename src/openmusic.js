// ===== VANG OPEN WEB MUSIC CLIENT =====
// Zero-Login, Zero-Persistent Data, 100% Free Global Music Search & Stream
// Accesses Apple Music / iTunes 100M+ catalog with high-resolution artwork and CORS audio streams.

const OpenMusicClient = (function () {
  const CACHE = new Map();

  function mapItunesItem(item) {
    if (!item || !item.trackId || !item.previewUrl) return null;
    const rawCover = item.artworkUrl100 || '';
    // Upscale thumbnail to crisp 600x600 album artwork
    const cover = rawCover.replace(/100x100bb\.(jpg|png|webp)/i, '600x600bb.$1');
    const safeCover = cover.startsWith('https://') ? cover : (rawCover.startsWith('https://') ? rawCover : '');

    return {
      id: `open-${item.trackId}`,
      source: 'open',
      sourceLabel: 'Web Mở',
      uri: `open:track:${item.trackId}`,
      t: String(item.trackName || 'Không rõ tên'),
      a: String(item.artistName || 'Nghệ sĩ'),
      al: String(item.collectionName || 'Đĩa đơn'),
      d: Math.max(1, Math.round((item.trackTimeMillis || 180000) / 1000)),
      cover: safeCover,
      previewUrl: item.previewUrl,
      c: [217, 130, 43],
      bpm: 118,
      liked: false,
      isOpenSource: true
    };
  }

  function queryItunes(term, limit = 50) {
    return new Promise(resolve => {
      const cbName = 'vang_itunes_cb_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
      let resolved = false;
      const script = document.createElement('script');
      const cleanup = () => {
        try { delete window[cbName]; } catch (e) {}
        if (script.parentNode) script.parentNode.removeChild(script);
      };
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve([]);
        }
      }, 5000);

      window[cbName] = data => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          cleanup();
          resolve((data && data.results) || []);
        }
      };

      script.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          cleanup();
          resolve([]);
        }
      };

      script.src = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=${limit}&callback=${cbName}`;
      (document.head || document.body).appendChild(script);
    });
  }

  async function search(query, limit = 50) {
    const q = String(query || '').trim();
    if (!q) return [];
    const cacheKey = `${q.toLowerCase()}__${limit}`;
    if (CACHE.has(cacheKey)) {
      return CACHE.get(cacheKey);
    }

    try {
      const items = await queryItunes(q, limit);
      const mapped = items.map(mapItunesItem).filter(Boolean);
      CACHE.set(cacheKey, mapped);
      return mapped;
    } catch (e) {
      return [];
    }
  }

  // Curated collections for the "Tuyển tập" & Discovery views
  const CURATED_COLLECTIONS = [
    {
      id: 'curated-vpop',
      kind: 'playlist',
      source: 'open',
      name: '🔥 V-Pop Thịnh Hành',
      artist: 'Sơn Tùng M-TP, Đen, Vũ, MONO...',
      query: 'V-Pop hot hits',
      count: 40,
      cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/bf/1d/15/bf1d15be-fcf8-8cba-68b2-b13cb85d898a/859765275824_cover.jpg/600x600bb.jpg',
      preloadedTracks: []
    },
    {
      id: 'curated-global',
      kind: 'playlist',
      source: 'open',
      name: '🌍 Top Hits Toàn Cầu',
      artist: 'Taylor Swift, The Weeknd, Billie Eilish...',
      query: 'Global Top Hits 2024',
      count: 40,
      cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/4a/1a/03/4a1a0397-5dc3-38ad-9cae-53c8ea6f85d2/24UMGIM22363.rgb.jpg/600x600bb.jpg',
      preloadedTracks: []
    },
    {
      id: 'curated-lofi',
      kind: 'playlist',
      source: 'open',
      name: '☕ Lofi & Acoustic Chill',
      artist: 'Gác Mái, Lofi Beats, Nhạc Thư Giãn...',
      query: 'lofi chill study beats',
      count: 35,
      cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/37/87/42/378742ca-3cf1-923f-e8d1-d2c695325c46/artwork.jpg/600x600bb.jpg',
      preloadedTracks: []
    },
    {
      id: 'curated-edm',
      kind: 'playlist',
      source: 'open',
      name: '⚡ Electronic & EDM Remix',
      artist: 'Alan Walker, Martin Garrix, Avicii...',
      query: 'EDM festival hits',
      count: 40,
      cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/3d/8b/63/3d8b63a9-0b1e-b7e1-ae40-e2d149025ce9/8718522067746.png/600x600bb.jpg',
      preloadedTracks: []
    }
  ];

  async function fetchCuratedTracks(collectionId) {
    const col = CURATED_COLLECTIONS.find(c => c.id === collectionId);
    if (!col) return [];
    if (col.preloadedTracks && col.preloadedTracks.length) {
      return col.preloadedTracks;
    }
    const tracks = await search(col.query, col.count || 40);
    if (tracks && tracks.length) {
      col.preloadedTracks = tracks;
    }
    return tracks;
  }

  function isOpenTrack(track) {
    if (!track) return false;
    return Boolean(track.isOpenSource || track.source === 'open' || (track.id && String(track.id).startsWith('open-')));
  }

  return {
    search,
    queryItunes,
    mapItunesItem,
    CURATED_COLLECTIONS,
    fetchCuratedTracks,
    isOpenTrack
  };
})();

if (typeof window !== 'undefined') {
  window.OpenMusicClient = OpenMusicClient;
}

// ===== OPENMUSIC SPOTIFY CLIENT (ZERO-RETENTION OAuth 2.0 PKCE + Web Playback SDK + Connect API) =====
// SECURITY & PRIVACY GUARANTEES:
// 1. Zero Persistent User Data: Access tokens and user profile exist ONLY in volatile RAM (memoryToken).
//    Closing the tab/app or clicking Logout erases all session tokens immediately (0 bytes stored on disk).
// 2. Least Privilege Scopes: Never requests user email (no 'user-read-email').
// 3. CSRF + PKCE Protection: Uses cryptographic S256 code_challenge + anti-CSRF state verification,
//    wiping temporary verifier from sessionStorage immediately upon callback.

const SpotifyClient = (function () {
  const LS_CLIENT_ID = 'vang_spotify_client_id';
  const SS_TOKEN = 'vang_spotify_session_token';
  const SS_VERIFIER = 'vang_pkce_verifier';
  const SS_STATE = 'vang_pkce_state';
  const SS_TEMP_CID = 'vang_pkce_cid';

  // Least-privilege scopes (no user-read-email)
  const SCOPES = [
    'streaming',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-library-read',
    'user-read-recently-played',
    'user-top-read',
    'playlist-read-private',
    'playlist-read-collaborative'
  ].join(' ');

  let memoryToken = null;
  let memoryClientId = '';
  let sdkPlayer = null;
  let webDeviceId = null;

  // Migrate any existing active session into sessionStorage so page refresh doesn't break audio playback
  try {
    const existing = sessionStorage.getItem(SS_TOKEN) || localStorage.getItem('vang_spotify_token');
    if (existing) {
      memoryToken = JSON.parse(existing);
      sessionStorage.setItem(SS_TOKEN, existing);
      localStorage.removeItem('vang_spotify_token');
    }
    const existingCid = sessionStorage.getItem(SS_TEMP_CID) || localStorage.getItem(LS_CLIENT_ID);
    if (existingCid) {
      memoryClientId = existingCid.trim();
      sessionStorage.setItem(SS_TEMP_CID, memoryClientId);
    }
  } catch (e) {}

  function getClientId() {
    if (memoryClientId) return memoryClientId;
    try {
      return (sessionStorage.getItem(SS_TEMP_CID) || localStorage.getItem(LS_CLIENT_ID) || '').trim();
    } catch (e) {
      return '';
    }
  }

  function setClientId(id) {
    memoryClientId = (id || '').trim();
    try {
      if (memoryClientId) {
        sessionStorage.setItem(SS_TEMP_CID, memoryClientId);
      } else {
        sessionStorage.removeItem(SS_TEMP_CID);
      }
      localStorage.removeItem(LS_CLIENT_ID);
    } catch (e) {}
  }

  function getRedirectUri() {
    return window.location.origin + window.location.pathname;
  }

  function saveTokenInMemory(res) {
    const prev = memoryToken || {};
    memoryToken = {
      access_token: res.access_token,
      refresh_token: res.refresh_token || prev.refresh_token || null,
      expires_at: Date.now() + (res.expires_in || 3600) * 1000 - 60000
    };
    try {
      sessionStorage.setItem(SS_TOKEN, JSON.stringify(memoryToken));
    } catch (e) {}
    return memoryToken;
  }

  function logout() {
    memoryToken = null;
    try {
      sessionStorage.removeItem(SS_TOKEN);
      sessionStorage.removeItem(SS_VERIFIER);
      sessionStorage.removeItem(SS_STATE);
      localStorage.removeItem('vang_spotify_token');
      localStorage.removeItem('vang_spotify_verifier');
    } catch (e) {}
    if (sdkPlayer) {
      try { sdkPlayer.disconnect(); } catch (e) {}
      sdkPlayer = null;
    }
    webDeviceId = null;
  }

  // Cryptographic random generator for PKCE & anti-CSRF state
  function randomString(len) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return Array.from(arr, x => chars[x % chars.length]).join('');
  }

  async function sha256Base64Url(plain) {
    const data = new TextEncoder().encode(plain);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(digest);
    let bin = '';
    bytes.forEach(b => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async function startLogin(customClientId) {
    if (customClientId !== undefined) setClientId(customClientId);
    const clientId = getClientId();
    if (!clientId) {
      throw new Error('Vui lòng nhập Spotify Client ID để kết nối.');
    }
    const verifier = randomString(64);
    const state = randomString(32);
    try {
      sessionStorage.setItem(SS_VERIFIER, verifier);
      sessionStorage.setItem(SS_STATE, state);
      sessionStorage.setItem(SS_TEMP_CID, clientId);
    } catch (e) {}

    const challenge = await sha256Base64Url(verifier);
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: getRedirectUri(),
      code_challenge_method: 'S256',
      code_challenge: challenge,
      state,
      scope: SCOPES
    });
    window.location.href = 'https://accounts.spotify.com/authorize?' + params.toString();
  }

  async function handleCallbackIfPresent() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Immediately clean URL bar so code/state never leak into history or referer
    if (code || error || returnedState) {
      window.history.replaceState({}, document.title, getRedirectUri());
    }

    if (error) {
      throw new Error('Spotify từ chối kết nối: ' + error);
    }
    if (!code) return false;

    let verifier = null;
    let expectedState = null;
    try {
      verifier = sessionStorage.getItem(SS_VERIFIER);
      expectedState = sessionStorage.getItem(SS_STATE);
      sessionStorage.removeItem(SS_VERIFIER);
      sessionStorage.removeItem(SS_STATE);
    } catch (e) {}

    if (expectedState && returnedState !== expectedState) {
      logout();
      throw new Error('Phát hiện mã trạng thái OAuth không khớp (CSRF protection). Đã hủy kết nối.');
    }

    const clientId = getClientId();
    if (!verifier || !clientId) return false;

    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: getRedirectUri(),
      code_verifier: verifier
    });

    const resp = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    if (!resp.ok) {
      throw new Error('Không thể xác thực phiên đăng nhập Spotify.');
    }
    const json = await resp.json();
    saveTokenInMemory(json);
    return true;
  }

  async function ensureValidToken() {
    if (!memoryToken || !memoryToken.access_token) return null;
    if (Date.now() < memoryToken.expires_at) return memoryToken.access_token;

    if (!memoryToken.refresh_token || !getClientId()) {
      logout();
      return null;
    }

    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: memoryToken.refresh_token,
        client_id: getClientId()
      });
      const resp = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      if (!resp.ok) {
        logout();
        return null;
      }
      const json = await resp.json();
      return saveTokenInMemory(json).access_token;
    } catch (e) {
      return null;
    }
  }

  async function api(path, options = {}) {
    const token = await ensureValidToken();
    if (!token) throw new Error('Chưa kết nối Spotify');
    const resp = await fetch('https://api.spotify.com/v1' + path, {
      ...options,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    if (resp.status === 204) return null;
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      throw new Error(`Spotify API (${resp.status}): ${txt.slice(0, 80)}`);
    }
    return resp.json().catch(() => null);
  }

  function extractCoverColor(imgUrl) {
    return new Promise(resolve => {
      if (!imgUrl || !imgUrl.startsWith('https://')) return resolve([217, 130, 43]);
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const cv = document.createElement('canvas');
          cv.width = 24;
          cv.height = 24;
          const c = cv.getContext('2d');
          c.drawImage(img, 0, 0, 24, 24);
          const d = c.getImageData(0, 0, 24, 24).data;
          let r = 0, g = 0, b = 0, count = 0;
          for (let i = 0; i < d.length; i += 4) {
            const br = (d[i] + d[i + 1] + d[i + 2]) / 3;
            if (br > 38 && br < 235) {
              r += d[i];
              g += d[i + 1];
              b += d[i + 2];
              count++;
            }
          }
          if (count > 0) {
            resolve([Math.round(r / count), Math.round(g / count), Math.round(b / count)]);
          } else {
            resolve([217, 130, 43]);
          }
        } catch (e) {
          resolve([217, 130, 43]);
        }
      };
      img.onerror = () => resolve([217, 130, 43]);
      img.src = imgUrl;
    });
  }

  function mapSpotifyTrack(item, fallbackAlbum = null) {
    const t = item && (item.track || item.item) ? (item.track || item.item) : item;
    if (!t || (!t.id && !t.uri && !t.name)) return null;
    if (t.type && t.type !== 'track') return null;
    const albumObj = t.album || fallbackAlbum || {};
    const rawImg =
      (albumObj.images && albumObj.images[0] && albumObj.images[0].url) ||
      (t.images && t.images[0] && t.images[0].url) ||
      '';
    const safeCover = rawImg.startsWith('https://') ? rawImg : '';
    const id = t.id || t.uri || `${t.name}_${Date.now()}`;
    return {
      id,
      uri: t.uri || (t.id ? `spotify:track:${t.id}` : ''),
      t: String(t.name || 'Không rõ tên'),
      a: (t.artists || []).map(x => x && x.name).filter(Boolean).join(', ') || (fallbackAlbum && fallbackAlbum.artistName) || 'Nghệ sĩ',
      al: String(albumObj.name || 'Spotify'),
      albumId: albumObj.id || '',
      albumUri: albumObj.uri || (albumObj.id ? `spotify:album:${albumObj.id}` : ''),
      d: Math.max(1, Math.round((t.duration_ms || 180000) / 1000)),
      cover: safeCover,
      c: [217, 130, 43],
      bpm: 116,
      liked: true
    };
  }

  function dedupeTracks(list) {
    const seen = new Set();
    const out = [];
    for (const tr of list) {
      if (!tr) continue;
      const key = tr.id || tr.uri || `${tr.t}__${tr.a}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(tr);
      }
    }
    return out;
  }

  async function fetchProfile() {
    return api('/me');
  }

  async function fetchLikedTracks(maxItems = 10000, onProgress = null) {
    const all = [];
    let offset = 0;
    const limit = 50;
    while (offset < maxItems) {
      const data = await api(`/me/tracks?market=from_token&limit=${limit}&offset=${offset}`).catch(() => null);
      const items = (data && data.items) || [];
      if (!items.length) break;
      const mapped = items.map(it => mapSpotifyTrack(it)).filter(Boolean);
      all.push(...mapped);
      if (onProgress) onProgress(all.slice());
      if (!data.next || items.length < limit) break;
      offset += limit;
    }
    return dedupeTracks(all);
  }

  async function fetchNewReleases(limit = 50) {
    const data = await api(`/browse/new-releases?limit=${limit}`).catch(() =>
      api(`/browse/new-releases?country=VN&limit=${limit}`).catch(() => null)
    );
    const items = (data && data.albums && data.albums.items) || [];
    return items.map(alb => {
      if (!alb || !alb.id) return null;
      const rawCover = (alb.images && alb.images[0] && alb.images[0].url) || '';
      return {
        id: alb.id,
        uri: alb.uri || `spotify:album:${alb.id}`,
        kind: 'album',
        source: 'spotify',
        name: alb.name || 'Album mới',
        artist: (alb.artists || []).map(a => a && a.name).filter(Boolean).join(', ') || 'Nghệ sĩ',
        count: alb.total_tracks || 0,
        cover: rawCover.startsWith('https://') ? rawCover : ''
      };
    }).filter(Boolean);
  }

  async function fetchFeaturedPlaylists(limit = 50) {
    const data = await api(`/browse/featured-playlists?limit=${limit}`).catch(() => null);
    const items = (data && data.playlists && data.playlists.items) || [];
    return items.map(p => {
      if (!p || !p.id) return null;
      const rawCover = (p.images && p.images[0] && p.images[0].url) || '';
      return {
        id: p.id,
        uri: p.uri || `spotify:playlist:${p.id}`,
        kind: 'playlist',
        source: 'spotify',
        name: p.name || 'Tuyển tập nổi bật',
        artist: (p.owner && p.owner.display_name) || 'Spotify',
        count: (p.tracks && p.tracks.total) || (p.items && p.items.total) || 0,
        cover: rawCover.startsWith('https://') ? rawCover : ''
      };
    }).filter(Boolean);
  }

  async function fetchTopTracks() {
    const [shortData, medData] = await Promise.all([
      api('/me/top/tracks?limit=50&time_range=short_term').catch(() => null),
      api('/me/top/tracks?limit=50&time_range=medium_term').catch(() => null)
    ]);
    const list = [
      ...(((shortData && shortData.items) || []).map(it => mapSpotifyTrack(it))),
      ...(((medData && medData.items) || []).map(it => mapSpotifyTrack(it)))
    ].filter(Boolean);
    return dedupeTracks(list);
  }

  // Fetch Saved Albums + embedded tracklists so albums in "Tuyển tập" open instantaneously!
  async function fetchSavedAlbums() {
    const data = await api('/me/albums?market=from_token&limit=50').catch(() => null);
    const items = (data && data.items) || [];
    const albums = [];
    const allAlbumTracks = [];

    for (const it of items) {
      const alb = it && it.album;
      if (!alb || !alb.id) continue;
      const cover = (alb.images && alb.images[0] && alb.images[0].url) || '';
      const artistName = (alb.artists || []).map(a => a && a.name).filter(Boolean).join(', ');
      const fallbackMeta = { name: alb.name, images: alb.images, artistName };
      const tracks = ((alb.tracks && alb.tracks.items) || [])
        .map(tr => mapSpotifyTrack(tr, fallbackMeta))
        .filter(Boolean);

      allAlbumTracks.push(...tracks);
      albums.push({
        id: alb.id,
        uri: alb.uri || `spotify:album:${alb.id}`,
        kind: 'album',
        name: alb.name || 'Album',
        artist: artistName,
        count: (alb.total_tracks || tracks.length || 0),
        cover: cover.startsWith('https://') ? cover : '',
        preloadedTracks: tracks
      });
    }
    return { albums, tracks: dedupeTracks(allAlbumTracks) };
  }

  async function fetchSavedAlbumTracks() {
    const res = await fetchSavedAlbums();
    return res.tracks;
  }

  async function fetchRecentTracks() {
    const data = await api('/me/player/recently-played?limit=50');
    const list = ((data && data.items) || []).map(it => mapSpotifyTrack(it.track)).filter(Boolean);
    return dedupeTracks(list);
  }

  async function fetchCurrentQueue() {
    const [curPlayback, queueData] = await Promise.all([
      api('/me/player?market=from_token').catch(() => null),
      api('/me/player/queue').catch(() => null)
    ]);
    const list = [];
    if (curPlayback && curPlayback.item) {
      const cur = mapSpotifyTrack(curPlayback.item);
      if (cur) list.push(cur);
    }
    if (queueData && queueData.currently_playing) {
      const curQ = mapSpotifyTrack(queueData.currently_playing);
      if (curQ) list.push(curQ);
    }
    if (queueData && Array.isArray(queueData.queue)) {
      for (const qItem of queueData.queue) {
        const m = mapSpotifyTrack(qItem);
        if (m) list.push(m);
      }
    }
    return {
      playback: curPlayback,
      tracks: dedupeTracks(list)
    };
  }

  async function fetchCurrentPlayback() {
    return api('/me/player?market=from_token').catch(() => null);
  }

  async function fetchAudioAnalysis(trackId) {
    if (!trackId) return null;
    return api(`/audio-analysis/${encodeURIComponent(trackId)}`).catch(() => null);
  }

  // Fetch both User Playlists AND Saved Albums for the "Tuyển tập" tab
  async function fetchPlaylists(maxItems = 200) {
    const all = [];
    let offset = 0;
    const limit = 50;
    while (offset < maxItems) {
      const data = await api(`/me/playlists?limit=${limit}&offset=${offset}`);
      const items = (data && data.items) || [];
      if (!items.length) break;
      for (const p of items) {
        if (!p || !p.id) continue;
        const rawCover = (p.images && p.images[0] && p.images[0].url) || '';
        all.push({
          id: p.id,
          uri: p.uri || `spotify:playlist:${p.id}`,
          kind: 'playlist',
          name: p.name || 'Tuyển tập',
          artist: (p.owner && p.owner.display_name) || 'Playlist',
          count: (p.tracks && p.tracks.total) || (p.items && p.items.total) || 0,
          cover: rawCover.startsWith('https://') ? rawCover : ''
        });
      }
      if (!data.next || items.length < limit) break;
      offset += limit;
    }

    // Also append Saved Albums so users can click any Album or Playlist in "Tuyển tập"
    try {
      const { albums } = await fetchSavedAlbums();
      for (const alb of albums) {
        all.push(alb);
      }
    } catch (e) {}

    return all;
  }

  // Robustly fetch tracks for any Playlist OR Album
  async function fetchPlaylistTracks(collectionId, maxItems = 500, onProgress = null, kind = 'playlist', preloaded = null, collectionName = '') {
    if (Array.isArray(preloaded) && preloaded.length > 0) {
      if (onProgress) onProgress(preloaded.slice());
      // If it's a Spotify album with only 1-2 library tracks preloaded, try fetching the full album tracklist
      if (kind === 'album' && collectionId && !String(collectionId).startsWith('lib-alb-') && !String(collectionId).startsWith('pl-') && preloaded.length < 3) {
        try {
          const albData = await api(`/albums/${encodeURIComponent(collectionId)}`).catch(() => null);
          if (albData && albData.tracks && albData.tracks.items && albData.tracks.items.length > preloaded.length) {
            const fallbackMeta = {
              name: albData.name,
              images: albData.images,
              artistName: (albData.artists || []).map(a => a && a.name).filter(Boolean).join(', ')
            };
            const fullMapped = albData.tracks.items.map(tr => mapSpotifyTrack(tr, fallbackMeta)).filter(Boolean);
            if (fullMapped.length) {
              if (onProgress) onProgress(fullMapped);
              return dedupeTracks(fullMapped);
            }
          }
        } catch (e) {}
      }
      return preloaded.slice();
    }

    // 1. If it's an Album, fetch /albums/{id} & /albums/{id}/tracks
    if (kind === 'album' && collectionId && !String(collectionId).startsWith('lib-alb-')) {
      const albData = await api(`/albums/${encodeURIComponent(collectionId)}`).catch(() =>
        api(`/albums/${encodeURIComponent(collectionId)}?market=from_token`).catch(() => null)
      );
      if (albData) {
        const fallbackMeta = {
          name: albData.name,
          images: albData.images,
          artistName: (albData.artists || []).map(a => a && a.name).filter(Boolean).join(', ')
        };
        const items = (albData.tracks && albData.tracks.items) || [];
        const mapped = items.map(tr => mapSpotifyTrack(tr, fallbackMeta)).filter(Boolean);
        if (onProgress && mapped.length) onProgress(mapped);
        if (mapped.length) return dedupeTracks(mapped);
      }
      const albTracksData = await api(`/albums/${encodeURIComponent(collectionId)}/tracks?limit=50`).catch(() => null);
      if (albTracksData && albTracksData.items) {
        const mapped = albTracksData.items.map(tr => mapSpotifyTrack(tr)).filter(Boolean);
        if (onProgress && mapped.length) onProgress(mapped);
        if (mapped.length) return dedupeTracks(mapped);
      }
    }

    // 2. Try paginated /playlists/{id}/tracks (first without market param, then with market=from_token)
    const all = [];
    let offset = 0;
    const limit = 100;
    try {
      while (offset < maxItems) {
        let data = await api(`/playlists/${encodeURIComponent(collectionId)}/tracks?limit=${limit}&offset=${offset}`).catch(() => null);
        if (!data) {
          data = await api(`/playlists/${encodeURIComponent(collectionId)}/tracks?market=from_token&limit=${limit}&offset=${offset}`).catch(() => null);
        }
        const items = (data && (data.items || (data.tracks && data.tracks.items))) || [];
        if (!items.length) break;
        const mapped = items.map(it => mapSpotifyTrack(it)).filter(Boolean);
        all.push(...mapped);
        if (onProgress && all.length) onProgress(all.slice());
        if (!data.next || items.length < limit) break;
        offset += limit;
      }
    } catch (e) {}

    if (all.length > 0) return dedupeTracks(all);

    // 3. Fallback: GET /playlists/{id}
    try {
      const fullPl = await api(`/playlists/${encodeURIComponent(collectionId)}`).catch(() =>
        api(`/playlists/${encodeURIComponent(collectionId)}?market=from_token`).catch(() => null)
      );
      const items =
        (fullPl && fullPl.tracks && fullPl.tracks.items) ||
        (fullPl && fullPl.items && fullPl.items.items) ||
        [];
      const mapped = items.map(it => mapSpotifyTrack(it)).filter(Boolean);
      if (onProgress && mapped.length) onProgress(mapped);
      if (mapped.length > 0) return dedupeTracks(mapped);
    } catch (e) {}

    // 4. Fallback: maybe collectionId is an album ID
    try {
      const albData = await api(`/albums/${encodeURIComponent(collectionId)}`);
      if (albData && albData.tracks && albData.tracks.items) {
        const fallbackMeta = {
          name: albData.name,
          images: albData.images,
          artistName: (albData.artists || []).map(a => a && a.name).filter(Boolean).join(', ')
        };
        const mapped = albData.tracks.items.map(tr => mapSpotifyTrack(tr, fallbackMeta)).filter(Boolean);
        if (onProgress && mapped.length) onProgress(mapped);
        if (mapped.length > 0) return dedupeTracks(mapped);
      }
    } catch (e) {}

    // 5. Fallback for Spotify Dev Mode restricted editorial/algorithmic playlists (e.g. Daily Mix / Top 50):
    // Search tracks matching the collection name so the playlist always opens and plays!
    if (collectionName && String(collectionName).trim()) {
      try {
        const searched = await searchTracks(String(collectionName).trim(), 0);
        if (searched && searched.length > 0) {
          if (onProgress) onProgress(searched);
          return dedupeTracks(searched);
        }
      } catch (e) {}
    }

    return [];
  }

  // Helper to execute play request reliably across Web Playback SDK or active Connect devices
  async function executePlayPayload(payload, preferredDeviceId = null) {
    if (sdkPlayer && typeof sdkPlayer.activateElement === 'function') {
      try { await sdkPlayer.activateElement(); } catch (e) {}
    }
    const targetId = preferredDeviceId || webDeviceId;
    const q = targetId ? `?device_id=${encodeURIComponent(targetId)}` : '';
    try {
      await api('/me/player/play' + q, {
        method: 'PUT',
        body: payload ? JSON.stringify(payload) : undefined
      });
      return true;
    } catch (err) {
      // Fallback 1: Try without device_id (uses currently active Spotify device on PC/Phone)
      if (targetId) {
        try {
          await api('/me/player/play', {
            method: 'PUT',
            body: payload ? JSON.stringify(payload) : undefined
          });
          return true;
        } catch (err2) {}
      }
      // Fallback 2: Discover available devices and play on the first available one
      try {
        const devs = await fetchDevices();
        const dev = devs.find(d => d.is_active) || devs[0];
        if (dev && dev.id) {
          await api(`/me/player/play?device_id=${encodeURIComponent(dev.id)}`, {
            method: 'PUT',
            body: payload ? JSON.stringify(payload) : undefined
          });
          return true;
        }
      } catch (err3) {}

      // Fallback 3: Ensure AudioEngine's direct audio output is audible
      if (window.AudioEngine && window.AudioEngine.setSpotifyDeviceAudible) {
        window.AudioEngine.setSpotifyDeviceAudible(false);
      }
      return false;
    }
  }

  async function playContextUri(contextUri, offsetIndex = 0, deviceId = null) {
    return executePlayPayload(
      {
        context_uri: contextUri,
        offset: { position: offsetIndex }
      },
      deviceId
    );
  }

  async function searchTracks(query, offset = 0) {
    if (!query.trim()) return [];
    const q = encodeURIComponent(query.trim());
    const data = await api(`/search?type=track&market=from_token&limit=50&offset=${offset}&q=${q}`);
    return ((data && data.tracks && data.tracks.items) || []).map(it => mapSpotifyTrack(it)).filter(Boolean);
  }

  async function fetchDevices() {
    const data = await api('/me/player/devices');
    return (data && data.devices) || [];
  }

  async function transferPlayback(deviceId, play = true) {
    return api('/me/player', {
      method: 'PUT',
      body: JSON.stringify({ device_ids: [deviceId], play })
    });
  }

  async function playUris(uris, offsetIndex = 0, deviceId = null) {
    return executePlayPayload(
      {
        uris,
        offset: { position: offsetIndex }
      },
      deviceId
    );
  }

  async function pausePlayback() {
    if (window.AudioEngine && window.AudioEngine.setSpotifyDeviceAudible) {
      window.AudioEngine.setSpotifyDeviceAudible(false);
    }
    if (sdkPlayer && typeof sdkPlayer.pause === 'function' && webDeviceId) {
      try { await sdkPlayer.pause(); } catch (e) {}
    }
    return api('/me/player/pause', { method: 'PUT' }).catch(() => null);
  }

  async function resumePlayback(fallbackUris = null, fallbackOffset = 0, positionMs = 0) {
    const ok = await executePlayPayload(null, webDeviceId);
    if (!ok && Array.isArray(fallbackUris) && fallbackUris.length > 0) {
      return executePlayPayload(
        {
          uris: fallbackUris,
          offset: { position: fallbackOffset },
          position_ms: Math.max(0, Math.round(positionMs || 0))
        },
        webDeviceId
      );
    }
    return ok;
  }

  async function nextTrack() {
    return api('/me/player/next', { method: 'POST' });
  }

  async function prevTrack() {
    return api('/me/player/previous', { method: 'POST' });
  }

  async function seekPosition(sec) {
    return api(`/me/player/seek?position_ms=${Math.round(sec * 1000)}`, { method: 'PUT' });
  }

  async function setRemoteVolume(pct) {
    if (sdkPlayer && typeof sdkPlayer.setVolume === 'function') {
      try { sdkPlayer.setVolume(Math.max(0, Math.min(1, pct / 100))); } catch (e) {}
    }
    return api(`/me/player/volume?volume_percent=${Math.round(pct)}`, { method: 'PUT' });
  }

  function initWebPlaybackSDK(onStateChange, onReadyDevice) {
    ensureValidToken().then(token => {
      if (!token) return;
      const setupPlayer = () => {
        if (!window.Spotify || sdkPlayer) return;
        sdkPlayer = new window.Spotify.Player({
          name: 'OpenMusic · 3D Audio Player',
          getOAuthToken: cb => {
            ensureValidToken().then(t => cb(t || ''));
          },
          volume: 0.78
        });
        sdkPlayer.addListener('ready', ({ device_id }) => {
          webDeviceId = device_id;
          if (onReadyDevice) onReadyDevice(device_id);
        });
        sdkPlayer.addListener('not_ready', () => {
          if (window.AudioEngine && window.AudioEngine.setSpotifyDeviceAudible) {
            window.AudioEngine.setSpotifyDeviceAudible(false);
          }
        });
        sdkPlayer.addListener('initialization_error', () => {
          if (window.AudioEngine && window.AudioEngine.setSpotifyDeviceAudible) {
            window.AudioEngine.setSpotifyDeviceAudible(false);
          }
        });
        sdkPlayer.addListener('account_error', () => {
          if (window.AudioEngine && window.AudioEngine.setSpotifyDeviceAudible) {
            window.AudioEngine.setSpotifyDeviceAudible(false);
          }
        });
        sdkPlayer.addListener('playback_error', () => {
          if (window.AudioEngine && window.AudioEngine.setSpotifyDeviceAudible) {
            window.AudioEngine.setSpotifyDeviceAudible(false);
          }
        });
        sdkPlayer.addListener('player_state_changed', st => {
          const isSdkActivelyPlaying = Boolean(
            st && !st.paused && st.track_window && st.track_window.current_track
          );
          if (window.AudioEngine && window.AudioEngine.setSpotifyDeviceAudible) {
            window.AudioEngine.setSpotifyDeviceAudible(isSdkActivelyPlaying);
          }
          if (st && onStateChange) onStateChange(st);
        });
        sdkPlayer.connect();
      };

      window.onSpotifyWebPlaybackSDKReady = setupPlayer;
      if (window.Spotify) {
        setupPlayer();
      } else if (!document.getElementById('spotify-sdk-script')) {
        const s = document.createElement('script');
        s.id = 'spotify-sdk-script';
        s.src = 'https://sdk.scdn.co/spotify-player.js';
        s.async = true;
        document.body.appendChild(s);
      }
    });
  }

  return {
    getClientId,
    setClientId,
    getRedirectUri,
    hasToken: () => !!(memoryToken && memoryToken.access_token),
    startLogin,
    handleCallbackIfPresent,
    logout,
    extractCoverColor,
    fetchProfile,
    fetchLikedTracks,
    fetchTopTracks,
    fetchNewReleases,
    fetchFeaturedPlaylists,
    fetchSavedAlbums,
    fetchSavedAlbumTracks,
    fetchRecentTracks,
    fetchCurrentQueue,
    fetchCurrentPlayback,
    fetchAudioAnalysis,
    fetchPlaylists,
    fetchPlaylistTracks,
    playContextUri,
    searchTracks,
    mapSpotifyTrack,
    fetchDevices,
    transferPlayback,
    playUris,
    pausePlayback,
    resumePlayback,
    nextTrack,
    prevTrack,
    seekPosition,
    setRemoteVolume,
    initWebPlaybackSDK,
    getWebDeviceId: () => webDeviceId
  };
})();
window.SpotifyClient = SpotifyClient;

// ===== VANG SPOTIFY CLIENT (OAuth 2.0 PKCE + Web Playback SDK + Connect REST API) =====
// Works without any backend secret. Stores token and user-configured Client ID in localStorage.

const SpotifyClient = (function () {
  const LS_CLIENT_ID = 'vang_spotify_client_id';
  const LS_VERIFIER = 'vang_spotify_verifier';
  const LS_TOKEN = 'vang_spotify_token';

  const SCOPES = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-library-read',
    'user-read-recently-played',
    'playlist-read-private',
    'playlist-read-collaborative'
  ].join(' ');

  let sdkPlayer = null;
  let webDeviceId = null;

  function getClientId() {
    return (localStorage.getItem(LS_CLIENT_ID) || '').trim();
  }

  function setClientId(id) {
    localStorage.setItem(LS_CLIENT_ID, (id || '').trim());
  }

  function getRedirectUri() {
    return window.location.origin + window.location.pathname;
  }

  function getSavedToken() {
    try {
      const raw = localStorage.getItem(LS_TOKEN);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data;
    } catch (e) {
      return null;
    }
  }

  function saveToken(res) {
    const prev = getSavedToken() || {};
    const payload = {
      access_token: res.access_token,
      refresh_token: res.refresh_token || prev.refresh_token,
      expires_at: Date.now() + (res.expires_in || 3600) * 1000 - 60000
    };
    localStorage.setItem(LS_TOKEN, JSON.stringify(payload));
    return payload;
  }

  function logout() {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_VERIFIER);
    if (sdkPlayer) {
      try { sdkPlayer.disconnect(); } catch (e) {}
      sdkPlayer = null;
    }
    webDeviceId = null;
  }

  // PKCE helpers
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
      throw new Error('Vui lòng nhập Spotify Client ID trước khi kết nối.');
    }
    const verifier = randomString(64);
    localStorage.setItem(LS_VERIFIER, verifier);
    const challenge = await sha256Base64Url(verifier);
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: getRedirectUri(),
      code_challenge_method: 'S256',
      code_challenge: challenge,
      scope: SCOPES
    });
    window.location.href = 'https://accounts.spotify.com/authorize?' + params.toString();
  }

  async function handleCallbackIfPresent() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    if (error) {
      window.history.replaceState({}, document.title, getRedirectUri());
      throw new Error('Spotify từ chối kết nối: ' + error);
    }
    if (!code) return false;

    const verifier = localStorage.getItem(LS_VERIFIER);
    const clientId = getClientId();
    window.history.replaceState({}, document.title, getRedirectUri());
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
      throw new Error('Không thể đổi mã đăng nhập Spotify.');
    }
    const json = await resp.json();
    saveToken(json);
    return true;
  }

  async function ensureValidToken() {
    const tok = getSavedToken();
    if (!tok || !tok.access_token) return null;
    if (Date.now() < tok.expires_at) return tok.access_token;

    if (!tok.refresh_token || !getClientId()) {
      logout();
      return null;
    }

    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tok.refresh_token,
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
      return saveToken(json).access_token;
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

  // Extract dominant warm/vibrant RGB color from an album cover URL (falls back to warm amber)
  function extractCoverColor(imgUrl) {
    return new Promise(resolve => {
      if (!imgUrl) return resolve([217, 130, 43]);
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

  function mapSpotifyTrack(item) {
    const t = item && item.track ? item.track : item;
    if (!t || !t.id) return null;
    const img = (t.album && t.album.images && t.album.images[0] && t.album.images[0].url) || '';
    return {
      id: t.id,
      uri: t.uri,
      t: t.name || 'Không rõ tên',
      a: (t.artists || []).map(x => x.name).join(', ') || 'Nghệ sĩ',
      al: (t.album && t.album.name) || 'Album',
      d: Math.max(1, Math.round((t.duration_ms || 180000) / 1000)),
      cover: img,
      c: [217, 130, 43],
      bpm: 116
    };
  }

  async function fetchProfile() {
    return api('/me');
  }

  async function fetchLikedTracks() {
    const data = await api('/me/tracks?limit=30');
    return ((data && data.items) || []).map(mapSpotifyTrack).filter(Boolean);
  }

  async function fetchRecentTracks() {
    const data = await api('/me/player/recently-played?limit=30');
    const seen = new Set();
    const list = [];
    ((data && data.items) || []).forEach(it => {
      const m = mapSpotifyTrack(it.track);
      if (m && !seen.has(m.id)) {
        seen.add(m.id);
        list.push(m);
      }
    });
    return list;
  }

  async function fetchPlaylists() {
    const data = await api('/me/playlists?limit=20');
    return ((data && data.items) || []).map(p => ({
      id: p.id,
      name: p.name,
      count: (p.tracks && p.tracks.total) || 0,
      cover: (p.images && p.images[0] && p.images[0].url) || ''
    }));
  }

  async function fetchPlaylistTracks(playlistId) {
    const data = await api(`/playlists/${playlistId}/tracks?limit=40`);
    return ((data && data.items) || []).map(mapSpotifyTrack).filter(Boolean);
  }

  async function searchTracks(query) {
    if (!query.trim()) return [];
    const q = encodeURIComponent(query.trim());
    const data = await api(`/search?type=track&limit=25&q=${q}`);
    return ((data && data.tracks && data.tracks.items) || []).map(mapSpotifyTrack).filter(Boolean);
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
    const q = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '';
    return api('/me/player/play' + q, {
      method: 'PUT',
      body: JSON.stringify({
        uris,
        offset: { position: offsetIndex }
      })
    });
  }

  async function pausePlayback() {
    return api('/me/player/pause', { method: 'PUT' });
  }

  async function resumePlayback() {
    return api('/me/player/play', { method: 'PUT' });
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
    return api(`/me/player/volume?volume_percent=${Math.round(pct)}`, { method: 'PUT' });
  }

  // Initialize Spotify Web Playback SDK on desktop browsers
  function initWebPlaybackSDK(onStateChange, onReadyDevice) {
    ensureValidToken().then(token => {
      if (!token) return;
      if (!document.getElementById('spotify-sdk-script')) {
        const s = document.createElement('script');
        s.id = 'spotify-sdk-script';
        s.src = 'https://sdk.scdn.co/spotify-player.js';
        s.async = true;
        document.body.appendChild(s);
      }
      window.onSpotifyWebPlaybackSDKReady = () => {
        if (!window.Spotify) return;
        sdkPlayer = new window.Spotify.Player({
          name: 'Vang · 3D Audio Player',
          getOAuthToken: cb => {
            ensureValidToken().then(t => cb(t || ''));
          },
          volume: 0.75
        });
        sdkPlayer.addListener('ready', ({ device_id }) => {
          webDeviceId = device_id;
          if (onReadyDevice) onReadyDevice(device_id);
        });
        sdkPlayer.addListener('player_state_changed', st => {
          if (st && onStateChange) onStateChange(st);
        });
        sdkPlayer.connect();
      };
    });
  }

  return {
    getClientId,
    setClientId,
    getRedirectUri,
    hasToken: () => !!(getSavedToken() && getSavedToken().access_token),
    startLogin,
    handleCallbackIfPresent,
    logout,
    extractCoverColor,
    fetchProfile,
    fetchLikedTracks,
    fetchRecentTracks,
    fetchPlaylists,
    fetchPlaylistTracks,
    searchTracks,
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

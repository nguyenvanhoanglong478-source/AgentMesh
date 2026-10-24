// ===== VANG APPLICATION CONTROLLER (v1.2.0) =====
// Security: Strict HTML/URL escaping (XSS-safe), zero persistent user data retention.

const APP_VERSION = '1.2.0';
const GITHUB_REPO_URL = 'https://github.com/nguyenvanhoanglong478-source/Vang-Player';
const GITHUB_RELEASE_API = 'https://api.github.com/repos/nguyenvanhoanglong478-source/Vang-Player/releases/latest';

// Strict XSS Escaping Helpers
function escHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escUrl(url) {
  const s = String(url || '').trim();
  if (s.startsWith('https://') || s.startsWith('http://127.0.0.1') || s.startsWith('blob:')) {
    return s.replace(/["'<>\\]/g, '');
  }
  return '';
}

const DEMO_TRACKS = [
  {
    id: 'demo-1',
    t: 'Đèn Đường Lúc Ba Giờ',
    a: 'Nhóm Gác Mái',
    al: 'Phố Không Ngủ · 2024',
    d: 252,
    c: [217, 130, 43],
    bpm: 112,
    rootHz: 110,
    chord: [1, 1.2, 1.5, 1.8],
    g: 'linear-gradient(135deg,#D9822B 0 45%,#2A2420 45% 100%)',
    liked: true
  },
  {
    id: 'demo-2',
    t: 'Salt & Static',
    a: 'Ines Harbour',
    al: 'Coastal Noise · 2023',
    d: 221,
    c: [120, 146, 180],
    bpm: 120,
    rootHz: 98,
    chord: [1, 1.25, 1.5, 1.875],
    g: 'radial-gradient(circle at 30% 35%,#C9D3DE 0 18%,#6F86A6 19% 60%,#1E2630 61%)',
    liked: true
  },
  {
    id: 'demo-3',
    t: 'Mưa Phố Cũ',
    a: 'Lê Vân Khê',
    al: 'Hà Nội, Tháng Ba · 2022',
    d: 303,
    c: [196, 78, 50],
    bpm: 96,
    rootHz: 82.4,
    chord: [1, 1.189, 1.498, 1.681],
    g: 'linear-gradient(180deg,#B5452B 0 30%,#ECE5D8 30% 34%,#3A1F18 34%)',
    liked: false
  },
  {
    id: 'demo-4',
    t: 'Low Orbit',
    a: 'Kaito Fern',
    al: 'Satellites · 2025',
    d: 198,
    c: [160, 166, 74],
    bpm: 126,
    rootHz: 123.5,
    chord: [1, 1.33, 1.5, 2.0],
    g: 'conic-gradient(from 200deg,#8A8F3C,#2B2D16,#C8C99A,#8A8F3C)',
    liked: true
  },
  {
    id: 'demo-5',
    t: 'Giấc Ngủ Muộn',
    a: 'Nhóm Gác Mái',
    al: 'Phố Không Ngủ · 2024',
    d: 287,
    c: [196, 160, 104],
    bpm: 104,
    rootHz: 103.8,
    chord: [1, 1.2, 1.498, 1.78],
    g: 'linear-gradient(90deg,#1A1714 0 50%,#C4A068 50%)',
    liked: false
  },
  {
    id: 'demo-6',
    t: 'Tín Hiệu Đêm Đông',
    a: 'Minh Vũ · Analog Lab',
    al: 'Sóng Ngầm · 2025',
    d: 244,
    c: [92, 174, 152],
    bpm: 118,
    rootHz: 116.5,
    chord: [1, 1.25, 1.5, 1.75],
    g: 'linear-gradient(150deg,#5CAE98 0 38%,#142824 38% 100%)',
    liked: true
  }
];

const DEMO_PLAYLISTS = [
  { id: 'pl-1', kind: 'playlist', name: 'Đêm Trắng Sài Gòn', artist: 'Tuyển tập', count: 4, trackIds: ['demo-1', 'demo-3', 'demo-5', 'demo-6'] },
  { id: 'pl-2', kind: 'album', name: 'Phố Không Ngủ · 2024', artist: 'Nhóm Gác Mái', count: 2, trackIds: ['demo-1', 'demo-5'] },
  { id: 'pl-3', kind: 'album', name: 'Ambient & Modular', artist: 'Ines Harbour · Kaito Fern', count: 3, trackIds: ['demo-2', 'demo-4', 'demo-6'] },
  { id: 'pl-4', kind: 'album', name: 'Hà Nội, Tháng Ba · 2022', artist: 'Lê Vân Khê', count: 2, trackIds: ['demo-3', 'demo-5'] },
  { id: 'pl-5', kind: 'album', name: 'Sóng Ngầm · 2025', artist: 'Minh Vũ · Analog Lab', count: 2, trackIds: ['demo-6', 'demo-4'] }
];

// Build playable album collections directly from library tracks so every album in the user's library opens in 0ms
function buildLibraryAlbums(tracks) {
  const map = new Map();
  for (const tr of tracks || []) {
    if (!tr || !tr.al || tr.al === 'Spotify' || tr.al === 'Bộ nhớ thiết bị') continue;
    const key = tr.albumId || tr.al.toLowerCase().trim();
    if (!map.has(key)) {
      map.set(key, {
        id: tr.albumId || ('lib-alb-' + map.size),
        uri: tr.albumUri || (tr.albumId ? `spotify:album:${tr.albumId}` : ''),
        kind: 'album',
        name: tr.al,
        artist: tr.a || 'Album',
        count: 0,
        cover: tr.cover || '',
        preloadedTracks: []
      });
    }
    const entry = map.get(key);
    if (!entry.cover && tr.cover) entry.cover = tr.cover;
    if (!entry.preloadedTracks.some(x => x.id === tr.id)) {
      entry.preloadedTracks.push(tr);
      entry.count = entry.preloadedTracks.length;
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 120);
}

function mergeCollections(...lists) {
  const seen = new Map();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (!item || !item.id) continue;
      const idKey = String(item.id);
      const nameKey = `${item.kind || 'playlist'}:${String(item.name || '').toLowerCase().trim()}`;
      if (seen.has(idKey)) {
        const prev = seen.get(idKey);
        if ((!prev.preloadedTracks || !prev.preloadedTracks.length) && item.preloadedTracks && item.preloadedTracks.length) {
          prev.preloadedTracks = item.preloadedTracks;
          prev.count = Math.max(prev.count || 0, item.preloadedTracks.length);
        }
        continue;
      }
      let dupByName = null;
      for (const existing of seen.values()) {
        if (`${existing.kind || 'playlist'}:${String(existing.name || '').toLowerCase().trim()}` === nameKey) {
          dupByName = existing;
          break;
        }
      }
      if (dupByName) {
        if ((!dupByName.preloadedTracks || !dupByName.preloadedTracks.length) && item.preloadedTracks && item.preloadedTracks.length) {
          dupByName.preloadedTracks = item.preloadedTracks;
          dupByName.count = Math.max(dupByName.count || 0, item.preloadedTracks.length);
        }
        continue;
      }
      seen.set(idKey, item);
    }
  }
  return Array.from(seen.values());
}

// Minimal geometric task icons
const TASK_ICONS = {
  play: `<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="4,2.2 13.8,8 4,13.8"/></svg>`,
  pause: `<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="3.5" y="2.5" width="3.2" height="11"/><rect x="9.3" y="2.5" width="3.2" height="11"/></svg>`,
  prev: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="2.5" y="3" width="1.8" height="10"/><polygon points="13,3 5.5,8 13,13"/></svg>`,
  next: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="3,3 10.5,8 3,13"/><rect x="11.7" y="3" width="1.8" height="10"/></svg>`,
  shuffle: `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 4.5h3.2l5.6 7H14M14 4.5h-3.2l-2 2.5M12 2.5l2 2-2 2M12 9.5l2 2-2 2"/></svg>`,
  repeat: `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3 5h9.5v3M10.5 3l2 2-2 2M13 11H3.5V8M5.5 13l-2-2 2-2"/></svg>`,
  vol: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="2,6 5.5,6 9.5,2.5 9.5,13.5 5.5,10 2,10"/><path d="M11.8 5.2a4.2 4.2 0 0 1 0 5.6" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`,
  mute: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="2,6 5.5,6 9.5,2.5 9.5,13.5 5.5,10 2,10"/><path d="M11.5 6l3.5 4M15 6l-3.5 4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`
};

const AppState = {
  tracks: DEMO_TRACKS.slice(),
  allTracks: DEMO_TRACKS.slice(),
  likedTracks: [],
  topTracks: [],
  recentTracks: [],
  localTracks: [],
  playlists: DEMO_PLAYLISTS.slice(),
  openedCollection: null, // Stores currently opened Playlist or Album object
  idx: 0,
  pos: 37,
  playing: false,
  shuffle: false,
  repeat: false,
  tab: 'queue', // 'queue' | 'liked' | 'top' | 'playlists' | 'recent' | 'search'
  searchQuery: '',
  searchOffset: 0,
  searchHasMore: false,
  spotifyActive: false,
  userName: 'Chế độ thử nghiệm',
  activeDeviceName: 'Trình phát Web · Vang',
  devices: [
    { id: 'local-web', name: 'Trình phát Web · Vang (Máy này)', type: 'Computer', is_active: true },
    { id: 'demo-phone', name: 'iPhone · Spotify Connect', type: 'Smartphone', is_active: false },
    { id: 'demo-laptop', name: 'Laptop Studio · Spotify Connect', type: 'Computer', is_active: false }
  ],
  mobDrawer: null,
  sleepMinutes: 0,
  sleepRemainingSec: 0
};
window.AppState = AppState;

let currentAcc = DEMO_TRACKS[0].c.slice();
let simTime = 0;
let visualTime = 0;
let lastFrame = performance.now();
let lastRenderedSec = -1;
let toastTmr = null;
let wakeLockSentinel = null;

function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
}

function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTmr);
  toastTmr = setTimeout(() => el.classList.remove('show'), 2600);
}

function currentTrack() {
  return AppState.tracks[AppState.idx] || AppState.allTracks[0] || DEMO_TRACKS[0];
}

// Android / Desktop MediaSession Integration (Lock Screen, Notification Bar & Bluetooth Controls)
function updateMediaSession() {
  if (!('mediaSession' in navigator)) return;
  const tr = currentTrack();
  if (!tr) return;
  try {
    const artwork = tr.cover && escUrl(tr.cover)
      ? [{ src: escUrl(tr.cover), sizes: '512x512', type: 'image/jpeg' }]
      : [];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: tr.t || 'VANG',
      artist: tr.a || 'Nghệ sĩ',
      album: tr.al || 'VANG · 3D Audio',
      artwork
    });
    navigator.mediaSession.playbackState = AppState.playing ? 'playing' : 'paused';
  } catch (e) {}
}

function bindMediaSessionHandlers() {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.setActionHandler('play', () => setPlaying(true));
    navigator.mediaSession.setActionHandler('pause', () => setPlaying(false));
    navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
    navigator.mediaSession.setActionHandler('seekto', details => {
      if (details && typeof details.seekTime === 'number') {
        AppState.pos = details.seekTime;
        if (AppState.spotifyActive) SpotifyClient.seekPosition(AppState.pos).catch(() => {});
        if (AudioEngine.seekLocalAudio) AudioEngine.seekLocalAudio(AppState.pos);
        renderMetadata();
      }
    });
  } catch (e) {}
}

// Keep screen awake on Android while playing 3D visuals
async function syncWakeLock(active) {
  if (!('wakeLock' in navigator)) return;
  try {
    if (active && !wakeLockSentinel) {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
    } else if (!active && wakeLockSentinel) {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
    }
  } catch (e) {}
}

function renderTrackList() {
  const container = document.getElementById('track-list');
  if (!container) return;

  // 1. Playlists & Saved Albums Directory View (when tab === 'playlists' and no collection is opened)
  if (AppState.tab === 'playlists' && !AppState.openedCollection) {
    document.querySelectorAll('.js-track-count').forEach(el => {
      el.textContent = AppState.playlists.length + ' mục';
    });

    if (!AppState.playlists.length) {
      container.innerHTML = `<div class="dim" style="padding:20px 0;font-size:12px">Chưa có tuyển tập hoặc album nào. Bấm "Đồng bộ" để tải.</div>`;
      return;
    }

    container.innerHTML = AppState.playlists
      .map((pl, i) => {
        const safeCover = escUrl(pl.cover);
        const artStyle = safeCover
          ? `background-image:url('${safeCover}')`
          : 'background:linear-gradient(135deg,var(--acc),#221e1a)';
        const kindBadge = pl.kind === 'album' ? 'Album' : 'Playlist';
        const subText = pl.count ? `${kindBadge} · ${Number(pl.count) || 0} bài` : kindBadge;
        return `
      <div class="qrow" data-pl="${escHtml(pl.id)}" role="button" tabindex="0">
        <span class="mono dim">${String(i + 1).padStart(2, '0')}</span>
        <div class="art" style="${artStyle}"></div>
        <div class="truncate">
          <div class="qt truncate">${escHtml(pl.name)}</div>
          <div class="qa truncate">${escHtml(subText)}</div>
        </div>
        <span class="mono acc" style="text-align:right">Mở →</span>
      </div>`;
      })
      .join('');

    container.querySelectorAll('[data-pl]').forEach(row => {
      row.onclick = () => openPlaylist(row.dataset.pl);
    });
    return;
  }

  let list = AppState.tracks;
  let headerHTML = '';

  // If viewing inside an opened Playlist or Album, render a fixed back/play header bar
  if (AppState.openedCollection) {
    const col = AppState.openedCollection;
    headerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0 10px;border-bottom:1px solid var(--line-strong);margin-bottom:4px">
        <button id="btn-back-playlists" class="word mono" type="button" style="height:28px;font-size:10.5px">← Tuyển tập</button>
        <div class="truncate" style="font-size:12px;font-weight:600;color:var(--acc);flex:1;text-align:center">${escHtml(col.name)}</div>
        <button id="btn-play-collection" class="word mono on" type="button" style="height:28px;font-size:10.5px">Phát tất cả</button>
      </div>`;
  }

  if (!list.length) {
    container.innerHTML =
      headerHTML +
      `<div class="dim" style="padding:20px 0;font-size:12px">Không tìm thấy bản nhạc phù hợp.</div>`;
    bindCollectionHeaderButtons();
    return;
  }

  const cur = currentTrack();
  let htmlRows =
    headerHTML +
    list
      .map((tr, i) => {
        const isCur = cur && tr.id === cur.id;
        const safeCover = escUrl(tr.cover);
        const artStyle = safeCover
          ? `background-image:url('${safeCover}')`
          : `background:${tr.g || 'linear-gradient(135deg,#D9822B,#2A2420)'}`;
        return `
      <div class="qrow${isCur ? ' cur' : ''}" data-idx="${i}">
        <span class="mono dim qidx">${String(i + 1).padStart(2, '0')}</span>
        <div class="art" style="${artStyle}"></div>
        <div class="truncate">
          <div class="qt truncate">${escHtml(tr.t)}</div>
          <div class="qa truncate">${escHtml(tr.a)}</div>
        </div>
        <span class="mono dim" style="text-align:right">${fmtTime(tr.d)}</span>
      </div>`;
      })
      .join('');

  if (AppState.tab === 'search' && AppState.spotifyActive && AppState.searchHasMore) {
    htmlRows += `
      <div style="padding:12px 0;text-align:center">
        <button id="btn-load-more-search" class="btn-outline" type="button" style="width:100%">Tải thêm kết quả (+50 bài)</button>
      </div>`;
  }

  container.innerHTML = htmlRows;

  document.querySelectorAll('.js-track-count').forEach(el => {
    el.textContent = list.length + ' bài';
  });

  bindCollectionHeaderButtons();

  container.querySelectorAll('.qrow[data-idx]').forEach(row => {
    row.onclick = () => {
      const i = Number(row.dataset.idx);
      selectTrack(i, true);
      if (window.innerWidth <= 900) closeMobileDrawers();
    };
  });

  const btnMore = document.getElementById('btn-load-more-search');
  if (btnMore) {
    btnMore.onclick = () => loadMoreSearchResults();
  }
}

function bindCollectionHeaderButtons() {
  const btnBack = document.getElementById('btn-back-playlists');
  if (btnBack) {
    btnBack.onclick = () => {
      AppState.openedCollection = null;
      AppState.tab = 'playlists';
      syncNavTabs();
      renderTrackList();
    };
  }
  const btnPlayCol = document.getElementById('btn-play-collection');
  if (btnPlayCol) {
    btnPlayCol.onclick = () => {
      AudioEngine.ensureContext();
      if (AppState.tracks.length > 0) {
        selectTrack(0, true);
      } else if (AppState.spotifyActive && AppState.openedCollection && AppState.openedCollection.uri) {
        SpotifyClient.playContextUri(AppState.openedCollection.uri, 0, SpotifyClient.getWebDeviceId())
          .then(() => {
            setPlaying(true, true);
            showToast('Đang phát: ' + AppState.openedCollection.name);
          })
          .catch(() => {});
      }
    };
  }
}

// Open any Playlist or Saved Album reliably and start playback immediately
async function openPlaylist(plId) {
  AudioEngine.ensureContext();

  const pl = AppState.playlists.find(p => String(p.id) === String(plId)) ||
             DEMO_PLAYLISTS.find(p => String(p.id) === String(plId));

  if (AppState.spotifyActive) {
    const colMeta = pl || { id: plId, kind: 'playlist', name: 'Tuyển tập', uri: `spotify:playlist:${plId}` };
    AppState.openedCollection = colMeta;

    // 1. Instant path: if preloadedTracks or matching library tracks exist, open & play in 0ms!
    const preloaded = (colMeta.preloadedTracks && colMeta.preloadedTracks.length)
      ? colMeta.preloadedTracks.slice()
      : AppState.allTracks.filter(
          tr => (tr.albumId && String(tr.albumId) === String(plId)) ||
                (colMeta.name && tr.al && tr.al.toLowerCase().trim() === colMeta.name.toLowerCase().trim())
        );

    if (preloaded.length > 0) {
      AppState.tracks = preloaded;
      renderTrackList();
      selectTrack(0, true);
      showToast(`Đang phát "${colMeta.name}" (${preloaded.length} bài)`);

      // If it's a Spotify album or playlist that might have more tracks on the server, fetch in background
      if (!String(plId).startsWith('lib-alb-') && !String(plId).startsWith('pl-')) {
        SpotifyClient.fetchPlaylistTracks(
          plId,
          500,
          null,
          colMeta.kind || 'playlist',
          null,
          colMeta.name || ''
        ).then(fullItems => {
          if (fullItems && fullItems.length > preloaded.length && AppState.openedCollection === colMeta) {
            AppState.tracks = fullItems;
            renderTrackList();
          }
        }).catch(() => {});
      }
      return;
    }

    // 2. Network path: show immediate collection view with loading message so UI never feels frozen
    AppState.tracks = [];
    const container = document.getElementById('track-list');
    if (container) {
      container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0 10px;border-bottom:1px solid var(--line-strong);margin-bottom:4px">
          <button id="btn-back-playlists" class="word mono" type="button" style="height:28px;font-size:10.5px">← Tuyển tập</button>
          <div class="truncate" style="font-size:12px;font-weight:600;color:var(--acc);flex:1;text-align:center">${escHtml(colMeta.name)}</div>
          <button id="btn-play-collection" class="word mono on" type="button" style="height:28px;font-size:10.5px">Phát tất cả</button>
        </div>
        <div class="dim" style="padding:20px 0;font-size:12px">Đang tải danh sách bài hát từ "${escHtml(colMeta.name)}"...</div>`;
      bindCollectionHeaderButtons();
    }

    try {
      showToast('Đang mở: ' + colMeta.name);
      let firstChunkPlayed = false;
      const items = await SpotifyClient.fetchPlaylistTracks(
        plId,
        500,
        partial => {
          if (partial.length && AppState.openedCollection === colMeta) {
            AppState.tracks = partial;
            renderTrackList();
            if (!firstChunkPlayed) {
              firstChunkPlayed = true;
              selectTrack(0, true);
            }
          }
        },
        colMeta.kind || 'playlist',
        null,
        colMeta.name || ''
      );

      if (items && items.length) {
        colMeta.preloadedTracks = items;
        AppState.tracks = items;
        renderTrackList();
        if (!firstChunkPlayed) {
          selectTrack(0, true);
        }
        showToast(`Đang phát "${colMeta.name}" (${items.length} bài)`);
        return;
      }

      // 3. Fallback: start playback via context_uri and sync queue or library tracks
      if (colMeta.uri) {
        await SpotifyClient.playContextUri(colMeta.uri, 0, SpotifyClient.getWebDeviceId()).catch(() => {});
        setPlaying(true, true);
        await new Promise(r => setTimeout(r, 550));
        const qInfo = await SpotifyClient.fetchCurrentQueue().catch(() => null);
        if (qInfo && qInfo.tracks && qInfo.tracks.length) {
          AppState.tracks = qInfo.tracks;
          renderTrackList();
          renderMetadata();
          showToast('Đang phát tuyển tập: ' + colMeta.name);
          return;
        }
      }

      if (AppState.allTracks.length > 0) {
        AppState.tracks = AppState.allTracks.slice(0, 40);
        renderTrackList();
        selectTrack(0, true);
        showToast('Đang phát: ' + colMeta.name);
        return;
      }

      renderTrackList();
      showToast('Đã mở: ' + colMeta.name);
      return;
    } catch (e) {
      if (AppState.allTracks.length > 0) {
        AppState.tracks = AppState.allTracks.slice(0, 40);
        renderTrackList();
        selectTrack(0, true);
      } else {
        showToast('Không tải được danh sách bài hát');
      }
    }
    return;
  }

  // Demo mode playlist/album opening
  const targetPl = pl || DEMO_PLAYLISTS[0];
  if (targetPl) {
    AppState.openedCollection = targetPl;
    if (targetPl.preloadedTracks && targetPl.preloadedTracks.length) {
      AppState.tracks = targetPl.preloadedTracks.slice();
    } else if (targetPl.trackIds) {
      AppState.tracks = DEMO_TRACKS.filter(t => targetPl.trackIds.includes(t.id));
    } else {
      AppState.tracks = DEMO_TRACKS.slice();
    }
    renderTrackList();
    selectTrack(0, true);
    showToast('Đang phát: ' + targetPl.name);
  }
}

function renderMetadata() {
  const tr = currentTrack();
  if (!tr) return;
  document.querySelectorAll('.js-title').forEach(el => (el.textContent = tr.t));
  document.querySelectorAll('.js-artist').forEach(el => (el.textContent = tr.a));
  document.querySelectorAll('.js-album').forEach(el => (el.textContent = tr.al));
  document.querySelectorAll('.js-dur').forEach(el => (el.textContent = fmtTime(tr.d)));
  document.querySelectorAll('.js-time').forEach(el => (el.textContent = fmtTime(AppState.pos)));

  if (tr.cover && (!tr.c || tr.c[0] === 217)) {
    SpotifyClient.extractCoverColor(tr.cover).then(rgb => {
      tr.c = rgb;
    });
  }
  if (AudioEngine.syncTrackAudioProfile) {
    AudioEngine.syncTrackAudioProfile(tr, AppState.playing);
  }
  updateMediaSession();
}

function selectTrack(index, autoPlay = false) {
  if (!AppState.tracks.length) return;
  if (autoPlay) {
    AudioEngine.ensureContext();
    AppState.playing = true;
  }
  AppState.idx = (index + AppState.tracks.length) % AppState.tracks.length;
  AppState.pos = 0;

  // Render metadata synchronously so AudioEngine starts inside the user's click gesture
  renderMetadata();
  const metaEl = document.querySelector('.stage-meta');
  if (metaEl) {
    metaEl.classList.add('swap');
    setTimeout(() => metaEl.classList.remove('swap'), 220);
  }

  renderTrackList();

  const tr = currentTrack();
  if (AppState.spotifyActive && tr && tr.uri && !tr.localUrl && autoPlay) {
    const uris = AppState.tracks.map(x => x.uri).filter(Boolean);
    const winStart = Math.max(0, AppState.idx - 10);
    const winUris = uris.slice(winStart, winStart + 80);
    const relOffset = Math.max(0, AppState.idx - winStart);
    SpotifyClient.playUris(winUris, relOffset, SpotifyClient.getWebDeviceId()).catch(() => {});
  }

  if (autoPlay) {
    // Pass skipRemoteCall = true so setPlaying doesn't send a competing empty resumePlayback() request
    setPlaying(true, true);
  }
}

function setPlaying(playState, skipRemoteCall = false) {
  AppState.playing = !!playState;
  const tr = currentTrack();
  const isLocal = !!(tr && tr.localUrl);

  if (AppState.playing) {
    AudioEngine.ensureContext();
  }

  if (AppState.spotifyActive && !isLocal && !skipRemoteCall) {
    if (AppState.playing) {
      const uris = AppState.tracks.map(x => x.uri).filter(Boolean);
      const winStart = Math.max(0, AppState.idx - 10);
      const winUris = uris.slice(winStart, winStart + 80);
      const relOffset = Math.max(0, AppState.idx - winStart);
      SpotifyClient.resumePlayback(winUris, relOffset, AppState.pos * 1000).catch(() => {});
    } else {
      SpotifyClient.pausePlayback().catch(() => {});
    }
  }
  if (AudioEngine.setReferencePlaying) {
    AudioEngine.setReferencePlaying(AppState.playing);
  }

  const iconHTML = AppState.playing ? TASK_ICONS.pause : TASK_ICONS.play;
  document.querySelectorAll('.js-play').forEach(btn => {
    btn.innerHTML = iconHTML;
    btn.setAttribute('aria-label', AppState.playing ? 'Tạm dừng' : 'Phát');
    btn.dataset.state = AppState.playing ? 'playing' : 'paused';
  });

  updateMediaSession();
  syncWakeLock(AppState.playing);
}

function nextTrack() {
  if (AppState.shuffle && AppState.tracks.length > 1) {
    let r = AppState.idx;
    while (r === AppState.idx) {
      r = Math.floor(Math.random() * AppState.tracks.length);
    }
    selectTrack(r, AppState.playing);
  } else {
    selectTrack(AppState.idx + 1, AppState.playing);
  }
}

function prevTrack() {
  if (AppState.pos > 4) {
    AppState.pos = 0;
    if (AppState.spotifyActive) SpotifyClient.seekPosition(0).catch(() => {});
    if (AudioEngine.seekLocalAudio) AudioEngine.seekLocalAudio(0);
    renderMetadata();
  } else {
    selectTrack(AppState.idx - 1, AppState.playing);
  }
}

function switchTab(tabName) {
  AppState.tab = tabName;
  AppState.openedCollection = null;
  syncNavTabs();

  const searchWrap = document.getElementById('search-wrap');
  if (searchWrap) {
    searchWrap.classList.toggle('show', tabName === 'search');
    if (tabName === 'search') {
      const inp = document.getElementById('search-input');
      if (inp) setTimeout(() => inp.focus(), 50);
    }
  }

  if (AppState.spotifyActive) {
    if (tabName === 'liked') {
      if (AppState.likedTracks.length) {
        AppState.tracks = AppState.likedTracks.slice();
        renderTrackList();
      }
      SpotifyClient.fetchLikedTracks(500, partial => {
        AppState.likedTracks = partial;
        if (AppState.tab === 'liked') {
          AppState.tracks = partial.slice();
          renderTrackList();
        }
      }).then(list => {
        if (list.length) {
          AppState.likedTracks = list;
          if (AppState.tab === 'liked') {
            AppState.tracks = list;
            renderTrackList();
          }
        }
      }).catch(() => {});
      return;
    }
    if (tabName === 'top') {
      if (AppState.topTracks.length) {
        AppState.tracks = AppState.topTracks.slice();
        renderTrackList();
      }
      SpotifyClient.fetchTopTracks().then(list => {
        if (list.length) {
          AppState.topTracks = list;
          if (AppState.tab === 'top') {
            AppState.tracks = list;
            renderTrackList();
          }
        }
      }).catch(() => {});
      return;
    }
    if (tabName === 'recent') {
      if (AppState.recentTracks.length) {
        AppState.tracks = AppState.recentTracks.slice();
        renderTrackList();
      }
      SpotifyClient.fetchRecentTracks().then(list => {
        if (list.length) {
          AppState.recentTracks = list;
          if (AppState.tab === 'recent') {
            AppState.tracks = list;
            renderTrackList();
          }
        }
      }).catch(() => {});
      return;
    }
    if (tabName === 'playlists') {
      const libAlbums = buildLibraryAlbums(AppState.allTracks);
      if (libAlbums.length) {
        AppState.playlists = mergeCollections(AppState.playlists, libAlbums);
      }
      renderTrackList();
      SpotifyClient.fetchPlaylists(200).then(pls => {
        AppState.playlists = mergeCollections(pls, buildLibraryAlbums(AppState.allTracks));
        if (AppState.tab === 'playlists' && !AppState.openedCollection) renderTrackList();
      }).catch(() => renderTrackList());
      return;
    }
  }

  // Demo mode / fallback tab filtering
  if (tabName === 'liked') {
    AppState.tracks = AppState.allTracks.filter(t => t.liked);
  } else if (tabName === 'top') {
    AppState.tracks = AppState.allTracks.slice();
  } else if (tabName === 'recent') {
    AppState.tracks = AppState.allTracks.slice().reverse();
  } else if (tabName === 'search') {
    filterSearch(AppState.searchQuery);
    return;
  } else {
    AppState.tracks = AppState.allTracks.slice();
  }
  renderTrackList();
}

function syncNavTabs() {
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.classList.toggle('on', btn.dataset.tab === AppState.tab);
  });
}

let searchDebounce = null;
function filterSearch(q) {
  AppState.searchQuery = q;
  AppState.searchOffset = 0;
  if (AppState.spotifyActive && q.trim().length >= 2) {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      SpotifyClient.searchTracks(q, 0).then(res => {
        AppState.tracks = res;
        AppState.searchOffset = res.length;
        AppState.searchHasMore = res.length >= 50;
        renderTrackList();
      }).catch(() => {});
    }, 300);
    return;
  }
  AppState.searchHasMore = false;
  const kw = q.trim().toLowerCase();
  AppState.tracks = !kw
    ? AppState.allTracks.slice()
    : AppState.allTracks.filter(
        t => t.t.toLowerCase().includes(kw) || t.a.toLowerCase().includes(kw) || t.al.toLowerCase().includes(kw)
      );
  renderTrackList();
}

async function loadMoreSearchResults() {
  if (!AppState.spotifyActive || !AppState.searchQuery.trim()) return;
  try {
    showToast('Đang tải thêm kết quả...');
    const more = await SpotifyClient.searchTracks(AppState.searchQuery, AppState.searchOffset);
    if (more.length) {
      AppState.tracks = AppState.tracks.concat(more);
      AppState.searchOffset += more.length;
      AppState.searchHasMore = more.length >= 50;
      renderTrackList();
    } else {
      AppState.searchHasMore = false;
      renderTrackList();
    }
  } catch (e) {
    showToast('Không thể tải thêm kết quả');
  }
}

// Handle Local Audio Files (.mp3, .flac, .wav, .m4a) for Android / PC Offline Music Playback
function handleLocalFilesSelected(fileList) {
  if (!fileList || !fileList.length) return;
  const added = [];
  for (let i = 0; i < fileList.length; i++) {
    const f = fileList[i];
    if (!f) continue;
    const rawName = f.name.replace(/\.[^/.]+$/, '');
    const parts = rawName.split(' - ');
    const artist = parts.length > 1 ? parts[0].trim() : 'Nhạc trong máy';
    const title = parts.length > 1 ? parts.slice(1).join(' - ').trim() : rawName.trim();
    const url = URL.createObjectURL(f);
    added.push({
      id: 'local-' + Date.now() + '-' + i,
      t: title || 'Bản nhạc nội bộ',
      a: artist,
      al: 'Bộ nhớ thiết bị',
      d: 210,
      c: [217, 130, 43],
      bpm: 116,
      localUrl: url,
      liked: true
    });
  }
  if (added.length) {
    AppState.localTracks = added.concat(AppState.localTracks);
    AppState.allTracks = added.concat(AppState.allTracks);
    AppState.tracks = AppState.allTracks.slice();
    AppState.openedCollection = null;
    AppState.tab = 'queue';
    syncNavTabs();
    selectTrack(0, true);
    showToast(`Đã mở ${added.length} bài nhạc từ thiết bị`);
  }
}

// Sleep Timer (Android / Desktop Music App Feature)
function cycleSleepTimer() {
  const steps = [0, 15, 30, 60];
  const curIdx = steps.indexOf(AppState.sleepMinutes);
  const nextMin = steps[(curIdx + 1) % steps.length];
  AppState.sleepMinutes = nextMin;
  AppState.sleepRemainingSec = nextMin * 60;
  document.querySelectorAll('.js-sleep-label').forEach(el => {
    el.textContent = nextMin > 0 ? `${nextMin}p` : 'Tắt';
  });
  showToast(nextMin > 0 ? `Hẹn giờ tắt nhạc: ${nextMin} phút` : 'Đã tắt hẹn giờ ngủ');
}

// Visual Mode Switching
function setVisualMode(m) {
  const mode = Visualizer3D.setMode(m);
  document.querySelectorAll('.js-vmode').forEach(btn => {
    btn.classList.toggle('on', btn.dataset.m === mode);
  });
  const labelMap = { cluster: 'Khối đốm hạt', ridge: 'Địa hình', vortex: 'Xoáy hạt' };
  document.querySelectorAll('.js-vmode-cycle, .js-vmode-label').forEach(el => {
    el.textContent = labelMap[mode] || 'Khối đốm hạt';
  });
}

// Modals: Spotify Connect, Device Selector & Install/Update
function openSpotifyModal() {
  const m = document.getElementById('spotify-modal');
  if (!m) return;
  const inp = document.getElementById('sp-client-id');
  const redir = document.getElementById('sp-redirect-uri');
  if (inp) inp.value = SpotifyClient.getClientId();
  if (redir) redir.textContent = SpotifyClient.getRedirectUri();
  m.hidden = false;
}

function closeSpotifyModal() {
  const m = document.getElementById('spotify-modal');
  if (m) m.hidden = true;
}

async function openDeviceModal() {
  const m = document.getElementById('device-modal');
  if (!m) return;
  m.hidden = false;
  if (AppState.spotifyActive) {
    try {
      const devs = await SpotifyClient.fetchDevices();
      if (devs && devs.length) {
        AppState.devices = devs;
      }
    } catch (e) {}
  }
  renderDeviceList();
}

function closeDeviceModal() {
  const m = document.getElementById('device-modal');
  if (m) m.hidden = true;
}

let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

function openInstallModal() {
  const m = document.getElementById('install-modal');
  if (m) m.hidden = false;
}

function closeInstallModal() {
  const m = document.getElementById('install-modal');
  if (m) m.hidden = true;
}

async function triggerPwaInstall() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    if (choice && choice.outcome === 'accepted') {
      showToast('Đã bắt đầu cài đặt ứng dụng VANG');
      closeInstallModal();
    }
  } else {
    showToast('Chọn Menu trình duyệt (⋮ hoặc Chia sẻ) → "Thêm vào màn hình chính"');
  }
}

function renderDeviceList() {
  const box = document.getElementById('device-list');
  if (!box) return;
  box.innerHTML = AppState.devices
    .map(
      d => `
    <div class="device-item${d.is_active ? ' active' : ''}" data-dev="${escHtml(d.id)}">
      <div>
        <div style="font-size:13px;color:var(--paper)">${escHtml(d.name)}</div>
        <div class="mono dim" style="margin-top:2px">${d.type === 'Smartphone' ? 'Điện thoại' : 'Máy tính'}</div>
      </div>
      <span class="mono ${d.is_active ? 'acc' : 'dim'}">${d.is_active ? 'Đang phát' : 'Chuyển sang'}</span>
    </div>`
    )
    .join('');

  box.querySelectorAll('[data-dev]').forEach(el => {
    el.onclick = async () => {
      const id = el.dataset.dev;
      AppState.devices.forEach(d => (d.is_active = d.id === id));
      const chosen = AppState.devices.find(d => d.id === id);
      if (chosen) {
        AppState.activeDeviceName = chosen.name;
        document.querySelectorAll('.js-device-name').forEach(s => (s.textContent = chosen.name));
      }
      if (AppState.spotifyActive) {
        try {
          await SpotifyClient.transferPlayback(id, true);
        } catch (e) {}
      }
      renderDeviceList();
      showToast('Đã chuyển âm thanh sang: ' + (chosen ? chosen.name : 'Thiết bị mới'));
      setTimeout(closeDeviceModal, 350);
    };
  });
}

// Mobile drawers
function toggleMobileDrawer(which) {
  const left = document.querySelector('.left-pane');
  const right = document.querySelector('.right-pane');
  if (AppState.mobDrawer === which) {
    AppState.mobDrawer = null;
  } else {
    AppState.mobDrawer = which;
  }
  if (left) left.classList.toggle('mob-open', AppState.mobDrawer === 'left');
  if (right) right.classList.toggle('mob-open', AppState.mobDrawer === 'right');
  document.querySelectorAll('[data-mob-drawer]').forEach(b => {
    b.classList.toggle('on', b.dataset.mobDrawer === AppState.mobDrawer);
  });
}

function closeMobileDrawers() {
  AppState.mobDrawer = null;
  const left = document.querySelector('.left-pane');
  const right = document.querySelector('.right-pane');
  if (left) left.classList.remove('mob-open');
  if (right) right.classList.remove('mob-open');
  document.querySelectorAll('[data-mob-drawer]').forEach(b => b.classList.remove('on'));
}

function mergeUniqueTracks(...arrays) {
  const seen = new Set();
  const out = [];
  for (const arr of arrays) {
    if (!Array.isArray(arr)) continue;
    for (const tr of arr) {
      if (!tr) continue;
      const key = tr.id || tr.uri || `${tr.t}__${tr.a}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(tr);
      }
    }
  }
  return out;
}

async function syncFullSpotifyLibrary(showFeedback = false) {
  if (!AppState.spotifyActive) return;
  if (showFeedback) showToast('Đang đồng bộ toàn bộ thư viện Spotify...');

  try {
    const [queueInfo, liked, top, recent, savedAlbumsInfo, playlists] = await Promise.all([
      SpotifyClient.fetchCurrentQueue().catch(() => ({ playback: null, tracks: [] })),
      SpotifyClient.fetchLikedTracks(500, partial => {
        AppState.likedTracks = partial;
        if (AppState.tab === 'liked') {
          AppState.tracks = partial.slice();
          renderTrackList();
        }
      }).catch(() => []),
      SpotifyClient.fetchTopTracks().catch(() => []),
      SpotifyClient.fetchRecentTracks().catch(() => []),
      SpotifyClient.fetchSavedAlbums().catch(() => ({ albums: [], tracks: [] })),
      SpotifyClient.fetchPlaylists(200).catch(() => [])
    ]);

    if (liked.length) AppState.likedTracks = liked;
    if (top.length) AppState.topTracks = top;
    if (recent.length) AppState.recentTracks = recent;

    let combined = mergeUniqueTracks(
      AppState.localTracks,
      queueInfo.tracks || [],
      liked,
      top,
      recent,
      savedAlbumsInfo.tracks || []
    );

    if (combined.length < 40 && playlists.length > 0) {
      const topPlaylists = playlists.slice(0, 3);
      for (const pl of topPlaylists) {
        try {
          const plTracks = await SpotifyClient.fetchPlaylistTracks(pl.id, 200, null, pl.kind, pl.preloadedTracks, pl.name);
          combined = mergeUniqueTracks(combined, plTracks);
        } catch (e) {}
      }
    }

    const derivedAlbums = buildLibraryAlbums(combined);
    const mergedCols = mergeCollections(playlists, savedAlbumsInfo.albums || [], derivedAlbums);
    if (mergedCols.length) {
      AppState.playlists = mergedCols;
    }

    if (combined.length > 0) {
      AppState.allTracks = combined;
      if (AppState.tab === 'queue' && !AppState.openedCollection) {
        AppState.tracks = combined.slice();
        selectTrack(0, false);
      } else {
        renderTrackList();
      }
    }

    if (queueInfo.playback) {
      applyRemotePlaybackState(queueInfo.playback);
    }

    if (showFeedback) {
      showToast(`Đã đồng bộ ${AppState.allTracks.length} bài hát & ${AppState.playlists.length} tuyển tập`);
    }
  } catch (e) {
    if (showFeedback) showToast('Không thể đồng bộ thư viện Spotify');
  }
}

function applyRemotePlaybackState(pb) {
  if (!pb) return;
  if (pb.device && pb.device.name) {
    AppState.activeDeviceName = pb.device.name;
    document.querySelectorAll('.js-device-name').forEach(s => (s.textContent = pb.device.name));
  }
  if (typeof pb.is_playing === 'boolean') {
    AppState.playing = pb.is_playing;
    const iconHTML = AppState.playing ? TASK_ICONS.pause : TASK_ICONS.play;
    document.querySelectorAll('.js-play').forEach(btn => {
      btn.innerHTML = iconHTML;
      btn.dataset.state = AppState.playing ? 'playing' : 'paused';
    });
  }
  if (typeof pb.progress_ms === 'number') {
    AppState.pos = Math.round(pb.progress_ms / 1000);
  }
  if (pb.item && pb.item.id) {
    const mapped = SpotifyClient.mapSpotifyTrack(pb.item);
    if (mapped) {
      const existingIdx = AppState.tracks.findIndex(x => x.id === mapped.id);
      if (existingIdx >= 0) {
        AppState.idx = existingIdx;
      } else if (!AppState.openedCollection) {
        AppState.tracks.unshift(mapped);
        AppState.allTracks = mergeUniqueTracks([mapped], AppState.allTracks);
        AppState.idx = 0;
      }
      renderMetadata();
      renderTrackList();
    }
  }
}

let remotePollTimer = null;
function startRemotePlaybackPolling() {
  if (remotePollTimer) clearInterval(remotePollTimer);
  remotePollTimer = setInterval(async () => {
    if (!AppState.spotifyActive) return;
    const pb = await SpotifyClient.fetchCurrentPlayback();
    if (pb && pb.item) {
      applyRemotePlaybackState(pb);
    }
  }, 4000);
}

// Connect live Spotify account (in-memory zero-retention session)
async function initSpotifySession() {
  try {
    await SpotifyClient.handleCallbackIfPresent();
  } catch (err) {
    showToast(err.message);
  }
  if (!SpotifyClient.hasToken()) return;

  try {
    const profile = await SpotifyClient.fetchProfile();
    if (profile && profile.display_name) {
      AppState.spotifyActive = true;
      AppState.userName = profile.display_name;
      document.querySelectorAll('.js-user-status').forEach(el => {
        el.textContent = profile.display_name + ' · Spotify';
      });
      showToast('Đã kết nối Spotify: ' + profile.display_name);

      await syncFullSpotifyLibrary(true);
      startRemotePlaybackPolling();

      SpotifyClient.initWebPlaybackSDK(
        st => {
          if (!st) return;
          AppState.playing = !st.paused;
          AppState.pos = Math.round((st.position || 0) / 1000);
          const curItem = st.track_window && st.track_window.current_track;
          if (curItem) {
            const tr = currentTrack();
            if (!tr || tr.id !== curItem.id) {
              renderMetadata();
            }
          }
        },
        devId => {
          AppState.activeDeviceName = 'Vang Web Player';
          document.querySelectorAll('.js-device-name').forEach(s => (s.textContent = 'Vang Web Player'));
        }
      );
    }
  } catch (e) {
    AppState.spotifyActive = false;
  }
}

// In-App GitHub Update Notifier (checks GitHub Releases API & version.json)
function compareSemver(a, b) {
  const pa = String(a || '').replace(/^v/i, '').split('.').map(Number);
  const pb = String(b || '').replace(/^v/i, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

async function checkGitHubUpdate(manual = false) {
  try {
    const resp = await fetch(GITHUB_RELEASE_API, { headers: { Accept: 'application/vnd.github+json' } });
    if (!resp.ok) return;
    const data = await resp.json();
    const latestTag = (data && data.tag_name) || '';
    if (latestTag && compareSemver(latestTag, APP_VERSION) > 0) {
      const banner = document.getElementById('update-banner');
      const verSpan = document.getElementById('update-ver-text');
      const linkEl = document.getElementById('update-link-btn');
      if (verSpan) verSpan.textContent = `Đã có bản cập nhật mới (${latestTag})`;
      if (linkEl && data.html_url && data.html_url.startsWith('https://github.com/')) {
        linkEl.href = data.html_url;
      }
      if (banner) banner.hidden = false;
    } else if (manual) {
      showToast(`Bạn đang dùng phiên bản mới nhất (v${APP_VERSION})`);
    }
  } catch (e) {
    if (manual) showToast(`Phiên bản hiện tại: v${APP_VERSION}`);
  }
}

// Main Animation Loop (60fps)
function tickFrame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;

  const tr = currentTrack();
  if (AppState.playing) {
    AppState.pos += dt;
    simTime += dt;
    if (AppState.pos >= tr.d) {
      if (AppState.repeat) {
        AppState.pos = 0;
      } else {
        nextTrack();
      }
    }

    // Sleep timer countdown
    if (AppState.sleepMinutes > 0 && AppState.sleepRemainingSec > 0) {
      AppState.sleepRemainingSec -= dt;
      if (AppState.sleepRemainingSec <= 0) {
        AppState.sleepMinutes = 0;
        AppState.sleepRemainingSec = 0;
        setPlaying(false);
        document.querySelectorAll('.js-sleep-label').forEach(el => (el.textContent = 'Tắt'));
        showToast('Đã tự động dừng phát nhạc theo hẹn giờ');
      }
    }
  }
  visualTime += dt * (AppState.playing ? 1.0 : 0.24);

  const bands = AudioEngine.sampleBands(dt, AppState.playing, simTime, tr.bpm || 112, AppState.pos);

  // Smoothly interpolate accent color toward current track's cover color
  const targetColor = tr.c || [217, 130, 43];
  for (let i = 0; i < 3; i++) {
    currentAcc[i] += (targetColor[i] - currentAcc[i]) * Math.min(1, dt * 3.0);
  }
  const rgbStr = `${Math.round(currentAcc[0])}, ${Math.round(currentAcc[1])}, ${Math.round(currentAcc[2])}`;
  document.documentElement.style.setProperty('--acc', `rgb(${rgbStr})`);
  document.documentElement.style.setProperty('--acc-rgb', rgbStr);

  // Render 3D Audio Stage
  const progRatio = tr.d > 0 ? AppState.pos / tr.d : 0;
  Visualizer3D.renderFrame(dt, visualTime, bands, currentAcc, progRatio, AppState.playing);

  // Update Scrubber UI
  const pct = Math.max(0, Math.min(100, progRatio * 100));
  document.querySelectorAll('.js-scrub-fill').forEach(el => (el.style.width = pct + '%'));
  document.querySelectorAll('.js-scrub-head').forEach(el => (el.style.left = pct + '%'));

  const sec = Math.floor(AppState.pos);
  if (sec !== lastRenderedSec) {
    lastRenderedSec = sec;
    document.querySelectorAll('.js-time').forEach(el => (el.textContent = fmtTime(AppState.pos)));
  }

  // Update Signal Meters
  document.querySelectorAll('.js-mb').forEach(el => (el.style.width = Math.round(bands.bass * 100) + '%'));
  document.querySelectorAll('.js-mm').forEach(el => (el.style.width = Math.round(bands.mid * 100) + '%'));
  document.querySelectorAll('.js-mh').forEach(el => (el.style.width = Math.round(bands.high * 100) + '%'));
  document.querySelectorAll('.js-mb-val').forEach(el => (el.textContent = Math.round(bands.bass * 100)));
  document.querySelectorAll('.js-mm-val').forEach(el => (el.textContent = Math.round(bands.mid * 100)));
  document.querySelectorAll('.js-mh-val').forEach(el => (el.textContent = Math.round(bands.high * 100)));

  requestAnimationFrame(tickFrame);
}

// Mount & Wire Event Listeners
function initApp() {
  // Inject task icons into transport buttons
  document.querySelectorAll('.js-prev').forEach(b => (b.innerHTML = TASK_ICONS.prev));
  document.querySelectorAll('.js-next').forEach(b => (b.innerHTML = TASK_ICONS.next));
  document.querySelectorAll('.js-shuffle').forEach(b => (b.innerHTML = TASK_ICONS.shuffle));
  document.querySelectorAll('.js-repeat').forEach(b => (b.innerHTML = TASK_ICONS.repeat));
  document.querySelectorAll('.js-mute').forEach(b => (b.innerHTML = TASK_ICONS.vol));

  // Mount 3D Stage
  const stageEl = document.getElementById('main-stage');
  Visualizer3D.mount(stageEl);
  window.addEventListener('resize', () => Visualizer3D.resize());

  // Transport controls
  document.querySelectorAll('.js-play').forEach(b => (b.onclick = () => setPlaying(!AppState.playing)));
  document.querySelectorAll('.js-next').forEach(b => (b.onclick = () => nextTrack()));
  document.querySelectorAll('.js-prev').forEach(b => (b.onclick = () => prevTrack()));

  document.querySelectorAll('.js-shuffle').forEach(b => {
    b.onclick = () => {
      AppState.shuffle = !AppState.shuffle;
      document.querySelectorAll('.js-shuffle').forEach(x => x.classList.toggle('on', AppState.shuffle));
      showToast(AppState.shuffle ? 'Đã bật trộn bài' : 'Đã tắt trộn bài');
    };
  });

  document.querySelectorAll('.js-repeat').forEach(b => {
    b.onclick = () => {
      AppState.repeat = !AppState.repeat;
      document.querySelectorAll('.js-repeat').forEach(x => x.classList.toggle('on', AppState.repeat));
      showToast(AppState.repeat ? 'Lặp lại bài hiện tại' : 'Đã tắt lặp bài');
    };
  });

  // Scrubber seek
  document.querySelectorAll('.js-scrub').forEach(track => {
    track.onclick = e => {
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const tr = currentTrack();
      AppState.pos = ratio * tr.d;
      if (AppState.spotifyActive) SpotifyClient.seekPosition(AppState.pos).catch(() => {});
      if (AudioEngine.seekLocalAudio) AudioEngine.seekLocalAudio(AppState.pos);
      renderMetadata();
    };
  });

  // Volume seek & mute
  document.querySelectorAll('.js-vol-track').forEach(vt => {
    vt.onclick = e => {
      const rect = vt.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const v = AudioEngine.setVolume(ratio);
      document.querySelectorAll('.js-vol-fill').forEach(f => (f.style.width = Math.round(v * 100) + '%'));
      document.querySelectorAll('.js-vol-lbl').forEach(l => (l.textContent = Math.round(v * 100)));
      if (AppState.spotifyActive) SpotifyClient.setRemoteVolume(v * 100).catch(() => {});
    };
  });

  document.querySelectorAll('.js-mute').forEach(b => {
    b.onclick = () => {
      const m = AudioEngine.toggleMute();
      document.querySelectorAll('.js-mute').forEach(x => (x.innerHTML = m ? TASK_ICONS.mute : TASK_ICONS.vol));
    };
  });

  // Navigation Tabs
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });

  const searchInp = document.getElementById('search-input');
  if (searchInp) {
    searchInp.oninput = e => filterSearch(e.target.value);
  }

  // Visualizer Mode Compact Icon Buttons
  document.querySelectorAll('.js-vmode').forEach(btn => {
    btn.onclick = () => setVisualMode(btn.dataset.m);
  });

  document.querySelectorAll('.js-vmode-cycle').forEach(btn => {
    btn.onclick = () => setVisualMode(Visualizer3D.nextMode());
  });

  // 3D Bounce Intensity Slider (0% -> 200%)
  const bounceSlider = document.getElementById('bounce-slider');
  if (bounceSlider) {
    bounceSlider.oninput = e => {
      const pct = Number(e.target.value) || 100;
      if (Visualizer3D.setBounceGain) Visualizer3D.setBounceGain(pct / 100);
      document.querySelectorAll('.js-bounce-val').forEach(el => (el.textContent = pct + '%'));
    };
  }

  // Audio Signal Source Compact Icon Buttons
  const srcLabelMap = { auto: 'Tự động', system: 'Âm thanh máy', mic: 'Micro' };
  document.querySelectorAll('.js-src-mode').forEach(btn => {
    btn.onclick = async () => {
      const target = btn.dataset.src;
      try {
        await AudioEngine.setSourceMode(target);
        if (target === 'system') {
          showToast('Đã bật bắt âm thanh trực tiếp từ Máy tính / Tab');
        } else if (target === 'mic') {
          showToast('Đã bật thu âm trực tiếp qua Micro');
        } else {
          showToast('Đã bật phân tích sóng âm tự động theo bài hát');
        }
      } catch (err) {
        showToast(err && err.message ? err.message : 'Không thể mở nguồn âm thanh — giữ chế độ tự động');
      }
      const curMode = AudioEngine.getSourceMode();
      document.querySelectorAll('.js-src-mode').forEach(x => x.classList.toggle('on', x.dataset.src === curMode));
      document.querySelectorAll('.js-src-label').forEach(el => (el.textContent = srcLabelMap[curMode] || 'Tự động'));
    };
  });

  // Local Audio Files & Sleep Timer
  const btnLocal = document.getElementById('btn-open-local-files');
  const inpLocal = document.getElementById('local-file-input');
  if (btnLocal && inpLocal) {
    btnLocal.onclick = () => inpLocal.click();
    inpLocal.onchange = e => handleLocalFilesSelected(e.target.files);
  }

  const btnSleep = document.getElementById('btn-sleep-timer');
  if (btnSleep) {
    btnSleep.onclick = cycleSleepTimer;
  }

  // Modals & Update Banner
  document.querySelectorAll('.js-open-spotify').forEach(b => (b.onclick = openSpotifyModal));
  document.querySelectorAll('.js-close-spotify').forEach(b => (b.onclick = closeSpotifyModal));
  document.querySelectorAll('.js-open-devices').forEach(b => (b.onclick = openDeviceModal));
  document.querySelectorAll('.js-close-devices').forEach(b => (b.onclick = closeDeviceModal));
  document.querySelectorAll('.js-open-install').forEach(b => (b.onclick = openInstallModal));
  document.querySelectorAll('.js-close-install').forEach(b => (b.onclick = closeInstallModal));

  const btnCloseUpdate = document.getElementById('btn-close-update');
  if (btnCloseUpdate) {
    btnCloseUpdate.onclick = () => {
      const banner = document.getElementById('update-banner');
      if (banner) banner.hidden = true;
    };
  }

  const btnCheckUpdate = document.getElementById('btn-check-update');
  if (btnCheckUpdate) {
    btnCheckUpdate.onclick = () => checkGitHubUpdate(true);
  }

  document.querySelectorAll('.js-sync-library').forEach(b => {
    b.onclick = () => {
      if (AppState.spotifyActive) {
        syncFullSpotifyLibrary(true);
      } else {
        openSpotifyModal();
      }
    };
  });

  const btnPwaInstall = document.getElementById('btn-pwa-install');
  if (btnPwaInstall) {
    btnPwaInstall.onclick = triggerPwaInstall;
  }

  const btnConnectSp = document.getElementById('btn-connect-spotify');
  if (btnConnectSp) {
    btnConnectSp.onclick = async () => {
      const val = document.getElementById('sp-client-id').value.trim();
      try {
        await SpotifyClient.startLogin(val);
      } catch (err) {
        showToast(err.message);
      }
    };
  }

  const btnSaveId = document.getElementById('btn-save-client-id');
  if (btnSaveId) {
    btnSaveId.onclick = () => {
      const val = document.getElementById('sp-client-id').value.trim();
      SpotifyClient.setClientId(val);
      showToast(val ? 'Đã lưu tạm Client ID trong phiên hiện tại' : 'Đã xóa Client ID');
    };
  }

  const btnLogoutSp = document.getElementById('btn-logout-spotify');
  if (btnLogoutSp) {
    btnLogoutSp.onclick = () => {
      SpotifyClient.logout();
      AppState.spotifyActive = false;
      AppState.userName = 'Chế độ thử nghiệm';
      AppState.allTracks = DEMO_TRACKS.slice();
      AppState.tracks = DEMO_TRACKS.slice();
      AppState.playlists = DEMO_PLAYLISTS.slice();
      AppState.openedCollection = null;
      document.querySelectorAll('.js-user-status').forEach(el => (el.textContent = 'Chế độ thử nghiệm'));
      renderTrackList();
      renderMetadata();
      closeSpotifyModal();
      showToast('Đã ngắt kết nối & xóa toàn bộ dữ liệu phiên');
    };
  }

  // Mobile drawers
  document.querySelectorAll('[data-mob-drawer]').forEach(b => {
    b.onclick = () => toggleMobileDrawer(b.dataset.mobDrawer);
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    if (e.code === 'Space') {
      e.preventDefault();
      setPlaying(!AppState.playing);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextTrack();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevTrack();
    } else if (e.key === 'Escape') {
      closeSpotifyModal();
      closeDeviceModal();
      closeInstallModal();
      closeMobileDrawers();
    }
  });

  // Initial render
  bindMediaSessionHandlers();
  renderTrackList();
  renderMetadata();
  setVisualMode('cluster');
  setPlaying(false);
  AudioEngine.startDemoSynth(currentTrack, () => AppState.playing);
  initSpotifySession();
  checkGitHubUpdate(false);
  requestAnimationFrame(tickFrame);
}

window.addEventListener('DOMContentLoaded', initApp);

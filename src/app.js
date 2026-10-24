// ===== VANG APPLICATION CONTROLLER =====

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
  { id: 'pl-1', name: 'Đêm Trắng Sài Gòn', count: 4, trackIds: ['demo-1', 'demo-3', 'demo-5', 'demo-6'] },
  { id: 'pl-2', name: 'Ambient & Modular', count: 3, trackIds: ['demo-2', 'demo-4', 'demo-6'] }
];

// Minimal geometric task icons (Play triangle, Pause bars, Skip, Shuffle, Repeat, Volume)
const TASK_ICONS = {
  play: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="4,2.2 13.8,8 4,13.8"/></svg>`,
  pause: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="3.5" y="2.5" width="3.2" height="11"/><rect x="9.3" y="2.5" width="3.2" height="11"/></svg>`,
  prev: `<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="2.5" y="3" width="1.8" height="10"/><polygon points="13,3 5.5,8 13,13"/></svg>`,
  next: `<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="3,3 10.5,8 3,13"/><rect x="11.7" y="3" width="1.8" height="10"/></svg>`,
  shuffle: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 4.5h3.2l5.6 7H14M14 4.5h-3.2l-2 2.5M12 2.5l2 2-2 2M12 9.5l2 2-2 2"/></svg>`,
  repeat: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3 5h9.5v3M10.5 3l2 2-2 2M13 11H3.5V8M5.5 13l-2-2 2-2"/></svg>`,
  vol: `<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="2,6 5.5,6 9.5,2.5 9.5,13.5 5.5,10 2,10"/><path d="M11.8 5.2a4.2 4.2 0 0 1 0 5.6" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`,
  mute: `<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="2,6 5.5,6 9.5,2.5 9.5,13.5 5.5,10 2,10"/><path d="M11.5 6l3.5 4M15 6l-3.5 4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`
};

const AppState = {
  tracks: DEMO_TRACKS.slice(),
  allTracks: DEMO_TRACKS.slice(),
  likedTracks: [],
  topTracks: [],
  recentTracks: [],
  playlists: DEMO_PLAYLISTS.slice(),
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
  mobDrawer: null // null | 'left' | 'right'
};

let currentAcc = DEMO_TRACKS[0].c.slice();
let simTime = 0;
let visualTime = 0;
let lastFrame = performance.now();
let lastRenderedSec = -1;
let toastTmr = null;

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

function renderTrackList() {
  const container = document.getElementById('track-list');
  if (!container) return;

  if (AppState.tab === 'playlists') {
    container.innerHTML = AppState.playlists
      .map(
        (pl, i) => `
      <div class="qrow" data-pl="${pl.id}">
        <span class="mono dim">${String(i + 1).padStart(2, '0')}</span>
        <div class="art" style="background:${pl.cover ? `url('${pl.cover}') center/cover` : 'linear-gradient(135deg,var(--acc),#221e1a)'}"></div>
        <div class="truncate">
          <div class="qt truncate">${pl.name}</div>
          <div class="qa truncate">${pl.count} bản nhạc</div>
        </div>
        <span class="mono dim">Mở</span>
      </div>`
      )
      .join('');
    container.querySelectorAll('[data-pl]').forEach(row => {
      row.onclick = () => openPlaylist(row.dataset.pl);
    });
    return;
  }

  let list = AppState.tracks;
  if (!list.length) {
    container.innerHTML = `<div class="dim" style="padding:22px 0;font-size:13.5px">Không tìm thấy bản nhạc phù hợp.</div>`;
    return;
  }

  const cur = currentTrack();
  let htmlRows = list
    .map((tr, i) => {
      const isCur = cur && tr.id === cur.id;
      const artStyle = tr.cover
        ? `background-image:url('${tr.cover}')`
        : `background:${tr.g || 'linear-gradient(135deg,#D9822B,#2A2420)'}`;
      return `
      <div class="qrow${isCur ? ' cur' : ''}" data-idx="${i}">
        <span class="mono dim qidx">${String(i + 1).padStart(2, '0')}</span>
        <div class="art" style="${artStyle}"></div>
        <div class="truncate">
          <div class="qt truncate">${tr.t}</div>
          <div class="qa truncate">${tr.a}</div>
        </div>
        <span class="mono dim">${fmtTime(tr.d)}</span>
      </div>`;
    })
    .join('');

  if (AppState.tab === 'search' && AppState.spotifyActive && AppState.searchHasMore) {
    htmlRows += `
      <div style="padding:14px 0;text-align:center">
        <button id="btn-load-more-search" class="btn-outline" type="button" style="width:100%">Tải thêm kết quả (+50 bài)</button>
      </div>`;
  }

  container.innerHTML = htmlRows;

  // Update count badge if present
  document.querySelectorAll('.js-track-count').forEach(el => {
    el.textContent = list.length + ' bài';
  });

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

async function openPlaylist(plId) {
  if (AppState.spotifyActive) {
    try {
      showToast('Đang tải toàn bộ danh sách phát...');
      const items = await SpotifyClient.fetchPlaylistTracks(plId, 1000, partial => {
        if (partial.length) {
          AppState.tracks = partial;
          AppState.tab = 'queue';
          syncNavTabs();
          renderTrackList();
        }
      });
      if (items.length) {
        AppState.tracks = items;
        AppState.tab = 'queue';
        syncNavTabs();
        selectTrack(0, true);
        showToast(`Đã tải đầy đủ ${items.length} bản nhạc`);
      } else {
        showToast('Tuyển tập này chưa có bài hát hoặc đang ở chế độ riêng tư');
      }
      return;
    } catch (e) {
      showToast('Không tải được danh sách phát');
    }
  }
  const pl = DEMO_PLAYLISTS.find(p => p.id === plId);
  if (pl) {
    AppState.tracks = DEMO_TRACKS.filter(t => pl.trackIds.includes(t.id));
    AppState.tab = 'queue';
    syncNavTabs();
    selectTrack(0, true);
    showToast('Đã mở: ' + pl.name);
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
}

function selectTrack(index, autoPlay = false) {
  if (!AppState.tracks.length) return;
  AppState.idx = (index + AppState.tracks.length) % AppState.tracks.length;
  AppState.pos = 0;

  const metaEl = document.querySelector('.stage-meta');
  if (metaEl) {
    metaEl.classList.add('swap');
    setTimeout(() => {
      renderMetadata();
      metaEl.classList.remove('swap');
    }, 280);
  } else {
    renderMetadata();
  }

  renderTrackList();

  const tr = currentTrack();
  if (AppState.spotifyActive && tr && tr.uri && autoPlay) {
    const uris = AppState.tracks.map(x => x.uri).filter(Boolean);
    const winStart = Math.max(0, AppState.idx - 10);
    const winUris = uris.slice(winStart, winStart + 80);
    const relOffset = Math.max(0, AppState.idx - winStart);
    SpotifyClient.playUris(winUris, relOffset, SpotifyClient.getWebDeviceId()).catch(() => {});
  }

  if (autoPlay) {
    setPlaying(true);
  }
}

function setPlaying(playState) {
  AppState.playing = !!playState;
  if (AppState.playing) {
    AudioEngine.ensureContext();
  }

  if (AppState.spotifyActive) {
    if (AppState.playing) SpotifyClient.resumePlayback().catch(() => {});
    else SpotifyClient.pausePlayback().catch(() => {});
  }

  const iconHTML = AppState.playing ? TASK_ICONS.pause : TASK_ICONS.play;
  document.querySelectorAll('.js-play').forEach(btn => {
    btn.innerHTML = iconHTML;
    btn.setAttribute('aria-label', AppState.playing ? 'Tạm dừng' : 'Phát');
    btn.dataset.state = AppState.playing ? 'playing' : 'paused';
  });
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
    renderMetadata();
  } else {
    selectTrack(AppState.idx - 1, AppState.playing);
  }
}

function switchTab(tabName) {
  AppState.tab = tabName;
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
      renderTrackList();
      SpotifyClient.fetchPlaylists(200).then(pls => {
        if (pls.length) AppState.playlists = pls;
        if (AppState.tab === 'playlists') renderTrackList();
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

// Visual Mode Switching
function setVisualMode(m) {
  const mode = Visualizer3D.setMode(m);
  document.querySelectorAll('.js-vmode').forEach(btn => {
    btn.classList.toggle('on', btn.dataset.m === mode);
  });
  const labelMap = { cluster: 'Khối đốm hạt', ridge: 'Địa hình', vortex: 'Xoáy hạt' };
  document.querySelectorAll('.js-vmode-cycle').forEach(btn => {
    btn.textContent = labelMap[mode] || 'Khối đốm hạt';
  });
}

// Modals: Spotify Connect & Device Selector
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
    showToast('Trên trình duyệt này: chọn Menu (⋮ hoặc Chia sẻ) → "Thêm vào màn hình chính / Cài đặt ứng dụng"');
  }
}

function renderDeviceList() {
  const box = document.getElementById('device-list');
  if (!box) return;
  box.innerHTML = AppState.devices
    .map(
      d => `
    <div class="device-item${d.is_active ? ' active' : ''}" data-dev="${d.id}">
      <div>
        <div style="font-size:14.5px;color:var(--paper)">${d.name}</div>
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
    const [queueInfo, liked, top, recent, savedAlbums, playlists] = await Promise.all([
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
      SpotifyClient.fetchSavedAlbumTracks().catch(() => []),
      SpotifyClient.fetchPlaylists(200).catch(() => [])
    ]);

    if (liked.length) AppState.likedTracks = liked;
    if (top.length) AppState.topTracks = top;
    if (recent.length) AppState.recentTracks = recent;
    if (playlists.length) AppState.playlists = playlists;

    let combined = mergeUniqueTracks(
      queueInfo.tracks || [],
      liked,
      top,
      recent,
      savedAlbums
    );

    // If user stores most of their songs inside Playlists rather than "Liked Songs",
    // automatically pull tracks from their first 3 playlists so Danh sách phát is rich and complete
    if (combined.length < 40 && playlists.length > 0) {
      const topPlaylists = playlists.slice(0, 3);
      for (const pl of topPlaylists) {
        try {
          const plTracks = await SpotifyClient.fetchPlaylistTracks(pl.id, 200);
          combined = mergeUniqueTracks(combined, plTracks);
        } catch (e) {}
      }
    }

    if (combined.length > 0) {
      AppState.allTracks = combined;
      if (AppState.tab === 'queue') {
        AppState.tracks = combined.slice();
        selectTrack(0, false);
      } else {
        renderTrackList();
      }
    }

    // Sync active device and playback state if currently playing on Phone/PC
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
      } else {
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

// Connect live Spotify account if token exists
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
  }
  visualTime += dt * (AppState.playing ? 1.0 : 0.24);

  const bands = AudioEngine.sampleBands(dt, AppState.playing, simTime, tr.bpm || 112);

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

  // Subtle typographic breathing on bass hits
  const titleEl = document.querySelector('.track-title');
  if (titleEl) {
    titleEl.style.letterSpacing = (-0.035 + bands.bass * 0.007).toFixed(4) + 'em';
  }

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

  // Visualizer Mode Buttons
  document.querySelectorAll('.js-vmode').forEach(btn => {
    btn.onclick = () => setVisualMode(btn.dataset.m);
  });

  document.querySelectorAll('.js-vmode-cycle').forEach(btn => {
    btn.onclick = () => setVisualMode(Visualizer3D.nextMode());
  });

  // Audio Signal Source Toggle (Synth/Beat vs. Live Mic/Loopback)
  document.querySelectorAll('.js-src-mode').forEach(btn => {
    btn.onclick = async () => {
      const target = btn.dataset.src;
      if (target === 'mic' && AudioEngine.getSourceMode() !== 'mic') {
        try {
          await AudioEngine.toggleMicInput();
          showToast('Đã bật thu tín hiệu âm thanh trực tiếp (Micro/Loopback)');
        } catch (err) {
          showToast('Không thể mở Micro — giữ chế độ đồng bộ nội bộ');
        }
      } else if (target === 'auto' && AudioEngine.getSourceMode() === 'mic') {
        await AudioEngine.toggleMicInput();
        showToast('Đã chuyển về chế độ đồng bộ nội bộ');
      }
      const curMode = AudioEngine.getSourceMode();
      document.querySelectorAll('.js-src-mode').forEach(x => x.classList.toggle('on', x.dataset.src === curMode));
    };
  });

  // Modals
  document.querySelectorAll('.js-open-spotify').forEach(b => (b.onclick = openSpotifyModal));
  document.querySelectorAll('.js-close-spotify').forEach(b => (b.onclick = closeSpotifyModal));
  document.querySelectorAll('.js-open-devices').forEach(b => (b.onclick = openDeviceModal));
  document.querySelectorAll('.js-close-devices').forEach(b => (b.onclick = closeDeviceModal));
  document.querySelectorAll('.js-open-install').forEach(b => (b.onclick = openInstallModal));
  document.querySelectorAll('.js-close-install').forEach(b => (b.onclick = closeInstallModal));
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
      showToast(val ? 'Đã lưu Spotify Client ID' : 'Đã xóa Client ID');
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
  renderTrackList();
  renderMetadata();
  setVisualMode('cluster');
  setPlaying(false);
  AudioEngine.startDemoSynth(currentTrack, () => AppState.playing);
  initSpotifySession();
  requestAnimationFrame(tickFrame);
}

window.addEventListener('DOMContentLoaded', initApp);

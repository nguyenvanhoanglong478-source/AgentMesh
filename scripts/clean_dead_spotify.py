from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX_PATH = ROOT / "index.html"

raw = INDEX_PATH.read_text(encoding="utf-8")
nl = "\r\n" if "\r\n" in raw else "\n"
text = raw.replace("\r\n", "\n")

# 1. Remove dead Spotify branch in openPlaylist
old_open_pl_sp = """  if (AppState.spotifyActive) {
    const colMeta = pl || { id: plId, kind: 'playlist', name: 'Tuyển tập', uri: `spotify:playlist:${plId}` };
    AppState.openedCollection = colMeta;

    // 1. Instant path: if preloadedTracks or matching library tracks exist, display without autoplaying!
    const preloaded = (colMeta.preloadedTracks && colMeta.preloadedTracks.length)
      ? colMeta.preloadedTracks.slice()
      : AppState.allTracks.filter(
          tr => (tr.albumId && String(tr.albumId) === String(plId)) ||
                (colMeta.name && tr.al && tr.al.toLowerCase().trim() === colMeta.name.toLowerCase().trim())
        );

    if (preloaded.length > 0) {
      AppState.tracks = preloaded;
      renderTrackList();
      showToast(`Đã mở: ${colMeta.name} (${preloaded.length} bài)`);


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
      const items = await SpotifyClient.fetchPlaylistTracks(
        plId,
        500,
        partial => {
          if (partial.length && AppState.openedCollection === colMeta) {
            AppState.tracks = partial;
            renderTrackList();
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
        showToast(`Đã mở: ${colMeta.name} (${items.length} bài)`);
        return;
      }

      // Fallback: If Spotify Dev API cannot access restricted editorial playlist, fetch from 100M+ Open Web catalog
      if (window.OpenMusicClient && window.OpenMusicClient.search) {
        const queryTerm = (colMeta.name || '').replace(/^(This Is|Playlist|Album|Tuyển tập)\\s+/i, '') || 'The Weeknd';
        const openItems = await window.OpenMusicClient.search(queryTerm, 45).catch(() => []);
        if (openItems && openItems.length) {
          colMeta.preloadedTracks = openItems;
          AppState.tracks = openItems;
          renderTrackList();
          showToast(`Đã mở: ${colMeta.name} (${openItems.length} bài Web Mở)`);
          return;
        }
      }

      if (AppState.allTracks.length > 0) {
        AppState.tracks = AppState.allTracks.slice(0, 40);
        renderTrackList();
        showToast('Đã mở: ' + colMeta.name);
        return;
      }

      renderTrackList();
      showToast('Đã mở: ' + colMeta.name);
      return;
    } catch (e) {
      if (window.OpenMusicClient && window.OpenMusicClient.search) {
        const queryTerm = (colMeta.name || '').replace(/^(This Is|Playlist|Album|Tuyển tập)\\s+/i, '') || 'The Weeknd';
        const openItems = await window.OpenMusicClient.search(queryTerm, 45).catch(() => []);
        if (openItems && openItems.length) {
          colMeta.preloadedTracks = openItems;
          AppState.tracks = openItems;
          renderTrackList();
          showToast(`Đã mở: ${colMeta.name} (${openItems.length} bài)`);
          return;
        }
      }
      if (AppState.allTracks.length > 0) {
        AppState.tracks = AppState.allTracks.slice(0, 40);
        renderTrackList();
      } else {
        showToast('Không tải được danh sách bài hát');
      }
    }
    return;
  }"""

assert old_open_pl_sp in text, "old_open_pl_sp not found"
text = text.replace(old_open_pl_sp, "", 1)

# 2. Clean switchTab
old_switch_tab_sp = """  if (AppState.spotifyActive) {
    if (tabName === 'liked') {
      if (AppState.likedTracks.length) {
        AppState.tracks = AppState.likedTracks.slice();
        renderTrackList();
      }
      SpotifyClient.fetchLikedTracks(10000, partial => {
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
      AppState.playlists = mergeCollections(curated, AppState.playlists, libAlbums);
      renderTrackList();
      Promise.all([
        SpotifyClient.fetchPlaylists(200).catch(() => []),
        SpotifyClient.fetchFeaturedPlaylists(30).catch(() => []),
        SpotifyClient.fetchNewReleases(30).catch(() => [])
      ]).then(([pls, featured, releases]) => {
        AppState.playlists = mergeCollections(curated, pls, featured, releases, buildLibraryAlbums(AppState.allTracks));
        if (AppState.tab === 'playlists' && !AppState.openedCollection) renderTrackList();
      }).catch(() => renderTrackList());
      return;
    }
  }

  // Demo / Open Web fallback tab filtering
  if (tabName === 'liked') {
    AppState.tracks = AppState.allTracks.filter(t => t.liked);
  }"""

new_switch_tab_sp = """  // Open Web tab filtering
  if (tabName === 'liked') {
    AppState.tracks = (AppState.likedTracks || []).slice();
  }"""

assert old_switch_tab_sp in text, "old_switch_tab_sp not found"
text = text.replace(old_switch_tab_sp, new_switch_tab_sp, 1)

# 3. Clean loadMoreSearchResults, syncFullSpotifyLibrary, applyRemotePlaybackState
old_search_more = """async function loadMoreSearchResults() {
  const cleanQ = String(AppState.searchQuery || '').trim();
  if (!cleanQ) return;
  const searchSource = AppState.searchSource || (AppState.spotifyActive ? 'spotify' : 'open');

  if (searchSource === 'spotify' && AppState.spotifyActive) {
    try {
      showToast('Đang tải thêm từ Spotify...');
      const more = await SpotifyClient.searchTracks(cleanQ, AppState.searchOffset);
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
}"""

new_search_more = """async function loadMoreSearchResults() {}"""

assert old_search_more in text, "old_search_more not found"
text = text.replace(old_search_more, new_search_more, 1)

old_sync_lib = """async function syncFullSpotifyLibrary(showFeedback = false) {
  if (!AppState.spotifyActive) return;
  if (showFeedback) showToast('Đang đồng bộ toàn bộ thư viện Spotify...');

  try {
    const curated = (window.OpenMusicClient && window.OpenMusicClient.CURATED_COLLECTIONS) || [];
    const [queueInfo, liked, top, recent, savedAlbumsInfo, playlists, featured, releases] = await Promise.all([
      SpotifyClient.fetchCurrentQueue().catch(() => ({ playback: null, tracks: [] })),
      SpotifyClient.fetchLikedTracks(10000, partial => {
        AppState.likedTracks = partial;
        if (AppState.tab === 'liked') {
          AppState.tracks = partial.slice();
          renderTrackList();
        }
      }).catch(() => []),
      SpotifyClient.fetchTopTracks().catch(() => []),
      SpotifyClient.fetchRecentTracks().catch(() => []),
      SpotifyClient.fetchSavedAlbums().catch(() => ({ albums: [], tracks: [] })),
      SpotifyClient.fetchPlaylists(200).catch(() => []),
      SpotifyClient.fetchFeaturedPlaylists(30).catch(() => []),
      SpotifyClient.fetchNewReleases(30).catch(() => [])
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
    const mergedCols = mergeCollections(curated, playlists, featured, releases, savedAlbumsInfo.albums || [], derivedAlbums);
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
  const tr = currentTrack();
  const isDirectWebOrLocal = Boolean(
    tr && (tr.localUrl || tr.source === 'open' || tr.isOpenSource || !tr.uri || !tr.uri.startsWith('spotify:'))
  );
  // CRITICAL: If the current track is a Local file or Open Web track, do NOT let remote Spotify poll hijack playback!
  if (isDirectWebOrLocal && AppState.playing) {
    return;
  }

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
        if (AppState.idx !== existingIdx) {
          AppState.idx = existingIdx;
          renderMetadata();
          renderTrackList();
        }
      } else if (!AppState.openedCollection) {
        AppState.tracks.unshift(mapped);
        AppState.allTracks = mergeUniqueTracks([mapped], AppState.allTracks);
        AppState.idx = 0;
        renderMetadata();
        renderTrackList();
      }
    }
  }
}"""

assert old_sync_lib in text, "old_sync_lib not found"
text = text.replace(old_sync_lib, "", 1)

INDEX_PATH.write_text(text.replace("\n", nl), encoding="utf-8")
print("Cleaned all dead SpotifyClient code from index.html!")

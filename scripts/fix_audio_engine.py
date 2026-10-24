from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX_PATH = ROOT / "index.html"

raw = INDEX_PATH.read_text(encoding="utf-8")
nl = "\r\n" if "\r\n" in raw else "\n"
text = raw.replace("\r\n", "\n")

# -------------------------------------------------------------------------
# 1. Replace AudioEngine core (remove DemoSynth, unify stream playback, fix seek)
# -------------------------------------------------------------------------
old_audio_core = """  // Procedural Demo Synth state (rich musical arrangement with drops, fills, and rests)
  let synthTimer = null;
  let stepIdx = 0;

  // 32 frequency bins (0.0 -> 1.0) + onset transient detector
  const NUM_BINS = 32;
  const bins = new Float32Array(NUM_BINS);
  const binFloor = new Float32Array(NUM_BINS);
  let prevRawBass = 0;
  let prevRawMid = 0;
  let prevRawHigh = 0;

  // Output state consumed by Visualizer3D & UI meters
  const bands = {
    sub: 0,
    subBass: 0,
    bass: 0,
    lowMid: 0,
    mid: 0,
    highMid: 0,
    treble: 0,
    air: 0,
    high: 0,
    energy: 0,
    punch: 0,      // Sharp transient spike on kick/snare hits (0.0 -> 1.0)
    snareHit: 0,   // Mid-high transient
    bins           // 32-band real-time frequency array
  };

  function ensureContext() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.52; // Fast response so drum hits are crisp, not smeared
      fftData = new Uint8Array(analyser.frequencyBinCount);
      timeData = new Uint8Array(analyser.fftSize);

      masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : volume;
      masterGain.connect(analyser);
      masterGain.connect(ctx.destination);

      // Audible gain for local audio files (.mp3) ONLY; kept at 0.0 for Spotify tracks to prevent double audio
      refAudibleGain = ctx.createGain();
      refAudibleGain.gain.value = 0.0;
      refAudibleGain.connect(masterGain);

      // Zero-gain sink connected to destination so browser always pulls FFT frames through analyser
      silentSink = ctx.createGain();
      silentSink.gain.value = 0.0;
      analyser.connect(silentSink);
      silentSink.connect(ctx.destination);

      if (!refAudio) {
        refAudio = new Audio();
        refAudio.crossOrigin = 'anonymous';
      }
      if (!refMediaSource) {
        try {
          refMediaSource = ctx.createMediaElementSource(refAudio);
          refMediaSource.connect(analyser);
          refMediaSource.connect(refAudibleGain);
        } catch (e) {}
      }
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  // Dynamic Demo Synthesizer: plays a varied musical structure (Intro, Groove, Drop, Breakdown)
  // so Demo Mode has genuine quiet passages, drum fills, and heavy bass drops
  function triggerDemoStep(track, step) {
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const bpm = track.bpm || 112;
    const stepDur = 60 / bpm / 4; // 16th-note resolution for realistic groove
    const root = track.rootHz || 110;
    const bar = Math.floor(step / 16) % 8; // 8-bar phrase structure
    const posInBar = step % 16;

    // Bar 7 is a breakdown/rest bar (almost silent except for a soft pad & riser)
    const isBreakdown = (bar === 6);
    const isDropFill = (bar === 7 && posInBar >= 8);

    // 1. Punchy Kick Drum (4-on-the-floor + syncopated ghost kicks)
    const kickPattern = isDropFill
      ? (posInBar % 2 === 0)
      : !isBreakdown && (posInBar === 0 || posInBar === 6 || posInBar === 10 || (bar % 2 === 1 && posInBar === 14));

    if (kickPattern) {
      const osc = ctx.createOscillator();
      const clickOsc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.22);

      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(620, now);
      clickOsc.frequency.exponentialRampToValueAtTime(80, now + 0.025);

      const vel = (posInBar === 0) ? 0.58 : 0.42;
      g.gain.setValueAtTime(vel, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(g);
      clickOsc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      clickOsc.start(now);
      osc.stop(now + 0.25);
      clickOsc.stop(now + 0.03);
    }

    // 2. Crisp Snare / Clap on backbeats (steps 4 and 12)
    if ((!isBreakdown && (posInBar === 4 || posInBar === 12)) || (isDropFill && posInBar % 2 === 1)) {
      const bufSize = Math.floor(ctx.sampleRate * 0.14);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.28));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const flt = ctx.createBiquadFilter();
      flt.type = 'bandpass';
      flt.frequency.value = 1850;
      flt.Q.value = 0.9;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.28, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      noise.connect(flt);
      flt.connect(g);
      g.connect(masterGain);
      noise.start(now);
    }

    // 3. Sub-bass & Melodic Pluck (varies per step so midrange jumps with the melody)
    const ratios = track.chord || [1, 1.2, 1.5, 1.8];
    if (posInBar === 0 || posInBar === 3 || posInBar === 7 || posInBar === 10 || posInBar === 14) {
      const r = ratios[(bar + posInBar) % ratios.length];
      const osc = ctx.createOscillator();
      const flt = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = posInBar % 3 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(root * (posInBar === 0 ? 1 : 2) * r, now);
      flt.type = 'lowpass';
      flt.frequency.setValueAtTime(isBreakdown ? 520 : 1350 + (posInBar * 110), now);
      flt.frequency.exponentialRampToValueAtTime(280, now + stepDur * 2.5);
      const amp = isBreakdown ? 0.08 : 0.20;
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(amp, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, now + stepDur * 2.8);
      osc.connect(flt);
      flt.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + stepDur * 2.9);
    }

    // 4. Hi-Hat 16th groove
    if (!isBreakdown && (posInBar % 2 === 1 || posInBar === 2)) {
      const dur = posInBar === 15 ? 0.09 : 0.035;
      const bufSize = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.25));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const flt = ctx.createBiquadFilter();
      flt.type = 'highpass';
      flt.frequency.value = 6500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(posInBar === 15 ? 0.14 : 0.07, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      noise.connect(flt);
      flt.connect(g);
      g.connect(masterGain);
      noise.start(now);
    }
  }

  function startDemoSynth(getTrackFn, isPlayingFn) {
    stopDemoSynth();
    const tick = () => {
      const tr = getTrackFn();
      const bpm = (tr && tr.bpm) || 112;
      const ms = (60 / bpm / 4) * 1000; // 16th-note clock
      const isLocalFile = !!(tr && tr.localUrl);
      const isSpotify = !!(window.AppState && window.AppState.spotifyActive);
      // DemoSynth ONLY plays in Demo Mode (when Spotify is NOT active and not a local file)
      if (isPlayingFn() && !isLocalFile && !isSpotify) {
        ensureContext();
        triggerDemoStep(tr, stepIdx++);
      }
      synthTimer = setTimeout(tick, ms);
    };
    synthTimer = setTimeout(tick, 100);
  }

  function stopDemoSynth() {
    if (synthTimer) {
      clearTimeout(synthTimer);
      synthTimer = null;
    }
  }

  // Load real audio reference stream (via public CORS-enabled iTunes API) & Spotify analysis for a track
  // Feeds real 32-band FFT into analyser (for 3D visualizer) while keeping speakers MUTED (0.0 volume)
  // so Spotify streams cleanly without any duplicate/overlapping audio!
  async function syncTrackAudioProfile(track, isPlaying) {
    if (!track || !track.t) return;
    const trackKey = track.id || `${track.t}__${track.a}`;
    const shouldPlayNow = () => Boolean(isPlaying || (window.AppState && window.AppState.playing));

    if (currentRefTrackId === trackKey) {
      if (refAudio && refAudio.src) {
        if (shouldPlayNow() && refAudio.paused) refAudio.play().catch(() => {});
        else if (!shouldPlayNow() && !refAudio.paused) refAudio.pause();
      }
      return;
    }
    currentRefTrackId = trackKey;
    spotifyAnalysis = null;

    if (refAudio) {
      try {
        refAudio.pause();
        refAudio.currentTime = 0;
        refAudio.onended = null;
        refAudio.onerror = null;
        refAudio.removeAttribute('src');
        refAudio.load();
      } catch (e) {}
    }

    // 0. If track is a Local Audio File (.mp3/.flac/.wav/.m4a) selected from device storage:
    if (track.localUrl) {
      ensureContext();
      if (!refAudio) {
        refAudio = new Audio();
        refAudio.crossOrigin = 'anonymous';
      }
      refAudio.loop = false;
      refAudio.onended = null;
      try { refAudio.currentTime = 0; } catch (e) {}
      refAudio.src = track.localUrl;
      try { refAudio.currentTime = 0; } catch (e) {}
      if (!refMediaSource && ctx) {
        try {
          refMediaSource = ctx.createMediaElementSource(refAudio);
          refMediaSource.connect(analyser);
          refMediaSource.connect(refAudibleGain);
        } catch (e) {}
      }
      if (refAudibleGain) refAudibleGain.gain.value = 1.0;
      refAudio.onloadedmetadata = () => {
        try { refAudio.currentTime = 0; } catch (e) {}
        if (refAudio.duration && isFinite(refAudio.duration)) {
          track.d = Math.max(1, Math.round(refAudio.duration));
          if (window.fmtTime) {
            document.querySelectorAll('.js-dur').forEach(el => (el.textContent = window.fmtTime(track.d)));
          }
        }
      };
      refAudio.oncanplay = () => {
        try {
          if (!window.AppState || window.AppState.pos === 0) {
            refAudio.currentTime = 0;
          }
        } catch (e) {}
      };
      refAudio.onerror = () => {
        console.warn('AudioEngine: local audio failed to load', track.localUrl);
      };
      refAudio.onended = () => {
        if (window.AppState && window.AppState.repeat) {
          refAudio.currentTime = 0;
          refAudio.play().catch(() => {});
        } else if (window.nextTrack) {
          window.nextTrack();
        }
      };
      refAudio.volume = 1.0;
      if (shouldPlayNow()) refAudio.play().catch(() => {});
      return;
    }

    // 1. If track is from Open Web catalog (already has previewUrl or is marked open source)
    const isDirectOpenTrack = Boolean(
      track.source === 'open' ||
      track.isOpenSource ||
      (track.id && String(track.id).startsWith('open-')) ||
      (!track.uri && track.previewUrl)
    );

    if (isDirectOpenTrack && track.previewUrl) {
      ensureContext();
      if (!refAudio) {
        refAudio = new Audio();
        refAudio.crossOrigin = 'anonymous';
      }
      refAudio.loop = false;
      refAudio.onended = null;
      refAudio.src = track.previewUrl;
      if (!refMediaSource && ctx) {
        try {
          refMediaSource = ctx.createMediaElementSource(refAudio);
          refMediaSource.connect(analyser);
          refMediaSource.connect(refAudibleGain);
        } catch (e) {}
      }
      if (refAudibleGain) refAudibleGain.gain.value = 1.0;
      refAudio.onloadedmetadata = () => {
        if (refAudio.duration && isFinite(refAudio.duration)) {
          track.d = Math.max(1, Math.round(refAudio.duration));
          if (window.fmtTime) {
            document.querySelectorAll('.js-dur').forEach(el => (el.textContent = window.fmtTime(track.d)));
          }
        }
      };
      refAudio.onerror = () => {
        console.warn('AudioEngine: open audio preview failed or CORS blocked', track.previewUrl);
      };
      refAudio.onended = () => {
        if (window.AppState && window.AppState.repeat) {
          refAudio.currentTime = 0;
          refAudio.play().catch(() => {});
        } else if (window.nextTrack) {
          window.nextTrack();
        }
      };
      refAudio.volume = 1.0;
      if (shouldPlayNow()) refAudio.play().catch(() => {});
      return;
    }

    // 2. Built-in Demo tracks use the procedural multi-section DemoSynth directly
    if (String(track.id || '').startsWith('demo-')) {
      if (refAudibleGain) refAudibleGain.gain.value = 0.0;
      if (refAudio) {
        try {
          refAudio.pause();
          refAudio.currentTime = 0;
          refAudio.onended = null;
          refAudio.onerror = null;
          refAudio.removeAttribute('src');
          refAudio.load();
        } catch (e) {}
      }
      return;
    }



    // 4. Fetch silent reference audio stream for Spotify tracks via public iTunes Search API
    // - Feeds 100% real vocal/drum/bass FFT into analyser (for the 3D visualizer)
    // - Speaker output is STRICTLY MUTED (gain = 0.0) so it NEVER clashes with Spotify's own audio!
    try {
      const q = `${track.t} ${track.a}`.trim();
      let item = null;
      if (window.OpenMusicClient && window.OpenMusicClient.queryItunes) {
        const results = await window.OpenMusicClient.queryItunes(q, 1);
        item = results && results[0];
      } else {
        const resp = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=1`).catch(() => null);
        if (resp && resp.ok) {
          const json = await resp.json().catch(() => null);
          item = json && json.results && json.results[0];
        }
      }
      if (!item || !item.previewUrl || currentRefTrackId !== trackKey) return;

      ensureContext();
      if (!refAudio) {
        refAudio = new Audio();
        refAudio.crossOrigin = 'anonymous';
      }
      refAudio.loop = true;
      refAudio.onended = null;
      try { refAudio.currentTime = 0; } catch (e) {}
      refAudio.src = item.previewUrl;
      try { refAudio.currentTime = 0; } catch (e) {}
      if (!refMediaSource && ctx) {
        try {
          refMediaSource = ctx.createMediaElementSource(refAudio);
          refMediaSource.connect(analyser);
          refMediaSource.connect(refAudibleGain);
        } catch (e) {}
      }
      if (refAudibleGain) {
        refAudibleGain.gain.value = 1.0;
      }
      refAudio.volume = 1.0;
      if (shouldPlayNow()) {
        refAudio.play().catch(() => {});
      }
    } catch (e) {}
  }

  function isTrackAudibleViaRefAudio(tr) {
    if (!tr) return false;
    if (tr.localUrl) return true;
    if (tr.source === 'open' || tr.isOpenSource || (tr.id && String(tr.id).startsWith('open-'))) return true;
    if (!window.AppState || !window.AppState.spotifyActive || !tr.uri || !tr.uri.startsWith('spotify:')) {
      return Boolean(tr.previewUrl);
    }
    return false;
  }

  function setSpotifyDeviceAudible(isAudible) {
    spotifyDeviceAudible = !!isAudible;
    if (refAudibleGain && ctx) {
      const tr = window.AppState && window.AppState.tracks && window.AppState.tracks[window.AppState.idx];
      const shouldBeAudible = isTrackAudibleViaRefAudio(tr);
      refAudibleGain.gain.setValueAtTime(shouldBeAudible ? 1.0 : 0.0, ctx.currentTime);
    }
  }

  function setReferencePlaying(isPlaying) {
    if (!refAudio) return;
    if (isPlaying) {
      if (refAudio.src && refAudio.paused) refAudio.play().catch(() => {});
    } else {
      if (!refAudio.paused) refAudio.pause();
    }
  }

  let isSeekingLocal = false;
  let seekTargetSec = 0;

  function seekLocalAudio(sec) {
    if (refAudio && refAudio.src) {
      const dur = isFinite(refAudio.duration) && refAudio.duration > 0 ? refAudio.duration : Infinity;
      const safeSec = Math.max(0, Math.min(sec, dur > 1 ? dur - 0.25 : dur));
      isSeekingLocal = true;
      seekTargetSec = safeSec;
      try {
        refAudio.currentTime = safeSec;
      } catch (e) {}
      const onSeekDone = () => {
        isSeekingLocal = false;
        refAudio.removeEventListener('seeked', onSeekDone);
      };
      refAudio.addEventListener('seeked', onSeekDone, { once: true });
      setTimeout(() => { isSeekingLocal = false; }, 350);
    }
  }

  function getPlaybackPosition() {
    const tr = window.AppState && window.AppState.tracks && window.AppState.tracks[window.AppState.idx];
    if (!tr) return null;
    // Only return refAudio.currentTime for tracks that legitimately use refAudio for sound output (Local & Open Web)!
    const isDirectAudioTrack = Boolean(
      tr.localUrl ||
      ((tr.source === 'open' || tr.isOpenSource || (tr.id && String(tr.id).startsWith('open-'))) && tr.previewUrl)
    );
    if (!isDirectAudioTrack) {
      return null;
    }
    if (isSeekingLocal) {
      return seekTargetSec;
    }
    if (refAudio && refAudio.src && !refAudio.paused && isFinite(refAudio.currentTime) && refAudio.currentTime >= 0) {
      return refAudio.currentTime;
    }
    return null;
  }"""

new_audio_core = """  let playReqSeq = 0;
  let pendingSeekSec = null;
  let isSeekingLocal = false;
  let seekTargetSec = 0;

  // 32 frequency bins (0.0 -> 1.0) + onset transient detector
  const NUM_BINS = 32;
  const bins = new Float32Array(NUM_BINS);
  const binFloor = new Float32Array(NUM_BINS);
  let prevRawBass = 0;
  let prevRawMid = 0;
  let prevRawHigh = 0;

  // Output state consumed by Visualizer3D & UI meters
  const bands = {
    sub: 0,
    subBass: 0,
    bass: 0,
    lowMid: 0,
    mid: 0,
    highMid: 0,
    treble: 0,
    air: 0,
    high: 0,
    energy: 0,
    punch: 0,      // Sharp transient spike on kick/snare hits (0.0 -> 1.0)
    snareHit: 0,   // Mid-high transient
    bins           // 32-band real-time frequency array
  };

  function ensureContext() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.52;
      fftData = new Uint8Array(analyser.frequencyBinCount);
      timeData = new Uint8Array(analyser.fftSize);

      masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : volume;
      masterGain.connect(analyser);
      masterGain.connect(ctx.destination);

      refAudibleGain = ctx.createGain();
      refAudibleGain.gain.value = 1.0;
      refAudibleGain.connect(masterGain);

      silentSink = ctx.createGain();
      silentSink.gain.value = 0.0;
      analyser.connect(silentSink);
      silentSink.connect(ctx.destination);

      if (!refAudio) {
        refAudio = new Audio();
        refAudio.crossOrigin = 'anonymous';
        refAudio.preload = 'auto';
      }
      if (!refMediaSource) {
        try {
          refMediaSource = ctx.createMediaElementSource(refAudio);
          refMediaSource.connect(analyser);
          refMediaSource.connect(refAudibleGain);
        } catch (e) {}
      }
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (refAudibleGain) {
      refAudibleGain.gain.value = 1.0;
    }
    return ctx;
  }

  function startDemoSynth() {}
  function stopDemoSynth() {}

  function attachTrackStream(url, track, shouldPlayNow, reqId) {
    if (!refAudio) {
      refAudio = new Audio();
      refAudio.crossOrigin = 'anonymous';
      refAudio.preload = 'auto';
    }
    if (shouldPlayNow() || ctx) {
      ensureContext();
    }
    if (refAudibleGain) {
      refAudibleGain.gain.value = 1.0;
    }
    if (masterGain && ctx) {
      masterGain.gain.setValueAtTime(muted ? 0 : volume, ctx.currentTime);
    }

    refAudio.loop = false;
    refAudio.volume = 1.0;
    pendingSeekSec = null;
    isSeekingLocal = false;

    refAudio.onloadedmetadata = () => {
      if (reqId !== playReqSeq) return;
      if (refAudio.duration && isFinite(refAudio.duration) && refAudio.duration > 0) {
        track.d = Math.max(1, Math.round(refAudio.duration));
        if (window.fmtTime) {
          document.querySelectorAll('.js-dur').forEach(el => (el.textContent = window.fmtTime(track.d)));
        }
      }
      if (pendingSeekSec != null) {
        try {
          refAudio.currentTime = pendingSeekSec;
        } catch (e) {}
        pendingSeekSec = null;
      }
    };

    refAudio.onerror = () => {
      if (reqId !== playReqSeq) return;
      console.warn('AudioEngine: stream failed to load', url);
    };

    refAudio.onended = () => {
      if (reqId !== playReqSeq) return;
      if (window.AppState && window.AppState.repeat) {
        try { refAudio.currentTime = 0; } catch (e) {}
        if (window.AppState) window.AppState.pos = 0;
        refAudio.play().catch(() => {});
      } else if (window.nextTrack) {
        window.nextTrack();
      }
    };

    if (refAudio.src !== url) {
      refAudio.src = url;
    } else {
      try { refAudio.currentTime = 0; } catch (e) {}
    }

    if (shouldPlayNow()) {
      ensureContext();
      const p = refAudio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          if (ctx && ctx.state === 'suspended') {
            ctx.resume().then(() => {
              if (reqId === playReqSeq && shouldPlayNow()) {
                refAudio.play().catch(() => {});
              }
            }).catch(() => {});
          }
        });
      }
    } else {
      if (!refAudio.paused) {
        try { refAudio.pause(); } catch (e) {}
      }
    }
  }

  async function syncTrackAudioProfile(track, isPlaying) {
    if (!track || !track.t) return;
    const trackKey = track.id || `${track.t}__${track.a}`;
    const shouldPlayNow = () => Boolean(isPlaying || (window.AppState && window.AppState.playing));

    if (currentRefTrackId === trackKey && refAudio && refAudio.src) {
      if (shouldPlayNow()) {
        ensureContext();
        if (refAudibleGain) refAudibleGain.gain.value = 1.0;
        if (refAudio.paused) {
          refAudio.play().catch(() => {});
        }
      } else if (!refAudio.paused) {
        refAudio.pause();
      }
      return;
    }

    currentRefTrackId = trackKey;
    const reqId = ++playReqSeq;

    if (refAudio && !refAudio.paused) {
      try { refAudio.pause(); } catch (e) {}
    }

    // 1. Direct stream URL available (Local Audio File or Open Web previewUrl)
    const directUrl = track.localUrl || track.previewUrl;
    if (directUrl) {
      attachTrackStream(directUrl, track, shouldPlayNow, reqId);
      return;
    }

    // 2. Fallback: look up real preview stream via iTunes Search API if track doesn't have previewUrl yet
    try {
      const q = `${track.t} ${track.a}`.trim();
      let item = null;
      if (window.OpenMusicClient && window.OpenMusicClient.queryItunes) {
        const results = await window.OpenMusicClient.queryItunes(q, 1);
        item = results && results[0];
      }
      if (!item || !item.previewUrl || reqId !== playReqSeq) return;
      track.previewUrl = item.previewUrl;
      track.source = 'open';
      track.isOpenSource = true;
      if (!track.cover && item.artworkUrl100) {
        track.cover = item.artworkUrl100.replace(/100x100bb\\.(jpg|png|webp)/i, '600x600bb.$1');
      }
      attachTrackStream(item.previewUrl, track, shouldPlayNow, reqId);
    } catch (e) {}
  }

  function setSpotifyDeviceAudible() {}

  function setReferencePlaying(isPlaying) {
    if (isPlaying) {
      ensureContext();
      if (refAudibleGain) refAudibleGain.gain.value = 1.0;
      const tr = window.AppState && window.AppState.tracks && window.AppState.tracks[window.AppState.idx];
      if (!refAudio || !refAudio.src) {
        if (tr) syncTrackAudioProfile(tr, true);
        return;
      }
      if (refAudio.paused) {
        refAudio.play().catch(() => {});
      }
    } else {
      if (refAudio && !refAudio.paused) {
        refAudio.pause();
      }
    }
  }

  function seekLocalAudio(sec) {
    const tr = window.AppState && window.AppState.tracks && window.AppState.tracks[window.AppState.idx];
    const fallbackDur = (tr && tr.d > 0) ? tr.d : Infinity;
    const dur = (refAudio && isFinite(refAudio.duration) && refAudio.duration > 0) ? refAudio.duration : fallbackDur;
    const safeSec = Math.max(0, Math.min(sec, dur > 1 ? dur - 0.25 : dur));
    isSeekingLocal = true;
    seekTargetSec = safeSec;

    if (refAudio && refAudio.src) {
      if (refAudio.readyState >= 1) {
        pendingSeekSec = null;
        try {
          refAudio.currentTime = safeSec;
        } catch (e) {}
      } else {
        pendingSeekSec = safeSec;
      }
      const onSeekDone = () => {
        isSeekingLocal = false;
        refAudio.removeEventListener('seeked', onSeekDone);
      };
      refAudio.addEventListener('seeked', onSeekDone, { once: true });
      setTimeout(() => { isSeekingLocal = false; }, 400);
    } else {
      pendingSeekSec = safeSec;
      setTimeout(() => { isSeekingLocal = false; }, 400);
    }
  }

  function getPlaybackPosition() {
    const tr = window.AppState && window.AppState.tracks && window.AppState.tracks[window.AppState.idx];
    if (!tr) return null;
    if (isSeekingLocal || pendingSeekSec != null) {
      return seekTargetSec;
    }
    if (refAudio && refAudio.src && !refAudio.paused && isFinite(refAudio.currentTime) && refAudio.currentTime >= 0) {
      return refAudio.currentTime;
    }
    return null;
  }"""

assert old_audio_core in text, "old_audio_core not found!"
text = text.replace(old_audio_core, new_audio_core, 1)

# -------------------------------------------------------------------------
# 2. Replace DEMO_TRACKS & DEMO_PLAYLISTS with Real Open Web Tracks
# -------------------------------------------------------------------------
old_demo_seed = """const DEMO_TRACKS = [
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
];"""

new_demo_seed = """const DEFAULT_OPEN_TRACKS = [
  {
    id: 'open-1637380094',
    source: 'open',
    sourceLabel: 'Web Mở',
    uri: 'open:track:1637380094',
    t: 'Bài Này Chill Phết',
    a: 'Đen & MIN',
    al: 'Bài Này Chill Phết - Single',
    d: 30,
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/5a/37/c8/5a37c86e-2ca3-48e0-04b5-d47a175dd651/cover.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/09/09/cb/0909cb07-b7dc-315a-296e-8528e7e3c3e7/mzaf_8402416386540560581.plus.aac.p.m4a',
    c: [217, 130, 43],
    bpm: 112,
    liked: true,
    isOpenSource: true
  },
  {
    id: 'open-1499378607',
    source: 'open',
    sourceLabel: 'Web Mở',
    uri: 'open:track:1499378607',
    t: 'Blinding Lights',
    a: 'The Weeknd',
    al: 'After Hours',
    d: 30,
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/6f/bc/e6/6fbce6c4-c38c-72d8-4fd0-66cfff32f679/20UMGIM12176.rgb.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/19/d6/60/19d660ff-e3a9-8377-15a3-ce4b28e89cac/mzaf_18422426156481158187.plus.aac.p.m4a',
    c: [196, 78, 50],
    bpm: 120,
    liked: true,
    isOpenSource: true
  },
  {
    id: 'open-1729378207',
    source: 'open',
    sourceLabel: 'Web Mở',
    uri: 'open:track:1729378207',
    t: 'ngủ một mình',
    a: 'HIEUTHUHAI, Negav & Kewtiie',
    al: 'ngủ một mình - Single',
    d: 30,
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8e/bb/ff/8ebbff69-0b36-118d-6dab-d2b3a9c3d677/602448945051_Cover.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/0d/2d/29/0d2d2908-709d-c6cc-1f49-1a2567c20a03/mzaf_8401445915932098462.plus.aac.p.m4a',
    c: [120, 146, 180],
    bpm: 110,
    liked: true,
    isOpenSource: true
  },
  {
    id: 'open-1649434293',
    source: 'open',
    sourceLabel: 'Web Mở',
    uri: 'open:track:1649434293',
    t: 'Anti-Hero',
    a: 'Taylor Swift',
    al: 'Midnights',
    d: 30,
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/3d/01/f2/3d01f2e5-5a08-835f-3d30-d031720b2b80/22UM1IM07364.rgb.jpg.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/1d/56/2a/1d562a07-dc5f-a9c0-1f36-2051a8c14eb7/mzaf_7214829135431340590.plus.aac.p.m4a',
    c: [160, 166, 74],
    bpm: 97,
    liked: true,
    isOpenSource: true
  },
  {
    id: 'open-1739659142',
    source: 'open',
    sourceLabel: 'Web Mở',
    uri: 'open:track:1739659142',
    t: 'BIRDS OF A FEATHER',
    a: 'Billie Eilish',
    al: 'HIT ME HARD AND SOFT',
    d: 30,
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/92/9f/69/929f69f1-9977-3a44-d674-11f70c852d1b/24UMGIM36186.rgb.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/34/31/d3/3431d34e-847f-5d66-df83-0bce688d997e/mzaf_18106743962423782018.plus.aac.p.m4a',
    c: [92, 174, 152],
    bpm: 105,
    liked: false,
    isOpenSource: true
  },
  {
    id: 'open-1642030746',
    source: 'open',
    sourceLabel: 'Web Mở',
    uri: 'open:track:1642030746',
    t: 'From The Ashes',
    a: 'ILLENIUM & Skylar Grey',
    al: 'From The Ashes - Single',
    d: 30,
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/34/d2/09/34d2095b-b527-f708-68ee-eadbb6c50425/054391834393.jpg/600x600bb.jpg',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/1f/30/e1/1f30e181-6854-801f-75de-d2777a497bc1/mzaf_12074059531596553467.plus.aac.p.m4a',
    c: [196, 160, 104],
    bpm: 126,
    liked: false,
    isOpenSource: true
  }
];
const DEMO_TRACKS = DEFAULT_OPEN_TRACKS;
const DEMO_PLAYLISTS = (window.OpenMusicClient && window.OpenMusicClient.CURATED_COLLECTIONS)
  ? window.OpenMusicClient.CURATED_COLLECTIONS.slice()
  : [];"""

assert old_demo_seed in text, "old_demo_seed not found!"
text = text.replace(old_demo_seed, new_demo_seed, 1)

# -------------------------------------------------------------------------
# 3. Filter out legacy demo-* tracks in loadCustomPlaylists & loadLikedTracks
# -------------------------------------------------------------------------
old_storage_loaders = """  function loadCustomPlaylists() {
    try {
      const raw = localStorage.getItem("openmusic_custom_playlists");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  function saveCustomPlaylists() {
    try {
      localStorage.setItem("openmusic_custom_playlists", JSON.stringify(AppState.customPlaylists || []));
    } catch (e) {}
  }

  function loadLikedTracks() {
    try {
      const raw = localStorage.getItem("openmusic_liked_tracks");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return DEMO_TRACKS.slice(0, 3);
  }"""

new_storage_loaders = """  function loadCustomPlaylists() {
    try {
      const raw = localStorage.getItem("openmusic_custom_playlists");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(pl => {
            if (Array.isArray(pl.tracks)) {
              pl.tracks = pl.tracks.filter(t => t && !String(t.id || "").startsWith("demo-"));
              pl.count = pl.tracks.length;
            }
          });
          return parsed;
        }
      }
    } catch (e) {}
    return [];
  }

  function saveCustomPlaylists() {
    try {
      localStorage.setItem("openmusic_custom_playlists", JSON.stringify(AppState.customPlaylists || []));
    } catch (e) {}
  }

  function loadLikedTracks() {
    try {
      const raw = localStorage.getItem("openmusic_liked_tracks");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(t => t && !String(t.id || "").startsWith("demo-") && (t.previewUrl || t.localUrl));
          if (valid.length > 0) return valid;
        }
      }
    } catch (e) {}
    return DEFAULT_OPEN_TRACKS.slice(0, 4);
  }"""

assert old_storage_loaders in text, "old_storage_loaders not found!"
text = text.replace(old_storage_loaders, new_storage_loaders, 1)

# -------------------------------------------------------------------------
# 4. Bind collection header buttons (shuffle & delete custom playlist)
# -------------------------------------------------------------------------
old_bind_header = """function bindCollectionHeaderButtons() {
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
      }
    };
  }
}"""

new_bind_header = """function bindCollectionHeaderButtons() {
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
      }
    };
  }
  const btnShufCol = document.getElementById('btn-shuffle-collection');
  if (btnShufCol) {
    btnShufCol.onclick = () => {
      AudioEngine.ensureContext();
      AppState.shuffle = true;
      document.querySelectorAll('.js-shuffle').forEach(x => x.classList.add('on'));
      if (AppState.tracks.length > 0) {
        const randIdx = Math.floor(Math.random() * AppState.tracks.length);
        selectTrack(randIdx, true);
      }
    };
  }
  const btnDelCol = document.getElementById('btn-del-custom-pl');
  if (btnDelCol && AppState.openedCollection) {
    btnDelCol.onclick = () => deleteCustomPlaylist(AppState.openedCollection.id);
  }
}"""

assert old_bind_header in text, "old_bind_header not found!"
text = text.replace(old_bind_header, new_bind_header, 1)

# -------------------------------------------------------------------------
# 5. Clean up selectTrack, openPlaylist, switchTab, tickFrame, initApp
# -------------------------------------------------------------------------
old_select_track = """function selectTrack(index, autoPlay = false) {
  if (!AppState.tracks.length) return;
  if (autoPlay) {
    AudioEngine.ensureContext();
    AppState.playing = true;
  }
  AppState.idx = (index + AppState.tracks.length) % AppState.tracks.length;
  AppState.pos = 0;
  if (AudioEngine.seekLocalAudio) {
    AudioEngine.seekLocalAudio(0);
  }

  // Render metadata synchronously so AudioEngine starts inside the user's click gesture
  renderMetadata();
  const metaEl = document.querySelector('.stage-meta');
  if (metaEl) {
    metaEl.classList.add('swap');
    setTimeout(() => metaEl.classList.remove('swap'), 220);
  }

  renderTrackList();

  const tr = currentTrack();
  const isDirectWebOrLocal = Boolean(
    tr && (tr.localUrl || tr.source === 'open' || tr.isOpenSource || !tr.uri || !tr.uri.startsWith('spotify:'))
  );



  if (autoPlay) {
    // Pass skipRemoteCall = true so setPlaying doesn't send a competing empty resumePlayback() request
    setPlaying(true, true);
  }
}"""

new_select_track = """function selectTrack(index, autoPlay = false) {
  if (!AppState.tracks.length) return;
  if (autoPlay) {
    AudioEngine.ensureContext();
    AppState.playing = true;
  }
  AppState.idx = (index + AppState.tracks.length) % AppState.tracks.length;
  AppState.pos = 0;

  // Render metadata synchronously so AudioEngine loads & plays inside the user's click gesture
  renderMetadata();
  updateLikeButtonsUI();

  const metaEl = document.querySelector('.stage-meta');
  if (metaEl) {
    metaEl.classList.add('swap');
    setTimeout(() => metaEl.classList.remove('swap'), 220);
  }

  renderTrackList();

  if (autoPlay) {
    setPlaying(true, true);
  }
}"""

assert old_select_track in text, "old_select_track not found!"
text = text.replace(old_select_track, new_select_track, 1)

old_tick_playback = """  const tr = currentTrack();
  if (AppState.playing) {
    if (AudioEngine.getPlaybackPosition) {
      const exactPos = AudioEngine.getPlaybackPosition();
      if (exactPos != null) {
        AppState.pos = exactPos;
      } else {
        AppState.pos += wallDt;
      }
    } else {
      AppState.pos += wallDt;
    }
    simTime += dt;
    if (AppState.pos >= tr.d) {
      if (AppState.repeat) {
        AppState.pos = 0;
      } else {
        nextTrack();
      }
    }"""

new_tick_playback = """  const tr = currentTrack();
  if (AppState.playing) {
    if (AudioEngine.getPlaybackPosition) {
      const exactPos = AudioEngine.getPlaybackPosition();
      if (exactPos != null) {
        AppState.pos = exactPos;
      } else {
        const ra = AudioEngine.getRefAudio && AudioEngine.getRefAudio();
        if (ra && ra.error) {
          AppState.pos += wallDt;
        }
      }
    }
    simTime += dt;"""

assert old_tick_playback in text, "old_tick_playback not found!"
text = text.replace(old_tick_playback, new_tick_playback, 1)

old_init_footer = """  // Initial render
  const curated = (window.OpenMusicClient && window.OpenMusicClient.CURATED_COLLECTIONS) || [];
  AppState.playlists = mergeCollections(curated, DEMO_PLAYLISTS);
  bindMediaSessionHandlers();
  renderTrackList();
  renderMetadata();
  setPlaying(false);
  AudioEngine.startDemoSynth(currentTrack, () => AppState.playing);
  // Wire Playlist Modals & Actions
  AppState.customPlaylists = loadCustomPlaylists();
  AppState.likedTracks = loadLikedTracks();"""

new_init_footer = """  // Initial render
  const curated = (window.OpenMusicClient && window.OpenMusicClient.CURATED_COLLECTIONS) || [];
  AppState.playlists = mergeCollections(curated);
  AppState.customPlaylists = loadCustomPlaylists();
  AppState.likedTracks = loadLikedTracks();
  bindMediaSessionHandlers();
  renderTrackList();
  renderMetadata();
  updateLikeButtonsUI();
  setPlaying(false);
  // Wire Current Track Like Button
  document.querySelectorAll(".js-btn-like-current").forEach(btn => {
    btn.onclick = () => toggleLikeTrack(currentTrack());
  });"""

assert old_init_footer in text, "old_init_footer not found!"
text = text.replace(old_init_footer, new_init_footer, 1)

INDEX_PATH.write_text(text.replace("\n", nl), encoding="utf-8")
print("Successfully updated index.html!")

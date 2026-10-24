// ===== VANG REAL-TIME AUDIO & TRANSIENT ENGINE =====
// Extracts real 32-band FFT frequency spectra + physical onset/beat transients (punch)
// Supports:
// 1. Internal WebAudio multi-section synthesizer (Demo Mode — real FFT through AnalyserNode)
// 2. Track-matched real audio preview & Spotify segment analysis (Auto Mode when Spotify is active)
// 3. System / Tab Audio Loopback capture (getDisplayMedia audio)
// 4. Raw Unfiltered Microphone capture (getUserMedia with AGC/NoiseSuppression disabled)

const AudioEngine = (function () {
  let ctx = null;
  let analyser = null;
  let masterGain = null;
  let refAudibleGain = null;
  let silentSink = null;
  let captureStream = null;
  let captureSource = null;
  let fftData = null;
  let timeData = null;
  let sourceMode = 'auto'; // 'auto' | 'system' | 'mic'
  let volume = 0.72;
  let muted = false;
  let spotifyDeviceAudible = false; // True when Spotify SDK/Connect is actively outputting sound

  // Real audio reference element for Spotify tracks (fetches real preview stream via CORS-enabled iTunes API)
  let refAudio = null;
  let refMediaSource = null;
  let currentRefTrackId = null;
  let spotifyAnalysis = null; // Stores /audio-analysis/{id} segments & beats if available

  // Procedural Demo Synth state (rich musical arrangement with drops, fills, and rests)
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
    bass: 0,
    mid: 0,
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
      refAudio.src = track.localUrl;
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
        }
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
        }
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
      return;
    }

    // 3. If Spotify token is active, try fetching Spotify's audio-features / audio-analysis
    if (window.SpotifyClient && window.SpotifyClient.hasToken && window.SpotifyClient.hasToken() && track.id) {
      window.SpotifyClient.fetchAudioAnalysis(track.id).then(data => {
        if (data && currentRefTrackId === trackKey) {
          spotifyAnalysis = data;
          if (data.track && data.track.tempo) {
            track.bpm = Math.round(data.track.tempo);
          }
        }
      }).catch(() => {});
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
      refAudio.src = item.previewUrl;
      if (!refMediaSource && ctx) {
        try {
          refMediaSource = ctx.createMediaElementSource(refAudio);
          refMediaSource.connect(analyser);
          refMediaSource.connect(refAudibleGain);
        } catch (e) {}
      }
      // CRITICAL: Mute speaker gain to 0.0 for all Spotify tracks so the user ONLY hears Spotify!
      if (refAudibleGain) {
        refAudibleGain.gain.value = 0.0;
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

  function seekLocalAudio(sec) {
    if (refAudio && refAudio.src) {
      try { refAudio.currentTime = Math.max(0, sec); } catch (e) {}
    }
  }

  function getPlaybackPosition() {
    if (refAudio && refAudio.src && !refAudio.paused && isFinite(refAudio.currentTime) && refAudio.currentTime > 0) {
      return refAudio.currentTime;
    }
    return null;
  }

  function stopCaptureStream() {
    if (captureStream) {
      captureStream.getTracks().forEach(t => t.stop());
      captureStream = null;
    }
    if (captureSource) {
      try { captureSource.disconnect(); } catch (e) {}
      captureSource = null;
    }
  }

  // Capture live Microphone with AGC, NoiseSuppression, and EchoCancellation disabled so bass/drums stay raw
  async function enableMicInput() {
    stopCaptureStream();
    ensureContext();
    captureStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      },
      video: false
    });
    captureSource = ctx.createMediaStreamSource(captureStream);
    captureSource.connect(analyser);
    sourceMode = 'mic';
    return sourceMode;
  }

  // Capture System / Tab Audio Loopback directly from Windows / Browser Tab
  async function enableSystemAudioInput() {
    stopCaptureStream();
    ensureContext();
    captureStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });
    const audioTracks = captureStream.getAudioTracks();
    if (!audioTracks.length) {
      stopCaptureStream();
      throw new Error('Bạn cần tích chọn "Chia sẻ âm thanh hệ thống / Share tab audio" trong hộp thoại.');
    }
    // Stop video track immediately — we only need the raw system/tab audio stream!
    captureStream.getVideoTracks().forEach(vt => vt.stop());
    const audioOnlyStream = new MediaStream(audioTracks);
    captureSource = ctx.createMediaStreamSource(audioOnlyStream);
    captureSource.connect(analyser);
    audioTracks[0].onended = () => {
      sourceMode = 'auto';
    };
    sourceMode = 'system';
    return sourceMode;
  }

  async function setSourceMode(target) {
    if (target === 'auto') {
      stopCaptureStream();
      sourceMode = 'auto';
      return sourceMode;
    }
    if (target === 'mic') {
      return enableMicInput();
    }
    if (target === 'system') {
      return enableSystemAudioInput();
    }
    return sourceMode;
  }

  async function toggleMicInput() {
    if (sourceMode === 'mic') return setSourceMode('auto');
    return setSourceMode('mic');
  }

  function setVolume(val) {
    volume = Math.max(0, Math.min(1, val));
    if (masterGain && ctx) {
      masterGain.gain.setValueAtTime(muted ? 0 : volume, ctx.currentTime);
    }
    return volume;
  }

  function toggleMute() {
    muted = !muted;
    if (masterGain && ctx) {
      masterGain.gain.setValueAtTime(muted ? 0 : volume, ctx.currentTime);
    }
    return muted;
  }

  // Sample real-time 32-band FFT + compute transient onset (punch)
  function sampleBands(dt, isPlaying, simTime, bpm, trackPosSec = 0) {
    // If paused and not capturing live mic/system audio, decay cleanly to ZERO (no fake continuous bouncing!)
    if (!isPlaying && sourceMode === 'auto') {
      const decay = Math.exp(-dt * 10);
      bands.bass *= decay;
      bands.mid *= decay;
      bands.high *= decay;
      bands.energy *= decay;
      bands.punch *= decay;
      bands.snareHit *= decay;
      for (let i = 0; i < NUM_BINS; i++) bins[i] *= decay;
      prevRawBass = 0;
      prevRawMid = 0;
      prevRawHigh = 0;
      return bands;
    }

    let gotRealFFT = false;
    let rawBass = 0;
    let rawMid = 0;
    let rawHigh = 0;

    if (analyser && fftData && ctx && ctx.state === 'running') {
      analyser.getByteFrequencyData(fftData);
      let totalSignal = 0;
      for (let i = 1; i < 180; i++) totalSignal += fftData[i];

      if (totalSignal > 40) {
        gotRealFFT = true;
        // Map 512 FFT bins logarithmically into 32 musical frequency bands
        for (let b = 0; b < NUM_BINS; b++) {
          const startBin = Math.max(1, Math.floor(Math.pow(b / NUM_BINS, 1.85) * 200));
          const endBin = Math.max(startBin + 1, Math.floor(Math.pow((b + 1) / NUM_BINS, 1.85) * 200));
          let sum = 0;
          for (let k = startBin; k < endBin && k < fftData.length; k++) {
            sum += fftData[k];
          }
          const avg = (sum / (endBin - startBin)) / 255;

          // Update rolling noise floor per bin so steady background noise doesn't inflate the visualizer
          binFloor[b] = binFloor[b] * 0.96 + avg * 0.04;
          const dynamicDelta = Math.max(0, avg - binFloor[b] * 0.62);
          const targetVal = Math.min(1, avg * 0.45 + dynamicDelta * 1.65);

          const rate = targetVal > bins[b] ? 32 : 9.5;
          bins[b] += (targetVal - bins[b]) * Math.min(1, dt * rate);
        }

        // Sub-bass & Kick (bins 0..5), Midrange/Vocals (bins 6..18), Highs/Presence (bins 19..31)
        for (let i = 0; i < 6; i++) rawBass += bins[i];
        for (let i = 6; i < 19; i++) rawMid += bins[i];
        for (let i = 19; i < 32; i++) rawHigh += bins[i];
        rawBass /= 6;
        rawMid /= 13;
        rawHigh /= 13;
      }
    }

    // 2. If Spotify audio-analysis segments exist for the current song, use exact segment loudness & pitches
    if (!gotRealFFT && spotifyAnalysis && Array.isArray(spotifyAnalysis.segments)) {
      const segs = spotifyAnalysis.segments;
      const t = trackPosSec;
      // Binary/linear search current segment
      let seg = null;
      for (let i = 0; i < segs.length; i++) {
        if (segs[i].start <= t && (segs[i].start + segs[i].duration) >= t) {
          seg = segs[i];
          break;
        }
      }
      if (seg) {
        gotRealFFT = true;
        const relT = Math.max(0, t - seg.start);
        const maxTime = seg.loudness_max_time || 0.05;
        const env = relT <= maxTime
          ? (relT / Math.max(0.01, maxTime))
          : Math.exp(-(relT - maxTime) * 4.5);
        const loudNorm = Math.max(0, Math.min(1, (seg.loudness_max + 35) / 35));
        const pitches = seg.pitches || [];
        for (let b = 0; b < NUM_BINS; b++) {
          const pVal = pitches[b % 12] || 0.3;
          const target = Math.min(1, loudNorm * env * pVal);
          bins[b] += (target - bins[b]) * Math.min(1, dt * 24);
        }
        rawBass = (bins[0] + bins[1] + bins[2] + bins[3]) / 4;
        rawMid = (bins[6] + bins[9] + bins[12] + bins[15]) / 4;
        rawHigh = (bins[20] + bins[24] + bins[28]) / 3;
      }
    }

    // 3. Dynamic multi-bar rhythmic synthesis if browser autoplay hasn't unlocked WebAudio yet
    if (!gotRealFFT && isPlaying) {
      const tempo = bpm || 114;
      const beatPos = simTime * (tempo / 60);
      const bar = Math.floor(beatPos / 4) % 8;
      const beatInBar = beatPos % 4;
      const frac = beatPos % 1;

      // Quiet breakdown on bar 6 so even fallback has real musical dynamics & pauses
      const barIntensity = bar === 6 ? 0.18 : bar === 7 ? 0.85 : 1.0;
      const isKick = (frac < 0.22) || (beatInBar > 2.45 && beatInBar < 2.7);
      const kickEnv = isKick ? Math.exp(-(frac % 0.5) * 9.5) * barIntensity : 0;
      const snareEnv = (Math.floor(beatInBar) % 2 === 1) ? Math.exp(-frac * 8.5) * barIntensity : 0;

      for (let b = 0; b < NUM_BINS; b++) {
        let v = 0;
        if (b < 6) v = kickEnv * (1 - b * 0.08);
        else if (b < 18) v = snareEnv * 0.65 + Math.max(0, Math.sin(beatPos * 2 + b * 0.7)) * 0.32 * barIntensity;
        else v = Math.exp(-((beatPos * 2) % 1) * 11) * 0.45 * barIntensity;
        bins[b] += (v - bins[b]) * Math.min(1, dt * 25);
      }
      rawBass = kickEnv * 0.92;
      rawMid = snareEnv * 0.6 + 0.22 * barIntensity;
      rawHigh = Math.exp(-((beatPos * 2) % 1) * 11) * 0.55 * barIntensity;
    }

    // Compute sharp onset transients (Punch = positive derivative of bass energy!)
    const bassJump = Math.max(0, rawBass - prevRawBass);
    const midJump = Math.max(0, rawMid - prevRawMid);
    prevRawBass = prevRawBass * 0.65 + rawBass * 0.35;
    prevRawMid = prevRawMid * 0.70 + rawMid * 0.30;
    prevRawHigh = prevRawHigh * 0.70 + rawHigh * 0.30;

    if (bassJump > 0.035) {
      bands.punch = Math.min(1, bands.punch + bassJump * 3.4);
    } else {
      bands.punch *= Math.exp(-dt * 11.5); // Fast spring snap-back between beats
    }

    if (midJump > 0.03) {
      bands.snareHit = Math.min(1, bands.snareHit + midJump * 2.8);
    } else {
      bands.snareHit *= Math.exp(-dt * 12.0);
    }

    // Fast attack (30), crisp release (9.5) so visuals snap tightly to the music
    const attackRelease = (cur, tgt) => {
      const rate = tgt > cur ? 30 : 9.5;
      return cur + (tgt - cur) * Math.min(1, dt * rate);
    };

    bands.bass = attackRelease(bands.bass, Math.min(1, rawBass + bands.punch * 0.35));
    bands.mid = attackRelease(bands.mid, rawMid);
    bands.high = attackRelease(bands.high, rawHigh);
    bands.energy = bands.bass * 0.48 + bands.mid * 0.34 + bands.high * 0.18;

    return bands;
  }

  return {
    ensureContext,
    startDemoSynth,
    stopDemoSynth,
    syncTrackAudioProfile,
    setReferencePlaying,
    setSpotifyDeviceAudible,
    seekLocalAudio,
    getPlaybackPosition,
    setSourceMode,
    toggleMicInput,
    setVolume,
    toggleMute,
    sampleBands,
    getVolume: () => volume,
    isMuted: () => muted,
    getSourceMode: () => sourceMode,
    bands
  };
})();

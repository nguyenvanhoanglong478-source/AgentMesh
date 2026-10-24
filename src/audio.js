// ===== VANG AUDIO ENGINE =====
// 1. WebAudio Synthesizer (plays procedural ambient/electronic music in Demo Mode so the player produces real sound out of the box)
// 2. Live FFT Analyser (analyses either the internal synth, microphone/system loopback, or beat-synced Spotify envelope)

const AudioEngine = (function () {
  let ctx = null;
  let analyser = null;
  let masterGain = null;
  let micStream = null;
  let micSource = null;
  let fftData = null;
  let sourceMode = 'auto'; // 'auto' | 'mic'
  let volume = 0.72;
  let muted = false;

  // Procedural Demo Synth state
  let synthTimer = null;
  let stepIdx = 0;

  // Smoothed frequency band outputs (0.0 -> 1.0)
  const bands = { bass: 0.04, mid: 0.05, high: 0.02, energy: 0.04 };

  function ensureContext() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.78;
      fftData = new Uint8Array(analyser.frequencyBinCount);

      masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : volume;
      masterGain.connect(analyser);
      analyser.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  // Trigger a warm analog kick + chord + hi-hat step for Demo Mode playback
  function triggerDemoStep(track, step) {
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const bpm = track.bpm || 112;
    const stepDur = 60 / bpm / 2; // 8th note steps
    const root = track.rootHz || 110;

    // Kick on 0, 3, 4, 6 (syncopated electronic pattern)
    if (step % 8 === 0 || step % 8 === 3 || step % 8 === 6) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(root * 1.35, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 0.16);
      g.gain.setValueAtTime(0.42, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.25);
    }

    // Warm sub-bass & mid pad chord on beat
    if (step % 4 === 0) {
      const ratios = track.chord || [1, 1.2, 1.5, 1.8];
      const r = ratios[(step / 4) % ratios.length];
      const osc = ctx.createOscillator();
      const flt = ctx.createBiquadFilter();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(root * 2 * r, now);
      flt.type = 'lowpass';
      flt.frequency.setValueAtTime(920 + (step % 16) * 65, now);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.14, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, now + stepDur * 3.5);
      osc.connect(flt);
      flt.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + stepDur * 3.6);
    }

    // Crisp hi-hat / shimmer on off-beats
    if (step % 2 === 1) {
      const bufSize = Math.floor(ctx.sampleRate * 0.045);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const flt = ctx.createBiquadFilter();
      flt.type = 'highpass';
      flt.frequency.value = 5200;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.09, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
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
      const ms = (60 / bpm / 2) * 1000;
      if (isPlayingFn() && !AppState.spotifyActive) {
        ensureContext();
        triggerDemoStep(tr, stepIdx++);
      }
      synthTimer = setTimeout(tick, ms);
    };
    synthTimer = setTimeout(tick, 120);
  }

  function stopDemoSynth() {
    if (synthTimer) {
      clearTimeout(synthTimer);
      synthTimer = null;
    }
  }

  async function toggleMicInput() {
    if (sourceMode === 'mic') {
      if (micStream) {
        micStream.getTracks().forEach(t => t.stop());
        micStream = null;
      }
      if (micSource) {
        try { micSource.disconnect(); } catch (e) {}
        micSource = null;
      }
      sourceMode = 'auto';
      return sourceMode;
    }
    try {
      ensureContext();
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micSource = ctx.createMediaStreamSource(micStream);
      micSource.connect(analyser);
      sourceMode = 'mic';
      return sourceMode;
    } catch (err) {
      sourceMode = 'auto';
      throw err;
    }
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

  // Update bands every animation frame (dt in seconds)
  function sampleBands(dt, isPlaying, simTime, bpm) {
    let targetBass = 0.04;
    let targetMid = 0.05;
    let targetHigh = 0.02;

    let gotFFT = false;
    if (analyser && fftData && (isPlaying || sourceMode === 'mic') && ctx && ctx.state === 'running') {
      analyser.getByteFrequencyData(fftData);
      let bSum = 0, mSum = 0, hSum = 0;
      for (let i = 1; i <= 10; i++) bSum += fftData[i];
      for (let i = 11; i <= 55; i++) mSum += fftData[i];
      for (let i = 56; i <= 140; i++) hSum += fftData[i];
      if (bSum + mSum + hSum > 15) {
        targetBass = Math.min(1, (bSum / 10) / 215);
        targetMid = Math.min(1, (mSum / 45) / 170);
        targetHigh = Math.min(1, (hSum / 85) / 135);
        gotFFT = true;
      }
    }

    // Fallback or hybrid beat-sync envelope (e.g. when Spotify plays on remote device or autoplay is blocked before first gesture)
    if (!gotFFT && isPlaying) {
      const tempo = bpm || 114;
      const beat = simTime * (tempo / 60);
      const kick = Math.exp(-((beat % 1) * 5.2));
      const snare = Math.exp(-(((beat + 0.5) % 1) * 7.0));
      const hat = Math.exp(-(((beat * 2 + 0.25) % 1) * 9.5));
      targetBass = 0.20 + 0.78 * kick;
      targetMid = 0.30 + 0.26 * Math.sin(simTime * 1.4) + 0.25 * snare;
      targetHigh = 0.16 + 0.68 * hat;
    }

    const smooth = (cur, tgt) => {
      const rate = tgt > cur ? 22 : 6.5;
      return cur + (tgt - cur) * Math.min(1, dt * rate);
    };

    bands.bass = smooth(bands.bass, targetBass);
    bands.mid = smooth(bands.mid, targetMid);
    bands.high = smooth(bands.high, targetHigh);
    bands.energy = (bands.bass * 0.5 + bands.mid * 0.35 + bands.high * 0.15);
    return bands;
  }

  return {
    ensureContext,
    startDemoSynth,
    stopDemoSynth,
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

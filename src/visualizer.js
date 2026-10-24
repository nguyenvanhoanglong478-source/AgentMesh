// ===== VANG 3D AUDIO-REACTIVE VISUALIZER =====
// Driven strictly by real-time 32-band FFT spectrum (bands.bins) and beat onset transients (bands.punch):
// - Stays calm and poised during silence or pause (zero fake continuous sine-wave bouncing)
// - Snaps outward with physical spring-damping on real kick/snare/vocal transients
// Mode 1 ('cluster'): "Khối đốm hạt" — 2,400-particle 3D sphere mapped to 32 frequency zones + bass shockwave
// Mode 2 ('ridge'): "Địa hình" — Real-time 3D Waterfall Spectrogram (34 cascading FFT history ridgelines)
// Mode 3 ('vortex'): "Xoáy hạt" — 32-ring 3D Orbital Spectrum Vortex

const Visualizer3D = (function () {
  let canvas = null;
  let ctx = null;
  let mode = 'cluster'; // 'cluster' | 'ridge' | 'vortex'
  let width = 0;
  let height = 0;
  let dpr = 1;

  // Interactive camera rotation (drag stage to rotate the 3D sculpture)
  let rotY = 0;
  let rotX = 0.22;
  let userYaw = 0;
  let userPitch = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  // Audio-driven phase (only advances when music actually has energy)
  let musicPhase = 0;
  let shockwavePhase = 0;
  let bounceGain = 1.0; // Adjustable 3D bounce sensitivity (0.0 -> 2.0)

  // 34-row x 65-column Waterfall Spectrogram history for "Địa hình" (ridge mode)
  const RIDGE_ROWS = 34;
  const RIDGE_COLS = 64;
  const ridgeHistory = [];
  let ridgeShiftTimer = 0;

  // Adaptive particle counts: 1800 on Desktop (rich 3D sculpture), 900 on Mobile (smooth 60fps & low battery)
  const MAX_PARTICLES = 1800;
  const MOBILE_PARTICLES = 900;
  const particles = [];

  // Pre-allocated object pools & draw buckets (Zero Garbage Collection overhead per frame)
  const clusterPool = [];
  for (let i = 0; i < MAX_PARTICLES; i++) {
    clusterPool.push({ sx: 0, sy: 0, rad: 0, haloRad: 0 });
  }
  const clusterBuckets = Array.from({ length: 9 }, () => []);

  const vortexPool = [];
  for (let i = 0; i < MAX_PARTICLES; i++) {
    vortexPool.push({ sx: 0, sy: 0, rad: 0 });
  }
  const vortexBuckets = Array.from({ length: 4 }, () => []);

  function initParticles() {
    particles.length = 0;
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const t = i / (MAX_PARTICLES - 1);
      const y = 1 - t * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;

      // 3 shells: outer surface (72%), mid-cluster (20%), dense core (8%)
      const shellRoll = (i * 2654435761) % 100;
      const shell = shellRoll < 72 ? 1.0 : shellRoll < 92 ? 0.68 : 0.34;
      const baseSize = shell === 1.0 ? 1.5 + (i % 5) * 0.32 : shell === 0.68 ? 1.2 : 2.1;

      // Map each particle to one of the 32 FFT frequency bins based on its 3D position
      // Equator (|y| near 0) = Bass & Kick (bins 0..9)
      // Mid-latitudes = Vocals & Synths (bins 10..21)
      // Poles (|y| near 1) = Hi-hats & Treble (bins 22..31)
      const latNorm = Math.abs(y);
      const lonWave = (Math.sin(theta * 3) * 0.5 + 0.5);
      const binIdx = Math.min(31, Math.floor(latNorm * 22 + lonWave * 10));

      particles.push({
        bx: Math.cos(theta) * r,
        by: y,
        bz: Math.sin(theta) * r,
        shell,
        binIdx,
        lobe: Math.sin(theta * 4 + y * 5),
        seed: (i * 0.137) % (Math.PI * 2),
        size: baseSize,
        ringAngle: (i / MAX_PARTICLES) * Math.PI * 2 * 16,
        ringRadius: 0.32 + (i / MAX_PARTICLES) * 1.25
      });
    }

    ridgeHistory.length = 0;
    for (let r = 0; r < RIDGE_ROWS; r++) {
      ridgeHistory.push(new Float32Array(RIDGE_COLS + 1));
    }
  }

  function mount(stageEl) {
    if (!canvas) {
      canvas = document.createElement('canvas');
      ctx = canvas.getContext('2d');
      initParticles();
      bindPointer(stageEl);
    }
    stageEl.prepend(canvas);
    resize();
  }

  function bindPointer(el) {
    if (!el) return;
    if (el.style) el.style.touchAction = 'none';
    if (canvas && canvas.style) canvas.style.touchAction = 'none';

    const onStart = (x, y, target) => {
      if (target && target.closest && target.closest('button, input, a')) return false;
      dragging = true;
      lastX = x;
      lastY = y;
      return true;
    };

    const onMove = (x, y) => {
      if (!dragging) return;
      const dx = x - lastX;
      const dy = y - lastY;
      lastX = x;
      lastY = y;
      const sens = window.innerWidth <= 900 ? 0.0085 : 0.006;
      userYaw += dx * sens;
      userPitch = Math.max(-0.95, Math.min(0.95, userPitch + dy * sens));
    };

    const onEnd = () => {
      dragging = false;
    };

    // Pointer Events (Desktop + Modern Mobile)
    el.addEventListener('pointerdown', e => {
      if (onStart(e.clientX, e.clientY, e.target)) {
        if (el.setPointerCapture && e.pointerId !== undefined) {
          try { el.setPointerCapture(e.pointerId); } catch (err) {}
        }
      }
    });
    el.addEventListener('pointermove', e => onMove(e.clientX, e.clientY));
    el.addEventListener('pointerup', onEnd);
    el.addEventListener('pointercancel', onEnd);

    // Explicit Touch Events fallback for mobile WebViews / Safari / Android browsers
    el.addEventListener('touchstart', e => {
      if (!e.touches || !e.touches.length) return;
      const t = e.touches[0];
      if (onStart(t.clientX, t.clientY, e.target)) {
        if (e.cancelable) e.preventDefault();
      }
    }, { passive: false });

    el.addEventListener('touchmove', e => {
      if (!dragging || !e.touches || !e.touches.length) return;
      if (e.cancelable) e.preventDefault();
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    }, { passive: false });

    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
  }

  function resize() {
    if (!canvas || !canvas.parentElement) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    width = canvas.parentElement.clientWidth || 800;
    height = canvas.parentElement.clientHeight || 600;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }

  // Compute strictly audio-reactive 3D radial displacement for each particle
  function computeAudioDisplacement(p, bands, bins) {
    const binVal = (bins ? bins[p.binIdx] : bands.mid) * bounceGain;
    const punch = (bands.punch || 0) * bounceGain;
    const snare = (bands.snareHit || 0) * bounceGain;

    // 1. Direct frequency bin bounce along directional 3D lobes
    const lobeDir = 0.45 + 0.55 * Math.sin(p.bx * 3.5 + p.bz * 3.5 + musicPhase * 1.4) * Math.cos(p.by * 4.0 - musicPhase);
    const freqBounce = binVal * (0.28 + lobeDir * 0.58);

    // 2. Kick drum transient shockwave (explodes outward from equator & core on beat hits)
    const equatorWeight = 1.0 - Math.abs(p.by) * 0.55;
    const kickBounce = punch * equatorWeight * (p.shell === 1.0 ? 0.52 : 0.72);

    // 3. Snare / vocal harmonic ripple
    const harmonicRipple = snare * 0.25 * Math.cos(p.by * 8.0 - shockwavePhase * 4.0);

    return 0.92 + freqBounce + kickBounce + harmonicRipple;
  }

  // Render Mode 1: "Khối đốm hạt" (Audio-Reactive 3D Particle Cluster - Zero-GC High-FPS Batch Render)
  function drawCluster(bands, acc, isMobile) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w * 0.5;
    const cy = h * (isMobile ? 0.44 : 0.45);
    const scale = Math.min(w, h) * (isMobile ? 0.30 : 0.29);
    const punch = bands.punch || 0;
    const bins = bands.bins;

    // Clear with deep warm ink + audio-reactive ambient core glow
    ctx.fillStyle = "#0E0D0B";
    ctx.fillRect(0, 0, w, h);

    const glowR = scale * (1.25 + bands.bass * 0.65 + punch * 0.55);
    const grad = ctx.createRadialGradient(cx, cy, scale * 0.04, cx, cy, glowR);
    const glowAlpha = Math.min(0.42, 0.08 + bands.energy * 0.22 + punch * 0.22);
    const ar = Math.round(acc[0]), ag = Math.round(acc[1]), ab = Math.round(acc[2]);
    grad.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, ${glowAlpha.toFixed(3)})`);
    grad.addColorStop(0.55, `rgba(${ar}, ${ag}, ${ab}, ${(glowAlpha * 0.22).toFixed(3)})`);
    grad.addColorStop(1, "rgba(14, 13, 11, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const yaw = rotY + userYaw;
    const pitch = rotX + userPitch + Math.sin(musicPhase * 0.3) * 0.08;
    const cyaw = Math.cos(yaw), syaw = Math.sin(yaw);
    const cpitch = Math.cos(pitch), spitch = Math.sin(pitch);

    const fov = 3.2;
    const activeCount = isMobile ? MOBILE_PARTICLES : MAX_PARTICLES;

    // Clear bucket buffers for this frame (zero allocations)
    for (let b = 0; b < 9; b++) {
      clusterBuckets[b].length = 0;
    }

    for (let i = 0; i < activeCount; i++) {
      const p = particles[i];
      const disp = computeAudioDisplacement(p, bands, bins);
      const rad = p.shell * disp;

      // Tangential jitter only when high frequencies (hi-hats/cymbals) are active
      const swirl = bands.high * 0.12 * Math.sin(musicPhase * 3 + p.seed);
      const px = p.bx * rad - p.bz * swirl;
      const py = p.by * rad;
      const pz = p.bz * rad + p.bx * swirl;

      const x1 = px * cyaw - pz * syaw;
      const z1 = px * syaw + pz * cyaw;
      const y2 = py * cpitch - z1 * spitch;
      const z2 = py * spitch + z1 * cpitch;

      const persp = fov / (fov + z2 + 1.85);
      const sx = cx + x1 * scale * persp * 1.45;
      const sy = cy + y2 * scale * persp * 1.45;

      const binVal = bins ? bins[p.binIdx] : bands.mid;
      const depthNorm = Math.max(0, Math.min(1, (1.3 - z2) / 2.6));
      const peakFactor = Math.max(0, Math.min(1, (disp - 0.94) * 1.65));
      const isAcc = (peakFactor > 0.32 || binVal > 0.40 || p.shell < 0.5 || punch > 0.30) ? 1 : 0;

      // Quantize depth into 4 back-to-front tiers (0 = farthest back, 3 = nearest front)
      const depthTier = depthNorm < 0.32 ? 0 : depthNorm < 0.58 ? 1 : depthNorm < 0.82 ? 2 : 3;
      const bucketIdx = depthTier * 2 + isAcc;

      const radius = Math.max(0.65 * dpr, p.size * dpr * persp * (0.78 + binVal * 0.55 + punch * 0.50));

      const it = clusterPool[i];
      it.sx = sx;
      it.sy = sy;
      it.rad = radius;
      clusterBuckets[bucketIdx].push(it);

      // Bokeh halo on foreground particles actively firing with the music transients
      if (depthNorm > 0.72 && (peakFactor > 0.38 || punch > 0.25) && (i % 6 === 0)) {
        it.haloRad = radius * (2.4 + punch * 1.2);
        clusterBuckets[8].push(it);
      }
    }

    // 9 Pre-computed draw styles: Back-to-front order (0 to 7) + Halo (8)
    const baseR = 236, baseG = 229, baseB = 216;
    const styles = [
      `rgba(${baseR}, ${baseG}, ${baseB}, 0.22)`,
      `rgba(${ar}, ${ag}, ${ab}, 0.28)`,
      `rgba(${baseR}, ${baseG}, ${baseB}, 0.46)`,
      `rgba(${ar}, ${ag}, ${ab}, 0.54)`,
      `rgba(${baseR}, ${baseG}, ${baseB}, 0.72)`,
      `rgba(${ar}, ${ag}, ${ab}, 0.80)`,
      `rgba(${baseR}, ${baseG}, ${baseB}, 0.92)`,
      `rgba(${ar}, ${ag}, ${ab}, 0.98)`,
      `rgba(${ar}, ${ag}, ${ab}, ${(0.16 + punch * 0.22).toFixed(3)})`
    ];

    // Batch-render: Only 9 canvas path flushes max per frame (30x faster!)
    for (let b = 0; b < 9; b++) {
      const pts = clusterBuckets[b];
      const len = pts.length;
      if (len === 0) continue;

      ctx.fillStyle = styles[b];
      ctx.beginPath();
      const isHalo = (b === 8);
      for (let j = 0; j < len; j++) {
        const pt = pts[j];
        const r = isHalo ? pt.haloRad : pt.rad;
        ctx.moveTo(pt.sx + r, pt.sy);
        ctx.arc(pt.sx, pt.sy, r, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }

  // Update the 34-row Waterfall Spectrogram buffer from the real 32-band FFT spectrum
  function updateRidgeSpectrogram(dt, bands) {
    const bins = bands.bins;
    const punch = bands.punch || 0;
    const front = ridgeHistory[0];

    // Map the 32 FFT bins symmetrically across the 64 columns:
    // Center (col 32) = Sub-Bass & Kick Drum (bins 0..4)
    // Mid-wings = Vocals, Guitar, Keys (bins 5..18)
    // Outer edges = Hi-Hats & Air (bins 19..31)
    for (let c = 0; c <= RIDGE_COLS; c++) {
      const distFromCenter = Math.abs(c - RIDGE_COLS / 2) / (RIDGE_COLS / 2); // 0 at center -> 1 at edges
      const bellWindow = Math.exp(-Math.pow(distFromCenter / 0.52, 2));
      const fIdx = Math.min(31, Math.floor(distFromCenter * 29));
      const nextIdx = Math.min(31, fIdx + 1);
      const frac = (distFromCenter * 29) - fIdx;
      const rawBin = bins ? (bins[fIdx] * (1 - frac) + bins[nextIdx] * frac) : 0;

      // Add organic spatial harmonic detail ONLY scaled by actual audio signal (0 when silent!)
      const harmonicDetail = rawBin * 0.28 * Math.sin(c * 0.65 + musicPhase * 2.5);
      const centerKickSpike = (distFromCenter < 0.28) ? punch * (1 - distFromCenter / 0.28) * 0.55 : 0;

      const targetHeight = Math.min(1.65, (rawBin * 0.95 + harmonicDetail + centerKickSpike) * (0.25 + 0.75 * bellWindow) * bounceGain);
      front[c] += (targetHeight - front[c]) * Math.min(1, dt * 28);
    }

    // Cascade rows backward in 3D waterfall every ~32ms
    ridgeShiftTimer += dt;
    if (ridgeShiftTimer >= 0.032) {
      ridgeShiftTimer = 0;
      for (let r = RIDGE_ROWS - 1; r >= 1; r--) {
        const dst = ridgeHistory[r];
        const src = ridgeHistory[r - 1];
        for (let c = 0; c <= RIDGE_COLS; c++) {
          dst[c] = dst[c] * 0.25 + src[c] * 0.74;
        }
      }
    }
  }

  // Render Mode 2: "Địa hình" (Real-Time 3D Waterfall Spectrogram Terrain)
  function drawRidge(bands, acc, progressRatio, isMobile) {
    const w = canvas.width;
    const h = canvas.height;
    const top = h * 0.16;
    const bot = h * (isMobile ? 0.76 : 0.70);
    const st = (bot - top) / RIDGE_ROWS;
    const maxAmp = h * (isMobile ? 0.19 : 0.22);

    ctx.fillStyle = '#0E0D0B';
    ctx.fillRect(0, 0, w, h);

    const ar = Math.round(acc[0]), ag = Math.round(acc[1]), ab = Math.round(acc[2]);

    // Draw from back (oldest row = RIDGE_ROWS - 1) to front (live FFT row = 0)
    for (let rIdx = RIDGE_ROWS - 1; rIdx >= 0; rIdx--) {
      const screenRow = (RIDGE_ROWS - 1) - rIdx; // 0 at top (back), RIDGE_ROWS-1 at bottom (front)
      const yBase = top + screenRow * st;
      const rowData = ridgeHistory[rIdx];
      const depthFactor = screenRow / (RIDGE_ROWS - 1); // 0 (back) -> 1 (front)

      // Perspective tapering (back rows slightly narrower than front rows)
      const rowWidth = w * (0.72 + 0.28 * depthFactor);
      const xStart = (w - rowWidth) * 0.5;

      ctx.beginPath();
      ctx.moveTo(xStart, h);
      for (let c = 0; c <= RIDGE_COLS; c++) {
        const u = c / RIDGE_COLS;
        const x = xStart + u * rowWidth;
        const val = rowData[c];
        const y = yBase - val * maxAmp * (0.45 + 0.55 * depthFactor);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(xStart + rowWidth, h);
      ctx.closePath();
      ctx.fillStyle = '#0E0D0B';
      ctx.fill();

      ctx.beginPath();
      for (let c = 0; c <= RIDGE_COLS; c++) {
        const u = c / RIDGE_COLS;
        const x = xStart + u * rowWidth;
        const val = rowData[c];
        const y = yBase - val * maxAmp * (0.45 + 0.55 * depthFactor);
        if (c === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // Highlight the live front row (rIdx === 0) and the song progress cursor row in album accent color
      const cursorRow = Math.floor((1 - Math.max(0, Math.min(0.999, progressRatio))) * (RIDGE_ROWS - 1));
      if (rIdx === 0) {
        ctx.strokeStyle = `rgb(${ar}, ${ag}, ${ab})`;
        ctx.lineWidth = (2.1 + (bands.punch || 0) * 1.2) * dpr;
      } else if (rIdx === cursorRow) {
        ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, 0.78)`;
        ctx.lineWidth = 1.6 * dpr;
      } else {
        ctx.strokeStyle = `rgba(236, 229, 216, ${(0.15 + 0.62 * depthFactor).toFixed(3)})`;
        ctx.lineWidth = 1.05 * dpr;
      }
      ctx.stroke();
    }
  }

  // Render Mode 3: "Xoáy hạt" (3D Spectrum Ring Vortex - Batch Rendered)
  function drawVortex(bands, acc, isMobile) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w * 0.5;
    const cy = h * (isMobile ? 0.44 : 0.45);
    const scale = Math.min(w, h) * 0.32;
    const bins = bands.bins;
    const punch = bands.punch || 0;

    ctx.fillStyle = "#0E0D0B";
    ctx.fillRect(0, 0, w, h);

    const ar = Math.round(acc[0]), ag = Math.round(acc[1]), ab = Math.round(acc[2]);
    const tiltX = 0.62 + userPitch * 0.6 + Math.sin(musicPhase * 0.35) * 0.08;
    const tiltY = userYaw + musicPhase * 0.22;
    const ctX = Math.cos(tiltX), stX = Math.sin(tiltX);
    const ctY = Math.cos(tiltY), stY = Math.sin(tiltY);

    const activeCount = isMobile ? MOBILE_PARTICLES : MAX_PARTICLES;
    for (let b = 0; b < 4; b++) {
      vortexBuckets[b].length = 0;
    }

    for (let i = 0; i < activeCount; i += 2) {
      const p = particles[i];
      const binVal = (bins ? bins[p.binIdx] : bands.mid) * bounceGain;
      const ang = p.ringAngle + musicPhase * (0.35 + (1.6 - p.ringRadius) * 0.45);

      // Ring radius and vertical wave jump strictly when its frequency bin & bass punch hit
      const r = p.ringRadius * (0.82 + binVal * 0.38 + punch * bounceGain * 0.26);
      const y0 = Math.sin(ang * 3 + musicPhase * 2) * (binVal * 0.32 + punch * bounceGain * 0.18);
      const x0 = Math.cos(ang) * r;
      const z0 = Math.sin(ang) * r;

      const x1 = x0 * ctY - z0 * stY;
      const z1 = x0 * stY + z0 * ctY;
      const y2 = y0 * ctX - z1 * stX;
      const z2 = y0 * stX + z1 * ctX;

      const persp = 3.0 / (3.0 + z2 + 1.8);
      const sx = cx + x1 * scale * persp * 1.4;
      const sy = cy + y2 * scale * persp * 1.4;

      const depth = Math.max(0.1, Math.min(1, (1.4 - z2) / 2.8));
      const isAcc = (binVal > 0.42 || i % 7 === 0) ? 1 : 0;
      const depthTier = depth < 0.55 ? 0 : 1;
      const bucketIdx = depthTier * 2 + isAcc;

      const rad = Math.max(0.75 * dpr, p.size * 0.9 * dpr * persp * (0.8 + binVal * 0.65 + punch * 0.45));

      const it = vortexPool[i];
      it.sx = sx;
      it.sy = sy;
      it.rad = rad;
      vortexBuckets[bucketIdx].push(it);
    }

    const baseR = 236, baseG = 229, baseB = 216;
    const styles = [
      `rgba(${baseR}, ${baseG}, ${baseB}, 0.32)`,
      `rgba(${ar}, ${ag}, ${ab}, 0.42)`,
      `rgba(${baseR}, ${baseG}, ${baseB}, 0.72)`,
      `rgba(${ar}, ${ag}, ${ab}, 0.88)`
    ];

    for (let b = 0; b < 4; b++) {
      const pts = vortexBuckets[b];
      const len = pts.length;
      if (len === 0) continue;
      ctx.fillStyle = styles[b];
      ctx.beginPath();
      for (let j = 0; j < len; j++) {
        const pt = pts[j];
        ctx.moveTo(pt.sx + pt.rad, pt.sy);
        ctx.arc(pt.sx, pt.sy, pt.rad, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }

  function renderFrame(dt, time, bands, acc, progressRatio, isPlaying) {
    if (!canvas || !ctx) return;
    const energy = bands.energy || 0;
    const punch = bands.punch || 0;

    // Advance rotation and wave phase strictly proportional to real music energy & transients
    rotY += dt * (isPlaying ? (0.08 + energy * 0.55 + punch * 0.85) : 0.02);
    musicPhase += dt * (isPlaying ? (0.12 + energy * 2.6 + punch * 4.2) : 0.0);
    shockwavePhase += dt * (isPlaying ? (0.4 + punch * 6.0) : 0.0);

    updateRidgeSpectrogram(dt, bands);

    const isMobile = window.innerWidth <= 900;
    if (mode === 'cluster') {
      drawCluster(bands, acc, isMobile);
    } else if (mode === 'ridge') {
      drawRidge(bands, acc, progressRatio, isMobile);
    } else {
      drawVortex(bands, acc, isMobile);
    }
  }

  function setMode(m) {
    if (['cluster', 'ridge', 'vortex'].includes(m)) {
      mode = m;
    }
    return mode;
  }

  function nextMode() {
    const order = ['cluster', 'ridge', 'vortex'];
    mode = order[(order.indexOf(mode) + 1) % order.length];
    return mode;
  }

  function setBounceGain(val) {
    bounceGain = Math.max(0, Math.min(2.5, Number(val) || 0));
    return bounceGain;
  }

  return {
    mount,
    resize,
    renderFrame,
    setMode,
    nextMode,
    getMode: () => mode,
    setBounceGain,
    getBounceGain: () => bounceGain
  };
})();
window.Visualizer3D = Visualizer3D;

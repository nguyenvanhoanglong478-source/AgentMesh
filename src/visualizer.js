// ===== VANG 3D AUDIO VISUALIZER =====
// Mode 1 ('cluster'): "Khối đốm hạt" — 3D Particle Cluster Sculpture (2,800 glowing organic particles arranged on a golden-spiral 3D sphere + inner core, deformed in 3D space by Bass/Mid/High frequencies with depth-of-field bokeh, core filaments, and interactive orbit).
// Mode 2 ('ridge'): "Địa hình" — 3D Topographic Frequency Ridgelines (36 stacked horizon lines with active time-cursor ridge in album accent color).
// Mode 3 ('vortex'): "Xoáy hạt" — Orbital Harmonic Ring Field (particles orbiting in 3D toroidal rings that tilt and pulse with the music).

const Visualizer3D = (function () {
  let canvas = null;
  let ctx = null;
  let mode = 'cluster'; // 'cluster' | 'ridge' | 'vortex'
  let width = 0;
  let height = 0;
  let dpr = 1;

  // Interactive camera rotation (drag stage to rotate the 3D particle cluster)
  let rotY = 0;
  let rotX = 0.22;
  let userYaw = 0;
  let userPitch = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  // Precomputed 3D particle nodes for "Khối đốm hạt" (Fibonacci sphere + inner shells)
  const NUM_PARTICLES = 2400;
  const particles = [];

  function initParticles() {
    particles.length = 0;
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const t = i / (NUM_PARTICLES - 1);
      const y = 1 - t * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;

      // 3 shells: outer surface (72%), mid-cluster (20%), dense core (8%)
      const shellRoll = (i * 2654435761) % 100;
      const shell = shellRoll < 72 ? 1.0 : shellRoll < 92 ? 0.68 : 0.36;
      const baseSize = shell === 1.0 ? 1.55 + (i % 5) * 0.32 : shell === 0.68 ? 1.2 : 2.1;

      particles.push({
        bx: Math.cos(theta) * r,
        by: y,
        bz: Math.sin(theta) * r,
        shell,
        seed: (i * 0.137) % (Math.PI * 2),
        size: baseSize,
        ringAngle: (i / NUM_PARTICLES) * Math.PI * 2 * 12,
        ringRadius: 0.45 + (i / NUM_PARTICLES) * 1.15
      });
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
    el.addEventListener('pointerdown', e => {
      if (e.target.closest('button, input, a')) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      userYaw += dx * 0.006;
      userPitch = Math.max(-0.85, Math.min(0.85, userPitch + dy * 0.006));
    });
    window.addEventListener('pointerup', () => {
      dragging = false;
    });
  }

  function resize() {
    if (!canvas || !canvas.parentElement) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    width = canvas.parentElement.clientWidth || 800;
    height = canvas.parentElement.clientHeight || 600;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }

  // Smooth 3D harmonic field displacement (simulates 3D simplex noise cleanly at 60fps)
  function displace3D(x, y, z, t, bass, mid, high) {
    const n1 = Math.sin(x * 2.7 + t * 1.4) * Math.cos(y * 2.5 - t * 1.1) * Math.sin(z * 2.9 + t * 0.9);
    const n2 = Math.sin(x * 5.3 - t * 2.2 + y * 3.1) * Math.cos(z * 4.8 + t * 1.9);
    const ripple = Math.sin((x * x + y * y) * 11.0 - t * 5.5) * high * 0.14;
    return 1.0 + bass * 0.24 + n1 * (0.22 + mid * 0.48) + n2 * (0.08 + high * 0.22) + ripple;
  }

  // Render Mode 1: "Khối đốm hạt" (3D Particle Cluster Sculpture)
  function drawCluster(time, bands, acc, isMobile) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w * 0.5;
    const cy = h * (isMobile ? 0.44 : 0.45);
    const scale = Math.min(w, h) * (isMobile ? 0.31 : 0.30);

    // Clear with deep warm ink + subtle radial ambient glow
    ctx.fillStyle = '#0E0D0B';
    ctx.fillRect(0, 0, w, h);

    const glowR = scale * (1.55 + bands.bass * 0.45);
    const grad = ctx.createRadialGradient(cx, cy, scale * 0.05, cx, cy, glowR);
    grad.addColorStop(0, `rgba(${Math.round(acc[0])}, ${Math.round(acc[1])}, ${Math.round(acc[2])}, ${0.18 + bands.bass * 0.16})`);
    grad.addColorStop(0.55, `rgba(${Math.round(acc[0])}, ${Math.round(acc[1])}, ${Math.round(acc[2])}, 0.04)`);
    grad.addColorStop(1, 'rgba(14, 13, 11, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const yaw = rotY + userYaw;
    const pitch = rotX + userPitch + Math.sin(time * 0.35) * 0.12;
    const cyaw = Math.cos(yaw), syaw = Math.sin(yaw);
    const cpitch = Math.cos(pitch), spitch = Math.sin(pitch);

    const fov = 3.2;
    const ar = Math.round(acc[0]), ag = Math.round(acc[1]), ab = Math.round(acc[2]);

    // Project all particles and bucket by depth so back-to-front rendering is fast
    const projected = new Array(NUM_PARTICLES);
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const p = particles[i];
      const disp = displace3D(p.bx, p.by, p.bz, time, bands.bass, bands.mid, bands.high);
      const rad = p.shell * disp;

      // Subtle tangential swirl on high frequencies
      const swirl = bands.high * 0.08 * Math.sin(time * 3 + p.seed);
      const px = p.bx * rad - p.bz * swirl;
      const py = p.by * rad;
      const pz = p.bz * rad + p.bx * swirl;

      // Rotate around Y then X
      const x1 = px * cyaw - pz * syaw;
      const z1 = px * syaw + pz * cyaw;
      const y2 = py * cpitch - z1 * spitch;
      const z2 = py * spitch + z1 * cpitch;

      const persp = fov / (fov + z2 + 1.85);
      const sx = cx + x1 * scale * persp * 1.45;
      const sy = cy + y2 * scale * persp * 1.45;

      projected[i] = {
        sx,
        sy,
        z: z2,
        persp,
        disp,
        size: p.size,
        shell: p.shell,
        seed: p.seed
      };
    }

    // Sort back-to-front (largest z is furthest away)
    projected.sort((a, b) => b.z - a.z);

    // Draw particles with depth-of-field bokeh and rim-light coloring
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const pt = projected[i];
      // Normalized depth: 0 (back) -> 1 (front)
      const depthNorm = Math.max(0, Math.min(1, (1.3 - pt.z) / 2.6));
      const peakFactor = Math.max(0, Math.min(1, (pt.disp - 0.92) * 1.85));

      // Color blend between warm paper (#ECE5D8) and album accent color on crests & front rim
      const mix = Math.min(1, peakFactor * 0.85 + (pt.shell < 0.5 ? 0.65 : 0) + bands.bass * 0.25);
      const r = Math.round(236 * (1 - mix) + ar * mix);
      const g = Math.round(229 * (1 - mix) + ag * mix);
      const b = Math.round(216 * (1 - mix) + ab * mix);

      const alpha = (0.14 + Math.pow(depthNorm, 1.45) * 0.78) * (pt.shell === 1.0 ? 1.0 : 0.72);
      const radius = (pt.size * dpr * pt.persp * (0.85 + bands.bass * 0.45 + peakFactor * 0.35));

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(pt.sx, pt.sy, Math.max(0.7 * dpr, radius), 0, Math.PI * 2);
      ctx.fill();

      // Soft outer halo on bright front crest particles
      if (depthNorm > 0.76 && peakFactor > 0.52 && (i % 6 === 0)) {
        ctx.fillStyle = `rgba(${ar}, ${ag}, ${ab}, ${(alpha * 0.22).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(pt.sx, pt.sy, radius * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Render Mode 2: "Địa hình" (Topographic Ridgelines)
  function drawRidge(time, bands, acc, progressRatio, isMobile) {
    const w = canvas.width;
    const h = canvas.height;
    const N = 34;
    const top = h * 0.14;
    const bot = h * (isMobile ? 0.76 : 0.68);
    const st = (bot - top) / N;
    const active = Math.floor(Math.max(0, Math.min(0.999, progressRatio)) * N);

    ctx.fillStyle = '#0E0D0B';
    ctx.fillRect(0, 0, w, h);

    for (let k = 0; k < N; k++) {
      const y0 = top + k * st;
      const pts = [];
      for (let x = 0; x <= w; x += 4 * dpr) {
        const u = x / w;
        const env = Math.exp(-Math.pow((u - 0.5) / 0.19, 2));
        const n =
          Math.sin(u * 23 + k * 1.7 + time * 1.3) * 0.5 +
          Math.sin(u * 51 - k * 0.9 + time * 2.1) * 0.3 +
          Math.sin(u * 9 + k * 0.4 - time * 0.6) * 0.6;
        const amp = env * (16 + bands.bass * 62 * (0.5 + 0.5 * Math.sin(k * 0.8 + time)) + bands.mid * 28) * (h / 560);
        const y = y0 - Math.max(0, n * 0.5 + 0.6) * amp - env * bands.high * 5.5 * dpr * Math.sin(u * 120 + time * 8);
        pts.push([x, y]);
      }

      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let j = 0; j < pts.length; j++) ctx.lineTo(pts[j][0], pts[j][1]);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = '#0E0D0B';
      ctx.fill();

      ctx.beginPath();
      for (let j = 0; j < pts.length; j++) {
        if (j === 0) ctx.moveTo(pts[j][0], pts[j][1]);
        else ctx.lineTo(pts[j][0], pts[j][1]);
      }
      if (k === active) {
        ctx.strokeStyle = `rgb(${Math.round(acc[0])}, ${Math.round(acc[1])}, ${Math.round(acc[2])})`;
        ctx.lineWidth = 2.0 * dpr;
      } else {
        ctx.strokeStyle = `rgba(236, 229, 216, ${(0.20 + 0.58 * (k / N)).toFixed(3)})`;
        ctx.lineWidth = 1.1 * dpr;
      }
      ctx.stroke();
    }
  }

  // Render Mode 3: "Xoáy hạt" (3D Orbital Harmonic Vortex)
  function drawVortex(time, bands, acc, isMobile) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w * 0.5;
    const cy = h * (isMobile ? 0.44 : 0.45);
    const scale = Math.min(w, h) * 0.32;

    ctx.fillStyle = '#0E0D0B';
    ctx.fillRect(0, 0, w, h);

    const ar = Math.round(acc[0]), ag = Math.round(acc[1]), ab = Math.round(acc[2]);
    const tiltX = 0.62 + userPitch * 0.6 + Math.sin(time * 0.4) * 0.12;
    const tiltY = userYaw + time * 0.18;
    const ctX = Math.cos(tiltX), stX = Math.sin(tiltX);
    const ctY = Math.cos(tiltY), stY = Math.sin(tiltY);

    for (let i = 0; i < NUM_PARTICLES; i += 2) {
      const p = particles[i];
      const ang = p.ringAngle + time * (0.45 + (1.6 - p.ringRadius) * 0.35);
      const wave = Math.sin(ang * 3 + time * 2.2) * (0.06 + bands.mid * 0.18);
      const r = p.ringRadius * (0.85 + bands.bass * 0.25);

      const x0 = Math.cos(ang) * r;
      const z0 = Math.sin(ang) * r;
      const y0 = wave + Math.cos(ang * 5 - time * 3) * bands.high * 0.12;

      const x1 = x0 * ctY - z0 * stY;
      const z1 = x0 * stY + z0 * ctY;
      const y2 = y0 * ctX - z1 * stX;
      const z2 = y0 * stX + z1 * ctX;

      const persp = 3.0 / (3.0 + z2 + 1.8);
      const sx = cx + x1 * scale * persp * 1.4;
      const sy = cy + y2 * scale * persp * 1.4;

      const depth = Math.max(0.1, Math.min(1, (1.4 - z2) / 2.8));
      const isAcc = (i % 7 === 0);
      ctx.fillStyle = isAcc
        ? `rgba(${ar}, ${ag}, ${ab}, ${(depth * 0.9).toFixed(3)})`
        : `rgba(236, 229, 216, ${(depth * 0.65).toFixed(3)})`;

      const rad = Math.max(0.8 * dpr, p.size * 0.9 * dpr * persp * (0.9 + bands.bass * 0.4));
      ctx.beginPath();
      ctx.arc(sx, sy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function renderFrame(dt, time, bands, acc, progressRatio, isPlaying) {
    if (!canvas || !ctx) return;
    rotY += dt * (isPlaying ? 0.26 + bands.bass * 0.18 : 0.07);
    const isMobile = window.innerWidth <= 900;

    if (mode === 'cluster') {
      drawCluster(time, bands, acc, isMobile);
    } else if (mode === 'ridge') {
      drawRidge(time, bands, acc, progressRatio, isMobile);
    } else {
      drawVortex(time, bands, acc, isMobile);
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

  return {
    mount,
    resize,
    renderFrame,
    setMode,
    nextMode,
    getMode: () => mode
  };
})();

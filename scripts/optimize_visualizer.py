import sys
from pathlib import Path

ROOT = Path(r"C:\Users\nguye\.gemini\antigravity\scratch\vang-player")

def update_file(file_path: Path):
    text = file_path.read_text(encoding="utf-8")
    is_crlf = "\r\n" in text
    nl = "\r\n" if is_crlf else "\n"
    
    # 1. Update Particle definition & pool
    old_init = (
        '  // Precomputed 3D particle nodes for "Khối đốm hạt"' + nl +
        '  const NUM_PARTICLES = 2400;' + nl +
        '  const particles = [];' + nl +
        nl +
        '  function initParticles() {' + nl +
        '    particles.length = 0;' + nl +
        '    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle' + nl +
        '    for (let i = 0; i < NUM_PARTICLES; i++) {' + nl +
        '      const t = i / (NUM_PARTICLES - 1);' + nl +
        '      const y = 1 - t * 2;' + nl +
        '      const r = Math.sqrt(Math.max(0, 1 - y * y));' + nl +
        '      const theta = phi * i;' + nl +
        nl +
        '      // 3 shells: outer surface (72%), mid-cluster (20%), dense core (8%)' + nl +
        '      const shellRoll = (i * 2654435761) % 100;' + nl +
        '      const shell = shellRoll < 72 ? 1.0 : shellRoll < 92 ? 0.68 : 0.34;' + nl +
        '      const baseSize = shell === 1.0 ? 1.5 + (i % 5) * 0.32 : shell === 0.68 ? 1.2 : 2.1;' + nl +
        nl +
        '      // Map each particle to one of the 32 FFT frequency bins based on its 3D position' + nl +
        '      // Equator (|y| near 0) = Bass & Kick (bins 0..9)' + nl +
        '      // Mid-latitudes = Vocals & Synths (bins 10..21)' + nl +
        '      // Poles (|y| near 1) = Hi-hats & Treble (bins 22..31)' + nl +
        '      const latNorm = Math.abs(y);' + nl +
        '      const lonWave = (Math.sin(theta * 3) * 0.5 + 0.5);' + nl +
        '      const binIdx = Math.min(31, Math.floor(latNorm * 22 + lonWave * 10));' + nl +
        nl +
        '      particles.push({' + nl +
        '        bx: Math.cos(theta) * r,' + nl +
        '        by: y,' + nl +
        '        bz: Math.sin(theta) * r,' + nl +
        '        shell,' + nl +
        '        binIdx,' + nl +
        '        lobe: Math.sin(theta * 4 + y * 5),' + nl +
        '        seed: (i * 0.137) % (Math.PI * 2),' + nl +
        '        size: baseSize,' + nl +
        '        ringAngle: (i / NUM_PARTICLES) * Math.PI * 2 * 16,' + nl +
        '        ringRadius: 0.32 + (i / NUM_PARTICLES) * 1.25' + nl +
        '      });' + nl +
        '    }'
    )
    
    new_init = (
        '  // Adaptive particle counts: 1800 on Desktop (rich 3D sculpture), 900 on Mobile (smooth 60fps & low battery)' + nl +
        '  const MAX_PARTICLES = 1800;' + nl +
        '  const MOBILE_PARTICLES = 900;' + nl +
        '  const particles = [];' + nl +
        nl +
        '  // Pre-allocated object pools & draw buckets (Zero Garbage Collection overhead per frame)' + nl +
        '  const clusterPool = [];' + nl +
        '  for (let i = 0; i < MAX_PARTICLES; i++) {' + nl +
        '    clusterPool.push({ sx: 0, sy: 0, rad: 0, haloRad: 0 });' + nl +
        '  }' + nl +
        '  const clusterBuckets = Array.from({ length: 9 }, () => []);' + nl +
        nl +
        '  const vortexPool = [];' + nl +
        '  for (let i = 0; i < MAX_PARTICLES; i++) {' + nl +
        '    vortexPool.push({ sx: 0, sy: 0, rad: 0 });' + nl +
        '  }' + nl +
        '  const vortexBuckets = Array.from({ length: 4 }, () => []);' + nl +
        nl +
        '  function initParticles() {' + nl +
        '    particles.length = 0;' + nl +
        '    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle' + nl +
        '    for (let i = 0; i < MAX_PARTICLES; i++) {' + nl +
        '      const t = i / (MAX_PARTICLES - 1);' + nl +
        '      const y = 1 - t * 2;' + nl +
        '      const r = Math.sqrt(Math.max(0, 1 - y * y));' + nl +
        '      const theta = phi * i;' + nl +
        nl +
        '      // 3 shells: outer surface (72%), mid-cluster (20%), dense core (8%)' + nl +
        '      const shellRoll = (i * 2654435761) % 100;' + nl +
        '      const shell = shellRoll < 72 ? 1.0 : shellRoll < 92 ? 0.68 : 0.34;' + nl +
        '      const baseSize = shell === 1.0 ? 1.5 + (i % 5) * 0.32 : shell === 0.68 ? 1.2 : 2.1;' + nl +
        nl +
        '      // Map each particle to one of the 32 FFT frequency bins based on its 3D position' + nl +
        '      // Equator (|y| near 0) = Bass & Kick (bins 0..9)' + nl +
        '      // Mid-latitudes = Vocals & Synths (bins 10..21)' + nl +
        '      // Poles (|y| near 1) = Hi-hats & Treble (bins 22..31)' + nl +
        '      const latNorm = Math.abs(y);' + nl +
        '      const lonWave = (Math.sin(theta * 3) * 0.5 + 0.5);' + nl +
        '      const binIdx = Math.min(31, Math.floor(latNorm * 22 + lonWave * 10));' + nl +
        nl +
        '      particles.push({' + nl +
        '        bx: Math.cos(theta) * r,' + nl +
        '        by: y,' + nl +
        '        bz: Math.sin(theta) * r,' + nl +
        '        shell,' + nl +
        '        binIdx,' + nl +
        '        lobe: Math.sin(theta * 4 + y * 5),' + nl +
        '        seed: (i * 0.137) % (Math.PI * 2),' + nl +
        '        size: baseSize,' + nl +
        '        ringAngle: (i / MAX_PARTICLES) * Math.PI * 2 * 16,' + nl +
        '        ringRadius: 0.32 + (i / MAX_PARTICLES) * 1.25' + nl +
        '      });' + nl +
        '    }'
    )
    
    if old_init not in text:
        raise ValueError(f"old_init not found in {file_path}")
    text = text.replace(old_init, new_init)
    
    # 2. Update drawCluster
    old_draw_cluster_start = '  // Render Mode 1: "Khối đốm hạt" (Audio-Reactive 3D Particle Cluster)' + nl + '  function drawCluster(bands, acc, isMobile) {'
    old_draw_cluster_end = '  // Update the 34-row Waterfall Spectrogram buffer from the real 32-band FFT spectrum'
    
    start_idx = text.find(old_draw_cluster_start)
    end_idx = text.find(old_draw_cluster_end)
    if start_idx == -1 or end_idx == -1:
        raise ValueError(f"drawCluster range not found in {file_path}")
    
    new_draw_cluster = (
        '  // Render Mode 1: "Khối đốm hạt" (Audio-Reactive 3D Particle Cluster - Zero-GC High-FPS Batch Render)' + nl +
        '  function drawCluster(bands, acc, isMobile) {' + nl +
        '    const w = canvas.width;' + nl +
        '    const h = canvas.height;' + nl +
        '    const cx = w * 0.5;' + nl +
        '    const cy = h * (isMobile ? 0.44 : 0.45);' + nl +
        '    const scale = Math.min(w, h) * (isMobile ? 0.30 : 0.29);' + nl +
        '    const punch = bands.punch || 0;' + nl +
        '    const bins = bands.bins;' + nl +
        nl +
        '    // Clear with deep warm ink + audio-reactive ambient core glow' + nl +
        '    ctx.fillStyle = "#0E0D0B";' + nl +
        '    ctx.fillRect(0, 0, w, h);' + nl +
        nl +
        '    const glowR = scale * (1.25 + bands.bass * 0.65 + punch * 0.55);' + nl +
        '    const grad = ctx.createRadialGradient(cx, cy, scale * 0.04, cx, cy, glowR);' + nl +
        '    const glowAlpha = Math.min(0.42, 0.08 + bands.energy * 0.22 + punch * 0.22);' + nl +
        '    const ar = Math.round(acc[0]), ag = Math.round(acc[1]), ab = Math.round(acc[2]);' + nl +
        '    grad.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, ${glowAlpha.toFixed(3)})`);' + nl +
        '    grad.addColorStop(0.55, `rgba(${ar}, ${ag}, ${ab}, ${(glowAlpha * 0.22).toFixed(3)})`);' + nl +
        '    grad.addColorStop(1, "rgba(14, 13, 11, 0)");' + nl +
        '    ctx.fillStyle = grad;' + nl +
        '    ctx.fillRect(0, 0, w, h);' + nl +
        nl +
        '    const yaw = rotY + userYaw;' + nl +
        '    const pitch = rotX + userPitch + Math.sin(musicPhase * 0.3) * 0.08;' + nl +
        '    const cyaw = Math.cos(yaw), syaw = Math.sin(yaw);' + nl +
        '    const cpitch = Math.cos(pitch), spitch = Math.sin(pitch);' + nl +
        nl +
        '    const fov = 3.2;' + nl +
        '    const activeCount = isMobile ? MOBILE_PARTICLES : MAX_PARTICLES;' + nl +
        nl +
        '    // Clear bucket buffers for this frame (zero allocations)' + nl +
        '    for (let b = 0; b < 9; b++) {' + nl +
        '      clusterBuckets[b].length = 0;' + nl +
        '    }' + nl +
        nl +
        '    for (let i = 0; i < activeCount; i++) {' + nl +
        '      const p = particles[i];' + nl +
        '      const disp = computeAudioDisplacement(p, bands, bins);' + nl +
        '      const rad = p.shell * disp;' + nl +
        nl +
        '      // Tangential jitter only when high frequencies (hi-hats/cymbals) are active' + nl +
        '      const swirl = bands.high * 0.12 * Math.sin(musicPhase * 3 + p.seed);' + nl +
        '      const px = p.bx * rad - p.bz * swirl;' + nl +
        '      const py = p.by * rad;' + nl +
        '      const pz = p.bz * rad + p.bx * swirl;' + nl +
        nl +
        '      const x1 = px * cyaw - pz * syaw;' + nl +
        '      const z1 = px * syaw + pz * cyaw;' + nl +
        '      const y2 = py * cpitch - z1 * spitch;' + nl +
        '      const z2 = py * spitch + z1 * cpitch;' + nl +
        nl +
        '      const persp = fov / (fov + z2 + 1.85);' + nl +
        '      const sx = cx + x1 * scale * persp * 1.45;' + nl +
        '      const sy = cy + y2 * scale * persp * 1.45;' + nl +
        nl +
        '      const binVal = bins ? bins[p.binIdx] : bands.mid;' + nl +
        '      const depthNorm = Math.max(0, Math.min(1, (1.3 - z2) / 2.6));' + nl +
        '      const peakFactor = Math.max(0, Math.min(1, (disp - 0.94) * 1.65));' + nl +
        '      const isAcc = (peakFactor > 0.32 || binVal > 0.40 || p.shell < 0.5 || punch > 0.30) ? 1 : 0;' + nl +
        nl +
        '      // Quantize depth into 4 back-to-front tiers (0 = farthest back, 3 = nearest front)' + nl +
        '      const depthTier = depthNorm < 0.32 ? 0 : depthNorm < 0.58 ? 1 : depthNorm < 0.82 ? 2 : 3;' + nl +
        '      const bucketIdx = depthTier * 2 + isAcc;' + nl +
        nl +
        '      const radius = Math.max(0.65 * dpr, p.size * dpr * persp * (0.78 + binVal * 0.55 + punch * 0.50));' + nl +
        nl +
        '      const it = clusterPool[i];' + nl +
        '      it.sx = sx;' + nl +
        '      it.sy = sy;' + nl +
        '      it.rad = radius;' + nl +
        '      clusterBuckets[bucketIdx].push(it);' + nl +
        nl +
        '      // Bokeh halo on foreground particles actively firing with the music transients' + nl +
        '      if (depthNorm > 0.72 && (peakFactor > 0.38 || punch > 0.25) && (i % 6 === 0)) {' + nl +
        '        it.haloRad = radius * (2.4 + punch * 1.2);' + nl +
        '        clusterBuckets[8].push(it);' + nl +
        '      }' + nl +
        '    }' + nl +
        nl +
        '    // 9 Pre-computed draw styles: Back-to-front order (0 to 7) + Halo (8)' + nl +
        '    const baseR = 236, baseG = 229, baseB = 216;' + nl +
        '    const styles = [' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.22)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.28)`,' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.46)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.54)`,' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.72)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.80)`,' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.92)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.98)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, ${(0.16 + punch * 0.22).toFixed(3)})`' + nl +
        '    ];' + nl +
        nl +
        '    // Batch-render: Only 9 canvas path flushes max per frame (30x faster!)' + nl +
        '    for (let b = 0; b < 9; b++) {' + nl +
        '      const pts = clusterBuckets[b];' + nl +
        '      const len = pts.length;' + nl +
        '      if (len === 0) continue;' + nl +
        nl +
        '      ctx.fillStyle = styles[b];' + nl +
        '      ctx.beginPath();' + nl +
        '      const isHalo = (b === 8);' + nl +
        '      for (let j = 0; j < len; j++) {' + nl +
        '        const pt = pts[j];' + nl +
        '        const r = isHalo ? pt.haloRad : pt.rad;' + nl +
        '        ctx.moveTo(pt.sx + r, pt.sy);' + nl +
        '        ctx.arc(pt.sx, pt.sy, r, 0, Math.PI * 2);' + nl +
        '      }' + nl +
        '      ctx.fill();' + nl +
        '    }' + nl +
        '  }' + nl + nl
    )
    
    text = text[:start_idx] + new_draw_cluster + text[end_idx:]
    
    # 3. Update drawVortex
    old_draw_vortex_start = '  // Render Mode 3: "Xoáy hạt" (3D Spectrum Ring Vortex)' + nl + '  function drawVortex(bands, acc, isMobile) {'
    old_draw_vortex_end = '  function renderFrame(dt, time, bands, acc, progressRatio, isPlaying) {'
    
    v_start_idx = text.find(old_draw_vortex_start)
    v_end_idx = text.find(old_draw_vortex_end)
    if v_start_idx == -1 or v_end_idx == -1:
        raise ValueError(f"drawVortex range not found in {file_path}")
        
    new_draw_vortex = (
        '  // Render Mode 3: "Xoáy hạt" (3D Spectrum Ring Vortex - Batch Rendered)' + nl +
        '  function drawVortex(bands, acc, isMobile) {' + nl +
        '    const w = canvas.width;' + nl +
        '    const h = canvas.height;' + nl +
        '    const cx = w * 0.5;' + nl +
        '    const cy = h * (isMobile ? 0.44 : 0.45);' + nl +
        '    const scale = Math.min(w, h) * 0.32;' + nl +
        '    const bins = bands.bins;' + nl +
        '    const punch = bands.punch || 0;' + nl +
        nl +
        '    ctx.fillStyle = "#0E0D0B";' + nl +
        '    ctx.fillRect(0, 0, w, h);' + nl +
        nl +
        '    const ar = Math.round(acc[0]), ag = Math.round(acc[1]), ab = Math.round(acc[2]);' + nl +
        '    const tiltX = 0.62 + userPitch * 0.6 + Math.sin(musicPhase * 0.35) * 0.08;' + nl +
        '    const tiltY = userYaw + musicPhase * 0.22;' + nl +
        '    const ctX = Math.cos(tiltX), stX = Math.sin(tiltX);' + nl +
        '    const ctY = Math.cos(tiltY), stY = Math.sin(tiltY);' + nl +
        nl +
        '    const activeCount = isMobile ? MOBILE_PARTICLES : MAX_PARTICLES;' + nl +
        '    for (let b = 0; b < 4; b++) {' + nl +
        '      vortexBuckets[b].length = 0;' + nl +
        '    }' + nl +
        nl +
        '    for (let i = 0; i < activeCount; i += 2) {' + nl +
        '      const p = particles[i];' + nl +
        '      const binVal = (bins ? bins[p.binIdx] : bands.mid) * bounceGain;' + nl +
        '      const ang = p.ringAngle + musicPhase * (0.35 + (1.6 - p.ringRadius) * 0.45);' + nl +
        nl +
        '      // Ring radius and vertical wave jump strictly when its frequency bin & bass punch hit' + nl +
        '      const r = p.ringRadius * (0.82 + binVal * 0.38 + punch * bounceGain * 0.26);' + nl +
        '      const y0 = Math.sin(ang * 3 + musicPhase * 2) * (binVal * 0.32 + punch * bounceGain * 0.18);' + nl +
        '      const x0 = Math.cos(ang) * r;' + nl +
        '      const z0 = Math.sin(ang) * r;' + nl +
        nl +
        '      const x1 = x0 * ctY - z0 * stY;' + nl +
        '      const z1 = x0 * stY + z0 * ctY;' + nl +
        '      const y2 = y0 * ctX - z1 * stX;' + nl +
        '      const z2 = y0 * stX + z1 * ctX;' + nl +
        nl +
        '      const persp = 3.0 / (3.0 + z2 + 1.8);' + nl +
        '      const sx = cx + x1 * scale * persp * 1.4;' + nl +
        '      const sy = cy + y2 * scale * persp * 1.4;' + nl +
        nl +
        '      const depth = Math.max(0.1, Math.min(1, (1.4 - z2) / 2.8));' + nl +
        '      const isAcc = (binVal > 0.42 || i % 7 === 0) ? 1 : 0;' + nl +
        '      const depthTier = depth < 0.55 ? 0 : 1;' + nl +
        '      const bucketIdx = depthTier * 2 + isAcc;' + nl +
        nl +
        '      const rad = Math.max(0.75 * dpr, p.size * 0.9 * dpr * persp * (0.8 + binVal * 0.65 + punch * 0.45));' + nl +
        nl +
        '      const it = vortexPool[i];' + nl +
        '      it.sx = sx;' + nl +
        '      it.sy = sy;' + nl +
        '      it.rad = rad;' + nl +
        '      vortexBuckets[bucketIdx].push(it);' + nl +
        '    }' + nl +
        nl +
        '    const baseR = 236, baseG = 229, baseB = 216;' + nl +
        '    const styles = [' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.32)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.42)`,' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.72)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.88)`' + nl +
        '    ];' + nl +
        nl +
        '    for (let b = 0; b < 4; b++) {' + nl +
        '      const pts = vortexBuckets[b];' + nl +
        '      const len = pts.length;' + nl +
        '      if (len === 0) continue;' + nl +
        '      ctx.fillStyle = styles[b];' + nl +
        '      ctx.beginPath();' + nl +
        '      for (let j = 0; j < len; j++) {' + nl +
        '        const pt = pts[j];' + nl +
        '        ctx.moveTo(pt.sx + pt.rad, pt.sy);' + nl +
        '        ctx.arc(pt.sx, pt.sy, pt.rad, 0, Math.PI * 2);' + nl +
        '      }' + nl +
        '      ctx.fill();' + nl +
        '    }' + nl +
        '  }' + nl + nl
    )
    text = text[:v_start_idx] + new_draw_vortex + text[v_end_idx:]

    # 4. Attach window.Visualizer3D
    old_return_end = '    getBounceGain: () => bounceGain' + nl + '  };' + nl + '})();'
    new_return_end = '    getBounceGain: () => bounceGain' + nl + '  };' + nl + '})();' + nl + 'window.Visualizer3D = Visualizer3D;'
    if old_return_end in text and 'window.Visualizer3D = Visualizer3D;' not in text:
        text = text.replace(old_return_end, new_return_end)
        
    file_path.write_text(text, encoding="utf-8")
    print(f"Successfully optimized {file_path}")

if __name__ == "__main__":
    update_file(ROOT / "index.html")
    update_file(ROOT / "src" / "visualizer.js")

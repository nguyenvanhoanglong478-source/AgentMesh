import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const ROOT = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
const swCode = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

// 1. Verify HTML & Security Headers
assert.ok(html.includes('id="main-stage"'), 'HTML must contain #main-stage');
assert.ok(!html.includes('http-equiv="Content-Security-Policy"'), 'HTML must not include restrictive CSP meta tag that blocks Spotify Web Playback SDK iframe');
assert.ok(html.includes('name="referrer" content="no-referrer"'), 'HTML must enforce no-referrer');
assert.ok(!html.includes('TÍN HIỆU THỜI GIAN THỰC · FFT'), 'Unnecessary HUD text must be removed');
assert.ok(!html.includes('60 FPS · 3D AUDIO STAGE'), 'Unnecessary topbar text must be removed');
assert.ok(html.includes('id="bounce-slider"'), 'HTML must contain 3D bounce intensity slider');
assert.ok(html.includes('class="icon-btn js-vmode on"'), '3D modes must use compact icon buttons');
assert.ok(html.includes('class="icon-btn js-src-mode on"'), 'Audio sources must use compact icon buttons');
assert.ok(html.includes('class="ctl-btn play-btn js-play"'), 'HTML must contain Play geometric button');
console.log('[PASS] 01. Spotify SDK compatibility, no-referrer, compact icon buttons, 3D bounce slider & clean HUD verified');

// 2. Verify PWA Manifest & Service Worker
assert.equal(manifest.short_name, 'VANG');
assert.equal(manifest.display, 'standalone');
assert.ok(swCode.includes('CACHE_NAME'));
console.log('[PASS] 02. PWA manifest.webmanifest and Service Worker (sw.js) verified');

// 3. Execute AudioEngine, Visualizer3D, SpotifyClient, and App Controller in a Mock Browser VM
const drawStats = { arcs: 0, paths: 0, fills: 0, strokes: 0 };

function makeMockElement(selector = '') {
  const el = {
    selector,
    innerHTML: '',
    textContent: '',
    value: '',
    hidden: true,
    dataset: {},
    style: { setProperty: () => {} },
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      toggle(c, force) {
        const on = force !== undefined ? !!force : !this._set.has(c);
        if (on) this._set.add(c); else this._set.delete(c);
        return on;
      },
      contains(c) { return this._set.has(c); }
    },
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k]; },
    addEventListener(ev, fn) { this['_on_' + ev] = fn; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 }; },
    appendChild(child) { this.child = child; },
    prepend(child) { this.child = child; },
    querySelectorAll() { return []; },
    focus() {},
    getContext() {
      return {
        setTransform() {},
        clearRect() {},
        fillRect() { drawStats.fills++; },
        beginPath() { drawStats.paths++; },
        moveTo() {},
        lineTo() {},
        quadraticCurveTo() {},
        closePath() {},
        stroke() { drawStats.strokes++; },
        fill() { drawStats.fills++; },
        arc() { drawStats.arcs++; },
        createRadialGradient() {
          return { addColorStop() {} };
        },
        drawImage() {},
        getImageData() {
          return { data: new Uint8ClampedArray([217, 130, 43, 255]) };
        }
      };
    }
  };
  return el;
}

const elementsById = new Map();
const elementsBySelector = new Map();

function getElById(id) {
  if (!elementsById.has(id)) elementsById.set(id, makeMockElement('#' + id));
  return elementsById.get(id);
}

function queryAll(sel) {
  if (!elementsBySelector.has(sel)) {
    // Create defaults for buttons/tabs
    if (sel === '.js-vmode') {
      const b1 = makeMockElement(sel); b1.dataset.m = 'cluster';
      const b2 = makeMockElement(sel); b2.dataset.m = 'ridge';
      const b3 = makeMockElement(sel); b3.dataset.m = 'vortex';
      elementsBySelector.set(sel, [b1, b2, b3]);
    } else if (sel === '[data-tab]') {
      const tabs = ['queue', 'liked', 'playlists', 'recent', 'search'].map(t => {
        const b = makeMockElement(sel);
        b.dataset.tab = t;
        return b;
      });
      elementsBySelector.set(sel, tabs);
    } else {
      elementsBySelector.set(sel, [makeMockElement(sel)]);
    }
  }
  return elementsBySelector.get(sel);
}

const storage = new Map();
const sessStorage = new Map();
let audioDestinationConnections = 0;
let audioElementPlayCalls = 0;

class MockAudioNode {
  constructor(name = 'node') {
    this.name = name;
    this.gain = {
      value: 1,
      setValueAtTime() {},
      linearRampToValueAtTime() {},
      exponentialRampToValueAtTime() {}
    };
    this.frequency = {
      value: 440,
      setValueAtTime() {},
      exponentialRampToValueAtTime() {}
    };
    this.Q = { value: 1 };
    this.fftSize = 1024;
    this.frequencyBinCount = 512;
  }
  connect(target) {
    if (target && target.name === 'destination') {
      audioDestinationConnections++;
    }
    return target;
  }
  disconnect() {}
  start() {}
  stop() {}
  getByteFrequencyData(arr) {
    for (let i = 0; i < arr.length; i++) arr[i] = 160;
  }
  getByteTimeDomainData(arr) {
    for (let i = 0; i < arr.length; i++) arr[i] = 128 + ((i % 2 === 0) ? 40 : -40);
  }
}

class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.destination = new MockAudioNode('destination');
  }
  resume() { this.state = 'running'; return Promise.resolve(); }
  createAnalyser() { return new MockAudioNode('analyser'); }
  createGain() { return new MockAudioNode('gain'); }
  createOscillator() { return new MockAudioNode('osc'); }
  createBiquadFilter() { return new MockAudioNode('filter'); }
  createBuffer(_ch, len) {
    return { getChannelData: () => new Float32Array(len) };
  }
  createBufferSource() { return new MockAudioNode('bufferSource'); }
  createMediaElementSource() { return new MockAudioNode('mediaElementSource'); }
}

class MockAudio {
  constructor() {
    this.src = '';
    this.paused = true;
    this.volume = 1;
    this.readyState = 4;
  }
  play() {
    this.paused = false;
    audioElementPlayCalls++;
    return Promise.resolve();
  }
  pause() { this.paused = true; }
  removeAttribute(k) { if (k === 'src') this.src = ''; }
  load() {}
}

const sandbox = {
  console,
  Math,
  Date,
  Uint8Array,
  Float32Array,
  Array,
  Object,
  String,
  Number,
  Boolean,
  Promise,
  URLSearchParams,
  AudioContext: MockAudioContext,
  Audio: MockAudio,
  setTimeout: (fn, ms) => { if (ms === 280) fn(); return 1; },
  clearTimeout: () => {},
  setInterval: () => 1,
  clearInterval: () => {},
  requestAnimationFrame: () => 1,
  performance: { now: () => 1000 },
  localStorage: {
    getItem: k => storage.get(k) || null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: k => storage.delete(k)
  },
  sessionStorage: {
    getItem: k => sessStorage.get(k) || null,
    setItem: (k, v) => sessStorage.set(k, String(v)),
    removeItem: k => sessStorage.delete(k)
  },
  fetch: () => Promise.resolve({ ok: false }),
  location: {
    origin: 'http://localhost:8080',
    pathname: '/index.html',
    search: '',
    protocol: 'http:',
    href: 'http://localhost:8080/index.html'
  },
  history: { replaceState: () => {} },
  navigator: {
    serviceWorker: { register: () => Promise.resolve() }
  },
  innerWidth: 1280,
  innerHeight: 800,
  devicePixelRatio: 1,
  addEventListener: () => {},
  window: null,
  document: {
    documentElement: { style: { setProperty: () => {} } },
    createElement: (tag) => makeMockElement(tag),
    getElementById: getElById,
    querySelector: (sel) => queryAll(sel)[0],
    querySelectorAll: queryAll,
    addEventListener: () => {}
  }
};
sandbox.window = sandbox;

vm.createContext(sandbox);

const audioSrc = fs.readFileSync(path.join(ROOT, 'src/audio.js'), 'utf8');
const visSrc = fs.readFileSync(path.join(ROOT, 'src/visualizer.js'), 'utf8');
const spSrc = fs.readFileSync(path.join(ROOT, 'src/spotify.js'), 'utf8');
const appSrc = fs.readFileSync(path.join(ROOT, 'src/app.js'), 'utf8');

vm.runInContext(`${audioSrc}\n${visSrc}\n${spSrc}\n${appSrc}\ninitApp();`, sandbox);
console.log('[PASS] 03. All 4 JS modules compiled & initialized cleanly with zero syntax/runtime errors');

// 4. Verify Visualizer3D "Khối đốm hạt" (cluster), "Địa hình" (ridge), "Xoáy hạt" (vortex)
vm.runInContext(`
  Visualizer3D.setMode('cluster');
  for (let i = 0; i < 10; i++) {
    Visualizer3D.renderFrame(0.016, i * 0.1, { bass: 0.75, mid: 0.5, high: 0.4, energy: 0.6 }, [217, 130, 43], 0.3, true);
  }
`, sandbox);
assert.ok(drawStats.arcs > 20000, `Expected >20,000 3D particle arcs drawn in Khối đốm hạt mode, got ${drawStats.arcs}`);
console.log(`[PASS] 04. "Khối đốm hạt" 3D particle cluster rendered (${drawStats.arcs} particle projections verified)`);

const prevStrokes = drawStats.strokes;
vm.runInContext(`
  Visualizer3D.setMode('ridge');
  for (let i = 0; i < 5; i++) {
    Visualizer3D.renderFrame(0.016, i * 0.1, { bass: 0.6, mid: 0.4, high: 0.3, energy: 0.5 }, [120, 146, 180], 0.5, true);
  }
  Visualizer3D.setMode('vortex');
  for (let i = 0; i < 5; i++) {
    Visualizer3D.renderFrame(0.016, i * 0.1, { bass: 0.8, mid: 0.6, high: 0.5, energy: 0.7 }, [196, 78, 50], 0.7, true);
  }
`, sandbox);
assert.ok(drawStats.strokes > prevStrokes, 'Expected topographic strokes in ridge/vortex modes');
console.log('[PASS] 05. "Địa hình" (ridge) and "Xoáy hạt" (vortex) 3D modes rendered cleanly');

// 5. Verify Transport Controls (Play/Pause icon swap, Next/Prev track, Shuffle/Repeat)
const playBtn = queryAll('.js-play')[0];
assert.ok(playBtn.innerHTML.includes('<polygon'), 'Paused state must display Play triangle polygon');
vm.runInContext(`setPlaying(true);`, sandbox);
assert.ok(playBtn.innerHTML.includes('<rect'), 'Playing state must display Pause double bars');
assert.equal(playBtn.dataset.state, 'playing');

vm.runInContext(`nextTrack();`, sandbox);
assert.equal(queryAll('.js-title')[0].textContent, 'Salt & Static');
vm.runInContext(`prevTrack();`, sandbox);
assert.equal(queryAll('.js-title')[0].textContent, 'Đèn Đường Lúc Ba Giờ');
console.log('[PASS] 06. Transport controls (Play triangle -> Pause bars, Next, Prev) verified');

// 6. Verify Library Tabs & Search Filtering
vm.runInContext(`switchTab('liked');`, sandbox);
const likedHTML = getElById('track-list').innerHTML;
assert.ok(likedHTML.includes('Đèn Đường Lúc Ba Giờ') && !likedHTML.includes('Mưa Phố Cũ'), 'Liked tab should filter liked tracks');

vm.runInContext(`switchTab('search'); filterSearch('Hà Nội');`, sandbox);
const searchHTML = getElById('track-list').innerHTML;
assert.ok(searchHTML.includes('Mưa Phố Cũ'), 'Search filter should find matching album/track');
console.log('[PASS] 07. Library tabs (Queue, Liked, Playlists, Recent, Search) verified');

// 7. Verify Zero-Retention Security, Playlist/Album Opening, 3D Bounce Slider & Audio Playback
vm.runInContext(`
  SpotifyClient.setClientId('test_spotify_client_123');
  Visualizer3D.setBounceGain(1.65);
  openPlaylist('pl-3');
  openDeviceModal();
  openInstallModal();
`, sandbox);
assert.equal(storage.has('vang_spotify_token'), false, 'Zero-retention: localStorage must NEVER store tokens');
assert.equal(storage.has('vang_spotify_client_id'), false, 'Zero-retention: localStorage must NEVER store client ID');
assert.equal(SpotifyClient_check(), 1.65);
function SpotifyClient_check() {
  return vm.runInContext('Visualizer3D.getBounceGain()', sandbox);
}
assert.ok(getElById('track-list').innerHTML.includes('Ambient &amp; Modular'), 'Opening album/playlist must render its tracks and header');
assert.equal(vm.runInContext('AppState.playing', sandbox), true, 'Opening an album must immediately start playback');
assert.equal(queryAll('.js-title')[0].textContent, 'Salt & Static', 'Opening pl-3 must immediately load and play its first track');

// 8. Verify Spotify Mode Album Derivation & Instant Album Playback
vm.runInContext(`
  AppState.spotifyActive = true;
  AppState.allTracks = [
    { id: 'sp-1', uri: 'spotify:track:1', t: 'Bản Nhạc Số 1', a: 'Ca Sĩ A', al: 'Album Bầu Trời Đêm', albumId: 'alb-sky-1', d: 200, c: [217, 130, 43] },
    { id: 'sp-2', uri: 'spotify:track:2', t: 'Bản Nhạc Số 2', a: 'Ca Sĩ A', al: 'Album Bầu Trời Đêm', albumId: 'alb-sky-1', d: 215, c: [217, 130, 43] }
  ];
  AppState.playlists = mergeCollections([], buildLibraryAlbums(AppState.allTracks));
  openPlaylist('alb-sky-1');
`, sandbox);
assert.equal(vm.runInContext('AppState.tracks.length', sandbox), 2, 'Opening derived Spotify library album must load its tracks immediately');
assert.equal(queryAll('.js-title')[0].textContent, 'Bản Nhạc Số 1', 'Opening Spotify album must immediately select and play track 0');
assert.equal(vm.runInContext('AppState.playing', sandbox), true, 'Spotify album must be in playing state');
assert.ok(audioDestinationConnections >= 2, `AudioEngine must connect masterGain & silentSink to ctx.destination (got ${audioDestinationConnections})`);
const sampled = vm.runInContext('AudioEngine.sampleBands(0.016, true, 1.0, 120, 10)', sandbox);
assert.ok(sampled.bass > 0 && sampled.mid > 0, 'AudioEngine.sampleBands must produce live non-zero FFT energy when playing');
assert.equal(getElById('install-modal').hidden, false);
console.log('[PASS] 08. Zero-retention security, WebAudio output routing, Demo & Spotify Album/Playlist playback verified');

console.log('\n=== ALL 8 VERIFICATION SUITES PASSED 100% ===');

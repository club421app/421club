/* =========================================================
   421 Club — interactions et animations
   - En-tête, menu mobile, apparitions au scroll
   - Moteur "halftone" : rend des dés 3D, des images et du texte
     en grille de points violets, façon template Onda.
   ========================================================= */
(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smooth = t => t * t * (3 - 2 * t);
  const WORD_SPLIT = /([ \n\t\r]+)/; // n'inclut pas l'espace insécable

  /* ---------- En-tête & menu mobile ---------- */
  const header = document.getElementById('header');
  const toggle = header.querySelector('.menu-toggle');
  const setMenu = open => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    header.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  header.querySelectorAll('.nav-mobile a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- Saison en cours & année ---------- */
  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const today = new Date();
  const month = MONTHS[today.getMonth()];
  const seasonLabel = document.getElementById('season-label');
  if (seasonLabel) seasonLabel.textContent = `Saison ${/^[aeiouyâ]/.test(month) ? "d'" : 'de '}${month} en cours`;
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = today.getFullYear();

  /* ---------- Bandeau : on double la piste pour une boucle sans couture ---------- */
  document.querySelectorAll('.marquee-track').forEach(track => {
    track.innerHTML += track.innerHTML;
  });

  /* ---------- Titres mot à mot ---------- */
  document.querySelectorAll('.split').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(WORD_SPLIT).forEach(part => {
            if (!part) return;
            if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.textContent = part;
            inner.style.setProperty('--d', (i++ * 0.07).toFixed(2) + 's');
            w.appendChild(inner);
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
  });

  /* ---------- Décalage des apparitions dans une même grille ---------- */
  ['.stats', '.modes-grid', '.badges-list', '.hero-bottom'].forEach(sel => {
    document.querySelectorAll(sel).forEach(group => {
      const step = sel === '.badges-list' ? 0.05 : 0.1;
      [...group.querySelectorAll(':scope > .reveal')].forEach((el, i) => el.style.setProperty('--delay', (i * step).toFixed(2) + 's'));
    });
  });

  /* ---------- Apparitions au scroll ---------- */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  document.querySelectorAll('.reveal, .split').forEach(el => revealIO.observe(el));

  /* ---------- Texte qui se "remplit" au scroll ---------- */
  const scrubs = [...document.querySelectorAll('[data-scrub]')].map(el => {
    const parts = el.textContent.trim().split(WORD_SPLIT);
    el.textContent = '';
    parts.forEach(part => {
      if (!part.trim()) { el.appendChild(document.createTextNode(part)); return; }
      const s = document.createElement('span');
      s.className = 'word';
      s.textContent = part;
      el.appendChild(s);
    });
    const words = [...el.querySelectorAll('.word')];
    if (reduceMotion) words.forEach(w => w.classList.add('is-lit'));
    return { el, words };
  });

  /* ---------- Compteurs ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if (!reduceMotion) {
    counters.forEach(el => { el.textContent = '0'; });
    const countIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        countIO.unobserve(e.target);
        const el = e.target;
        const target = +el.dataset.count;
        const t0 = performance.now();
        const dur = 1500;
        const tick = t => {
          const p = clamp((t - t0) / dur);
          el.textContent = Math.round(easeOut(p) * target);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    counters.forEach(el => countIO.observe(el));
  }

  /* ---------- Frise des rangs ---------- */
  const timeline = document.querySelector('[data-timeline]');
  const tlFill = timeline && timeline.querySelector('.timeline-fill');
  const tlSteps = timeline ? [...timeline.querySelectorAll('.step')] : [];

  const onScroll = () => {
    header.classList.toggle('is-scrolled', scrollY > 8);
    const vh = innerHeight;

    if (!reduceMotion) {
      scrubs.forEach(({ el, words }) => {
        const r = el.getBoundingClientRect();
        const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35));
        const lit = Math.round(p * words.length);
        words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
      });
    }

    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const p = reduceMotion ? 1 : clamp((vh * 0.85 - r.top) / (vh * 0.55));
      tlFill.style.width = (p * 100).toFixed(2) + '%';
      const px = p * r.width;
      tlSteps.forEach(s => s.classList.toggle('is-active', s.offsetLeft <= px + 1));
    }
  };
  let scrollQueued = false;
  addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => { scrollQueued = false; onScroll(); });
  }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Écrans tactiles : on révèle l'image quand la carte passe au centre ---------- */
  if (!canHover) {
    const touchIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.target.classList.contains('ht-failed')) return;
        e.target.classList.toggle('is-revealed', e.isIntersecting);
      });
    }, { rootMargin: '-38% 0px -38% 0px' });
    document.querySelectorAll('.mode-card, .work-card, .quote-art').forEach(el => touchIO.observe(el));
  }

  /* =========================================================
     Moteur halftone
     ========================================================= */
  const PALETTE = ['#ebe5fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9'];
  const GRID_DOT = '#e1e5eb';
  const NB = PALETTE.length;
  const pointer = { x: -1e5, y: -1e5 };
  const fields = [];

  addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.x = pointer.y = -1e5; });

  const loadImage = src => new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  // Dessine une image en "contain" ou "cover" (focus = position verticale 0..1, comme object-position)
  const drawFit = (ctx, img, W, H, { fit = 'contain', focus = 0.5, scale = 1, dx = 0, dy = 0 } = {}) => {
    const ir = img.naturalWidth / img.naturalHeight;
    let w, h;
    if ((fit === 'cover') === (ir < W / H)) { w = W * scale; h = w / ir; } else { h = H * scale; w = h * ir; }
    const x = (W - w) / 2 + dx * W;
    const y = (H - h) * (fit === 'cover' ? focus : 0.5) + dy * H;
    ctx.drawImage(img, x, y, w, h);
  };

  class Field {
    constructor(canvas, cfg) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.cfg = Object.assign({ cell: 8, grid: true, mouse: 0, wave: 0, intro: 1.4, lo: 0, hi: 1, gamma: 1, gain: 1 }, cfg);
      this.src = document.createElement('canvas');
      this.sctx = this.src.getContext('2d', { willReadFrequently: true });
      this.visible = false;
      this.introAt = null;
      this.introDone = false;
      this.ready = !this.cfg.load;
      this.failed = false;
      this.dirty = true;
      this.state = {};
      canvas.__field = this;
      fields.push(this);
      this.resize();
      if (this.cfg.load) {
        this.cfg.load(this)
          .then(() => { this.ready = true; this.resize(); })
          .catch(() => this.fail());
      }
    }

    fail() {
      if (this.failed) return;
      this.failed = true;
      const host = this.canvas.closest('.mode-card, .work-card, .quote-art') || this.canvas.parentElement;
      host.classList.add('is-revealed', 'ht-failed');
    }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      if (!r.width || !r.height) { this.cols = 0; return; }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = r.width;
      this.h = r.height;
      this.dpr = dpr;
      this.canvas.width = Math.round(r.width * dpr);
      this.canvas.height = Math.round(r.height * dpr);
      const cell = typeof this.cfg.cell === 'function' ? this.cfg.cell(r.width, r.height) : this.cfg.cell;
      this.cell = cell;
      this.cols = Math.max(1, Math.floor(r.width / cell));
      this.rows = Math.max(1, Math.floor(r.height / cell));
      this.ox = (r.width - this.cols * cell) / 2;
      this.oy = (r.height - this.rows * cell) / 2;
      this.src.width = this.cols;
      this.src.height = this.rows;
      this.sctx.imageSmoothingQuality = 'high';
      const n = this.cols * this.rows;
      this.values = new Float32Array(n);
      this.delays = new Float32Array(n);
      for (let i = 0; i < n; i++) this.delays[i] = Math.random();
      this.buckets = Array.from({ length: NB + 1 }, () => new Float32Array(n * 3));
      this.counts = new Int32Array(NB + 1);
      if (this.ready && this.cfg.setup) this.cfg.setup(this);
      this.dirty = true;
    }

    // Lit le canvas source : sombre + opaque = point fort
    sample(target = this.values) {
      let data;
      try { data = this.sctx.getImageData(0, 0, this.cols, this.rows).data; }
      catch (err) { this.fail(); return false; }
      const { lo, hi, gamma, gain } = this.cfg;
      const inv = 1 / (hi - lo);
      for (let i = 0, j = 0, n = target.length; i < n; i++, j += 4) {
        const a = data[j + 3] / 255;
        const lum = (0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2]) / 255;
        const v = clamp((a * (1 - lum) - lo) * inv);
        target[i] = (gamma === 1 ? v : Math.pow(v, gamma)) * gain;
      }
      return true;
    }

    frame(t) {
      if (!this.cols || !this.ready || this.failed) return;
      if (this.cfg.draw) {
        this.sctx.clearRect(0, 0, this.cols, this.rows);
        this.sctx.save();
        this.cfg.draw(this, this.sctx, t);
        this.sctx.restore();
        if (!this.sample()) return;
      }
      if (this.cfg.update) this.cfg.update(this, t);
      this.paint(t);
    }

    paint(t) {
      const { ctx, dpr, cell, cols, rows, ox, oy, values, delays, buckets, counts, cfg } = this;
      counts.fill(0);

      let intro = 1;
      if (cfg.intro && !reduceMotion) {
        if (this.introAt === null) this.introAt = t;
        intro = clamp((t - this.introAt) / (cfg.intro * 1000));
      }
      const introDone = intro >= 1;

      let px = -1e5, py = -1e5, R = 0;
      if (cfg.mouse && !reduceMotion) {
        const r = this.canvas.getBoundingClientRect();
        px = pointer.x - r.left;
        py = pointer.y - r.top;
        R = cfg.mouse * cell;
      }
      const R2 = R * R;
      const ts = t / 1000;
      const waveFn = !reduceMotion && cfg.waveFn;
      const wave = !reduceMotion && cfg.wave;
      const half = cell / 2;

      for (let y = 0, i = 0; y < rows; y++) {
        const cy = oy + y * cell + half;
        for (let x = 0; x < cols; x++, i++) {
          let v = values[i];
          if (!introDone) v *= smooth(clamp((intro - delays[i] * 0.6) / 0.4));
          if (v > 0) {
            if (waveFn) v *= waveFn(x, y, ts);
            else if (wave) v *= 1 - wave + wave * (0.5 + 0.5 * Math.sin(ts * 1.1 - (x + y) * 0.12));
          }
          const cx = ox + x * cell + half;
          if (R) {
            const dx = cx - px, dy = cy - py, d2 = dx * dx + dy * dy;
            if (d2 < R2) {
              const f = 1 - Math.sqrt(d2) / R;
              v = Math.min(1, v * (1 + 0.6 * f) + 0.3 * f * f * intro);
            }
          }
          if (v < 0.07) {
            if (cfg.grid) {
              const c = counts[NB]++ * 3;
              buckets[NB][c] = cx;
              buckets[NB][c + 1] = cy;
            }
            continue;
          }
          const k = Math.min(NB - 1, (v * NB) | 0);
          const c = counts[k]++ * 3;
          const b = buckets[k];
          b[c] = cx;
          b[c + 1] = cy;
          b[c + 2] = cell * (0.3 + 0.62 * v);
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, this.w, this.h);
      if (cfg.grid && counts[NB]) {
        const b = buckets[NB];
        const gs = Math.max(1.2, cell * 0.2), gh = gs / 2;
        ctx.fillStyle = GRID_DOT;
        ctx.beginPath();
        for (let c = 0, n = counts[NB] * 3; c < n; c += 3) ctx.rect(b[c] - gh, b[c + 1] - gh, gs, gs);
        ctx.fill();
      }
      for (let k = 0; k < NB; k++) {
        if (!counts[k]) continue;
        const b = buckets[k];
        ctx.fillStyle = PALETTE[k];
        ctx.beginPath();
        for (let c = 0, n = counts[k] * 3; c < n; c += 3) {
          const s = b[c + 2], h = s / 2;
          ctx.rect(b[c] - h, b[c + 1] - h, s, s);
        }
        ctx.fill();
      }
      this.introDone = introDone;
    }
  }

  /* ---------- Dés 3D ---------- */
  const FACES = [ // normale, axe u, axe v (cube de demi-côté 1)
    { n: [0, 0, 1], u: [1, 0, 0], v: [0, -1, 0] },  // face avant
    { n: [0, 0, -1], u: [-1, 0, 0], v: [0, -1, 0] }, // arrière
    { n: [1, 0, 0], u: [0, 0, -1], v: [0, -1, 0] },  // droite
    { n: [-1, 0, 0], u: [0, 0, 1], v: [0, -1, 0] },  // gauche
    { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] },    // dessus
    { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, -1] },  // dessous
  ];
  const PP = 0.5;
  const PIPS = {
    1: [[0, 0]],
    2: [[-PP, -PP], [PP, PP]],
    3: [[-PP, -PP], [0, 0], [PP, PP]],
    4: [[-PP, -PP], [PP, -PP], [-PP, PP], [PP, PP]],
    5: [[-PP, -PP], [PP, -PP], [0, 0], [-PP, PP], [PP, PP]],
    6: [[-PP, -PP], [PP, -PP], [-PP, 0], [PP, 0], [-PP, PP], [PP, PP]],
  };
  const ROUNDED = []; // carré arrondi (super-ellipse)
  for (let k = 0; k < 40; k++) {
    const a = (k / 40) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    ROUNDED.push([Math.sign(c) * Math.pow(Math.abs(c), 0.25) * 0.94, Math.sign(s) * Math.pow(Math.abs(s), 0.25) * 0.94]);
  }
  const CIRCLE = [];
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; CIRCLE.push([Math.cos(a), Math.sin(a)]); }
  const LIGHT = (() => { const l = [-0.45, 0.6, 0.75], n = Math.hypot(...l); return l.map(c => c / n); })();

  const faceValues = f => {
    const pairs = [[1, 6], [2, 5], [3, 4]].filter(p => !p.includes(f));
    return [f, 7 - f, pairs[0][0], pairs[0][1], pairs[1][0], pairs[1][1]];
  };

  const rotMat = (rx, ry, rz) => {
    const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
    return [
      cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx,
      sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx,
      -sy, cy * sx, cy * cx,
    ];
  };
  const mul = (m, x, y, z) => [m[0] * x + m[1] * y + m[2] * z, m[3] * x + m[4] * y + m[5] * z, m[6] * x + m[7] * y + m[8] * z];

  const drawDie = (ctx, cx, cy, s, m, vals, persp = 9) => {
    const proj = (x, y, z) => {
      const p = mul(m, x, y, z);
      const k = persp / (persp - p[2]);
      return [cx + p[0] * s * k, cy - p[1] * s * k];
    };
    const at = (f, u, v) => proj(
      f.n[0] + u * f.u[0] + v * f.v[0],
      f.n[1] + u * f.u[1] + v * f.v[1],
      f.n[2] + u * f.u[2] + v * f.v[2]
    );
    FACES.forEach((f, fi) => {
      const n = mul(m, ...f.n);
      if (n[0] * -n[0] + n[1] * -n[1] + n[2] * (persp - n[2]) <= 0) return; // face cachée
      const b = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
      ctx.fillStyle = `rgba(0,0,0,${(0.42 + 0.52 * (1 - b)).toFixed(3)})`;
      ctx.beginPath();
      ROUNDED.forEach(([u, v], k) => { const p = at(f, u, v); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      PIPS[vals[fi]].forEach(([pu, pv]) => {
        ctx.beginPath();
        CIRCLE.forEach(([a, c], k) => { const p = at(f, pu + a * 0.21, pv + c * 0.21); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
        ctx.closePath();
        ctx.fill();
      });
    });
  };

  const drawShadow = (ctx, cx, cy, rx, ry, alpha) => {
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  // Souris lissée, normalisée -1..1 par rapport au canvas
  const smoothPointer = (f, ease = 0.06) => {
    const r = f.canvas.getBoundingClientRect();
    const inside = pointer.x > -1e4;
    const tx = inside ? clamp(((pointer.x - r.left) / r.width) * 2 - 1, -1, 1) : 0;
    const ty = inside ? clamp(((pointer.y - r.top) / r.height) * 2 - 1, -1, 1) : 0;
    f.state.mx = (f.state.mx || 0) + (tx - (f.state.mx || 0)) * ease;
    f.state.my = (f.state.my || 0) + (ty - (f.state.my || 0)) * ease;
  };

  /* ---------- Hero : trois dés qui montrent 4, 2, 1 ---------- */
  // Les dés se placent dans la bande libre entre l'en-tête et les textes du bas.
  const HERO_WIDE = [
    { f: 4, x: 0.5, y: 0.56, s: 0.3, rz: -0.12 },
    { f: 2, x: 0.69, y: 0.4, s: 0.2, rz: 0.22 },
    { f: 1, x: 0.84, y: 0.64, s: 0.14, rz: -0.3 },
  ];
  const HERO_TALL = [
    { f: 4, x: 0.3, y: 0.56, s: 0.3, rz: -0.12 },
    { f: 2, x: 0.63, y: 0.38, s: 0.2, rz: 0.22 },
    { f: 1, x: 0.85, y: 0.66, s: 0.14, rz: -0.3 },
  ];
  HERO_WIDE.concat(HERO_TALL).forEach(d => { d.vals = faceValues(d.f); });

  const heroBand = f => {
    const hero = f.canvas.parentElement;
    const c = f.canvas.getBoundingClientRect();
    const tall = c.width < 900;
    const limit = hero.querySelector(tall ? '.hero-title' : '.hero-side').getBoundingClientRect();
    const above = tall ? hero.querySelector('.hero-meta') : header; // sur mobile, on laisse respirer les mentions du haut
    const top = (above.getBoundingClientRect().bottom - c.top + 12 - f.oy) / f.cell;
    const bottom = (limit.top - c.top - 16 - f.oy) / f.cell;
    return { tall, top, band: Math.max(8, bottom - top) };
  };

  const heroDraw = (f, ctx, t) => {
    const ts = t / 1000;
    const W = f.cols;
    const { tall, top, band } = heroBand(f);
    const layout = tall ? HERO_TALL : HERO_WIDE;
    const unit = Math.min(band, W * (tall ? 0.62 : 0.34));
    smoothPointer(f);
    const period = 7;
    const tc = ts % period;
    layout.forEach((d, i) => {
      const p = clamp((tc - 3.2 - i * 0.14) / 1.5);
      const e = easeOut(p);
      const hop = Math.sin(Math.PI * Math.min(1, p * 1.15)) * 0.14 * band;
      const dir = i % 2 ? -1 : 1;
      const rx = 0.36 + 0.08 * Math.sin(ts * 0.6 + i) + f.state.my * 0.3 + e * Math.PI * 2 * dir;
      const ry = -0.38 * dir + 0.12 * Math.sin(ts * 0.45 + i * 2) + f.state.mx * 0.45 + e * Math.PI * 2;
      const rz = d.rz + 0.05 * Math.sin(ts * 0.5 + i);
      const s = d.s * unit;
      const cx = d.x * W, cy = top + d.y * band;
      drawShadow(ctx, cx, cy + s * 1.4, s * (1 - hop / band), s * 0.18, 0.09);
      drawDie(ctx, cx, cy - hop, s, rotMat(rx, ry, rz), d.vals, 9);
    });
  };

  /* ---------- Partie rapide : deux dés en duel ---------- */
  const diceDraw = (f, ctx, t) => {
    const ts = t / 1000;
    const W = f.cols, H = f.rows;
    const unit = Math.min(W, H * 1.6);
    if (!f.state.dice) {
      const faces = (f.canvas.dataset.faces || '4,2').split(',').map(Number);
      f.state.dice = faces.map(v => faceValues(v));
    }
    smoothPointer(f, 0.08);
    const period = 4.2;
    f.state.dice.forEach((vals, i) => {
      const dir = i ? -1 : 1;
      const local = (ts + i * period / 2) % period;
      const p = clamp((local - 2.4) / 1.2);
      const e = easeOut(p);
      const hop = Math.sin(Math.PI * p) * 0.12 * H;
      const rx = 0.45 + 0.08 * Math.sin(ts * 0.8 + i) + f.state.my * 0.3 + e * Math.PI * 2;
      const ry = 0.55 * dir + 0.12 * Math.sin(ts * 0.7 + i) + f.state.mx * 0.4 + e * Math.PI * 2 * dir;
      const s = 0.12 * unit;
      const cx = (0.5 + dir * -0.2) * W;
      const cy = 0.46 * H;
      drawShadow(ctx, cx, cy + s * 1.5, s * 1.05, s * 0.2, 0.1);
      drawDie(ctx, cx, cy - hop, s, rotMat(rx, ry, dir * 0.15), vals, 9);
    });
  };

  /* ---------- Compteur : bâtons sur un carnet ---------- */
  const tallyDraw = (f, ctx, t) => {
    const ts = t / 1000;
    const W = f.cols, H = f.rows;
    // lignes du carnet
    ctx.strokeStyle = 'rgba(0,0,0,0.13)';
    ctx.lineWidth = Math.max(1, H * 0.022);
    for (let y = 0.16; y < 0.95; y += 0.17) {
      ctx.beginPath();
      ctx.moveTo(W * 0.1, H * y);
      ctx.lineTo(W * 0.9, H * y);
      ctx.stroke();
    }
    const per = 0.3, total = 10, hold = 1.8, fadeDur = 0.6;
    const cycle = total * per + hold + fadeDur;
    const tc = reduceMotion ? total * per : ts % cycle;
    const shown = tc / per;
    const fade = tc > total * per + hold ? 1 - (tc - total * per - hold) / fadeDur : 1;
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(2, H * 0.075);
    ctx.strokeStyle = `rgba(0,0,0,${(0.9 * fade).toFixed(3)})`;
    const top = H * 0.24, bot = H * 0.76, gw = W * 0.2;
    for (let g = 0; g < 2; g++) {
      const gx = W * (g ? 0.56 : 0.24);
      for (let k = 0; k < 5; k++) {
        const p = clamp(shown - (g * 5 + k));
        if (p <= 0) continue;
        let x0, y0, x1, y1;
        if (k < 4) {
          const wob = Math.sin((g * 5 + k) * 2.3) * 0.012 * W;
          x0 = gx + k * (gw / 3) + wob; y0 = top;
          x1 = x0 - wob * 1.5; y1 = bot;
        } else {
          x0 = gx - 0.04 * W; y0 = bot - 0.06 * H;
          x1 = gx + gw + 0.04 * W; y1 = top + 0.1 * H;
        }
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + (x1 - x0) * easeOut(p), y0 + (y1 - y0) * easeOut(p));
        ctx.stroke();
      }
    }
  };

  /* ---------- Mode soirée : cartes défi / gage qui se retournent ---------- */
  const roundRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  const star = (ctx, x, y, r) => {
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 - Math.PI / 2;
      const rr = k % 2 ? r * 0.28 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  };
  const cardsDraw = (f, ctx, t) => {
    const ts = t / 1000;
    const W = f.cols, H = f.rows;
    const ch = H * 0.66, cw = ch * 0.72;
    const cards = [
      { x: 0.41, y: 0.52, rot: -0.17, sym: '!', ph: 0 },
      { x: 0.59, y: 0.48, rot: 0.13, sym: '?', ph: 1.7 },
    ];
    const period = 3.4;
    cards.forEach(c => {
      const local = ts + c.ph;
      const idx = Math.floor(local / period);
      const p = clamp(((local % period) - 2.5) / 0.8);
      const ang = (idx + easeInOut(p)) * Math.PI;
      const sx = Math.abs(Math.cos(ang));
      const front = Math.cos(ang) >= 0;
      ctx.save();
      ctx.translate(c.x * W, c.y * H - Math.sin(p * Math.PI) * H * 0.04);
      ctx.rotate(c.rot + 0.04 * Math.sin(ts * 0.9 + c.ph));
      ctx.scale(Math.max(sx, 0.02), 1);
      roundRect(ctx, -cw / 2, -ch / 2, cw, ch, cw * 0.12);
      if (front) {
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = `600 ${Math.round(ch * 0.58)}px "Host Grotesk", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.sym, 0, ch * 0.04);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.88)';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = Math.max(1, cw * 0.06);
        roundRect(ctx, -cw * 0.34, -ch * 0.38, cw * 0.68, ch * 0.76, cw * 0.06);
        ctx.stroke();
        ctx.fillStyle = '#fff';
        star(ctx, 0, 0, cw * 0.2);
      }
      ctx.restore();
    });
    ctx.fillStyle = '#000';
    [[0.2, 0.28, 0], [0.8, 0.22, 1.3], [0.84, 0.74, 2.1], [0.16, 0.74, 3.2]].forEach(([x, y, ph]) => {
      const r = H * (0.05 + 0.03 * Math.sin(ts * 2 + ph));
      star(ctx, x * W, y * H, Math.max(1.5, r));
    });
  };

  /* ---------- Entre potes : trois avatars ---------- */
  const avatarsDraw = (f, ctx, t) => {
    const ts = t / 1000;
    const W = f.cols, H = f.rows;
    const spots = [
      { x: 0.3, y: 0.58, r: 0.27, ph: 0 },
      { x: 0.7, y: 0.56, r: 0.27, ph: 2.1 },
      { x: 0.5, y: 0.44, r: 0.32, ph: 1 },
    ];
    f.state.imgs.forEach((img, i) => {
      const s = spots[i];
      const r = s.r * H;
      const cx = s.x * W, cy = s.y * H + Math.sin(ts * 1.4 + s.ph) * H * 0.02;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.fill();
      ctx.clip();
      ctx.drawImage(img, cx - r * 0.95, cy - r * 0.9, r * 1.9, r * 1.9);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = Math.max(1, H * 0.035);
      ctx.stroke();
    });
  };

  /* ---------- Fabrique des champs selon data-ht ---------- */
  const cardCell = w => clamp(w / 82, 5, 8);
  const makers = {
    hero: c => new Field(c, {
      cell: w => (w < 700 ? 7 : 8),
      mouse: 9,
      intro: 1.8,
      draw: heroDraw,
    }),
    dice: c => new Field(c, { cell: cardCell, draw: diceDraw }),
    tally: c => new Field(c, { cell: cardCell, draw: tallyDraw }),
    cards: c => new Field(c, { cell: cardCell, draw: cardsDraw }),
    avatars: c => new Field(c, {
      cell: cardCell,
      hi: 0.85,
      load: f => Promise.all(c.dataset.srcs.split(',').map(loadImage)).then(imgs => { f.state.imgs = imgs; }),
      draw: avatarsDraw,
    }),
    image: c => {
      const fit = c.dataset.fit || 'contain';
      const focus = parseFloat(c.dataset.focus || '0.5');
      const bob = c.dataset.bob === '1';
      const big = fit === 'cover';
      const img = c.parentElement.querySelector('.reveal-img');
      if (img && big) img.style.objectPosition = `50% ${focus * 100}%`;
      const opts = { fit, focus, scale: big ? 1 : 0.92 };
      return new Field(c, {
        cell: big ? w => clamp(w / 92, 5, 8) : cardCell,
        lo: big ? 0.07 : 0,
        wave: big ? 0.12 : 0,
        load: f => loadImage(c.dataset.src).then(im => { f.state.img = im; }),
        setup: bob ? null : f => {
          f.sctx.clearRect(0, 0, f.cols, f.rows);
          drawFit(f.sctx, f.state.img, f.cols, f.rows, opts);
          f.sample();
        },
        draw: bob ? (f, ctx, t) => {
          drawFit(ctx, f.state.img, f.cols, f.rows, Object.assign({ dy: Math.sin(t / 1000 * 1.6) * 0.025 }, opts));
        } : null,
      });
    },
    screens: c => {
      // Écrans de l'app : les points marquent ce qui se détache du fond de l'écran,
      // qu'il soit clair ou sombre, puis on trace le contour du téléphone.
      const srcs = c.dataset.srcs.split(',');
      const lumAt = (d, i) => (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
      return new Field(c, {
        cell: w => clamp(w / 90, 5, 8),
        wave: 0.1,
        load: f => Promise.all(srcs.map(loadImage)).then(imgs => {
          f.state.imgs = imgs;
          const probe = document.createElement('canvas');
          probe.width = 40; probe.height = 80;
          const pctx = probe.getContext('2d', { willReadFrequently: true });
          f.state.bg = imgs.map(im => {
            pctx.clearRect(0, 0, 40, 80);
            pctx.drawImage(im, 0, 0, 40, 80);
            return lumAt(pctx.getImageData(0, 40, 1, 1).data, 0); // marge gauche, mi-hauteur
          });
        }),
        setup: f => {
          // Même géométrie que .reveal-screens : hauteur 86 %, écart 4 % de la largeur
          const ctx = f.sctx, W = f.cols, H = f.rows, imgs = f.state.imgs, V = f.values;
          const h = H * 0.86, gap = W * 0.04;
          const ws = imgs.map(im => (h * im.naturalWidth) / im.naturalHeight);
          const y = (H - h) / 2;
          let x = (W - ws.reduce((a, b) => a + b, 0) - gap * (imgs.length - 1)) / 2;
          const rects = imgs.map((im, i) => { const r = { x, w: ws[i], bg: f.state.bg[i] }; x += ws[i] + gap; return r; });
          const shape = r => roundRect(ctx, r.x, y, r.w, h, r.w * 0.12);

          ctx.clearRect(0, 0, W, H);
          rects.forEach((r, i) => { ctx.save(); shape(r); ctx.clip(); ctx.drawImage(imgs[i], r.x, y, r.w, h); ctx.restore(); });
          let d;
          try { d = ctx.getImageData(0, 0, W, H).data; } catch (err) { f.fail(); return; }
          V.fill(0);
          for (let yy = 0, i = 0; yy < H; yy++) {
            for (let xx = 0; xx < W; xx++, i++) {
              const a = d[i * 4 + 3] / 255;
              if (!a) continue;
              const r = rects.find(q => xx + 0.5 >= q.x && xx + 0.5 <= q.x + q.w);
              if (!r) continue;
              V[i] = a * 0.86 * clamp(Math.abs(lumAt(d, i * 4) - r.bg) * (r.bg < 0.35 ? 2.6 : 1.3) - 0.06); // les thèmes sombres ont moins de contraste
            }
          }
          ctx.clearRect(0, 0, W, H);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 0.8;
          rects.forEach(r => { shape(r); ctx.stroke(); });
          d = ctx.getImageData(0, 0, W, H).data;
          for (let i = 0; i < V.length; i++) V[i] = Math.max(V[i], (d[i * 4 + 3] / 255) * 0.42);
        },
      });
    },
    cycle: c => {
      const srcs = c.dataset.srcs.split(',');
      const img = c.parentElement.querySelector('.reveal-img');
      const hold = 2.6, blend = 0.5;
      return new Field(c, {
        cell: cardCell,
        load: f => Promise.all(srcs.map(loadImage)).then(imgs => { f.state.imgs = imgs; }),
        setup: f => {
          f.state.frames = f.state.imgs.map(im => {
            const arr = new Float32Array(f.values.length);
            f.sctx.clearRect(0, 0, f.cols, f.rows);
            drawFit(f.sctx, im, f.cols, f.rows, { scale: 0.84 });
            f.sample(arr);
            return arr;
          });
        },
        update: (f, t) => {
          const frames = f.state.frames;
          if (!frames) return;
          const ts = reduceMotion ? 0 : t / 1000;
          const idx = Math.floor(ts / hold) % frames.length;
          const prev = (idx + frames.length - 1) % frames.length;
          const k = smooth(clamp((ts % hold) / blend));
          const A = frames[prev], B = frames[idx], V = f.values;
          for (let i = 0; i < V.length; i++) V[i] = A[i] + (B[i] - A[i]) * k;
          if (img && f.state.idx !== idx) { f.state.idx = idx; img.src = srcs[idx]; }
        },
      });
    },
    text: c => new Field(c, {
      cell: w => clamp(w / 120, 5, 11),
      mouse: 10,
      intro: 2,
      load: () => (document.fonts && document.fonts.load ? document.fonts.load('500 100px "Host Grotesk"') : Promise.resolve()).catch(() => {}),
      setup: f => {
        const ctx = f.sctx, W = f.cols, H = f.rows, text = c.dataset.text;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#000';
        ctx.font = '500 100px "Host Grotesk", sans-serif';
        const m = ctx.measureText(text);
        const asc = m.actualBoundingBoxAscent || 72, desc = m.actualBoundingBoxDescent || 0;
        const left = m.actualBoundingBoxLeft || 0, right = m.actualBoundingBoxRight || m.width;
        const k = Math.min((W * 0.97) / (left + right), (H * 0.94) / (asc + desc));
        ctx.font = `500 ${100 * k}px "Host Grotesk", sans-serif`;
        const x = (W - (left + right) * k) / 2 + left * k;
        const y = (H - (asc + desc) * k) / 2 + asc * k;
        ctx.fillText(text, x, y);
        f.sample();
      },
      waveFn: (x, y, ts) => 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(ts * 0.9 - x * 0.07 + y * 0.05)),
    }),
  };

  const canvases = [...document.querySelectorAll('canvas[data-ht]')];
  if (!canvases.length) return;

  const visIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const f = e.target.__field;
      if (!f) return;
      f.visible = e.isIntersecting;
      if (f.visible) f.dirty = true;
    });
  }, { rootMargin: '80px 0px' });

  const resizeIO = new ResizeObserver(entries => {
    entries.forEach(e => { const f = e.target.__field; if (f) f.resize(); });
  });

  canvases.forEach(c => {
    const make = makers[c.dataset.ht];
    if (!make) return;
    make(c);
    visIO.observe(c);
    resizeIO.observe(c);
  });

  // Une seule boucle pour tous les canvas visibles
  const loop = t => {
    requestAnimationFrame(loop);
    for (const f of fields) {
      if (!f.visible || !f.ready || f.failed) continue;
      const needs = reduceMotion
        ? f.dirty
        : f.dirty || !f.introDone || f.cfg.draw || f.cfg.update || f.cfg.wave || f.cfg.waveFn || f.cfg.mouse;
      if (!needs) continue;
      f.dirty = false;
      f.frame(reduceMotion ? 2600 : t);
    }
  };
  requestAnimationFrame(loop);
})();

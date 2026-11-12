/* 421 Club — animations au défilement (sans bibliothèque). */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Scène : titre, téléphone qui monte, puis les cinq modes ---------- */
  var scene = document.querySelector('[data-scene]');
  var card = scene && scene.querySelector('.stage-card');
  var intro = scene && scene.querySelector('.intro');
  var phone = scene && scene.querySelector('.phone');
  var glow = scene && scene.querySelector('.glow');
  var bgs = scene ? scene.querySelectorAll('.stage-bg span') : [];
  var words = scene ? scene.querySelectorAll('.words span') : [];
  var shots = scene ? scene.querySelectorAll('.phone-screen img') : [];
  var caps = scene ? scene.querySelectorAll('.captions li') : [];
  var dots = scene ? scene.querySelectorAll('.progress i') : [];
  var progress = scene && scene.querySelector('.progress');
  var STEPS = 5, INTRO = 0.12, current = 0;

  // 0 = le titre (écran d'accueil), puis 1 à 5 = les cinq étapes.
  function setStep(i) {
    if (i === current) return;
    current = i;
    var k;
    for (k = 0; k < bgs.length; k++) bgs[k].classList.toggle('on', k === i);
    for (k = 0; k < shots.length; k++) shots[k].classList.toggle('on', k === i);
    for (k = 0; k < caps.length; k++) caps[k].classList.toggle('on', k === i - 1);
    for (k = 0; k < dots.length; k++) dots[k].classList.toggle('on', k === i - 1);
  }

  function updateScene(vw, vh) {
    var r = scene.getBoundingClientRect();
    var total = scene.offsetHeight - vh;
    var p = clamp(-r.top / total, 0, 1);
    var mobile = vw < 700;

    // Le titre s'efface, la carte s'étend jusqu'aux bords, le téléphone monte au centre.
    var t = ease(clamp(p / INTRO, 0, 1));
    var top = lerp(mobile ? 66 : 72, 0, t), side = lerp(mobile ? 10 : 16, 0, t);
    card.style.inset = top + 'px ' + side + 'px 0';
    card.style.borderRadius = lerp(mobile ? 28 : 36, 0, t) + 'px';
    intro.style.opacity = clamp(1 - t * 1.6, 0, 1);
    intro.style.transform = 'translateY(' + (-t * 90) + 'px)';
    phone.style.setProperty('--rise', lerp(vh * (mobile ? 0.27 : 0.38), 0, t) + 'px');
    glow.style.opacity = lerp(1, 0.25, t);

    var inSteps = p >= INTRO * 0.85;
    progress.classList.toggle('on', inSteps);

    var q = clamp((p - INTRO) / (1 - INTRO), 0, 0.9999) * STEPS;
    var idx = Math.floor(q), local = q - idx;
    setStep(inSteps ? idx + 1 : 0);

    // Le grand mot de chaque mode traverse l'écran derrière le téléphone.
    for (var j = 0; j < words.length; j++) {
      var w = words[j];
      if (j !== idx || p < INTRO) { w.style.opacity = 0; continue; }
      w.style.opacity = 1;
      var ww = w.offsetWidth;
      var x = reduce ? (vw - ww) / 2 : lerp(vw * 0.9, -ww + vw * 0.1, local);
      w.style.transform = 'translateX(' + x + 'px)';
    }
    phone.style.setProperty('--tilt', reduce || p < INTRO ? '0deg' : (Math.sin(local * Math.PI * 2) * 2).toFixed(2) + 'deg');
  }

  /* ---------- Texte qui se remplit mot à mot ---------- */
  var fill = document.querySelector('[data-fill]');
  var fillWords = [];
  if (fill) {
    var parts = fill.textContent.split(/(\s+)/);
    fill.textContent = '';
    parts.forEach(function (part) {
      if (/^\s+$/.test(part)) { fill.appendChild(document.createTextNode(part)); return; }
      if (!part) return;
      var s = document.createElement('span');
      s.className = 'wd';
      if (/^(421|Club|lancer\.)$/.test(part)) s.classList.add('hl');
      s.textContent = part;
      fill.appendChild(s);
      fillWords.push(s);
    });
  }
  function updateFill(vh) {
    var r = fill.getBoundingClientRect();
    var p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
    var lit = reduce ? fillWords.length : Math.round(p * fillWords.length);
    for (var i = 0; i < fillWords.length; i++) fillWords[i].classList.toggle('lit', i < lit);
  }

  /* ---------- Les trois tuiles qui se redressent ---------- */
  var tiles = document.querySelector('[data-tiles]');
  var giant = tiles && tiles.querySelector('.giant');
  var faces = tiles ? tiles.querySelectorAll('.tile-face') : [];
  function updateTiles(vw, vh) {
    var r = tiles.getBoundingClientRect();
    var p = clamp((vh - r.top) / (vh + r.height), 0, 1);
    var flat = ease(clamp((vh - r.top) / (vh * 0.75), 0, 1));
    for (var i = 0; i < faces.length; i++) {
      var d = clamp(flat - i * 0.06, 0, 1);
      faces[i].style.setProperty('--rx', (reduce ? 0 : lerp(55, 0, d)) + 'deg');
    }
    var span = giant.scrollWidth - vw;
    giant.style.transform = 'translateX(' + (reduce ? 0 : lerp(vw * 0.15, -span - vw * 0.05, p)) + 'px)';
  }

  /* ---------- Le mur qui glisse ---------- */
  var wall = document.querySelector('[data-wall]');
  var rows = wall ? wall.querySelectorAll('.wall-row') : [];
  function updateWall(vw, vh) {
    var r = wall.getBoundingClientRect();
    var p = clamp((vh - r.top) / (vh + r.height), 0, 1);
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i], range = Math.max(0, row.scrollWidth - vw);
      var dir = Number(row.getAttribute('data-dir'));
      var x = dir < 0 ? -range * p : -range * (1 - p);
      row.style.transform = 'translateX(' + (reduce ? -range / 2 : x) + 'px)';
    }
  }

  /* ---------- Les anneaux et les chiffres ---------- */
  var rings = document.querySelectorAll('.ring-item');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var item = e.target, num = item.querySelector('[data-count]');
        item.classList.add('on');
        io.unobserve(item);
        if (reduce || !num) return;
        var end = Number(num.getAttribute('data-count')), t0 = null;
        var tick = function (ts) {
          if (!t0) t0 = ts;
          var k = clamp((ts - t0) / 1400, 0, 1);
          num.textContent = Math.round(ease(k) * end);
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    rings.forEach(function (r) { io.observe(r); });
  } else {
    rings.forEach(function (r) { r.classList.add('on'); });
  }

  /* ---------- Boucle ---------- */
  var header = document.querySelector('.top');
  var queued = false;
  function frame() {
    queued = false;
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    if (scene) updateScene(vw, vh);
    if (header) header.classList.toggle('solid', scene ? scene.getBoundingClientRect().bottom < 70 : window.scrollY > 10);
    if (fill) updateFill(vh);
    if (tiles) updateTiles(vw, vh);
    if (wall) updateWall(vw, vh);
  }
  function request() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(request);
  frame();
})();

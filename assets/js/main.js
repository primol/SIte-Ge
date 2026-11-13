/* Navegação, revelações ao rolar, linha do tempo e fios decorativos. */
(function () {
  'use strict';
  window.__siteReady = true;

  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('menu');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVG = 'http://www.w3.org/2000/svg';

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* ---------- Menu ---------- */
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (toggle) {
    toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1100) setMenu(false); });
  }

  /* ---------- Link ativo ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[href^="#"]'));
  var sections = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  function setActive() {
    var line = window.innerHeight * 0.4, current = 0;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i] && sections[i].getBoundingClientRect().top <= line) current = i;
    }
    for (var j = 0; j < links.length; j++) {
      var on = j === current;
      links[j].classList.toggle('is-active', on);
      if (on) links[j].setAttribute('aria-current', 'true'); else links[j].removeAttribute('aria-current');
    }
  }

  /* ---------- Revelações ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Rede de conexões (seção Neuropsicologia) ---------- */
  (function () {
    var net = document.getElementById('neuroNet');
    if (!net) return;
    var NW = 760, NH = 520, seed = 23;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    net.setAttribute('viewBox', '0 0 ' + NW + ' ' + NH);
    net.setAttribute('preserveAspectRatio', 'xMaxYMin slice');

    var pts = [], tries = 0;
    while (pts.length < 26 && tries++ < 900) {
      var x = 40 + rnd() * (NW - 80), y = 30 + rnd() * (NH - 60), ok = true;
      // mais densidade no canto superior direito
      if (rnd() > (x / NW) * 0.9 + (1 - y / NH) * 0.5) continue;
      for (var i = 0; i < pts.length; i++) {
        var dx = pts[i][0] - x, dy = pts[i][1] - y;
        if (dx * dx + dy * dy < 78 * 78) { ok = false; break; }
      }
      if (ok) pts.push([x, y, 2 + rnd() * 2.6]);
    }
    var seen = {}, html = '';
    pts.forEach(function (a, i) {
      pts.map(function (b, j) { return [j, Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2)]; })
        .filter(function (d) { return d[0] !== i; })
        .sort(function (m, n) { return m[1] - n[1]; })
        .slice(0, 2)
        .forEach(function (d) {
          var key = Math.min(i, d[0]) + '-' + Math.max(i, d[0]);
          if (seen[key] || d[1] > 190 * 190) return;
          seen[key] = 1;
          var b = pts[d[0]];
          html += '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '"/>';
        });
    });
    pts.forEach(function (a, i) {
      html += '<circle cx="' + a[0].toFixed(1) + '" cy="' + a[1].toFixed(1) + '" r="' + a[2].toFixed(1) + '"' + (i % 4 === 0 ? ' class="is-pulse" style="animation-delay:' + (i * 0.37 % 3).toFixed(2) + 's"' : '') + '/>';
    });
    net.innerHTML = html;
  })();

  /* ---------- Espiral do contato: o fio, enfim, organizado ---------- */
  (function () {
    var sp = document.getElementById('spiral');
    if (!sp) return;
    var d = '', turns = 7, steps = 700;
    for (var i = 0; i <= steps; i++) {
      var th = (i / steps) * Math.PI * 2 * turns;
      var r = 6 + th * 4.45;
      d += (i ? 'L' : 'M') + (Math.cos(th) * r).toFixed(1) + ' ' + (Math.sin(th) * r).toFixed(1);
    }
    sp.setAttribute('d', d);
  })();

  /* ---------- Fios desenhados conforme a rolagem ---------- */
  var drawn = Array.prototype.slice.call(document.querySelectorAll('[data-draw]'));
  drawn.forEach(function (path) {
    path.setAttribute('pathLength', '1');
    path.style.strokeDasharray = '1';
    path.style.strokeDashoffset = reduce ? '0' : '1';
  });

  var tl = document.getElementById('timeline');
  var tlFill = tl && tl.querySelector('.tl__fill');
  var tlItems = tl ? Array.prototype.slice.call(tl.querySelectorAll('.tl__item')) : [];

  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    nav.classList.toggle('is-scrolled', window.scrollY > 12);
    setActive();

    if (tl) {
      var r = tl.getBoundingClientRect();
      if (r.bottom > -200 && r.top < vh + 200) {
        var h = Math.max(0, Math.min(r.height - 16, vh * 0.62 - r.top - 8));
        tlFill.style.height = h + 'px';
        tlItems.forEach(function (it) {
          it.classList.toggle('is-passed', h >= it.getBoundingClientRect().top - r.top - 2);
        });
      }
    }

    if (!reduce) {
      drawn.forEach(function (path) {
        var b = path.ownerSVGElement.getBoundingClientRect();
        if (b.bottom < -100 || b.top > vh + 100) return;
        var prog = clamp((vh * 0.92 - b.top) / (vh * 0.55 + b.height * 0.55));
        path.style.strokeDashoffset = String(1 - prog);
      });
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

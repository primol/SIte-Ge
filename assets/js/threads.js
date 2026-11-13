/* ==========================================================================
   Cena inicial: uma cabeça cheia de fios emaranhados.
   Ao rolar a página, cada fio é puxado para fora e se organiza em uma
   linha limpa que termina em uma função cognitiva.

   Cada fio é uma única polilinha: [emaranhado dentro da cabeça] + [saída
   organizada]. A animação só desloca a janela visível ao longo dessa linha,
   como um fio sendo puxado pelo próprio caminho.
   ========================================================================== */
(function () {
  'use strict';

  var hero = document.getElementById('inicio');
  var canvas = document.getElementById('fios');
  if (!hero || !canvas || !canvas.getContext) return;

  var stage = hero.querySelector('.hero__stage');
  var ctx = canvas.getContext('2d');
  var copy = document.getElementById('heroCopy');
  var cue = document.getElementById('heroCue');
  var caption = document.getElementById('heroCaption');
  var strandEls = Array.prototype.slice.call(hero.querySelectorAll('.strand'));
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqTall = window.matchMedia('(max-width: 899px), (max-aspect-ratio: 23/20)');

  /* ---------- Desenho da cabeça (perfil voltado para a direita) ---------- */
  var HEAD_W = 400, HEAD_H = 520;
  var HEAD_D = 'M 126 520 C 130 478 138 440 128 404 C 84 380 50 318 48 236 ' +
    'C 46 124 118 38 220 38 C 292 38 342 88 350 158 C 352 176 346 188 348 200 ' +
    'C 351 220 378 258 384 274 C 388 285 378 293 362 296 C 355 298 357 308 363 315 ' +
    'C 369 322 364 329 355 331 C 363 336 367 344 361 352 C 356 359 349 362 351 371 ' +
    'C 355 388 350 404 332 412 C 306 423 268 420 252 428 C 240 434 236 476 242 520';
  var CROWN = { x: 220, y: 38 };                      // por onde os fios saem
  var BALL = { cx: 200, cy: 192, rx: 124, ry: 112 };  // região do emaranhado

  var COLORS = ['#193653', '#2b5f8f', '#3f84bd', '#62a6d8', '#8ec3ea'];
  var N = COLORS.length;
  var TAU = Math.PI * 2;

  /* ---------- Roteiro da rolagem (0 → 1) ---------- */
  var T0 = 0.07;        // início da saída do primeiro fio
  var STAG = 0.125;     // intervalo entre fios
  var HEAD_DUR = 0.28;  // tempo para a ponta chegar ao destino
  var TAIL_LAG = 0.05;  // atraso para o emaranhado começar a esvaziar
  var TAIL_DUR = 0.30;

  var headPath = new Path2D(HEAD_D);
  var headShape = new Path2D(HEAD_D + ' Z');
  var headLen = (function () {
    try {
      var el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      el.setAttribute('d', HEAD_D);
      return el.getTotalLength() || 1500;
    } catch (e) { return 1500; }
  })();

  /* ---------- Utilidades ---------- */
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // Spline Catmull-Rom passando por todos os pontos
  function spline(pts, seg) {
    var out = [], n = pts.length;
    for (var i = 0; i < n - 1; i++) {
      var p0 = pts[i ? i - 1 : 0], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2 < n ? i + 2 : n - 1];
      for (var j = 0; j < seg; j++) {
        var t = j / seg, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (p2[0] - p0[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (p2[1] - p0[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    out.push(pts[n - 1]);
    return out;
  }

  function cubic(out, a, c1, c2, b, n) {
    for (var i = 1; i <= n; i++) {
      var t = i / n, u = 1 - t;
      out.push([
        u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0],
        u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1]
      ]);
    }
  }

  // Reamostra a polilinha com espaçamento uniforme
  function resample(pts, step) {
    var out = [pts[0]], carry = 0;
    for (var i = 1; i < pts.length; i++) {
      var ax = pts[i - 1][0], ay = pts[i - 1][1];
      var dx = pts[i][0] - ax, dy = pts[i][1] - ay;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (!d) continue;
      var pos = step - carry;
      while (pos <= d) { out.push([ax + dx * pos / d, ay + dy * pos / d]); pos += step; }
      carry = d - (pos - step);
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  /* ---------- Emaranhado: gerado uma vez, em coordenadas da cabeça ---------- */
  var TANGLE = (function () {
    var rng = mulberry32(11);
    var list = [];
    for (var k = 0; k < N; k++) {
      var pts = [], ang = rng() * TAU, n = 19 + Math.floor(rng() * 5);
      var ccx = BALL.cx + (rng() - 0.5) * 26, ccy = BALL.cy + (rng() - 0.5) * 22;
      for (var i = 0; i < n; i++) {
        ang += 1.05 + rng() * 1.9;
        var r = rng() < 0.28 ? 0.08 + rng() * 0.34 : 0.5 + 0.5 * Math.pow(rng(), 0.6);
        pts.push([ccx + Math.cos(ang) * BALL.rx * r, ccy + Math.sin(ang) * BALL.ry * r]);
      }
      list.push(pts);
    }
    return list;
  })();

  /* ---------- Estado ---------- */
  var W = 0, H = 0, dpr = 1, wide = true;
  var s = 1, ox = 0, oy = 0, lineW = 1.6;
  var threads = [], nodes = [];
  var fillGrad = null, strokeGrad = null;
  var p = 0, intro = 0, last = 0, raf = 0, visible = true, started = false;
  var capOn = false, lastFade = -1;
  var ptr = { x: 0, y: 0, tx: 0, ty: 0, k: 0, on: false };

  function build() {
    var rect = stage.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    wide = !mqTall.matches;

    var navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64;

    if (wide) {
      s = Math.min(H * 0.74 / HEAD_H, W * 0.35 / HEAD_W);
      ox = Math.max(W * 0.04, W * 0.245 - HEAD_W * s / 2);
      oy = H - HEAD_H * s * 0.93;
    } else {
      // retrato: a cabeça ocupa a parte de baixo, logo abaixo do texto
      var copyBottom = copy ? copy.offsetTop + copy.offsetHeight : H * 0.45;
      var avail = H - 18 - (copyBottom + 14);
      s = Math.min(H * 0.6 / HEAD_H, W * 0.82 / HEAD_W, avail / (430 - CROWN.y));
      s = Math.max(s, 0.42);
      ox = (W - HEAD_W * s) / 2 + W * 0.06;
      oy = H - 18 - 430 * s;
    }
    lineW = Math.max(1.25, Math.min(2.1, 1 + s * 0.6));

    fillGrad = ctx.createLinearGradient(0, 0, 0, HEAD_H);
    fillGrad.addColorStop(0, '#cfe6f7');
    fillGrad.addColorStop(0.7, '#d6eaf8');
    fillGrad.addColorStop(1, 'rgba(214,234,248,0)');
    strokeGrad = ctx.createLinearGradient(0, 0, 0, HEAD_H);
    strokeGrad.addColorStop(0, '#193653');
    strokeGrad.addColorStop(0.8, '#193653');
    strokeGrad.addColorStop(1, 'rgba(25,54,83,0)');

    var px = ox + CROWN.x * s, py = oy + CROWN.y * s;
    var gap = 5 * s;
    var step = 3;
    var k;

    nodes = [];
    if (wide) {
      var nx = W * 0.6, y0 = H * 0.29, dy = Math.min(H * 0.096, 98);
      for (k = 0; k < N; k++) nodes.push({ x: nx, y: y0 + k * dy });
    } else {
      var mx = Math.max(46, W * 0.12), my0 = navH + Math.max(46, H * 0.085);
      var room = (oy + CROWN.y * s) - my0 - 100;
      var mdy = Math.max(30, Math.min(58, room / (N - 1)));
      for (k = 0; k < N; k++) nodes.push({ x: mx, y: my0 + k * mdy });
    }

    threads = [];
    for (k = 0; k < N; k++) {
      var node = nodes[k];
      var portX = (k - 2) * gap;                 // fio 0 sai mais à esquerda
      var ax = px + portX, ay = py;
      var i;

      // 1) emaranhado + subida até o topo da cabeça (a subida só aparece ao rolar)
      var body = TANGLE[k];
      var local = body.concat([[CROWN.x + portX / s - 8, CROWN.y + 104], [CROWN.x + portX / s, CROWN.y + 54], [CROWN.x + portX / s, CROWN.y]]);
      var sp = spline(local, 16);
      for (i = 0; i < sp.length; i++) sp[i] = [ox + sp[i][0] * s, oy + sp[i][1] * s];
      var cut = (body.length - 1) * 16;
      var ball = resample(sp.slice(0, cut + 1), step);
      var riser = resample(sp.slice(cut), step);
      var A0 = ball.length - 1;
      var tangle = ball.concat(riser.slice(1));

      // 2) saída organizada até o destino
      var exit = [[ax, ay]];
      if (wide) {
        var topRoom = py - (navH + 26);
        var R0 = Math.min(topRoom, 150 * s);
        var lane = Math.max(9, Math.min(18, R0 * 0.085));
        var R = R0 - k * lane;
        var bx = ax + R, by = ay - R;
        cubic(exit, [ax, ay], [ax, ay - R * 0.5523], [bx - R * 0.5523, by], [bx, by], 40);
        var d = (node.x - bx) * 0.5;
        cubic(exit, [bx, by], [bx + d, by], [node.x - d, node.y], [node.x, node.y], 90);
      } else {
        // sobe, curva à esquerda, corre em paralelo, sobe pela margem e entra no destino
        var r = 10 + (N - 1 - k) * 6;            // raio do gancho final; fio 0 é o mais externo
        var laneX = node.x - r;
        var R1 = 24 + k * 6;                     // primeira curva (fio 4 por fora)
        var R2 = 12 + (N - 1 - k) * 6;           // segunda curva (fio 0 por fora)
        var runY = ay - R1;
        cubic(exit, [ax, ay], [ax, ay - R1 * 0.5523], [ax - R1 * 0.4477, runY], [ax - R1, runY], 22);
        exit.push([laneX + R2, runY]);
        cubic(exit, [laneX + R2, runY], [laneX + R2 * 0.4477, runY], [laneX, runY - R2 * 0.4477], [laneX, runY - R2], 22);
        exit.push([laneX, node.y + r]);
        cubic(exit, [laneX, node.y + r], [laneX, node.y + r * 0.4477], [node.x - r * 0.5523, node.y], [node.x, node.y], 22);
      }
      exit = resample(exit, step);

      var A = tangle.length - 1;
      var all = tangle.concat(exit.slice(1));
      var n = all.length;
      var th = {
        x: new Float32Array(n), y: new Float32Array(n),
        nx: new Float32Array(n), ny: new Float32Array(n),
        A0: A0, A: A, n: n, color: COLORS[k], on: false
      };
      for (i = 0; i < n; i++) { th.x[i] = all[i][0]; th.y[i] = all[i][1]; }
      for (i = A; i < n; i++) {
        var i0 = Math.max(A, i - 1), i1 = Math.min(n - 1, i + 1);
        var tx = th.x[i1] - th.x[i0], ty = th.y[i1] - th.y[i0];
        var tl = Math.sqrt(tx * tx + ty * ty) || 1;
        th.nx[i] = -ty / tl; th.ny[i] = tx / tl;
      }
      threads.push(th);

      if (strandEls[k]) {
        strandEls[k].style.transform = 'translate(' + node.x.toFixed(1) + 'px,' + node.y.toFixed(1) + 'px)';
        strandEls[k].classList.remove('is-on');
      }
    }

    if (caption) {
      if (wide) {
        caption.style.left = (nodes[0].x + 22) + 'px';
        caption.style.top = (nodes[N - 1].y + Math.min(64, H * 0.075)) + 'px';
      } else {
        caption.style.left = (nodes[0].x + 22) + 'px';
        caption.style.top = (nodes[0].y - 42) + 'px';
      }
    }
    capOn = false; lastFade = -1;
    if (caption) caption.classList.remove('is-on');
  }

  /* ---------- Progresso da rolagem ---------- */
  function measure() {
    var total = hero.offsetHeight - H;
    if (total <= 0) return 0;
    return clamp(-hero.getBoundingClientRect().top / total);
  }

  /* ---------- Desenho ---------- */
  var qx = 0, qy = 0;
  function point(th, i, t, k, wob) {
    var x = th.x[i], y = th.y[i];
    if (i < th.A) {
      var near = Math.min(1, (th.A - i) / 40);
      if (wob) {
        var wt = 1.25 * s * near;
        x += (Math.sin(i * 0.043 + t * 1.05 + k * 1.7) + Math.sin(i * 0.0117 - t * 0.63 + k)) * wt;
        y += (Math.cos(i * 0.037 - t * 0.92 + k * 2.3) + Math.sin(i * 0.0093 + t * 0.51 + k * 0.7)) * wt;
      }
      if (ptr.k > 0.01) {
        var dx = x - ptr.x, dy = y - ptr.y, R = 84 * s;
        var d2 = dx * dx + dy * dy;
        if (d2 < R * R) {
          var d = Math.sqrt(d2) + 0.001, f = 1 - d / R;
          f = f * f * 18 * s * ptr.k * near;
          x += dx / d * f; y += dy / d * f;
        }
      }
    } else if (wob) {
      var u = (i - th.A) / (th.n - 1 - th.A);
      var w = Math.sin(u * 8 - t * 0.9 + k * 1.3) * Math.sin(Math.PI * u) * 3.2;
      x += th.nx[i] * w; y += th.ny[i] * w;
    }
    qx = x; qy = y;
  }

  function strokeThread(th, a, b, t, k, wob) {
    var i0 = Math.ceil(a), i1 = Math.floor(b), i;
    ctx.beginPath();
    if (i0 > a && i0 >= 1) {
      point(th, i0 - 1, t, k, wob); var x0 = qx, y0 = qy;
      point(th, i0, t, k, wob);
      var f = a - (i0 - 1);
      ctx.moveTo(x0 + (qx - x0) * f, y0 + (qy - y0) * f);
    } else {
      point(th, i0, t, k, wob); ctx.moveTo(qx, qy);
    }
    for (i = i0; i <= i1; i++) { point(th, i, t, k, wob); ctx.lineTo(qx, qy); }
    if (b > i1 && i1 + 1 < th.n) {
      var x1 = qx, y1 = qy;
      point(th, i1 + 1, t, k, wob);
      var g = b - i1;
      ctx.lineTo(x1 + (qx - x1) * g, y1 + (qy - y1) * g);
    }
    ctx.strokeStyle = th.color;
    ctx.stroke();
  }

  function draw(t) {
    var still = mqReduce.matches;
    var wob = !still;
    var iLine = still ? 1 : easeOut(clamp(intro / 0.5));
    var iFill = still ? 1 : clamp((intro - 0.1) / 0.45);
    var k;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // cabeça: forma azul bebê deslocada + contorno fino
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(s, s);
    ctx.globalAlpha = iFill;
    ctx.save();
    ctx.translate(13, 10);
    ctx.fillStyle = fillGrad;
    ctx.fill(headShape);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = lineW * 1.05 / s;
    ctx.strokeStyle = strokeGrad;
    if (iLine < 1) ctx.setLineDash([headLen * iLine, headLen * 1.2]);
    ctx.stroke(headPath);
    ctx.setLineDash([]);
    ctx.restore();

    // fios
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = lineW;
    ctx.globalAlpha = 0.94;
    var done = 0;
    for (k = 0; k < N; k++) {
      var th = threads[k];
      var st = T0 + k * STAG;
      var hp = clamp((p - st) / HEAD_DUR);
      var tp = clamp((p - st - TAIL_LAG) / TAIL_DUR);
      var grow = still ? 1 : easeInOut(clamp((intro - 0.08 - k * 0.07) / 0.62));
      var a = easeInOut(tp) * th.A;
      var b = th.A0 * grow + easeInOut(hp) * (th.n - 1 - th.A0);
      if (b - a >= 1) strokeThread(th, a, b, t, k, wob);

      var on = hp >= 0.97;
      if (on) done++;
      if (on !== th.on) {
        th.on = on;
        if (strandEls[k]) strandEls[k].classList.toggle('is-on', on);
      }
    }
    ctx.globalAlpha = 1;

    // ponto de saída no topo da cabeça, quando tudo está organizado
    if (done) {
      var px = ox + CROWN.x * s, py = oy + CROWN.y * s;
      ctx.beginPath();
      ctx.arc(px, py, 2.2 + done * 0.5, 0, TAU);
      ctx.fillStyle = '#193653';
      ctx.fill();
    }

    var cap = done === N;
    if (cap !== capOn) { capOn = cap; if (caption) caption.classList.toggle('is-on', cap); }
  }

  function updateCopy() {
    var f = Math.round(clamp(p / 0.085) * 200) / 200;
    if (f === lastFade) return;
    lastFade = f;
    if (copy) {
      copy.style.opacity = String(1 - f);
      copy.style.translate = '0 ' + (-f * 40).toFixed(1) + 'px';
      copy.style.visibility = f >= 1 ? 'hidden' : 'visible';
      copy.style.pointerEvents = f > 0.5 ? 'none' : '';
    }
    if (cue) cue.style.opacity = String(1 - clamp(p / 0.03));
  }

  function frame(now) {
    raf = 0;
    var t = now / 1000;
    var dt = last ? Math.min(0.05, t - last) : 0.016;
    last = t;

    var target = measure();
    if (!started) {
      started = true;
      if (target > 0.004) { intro = 1; p = target; }
    }
    p += (target - p) * (1 - Math.exp(-dt * 9));
    if (Math.abs(target - p) < 0.0003) p = target;
    if (intro < 1) intro = Math.min(1, intro + dt / 2.8);

    ptr.x += (ptr.tx - ptr.x) * 0.2;
    ptr.y += (ptr.ty - ptr.y) * 0.2;
    ptr.k += ((ptr.on ? 1 : 0) - ptr.k) * 0.1;

    draw(t);
    updateCopy();
    if (visible) raf = requestAnimationFrame(frame);
  }

  function renderStill() {
    p = 0; intro = 1;
    draw(0);
    if (copy) { copy.style.opacity = ''; copy.style.translate = ''; copy.style.visibility = ''; }
  }

  function start() {
    if (mqReduce.matches) { renderStill(); return; }
    if (!raf && visible) { last = 0; raf = requestAnimationFrame(frame); }
  }

  /* ---------- Eventos ---------- */
  var resizeRaf = 0;
  function onResize() {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(function () {
      resizeRaf = 0;
      var rect = stage.getBoundingClientRect();
      if (Math.round(rect.width) === W && Math.round(rect.height) === H && wide === !mqTall.matches) return;
      build();
      if (mqReduce.matches) renderStill();
    });
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }, { rootMargin: '80px' }).observe(hero);
  }

  stage.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    var r = stage.getBoundingClientRect();
    ptr.tx = e.clientX - r.left; ptr.ty = e.clientY - r.top;
    if (!ptr.on) { ptr.x = ptr.tx; ptr.y = ptr.ty; }
    ptr.on = true;
  });
  stage.addEventListener('pointerleave', function () { ptr.on = false; });

  var onMotionChange = function () { build(); if (mqReduce.matches) { cancelAnimationFrame(raf); raf = 0; renderStill(); } else start(); };
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', onMotionChange);

  build();
  start();
})();

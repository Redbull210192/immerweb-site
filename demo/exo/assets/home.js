/* Accueil : hero cinématique + sections dynamiques */
(function () {
  'use strict';
  var hero = document.getElementById('hero');
  EXO.init({ active: 'index.html', dark: true, solidAfter: function () { return hero.offsetHeight - innerHeight - 10; }, floatAfter: innerHeight * 3 });

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stage = hero.querySelector('.hero-stage');
  var steps = [].slice.call(hero.querySelectorAll('.hero-step')).map(function (el) {
    return { el: el, s: el.dataset.s.split(',').map(Number) };
  });
  var bar = document.getElementById('heroBar');

  function progress() {
    var r = hero.getBoundingClientRect(), total = hero.offsetHeight - innerHeight;
    return Math.min(1, Math.max(0, -r.top / (total || 1)));
  }
  function stepsUpdate(p) {
    steps.forEach(function (st) {
      var a = st.s[0], b = st.s[1], c = st.s[2], d = st.s[3], o;
      if (p < a) o = 0; else if (p < b) o = (p - a) / (b - a || 1); else if (p < c) o = 1; else if (p < d) o = 1 - (p - c) / (d - c); else o = 0;
      if (a === 0 && b === 0 && p < c) o = 1;
      var y = p < b ? (1 - o) * 40 : -(1 - o) * 40;
      st.el.style.opacity = o.toFixed(3);
      st.el.style.transform = 'translateY(' + y.toFixed(1) + 'px) scale(' + (1 + (1 - o) * 0.04).toFixed(3) + ')';
      st.el.style.visibility = o > 0.01 ? 'visible' : 'hidden';
    });
    bar.style.width = (p * 100).toFixed(1) + '%';
  }

  /* --- lecteur de séquence d'images (canvas) --- */
  function framePlayer(m) {
    var mobile = innerWidth < 768 && m.mobile;
    var count = mobile ? m.mobile.count : m.count, path = mobile ? m.mobile.path : m.path;
    var start = m.start != null ? m.start : 1;
    function url(i) { return path.replace(/%0(\d)d/, function (_, w) { var s = String(i + start); while (s.length < +w) s = '0' + s; return s; }); }
    var cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
    var ctx = cv.getContext('2d');
    var imgs = new Array(count), loaded = new Uint8Array(count), cur = 0, shown = -1, ready = false;
    function size() {
      var dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = stage.clientWidth * dpr; cv.height = stage.clientHeight * dpr; shown = -1;
    }
    function draw(i) {
      var img = imgs[i]; if (!img) return;
      var cw = cv.width, ch = cv.height, ir = img.naturalWidth / img.naturalHeight, cr = cw / ch, w, h;
      if (cr > ir) { w = cw; h = cw / ir; } else { h = ch; w = ch * ir; }
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    }
    function nearest(t) {
      for (var d = 0; d < count; d++) { if (t - d >= 0 && loaded[t - d]) return t - d; if (t + d < count && loaded[t + d]) return t + d; }
      return -1;
    }
    // ordre de chargement : grossier → fin (on voit vite tout le film, puis il devient fluide)
    var order = [], seen = new Uint8Array(count);
    for (var step = 32; step >= 1; step = step / 2) for (var i = 0; i < count; i += step) if (!seen[i]) { seen[i] = 1; order.push(i); }
    if (!seen[count - 1]) order.push(count - 1);
    var q = 0, active = 0, failed = 0, dead = false;
    function next() {
      while (active < 6 && q < order.length) {
        (function (i) {
          active++;
          var im = new Image(); im.decoding = 'async';
          im.onload = function () {
            imgs[i] = im; loaded[i] = 1; active--;
            if (!ready) { ready = true; size(); stage.insertBefore(cv, stage.firstChild); var st = document.getElementById('heroStatic'); if (st) st.style.opacity = 0; }
            next();
          };
          im.onerror = function () { active--; failed++; if (!ready && failed >= 8) { q = order.length; if (!dead) { dead = true; videoPlayer(); } return; } next(); };
          im.src = url(i);
        })(order[q++]);
      }
    }
    next();
    addEventListener('resize', size);
    return function (p) {
      if (!ready) return;
      var target = p * (count - 1);
      cur += (target - cur) * (reduce ? 1 : 0.2);
      var f = nearest(Math.round(cur));
      if (f >= 0 && f !== shown) { draw(f); shown = f; }
    };
  }

  /* --- repli : vidéo pilotée par le scroll --- */
  var vidUpdate = null;
  function videoPlayer() {
    var v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto'; v.setAttribute('aria-hidden', 'true');
    // la vidéo est chargée en entier (blob) : le scrub marche même sur un serveur sans « Range »
    fetch('v/hero.mp4').then(function (r) { if (!r.ok) throw 0; return r.blob(); })
      .then(function (bl) { v.src = URL.createObjectURL(bl); })
      .catch(function () { vidUpdate = null; });
    var target = 0;
    v.addEventListener('loadeddata', function () {
      stage.insertBefore(v, stage.firstChild);
      var st = document.getElementById('heroStatic'); if (st) st.style.opacity = 0;
      var pr = v.play(); if (pr && pr.then) pr.then(function () { v.pause(); }).catch(function () {});
    });
    v.addEventListener('error', function () { vidUpdate = null; });
    vidUpdate = function (p) {
      var d = v.duration; if (!d || !isFinite(d)) return;
      target += (Math.min(d - 0.05, p * d) - target) * 0.2;
      if (!v.seeking && Math.abs(v.currentTime - target) > 0.03) v.currentTime = target;
    };
  }

  var frameUpdate = null;
  fetch('hero/manifest.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (m) { if (!m || !m.count || !m.path) throw 0; frameUpdate = framePlayer(m); })
    .catch(function () { videoPlayer(); });

  (function loop() {
    var p = progress();
    stepsUpdate(p);
    if (frameUpdate) frameUpdate(p);
    if (vidUpdate) vidUpdate(p);
    requestAnimationFrame(loop);
  })();

  /* --- intro : les mots s'allument --- */
  var intro = document.getElementById('introText');
  (function split(node) {
    [].slice.call(node.childNodes).forEach(function (c) {
      if (c.nodeType === 3) {
        var frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
          var s = document.createElement('span'); s.className = 'w'; s.textContent = w; frag.appendChild(s);
        });
        c.parentNode.replaceChild(frag, c);
      } else split(c);
    });
  })(intro);
  var words = intro.querySelectorAll('.w');
  function introUpdate() {
    var r = intro.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
    var n = Math.round(p * words.length);
    words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
  }
  addEventListener('scroll', introUpdate, { passive: true }); introUpdate();

  /* --- parallaxe plein cadre --- */
  var px = document.querySelector('[data-parallax]');
  if (px && !reduce) addEventListener('scroll', function () {
    var r = px.parentNode.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    px.style.transform = 'translateY(' + ((r.top / innerHeight) * -8).toFixed(2) + '%)';
  }, { passive: true });

  /* --- vidéo de visite : lecture quand visible --- */
  var vv = document.getElementById('visitVid');
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { vv.preload = 'auto'; var p = vv.play(); if (p && p.catch) p.catch(function () {}); } else vv.pause(); });
  }, { threshold: 0.35 }).observe(vv);

  /* --- formulaire de recherche --- */
  var f = document.getElementById('searchForm');
  var sAd = document.getElementById('sAd'), sEn = document.getElementById('sEn');
  for (var i = 1; i <= 9; i++) sAd.add(new Option(i, i, i === 2, i === 2));
  for (var j = 0; j <= 6; j++) sEn.add(new Option(j, j));
  var today = EXO.isoD(new Date()), sA = document.getElementById('sA'), sD = document.getElementById('sD');
  sA.min = today; sD.min = today;
  sA.addEventListener('change', function () {
    if (!sA.value) return;
    var n = EXO.isoD(new Date(EXO.parseD(sA.value).getTime() + 864e5)); sD.min = n;
    if (!sD.value || sD.value <= sA.value) sD.value = EXO.isoD(new Date(EXO.parseD(sA.value).getTime() + 7 * 864e5));
  });
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var p = new URLSearchParams();
    new FormData(f).forEach(function (v, k) { if (v !== '' && !(k === 'enfants' && v === '0')) p.set(k, v); });
    location.href = 'biens.html' + (p.toString() ? '?' + p : '');
  });

  /* --- données --- */
  var LIVRE = [
    { t: 'Grande maison bord de mer à Miraflores, Mijas', q: 'Je ne peux pas imaginer un meilleur emplacement sur la Costa del Sol. Les images ne montrent pas toute la beauté de la maison et de son emplacement.', w: 'Rachel', p: 'Boulder, Colorado · janvier 2019' },
    { t: 'Grand appartement 3 chambres à Las Terrazas de Marbella, Cabopino', q: 'Absolument incroyable ! Super élégant et propre ! Aussi la vue est sur le point !', w: 'Helmut', p: 'Essen, Allemagne · février 2019' },
    { t: 'Superbe villa de plein-pied à Mijas', q: 'Les hôtes étaient très amicaux et serviables, et ils ont répondu à toutes nos questions. Merci beaucoup pour la semaine merveilleuse !', w: 'Päivi', p: 'Ii, Finlande · décembre 2018' },
    { t: 'Appartement sur le golf d’Estepona', q: 'Très bel appartement bien aménagé, frais et moderne. Très bon appartement pour les golfeurs.', w: 'Eva', p: 'Stockholm, Suède · octobre 2018' }
  ];
  EXO.biens().then(function (B) {
    document.querySelectorAll('[data-count-biens]').forEach(function (e) { e.textContent = B.length; });
    var rated = B.filter(function (b) { return b.rating; });
    var avg = rated.reduce(function (s, b) { return s + b.rating; }, 0) / rated.length;
    document.getElementById('avgRate').textContent = avg.toFixed(1).replace('.', ',');

    var top = B.slice().sort(function (a, b) { return (b.rating || 0) - (a.rating || 0) || b.avis_count - a.avis_count; }).slice(0, 6);
    var fe = document.getElementById('featured');
    fe.innerHTML = top.map(function (b) { return EXO.card(b, { rv: true }); }).join('');
    EXO.bindCards(fe);

    // villes
    var towns = {};
    B.forEach(function (b) { if (!b.town) return; (towns[b.town] = towns[b.town] || []).push(b); });
    var tw = Object.keys(towns).sort(function (a, b) { return towns[b].length - towns[a].length; });
    document.getElementById('towns').innerHTML = tw.map(function (t) {
      var list = towns[t].slice().sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); });
      var min = Math.min.apply(null, list.map(function (b) { return b.prix_min || 1e9; }));
      return '<a class="town rv" href="biens.html?ville=' + encodeURIComponent(t) + '"><img src="' + EXO.esc(EXO.thumb(list[0].photos[0])) + '" alt="' + EXO.esc(t) + '" loading="lazy"><div><b>' + EXO.esc(t) + '</b><span>' + EXO.plural(list.length, 'logement') + (min < 1e9 ? ' · dès ' + EXO.eur(min, 0) + ' / nuit' : '') + '</span></div></a>';
    }).join('');

    // avis
    var revs = [];
    B.slice().sort(function (a, b) { return b.avis_count - a.avis_count; }).forEach(function (b) {
      var r = b.avis.filter(function (a) { return a.texte.length && a.texte[0].length > 60; })[0];
      if (r) revs.push({ t: r.titre, q: r.texte[0], w: r.auteur, p: (r.pays || '') + (r.age ? ' · il y a ' + r.age : ''), ref: b.ref });
    });
    var mix = [];
    revs.slice(0, 10).forEach(function (r, i) { mix.push(r); if (i % 3 === 1 && LIVRE.length) mix.push(LIVRE.shift()); });
    mix = mix.concat(LIVRE);
    function cut(s) { return s.length > 230 ? s.slice(0, 225).replace(/\s+\S*$/, '') + '…' : s; }
    var rv = document.getElementById('reviews');
    rv.innerHTML = mix.map(function (r) {
      return '<figure class="rev" style="margin:0"><p class="t">' + EXO.esc(r.t) + '</p><q>' + EXO.esc(cut(r.q)) + '</q><figcaption class="who"><b>' + EXO.esc(r.w) + '</b> · ' + EXO.esc(r.p) +
        (r.ref ? '<br><a class="src" href="bien.html?ref=' + r.ref + '">Réf. ' + r.ref + ' →</a>' : '<br><span class="src">Livre d’or</span>') + '</figcaption></figure>';
    }).join('');
    document.querySelectorAll('.rev-nav button').forEach(function (b) {
      b.addEventListener('click', function () { rv.scrollBy({ left: +b.dataset.dir * Math.min(rv.clientWidth * 0.8, 440), behavior: 'smooth' }); });
    });
    EXO.reveal();
  }).catch(function (e) { console.warn('Données indisponibles', e); });
})();

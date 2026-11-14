/* EXO IMMO MARBELLA — script commun (démo Immerweb) */
(function () {
  'use strict';
  var EXO = window.EXO = {};
  EXO.WA = '34664626414';
  EXO.OFFICIAL = 'https://www.exoimmo-marbella.com';
  EXO.EMAIL = 'office@exoimmo-marbella.com';

  /* ---------- utilitaires ---------- */
  var esc = EXO.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  EXO.eur = function (n, dec) {
    if (n == null || isNaN(n)) return '–';
    var d = dec === undefined ? (Math.round(n) === n ? 0 : 2) : dec;
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n) + ' €';
  };
  EXO.qs = function (k) { return new URLSearchParams(location.search).get(k); };
  EXO.thumb = function (p) { return /^https?:/.test(p) ? p : p.replace(/\/(\d+\.jpg)$/, '/t/$1'); };
  EXO.store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  EXO.waLink = function (text) { return 'https://wa.me/' + EXO.WA + '?text=' + encodeURIComponent(text); };
  EXO.plural = function (n, s, p) { return n + ' ' + (n > 1 ? (p || s + 's') : s); };
  EXO.fmtDist = function (m) { if (m == null) return null; return m < 1000 ? m + ' m' : (m / 1000).toFixed(m % 1000 ? 1 : 0).replace('.', ',') + ' km'; };

  /* ---------- icônes ---------- */
  var I = EXO.icons = {
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.3C1.5 8 3.6 4.5 7.1 4.5c2 0 3.5 1.1 4.9 2.9 1.4-1.8 2.9-2.9 4.9-2.9 3.5 0 5.6 3.5 4.4 6.7-1.8 4.7-9.3 9.3-9.3 9.3z"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.7-.3-1.4-.7-2-1.3-.6-.5-1-1.1-1.4-1.8-.1-.2 0-.4.1-.5l.4-.5.3-.5v-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.6-1 2.5.1 1.1.5 2.1 1.2 3 1.2 1.8 2.8 3.2 4.7 4.1.5.2 1 .4 1.5.5.6.2 1.2.2 1.8.1.6-.1 1.4-.6 1.6-1.2.2-.5.2-1 .1-1.2l-.5-.2z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    bed: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 25V8M3 19h26v6M29 19v-4a3 3 0 0 0-3-3H14v7M8 16a2.5 2.5 0 1 0 0-.1"/></svg>',
    bath: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 16h24v3a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6zM8 16V7a3 3 0 0 1 6 0M9 25l-1 3M23 25l1 3"/></svg>',
    fb: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M14 8V6.5c0-.7.2-1.2 1.2-1.2H17V2.2C16.6 2.1 15.6 2 14.5 2 12 2 10.5 3.5 10.5 6.2V8H8v3.4h2.5V22H14V11.4h2.6L17 8z"/></svg>'
  };

  /* ---------- données ---------- */
  var _biens;
  EXO.biens = function () {
    if (!_biens) _biens = fetch('data/biens.json').then(function (r) { if (!r.ok) throw new Error('data'); return r.json(); });
    return _biens;
  };
  var _pages;
  EXO.pages = function () {
    if (!_pages) _pages = fetch('data/pages-fr.json').then(function (r) { return r.json(); });
    return _pages;
  };

  /* ---------- favoris ---------- */
  EXO.favs = function () { return EXO.store.get('exo-favs', []); };
  EXO.isFav = function (ref) { return EXO.favs().indexOf(String(ref)) > -1; };
  EXO.toggleFav = function (ref) {
    ref = String(ref);
    var f = EXO.favs(), i = f.indexOf(ref);
    if (i > -1) f.splice(i, 1); else f.push(ref);
    EXO.store.set('exo-favs', f);
    EXO.updateFavCount();
    document.querySelectorAll('.heart[data-ref="' + ref + '"]').forEach(function (h) {
      h.classList.toggle('on', i < 0);
      h.setAttribute('aria-pressed', i < 0 ? 'true' : 'false');
    });
    document.dispatchEvent(new CustomEvent('favs-change'));
    return i < 0;
  };
  EXO.updateFavCount = function () {
    var n = EXO.favs().length;
    document.querySelectorAll('.fav-link .n').forEach(function (e) { e.textContent = n ? n : ''; });
  };
  EXO.heart = function (ref) {
    var on = EXO.isFav(ref);
    return '<button class="heart' + (on ? ' on' : '') + '" data-ref="' + esc(ref) + '" aria-pressed="' + on + '" aria-label="Ajouter le bien ' + esc(ref) + ' à mes favoris" type="button">' + I.heart + '</button>';
  };
  document.addEventListener('click', function (e) {
    var h = e.target.closest('.heart');
    if (h) { e.preventDefault(); e.stopPropagation(); EXO.toggleFav(h.dataset.ref); }
  });

  /* ---------- estimation ---------- */
  function parseD(s) { var p = s.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  EXO.parseD = parseD;
  EXO.isoD = function (d) { return d.toISOString().slice(0, 10); };
  EXO.frD = function (s) { if (!s) return ''; var p = s.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; };
  EXO.estimate = function (b, a, d) {
    if (!a || !d) return null;
    var A = parseD(a), D = parseD(d);
    if (!(D > A)) return null;
    var nights = Math.round((D - A) / 864e5), groups = [], missing = 0, rent = 0;
    for (var i = 0; i < nights; i++) {
      var day = EXO.isoD(new Date(A.getTime() + i * 864e5)), p = null;
      for (var k = 0; k < b.tarifs.length; k++) { if (day >= b.tarifs[k].from && day <= b.tarifs[k].to) { p = b.tarifs[k].price; break; } }
      if (p == null) { missing++; continue; }
      rent += p;
      var g = groups[groups.length - 1];
      if (g && g.price === p) g.n++; else groups.push({ price: p, n: 1 });
    }
    return { nights: nights, groups: groups, rent: rent, missing: missing, menage: b.menage || 0, total: rent + (b.menage || 0) };
  };

  /* ---------- carte de bien ---------- */
  EXO.card = function (b, o) {
    o = o || {};
    var href = 'bien.html?ref=' + encodeURIComponent(b.ref);
    var ph = b.photos.slice(0, 5);
    var slides = ph.map(function (p, i) {
      return '<a href="' + href + '" tabindex="-1" aria-hidden="' + (i ? 'true' : 'false') + '"><img src="' + esc(EXO.thumb(p)) + '" alt="' + esc(b.short + ' — photo ' + (i + 1)) + '" loading="lazy" decoding="async" width="760" height="526"></a>';
    }).join('');
    var dots = ph.map(function (_, i) { return '<i' + (i ? '' : ' class="on"') + '></i>'; }).join('');
    var rate = b.rating ? '<span class="rate">' + I.star + String(b.rating).replace('.', ',') + (b.avis_count ? ' <small>(' + b.avis_count + ' avis)</small>' : '') + '</span>' : '<span class="rate"><small>Nouveau</small></span>';
    var est = '';
    if (o.a && o.d) {
      var e = EXO.estimate(b, o.a, o.d);
      if (e && !e.missing) est = '<span class="est">' + EXO.eur(e.total, 0) + ' pour ' + EXO.plural(e.nights, 'nuit') + ' · estimation</span>';
      else if (e) est = '<span class="est">Tarif à confirmer pour ces dates</span>';
    }
    var plage = b.plage_m != null ? '<span>Plage ' + EXO.fmtDist(b.plage_m) + '</span>' : '';
    return '<article class="card' + (o.rv ? ' rv' : '') + '" data-ref="' + esc(b.ref) + '">' +
      '<div class="media"><div class="slides">' + slides + '</div>' +
      (ph.length > 1 ? '<button class="arr p" type="button" aria-label="Photo précédente">‹</button><button class="arr n" type="button" aria-label="Photo suivante">›</button><div class="dots">' + dots + '</div>' : '') +
      '<span class="badge">Réf. ' + esc(b.ref) + '</span>' + EXO.heart(b.ref) + '</div>' +
      '<div class="body"><div class="top"><span>' + esc(b.type) + ' · ' + esc(b.town || '') + '</span>' + rate + '</div>' +
      '<h3><a href="' + href + '">' + esc(b.short) + '</a></h3>' +
      '<div class="meta"><span>' + EXO.plural(b.occupants, 'pers.', 'pers.') + '</span><span>' + EXO.plural(b.chambres, 'chambre') + '</span><span>' + EXO.plural(b.sdb, 'sdb', 'sdb') + '</span>' + plage + '</div>' +
      '<div class="price">' + (b.prix_min ? 'dès <b>' + EXO.eur(b.prix_min, 0) + '</b> / nuit' : 'Prix sur demande') + est + '</div></div></article>';
  };
  EXO.bindCards = function (root) {
    root.querySelectorAll('.card').forEach(function (c) {
      if (c._b) return; c._b = 1;
      var s = c.querySelector('.slides'), dots = c.querySelectorAll('.dots i');
      if (!s) return;
      function go(dir) { s.scrollBy({ left: dir * s.clientWidth, behavior: 'smooth' }); }
      var p = c.querySelector('.arr.p'), n = c.querySelector('.arr.n');
      if (p) p.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); go(s.scrollLeft < 5 ? 99 : -1); });
      if (n) n.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); go(s.scrollLeft + s.clientWidth >= s.scrollWidth - 5 ? -99 : 1); });
      s.addEventListener('scroll', function () {
        var i = Math.round(s.scrollLeft / s.clientWidth);
        dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
      }, { passive: true });
    });
    EXO.reveal(root);
  };

  /* ---------- apparition au scroll ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  EXO.reveal = function (root) {
    (root || document).querySelectorAll('.rv:not(.in)').forEach(function (el) { if (io) io.observe(el); else el.classList.add('in'); });
  };

  /* ---------- en-tête / pied ---------- */
  var NAV = [['index.html', 'Accueil'], ['biens.html', 'Nos biens'], ['services.html', 'Services'], ['qui-sommes-nous.html', 'Qui sommes-nous'], ['contact.html', 'Contact']];
  function header(active) {
    var nav = NAV.map(function (n) { return '<li><a href="' + n[0] + '"' + (n[0] === active ? ' aria-current="page"' : '') + '>' + n[1] + '</a></li>'; }).join('');
    var lang = '<div class="lang" aria-label="Langue"><span aria-current="true"><i>FR</i></span><a href="' + EXO.OFFICIAL + '/en/" hreflang="en" lang="en">EN</a><a href="' + EXO.OFFICIAL + '/es/" hreflang="es" lang="es">ES</a></div>';
    return '<header class="hdr" id="hdr"><div class="wrap">' +
      '<a class="logo" href="index.html" aria-label="EXO IMMO MARBELLA, accueil"><b>EXO IMMO</b><span>MARBELLA</span></a>' +
      '<nav aria-label="Navigation principale"><ul class="nav">' + nav + '</ul></nav>' +
      '<div class="hdr-tools">' + lang +
      '<a class="fav-link" href="biens.html?favoris=1" aria-label="Mes favoris">' + I.heart.replace('<svg', '<svg fill="none" stroke="currentColor" stroke-width="1.8"') + '<span class="n"></span></a>' +
      '<a class="btn btn-primary hdr-cta" href="biens.html">Réserver</a>' +
      '<button class="burger" type="button" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="mnav"><span></span><span></span><span></span></button>' +
      '</div></div></header>' +
      '<div class="mnav" id="mnav">' + NAV.map(function (n) { return '<a href="' + n[0] + '">' + n[1] + '</a>'; }).join('') +
      '<a href="biens.html?favoris=1">Mes favoris</a>' + lang + '</div>';
  }
  function footer() {
    return '<footer class="ftr"><div class="wrap">' +
      '<p class="big">Votre séjour<br><em>commence ici.</em></p>' +
      '<div class="grid">' +
      '<div><a class="logo" href="index.html"><b>EXO IMMO</b><span>MARBELLA</span></a><p>Location de vacances et conciergerie sur la Costa del Sol, depuis 2016.</p><p>29649 Mijas-Calahonda<br>Espagne</p></div>' +
      '<div><h3>Explorer</h3><ul><li><a href="biens.html">Nos biens</a></li><li><a href="biens.html?type=Villa">Villas</a></li><li><a href="biens.html?type=Appartement">Appartements</a></li><li><a href="biens.html?type=Maison+mitoyenne">Maisons mitoyennes</a></li><li><a href="services.html">Services</a></li><li><a href="qui-sommes-nous.html">Qui sommes-nous</a></li></ul></div>' +
      '<div><h3>Contact</h3><ul><li><a href="https://wa.me/' + EXO.WA + '" target="_blank" rel="noopener">WhatsApp +34 664 626 414</a></li><li><a href="tel:+34608405126">Jon +34 608 405 126 (FR/NL)</a></li><li><a href="tel:+34664626414">Servane +34 664 626 414 (EN/ES)</a></li><li><a href="tel:+34610030356">Mélanie +34 610 030 356</a></li><li><a href="mailto:' + EXO.EMAIL + '">' + EXO.EMAIL + '</a></li><li><a href="https://m.facebook.com/exoimmo/" target="_blank" rel="noopener">Facebook</a></li></ul></div>' +
      '<div><h3>Informations</h3><ul><li><a href="conditions.html">Conditions générales</a></li><li><a href="mentions.html">Mentions légales</a></li><li><a href="confidentialite.html">Politique de confidentialité</a></li><li><a href="cookies.html">Politique de cookies</a></li><li><a href="contact.html">Nous écrire</a></li></ul></div>' +
      '</div><div class="bottom"><span>© EXO IMMO MARBELLA 2026</span><span>Réservation et paiement sécurisés sur le moteur officiel EXO</span></div></div></footer>' +
      '<div class="demo-banner" role="note"><b>Démo réalisée par Immerweb</b> — maquette, les réservations se font sur le moteur officiel EXO.</div>';
  }

  EXO.init = function (opts) {
    opts = opts || {};
    var hs = document.getElementById('site-header'), fs = document.getElementById('site-footer');
    if (hs) hs.outerHTML = header(opts.active || '');
    if (fs) fs.outerHTML = footer();
    var hdr = document.getElementById('hdr');
    if (opts.dark) hdr.classList.add('on-dark');
    var burger = hdr.querySelector('.burger');
    burger.addEventListener('click', function () {
      var o = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', o); burger.setAttribute('aria-label', o ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    var last = 0;
    function onScroll() {
      var y = window.scrollY, lim = opts.solidAfter ? opts.solidAfter() : 40;
      hdr.classList.toggle('solid', y > lim);
      hdr.classList.toggle('hide', y > 400 && y > last + 4 && !document.body.classList.contains('menu-open'));
      if (y < last - 4) hdr.classList.remove('hide');
      document.body.classList.toggle('hdr-hidden', hdr.classList.contains('hide'));
      last = y;
      var fb = document.querySelector('.float-book');
      if (fb) {
        var ft = document.querySelector('.ftr'), nearEnd = ft && ft.getBoundingClientRect().top < innerHeight;
        fb.classList.toggle('away', y < (opts.floatAfter || 300) || nearEnd);
      }
    }
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    if (opts.float !== false) {
      var f = document.createElement('div');
      f.className = 'float-book away';
      f.innerHTML = '<a class="btn btn-primary btn-big" href="' + (opts.floatHref || 'biens.html') + '">Réserver un séjour</a><a class="btn btn-wa wa" href="' + EXO.waLink('Bonjour EXO IMMO, je souhaite des informations pour un séjour.') + '" target="_blank" rel="noopener" aria-label="Nous écrire sur WhatsApp">' + I.wa + '</a>';
      document.body.appendChild(f);
    }
    EXO.updateFavCount();
    EXO.reveal();
    // défilement doux (ordinateur seulement)
    if (window.Lenis && !matchMedia('(prefers-reduced-motion: reduce)').matches && matchMedia('(pointer:fine)').matches) {
      try {
        var lenis = EXO.lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
        (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
        document.addEventListener('click', function (e) {
          var a = e.target.closest('a[href^="#"]');
          if (a && a.getAttribute('href').length > 1) { var t = document.querySelector(a.getAttribute('href')); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -130 }); } }
        });
      } catch (e) { }
    }
  };
  EXO.lock = function (on) { if (EXO.lenis) { on ? EXO.lenis.stop() : EXO.lenis.start(); } document.documentElement.style.overflow = on ? 'hidden' : ''; };

  /* ---------- texte brut → paragraphes ---------- */
  EXO.prose = function (text, opts) {
    opts = opts || {};
    var raw = text.split('\n').map(function (l) { return l.trim(); }).filter(Boolean), L = [];
    for (var r = 0; r < raw.length; r++) {
      var cur = raw[r];
      if (/^https?:\/\//.test(cur)) while (raw[r + 1] && !/\s/.test(raw[r + 1]) && raw[r + 1] !== '.') cur += raw[++r];
      if (opts.drop && opts.drop.indexOf(cur.toLowerCase()) > -1) continue;
      if (cur === '.') continue;
      L.push(cur);
    }
    var html = '', list = false;
    for (var i = 0; i < L.length; i++) {
      var l = L[i];
      if (l === '•' && L[i + 1]) { if (!list) { html += '<ul>'; list = true; } html += '<li>' + esc(L[++i]) + '</li>'; continue; }
      if (list) { html += '</ul>'; list = false; }
      var letters = l.replace(/[^A-Za-zÀ-ÿ]/g, '');
      if (letters.length > 3 && l === l.toUpperCase() && l.length < 90) html += '<h2>' + esc(l.charAt(0) + l.slice(1).toLowerCase()) + '</h2>';
      else if (/\?$/.test(l) && l.length < 140) html += '<h3>' + esc(l) + '</h3>';
      else if (/^https?:\/\//.test(l)) html += '<p><a href="' + esc(l) + '" target="_blank" rel="noopener">' + esc(l) + '</a></p>';
      else html += '<p>' + esc(l) + '</p>';
    }
    if (list) html += '</ul>';
    return html;
  };
})();

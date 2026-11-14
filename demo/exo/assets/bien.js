/* Fiche logement : un seul gabarit pour les 41 biens */
(function () {
  'use strict';
  var esc = EXO.esc, eur = EXO.eur, I = EXO.icons;
  var ref = EXO.qs('ref') || '53';
  var root = document.getElementById('bien');
  var heroEl;
  EXO.init({ active: 'biens.html', dark: true, float: false, solidAfter: function () { return heroEl ? heroEl.offsetHeight - 80 : 40; } });

  EXO.biens().then(function (B) {
    var b = B.filter(function (x) { return x.ref === ref; })[0];
    if (!b) return notFound();
    render(b, B);
  }).catch(notFound);

  function notFound() {
    root.removeAttribute('aria-busy');
    document.getElementById('hdr').classList.remove('on-dark');
    root.innerHTML = '<section class="page-head wrap"><p class="kicker">Logement introuvable</p><h1 class="h-xl">Ce bien <em>n’existe pas.</em></h1><p class="lead">La référence demandée n’est pas dans notre catalogue.</p><p><a class="btn btn-primary" href="biens.html">Voir tous nos biens</a></p></section>';
  }

  function render(b, B) {
    document.title = 'Réf. ' + b.ref + ' — ' + b.short + ' · ' + (b.town || '') + ' — EXO IMMO Marbella';
    var md = document.querySelector('meta[name=description]');
    if (md) md.content = b.type + ' à ' + (b.town || 'la Costa del Sol') + ' pour ' + b.occupants + ' personnes, ' + b.chambres + ' chambres. ' + (b.description[1] || '');
    var photos = b.photos, n = photos.length;
    var P = new URLSearchParams(location.search);
    var q = { a: P.get('arrivee') || '', d: P.get('depart') || '', ad: P.get('adultes') || '2', en: P.get('enfants') || '0' };
    if (+q.ad > b.occupants) q.ad = String(b.occupants);

    var today = EXO.isoD(new Date());
    var rateTxt = b.rating ? String(b.rating).replace('.', ',') : null;

    /* ---- hero ---- */
    var h = '<section class="p-hero" id="pHero"><img src="' + esc(photos[0]) + '" alt="' + esc(b.short) + ' — photo principale" fetchpriority="high">' +
      '<div class="in wrap"><nav class="crumbs" aria-label="Fil d’Ariane"><a href="index.html">Accueil</a><span>›</span><a href="biens.html">Nos biens</a><span>›</span><a href="biens.html?type=' + encodeURIComponent(b.type) + '">' + esc({ 'Appartement': 'Appartements', 'Villa': 'Villas', 'Maison mitoyenne': 'Maisons mitoyennes' }[b.type] || b.type) + '</a><span>›</span><span>Réf. ' + esc(b.ref) + '</span></nav>' +
      '<h1>' + esc(b.short) + '</h1><div class="sub"><span>' + esc(b.type) + ' · ' + esc(b.town || '') + '</span><span>Réf. ' + esc(b.ref) + '</span>' +
      (rateTxt ? '<span>★ ' + rateTxt + '/10 · ' + EXO.plural(b.avis_count, 'avis', 'avis') + '</span>' : '') + '</div></div>' +
      '<div class="acts"><button class="btn" type="button" data-lb="0">Voir les ' + n + ' photos</button>' + EXO.heart(b.ref) + '</div></section>';

    /* ---- mosaïque ---- */
    var mos = '<div class="wrap"><div class="mosaic">' + [1, 2, 3, 4, 5].filter(function (i) { return i < n; }).map(function (i, k, arr) {
      return '<button type="button" data-lb="' + i + '" aria-label="Agrandir la photo ' + (i + 1) + '"><img src="' + esc(EXO.thumb(photos[i])) + '" alt="' + esc(b.short) + ' — photo ' + (i + 1) + '" loading="lazy">' + (k === arr.length - 1 && n > 6 ? '<span class="more">+ ' + (n - 6) + ' photos</span>' : '') + '</button>';
    }).join('') + '</div></div>';

    /* ---- sous-navigation ---- */
    var hasVideo = b.ref === '53' || b.youtube;
    var navItems = [['apercu', 'Aperçu']].concat(hasVideo ? [['video', 'Vidéo']] : [], [['equipements', 'Équipements'], ['tarifs', 'Tarifs'], ['infos', 'Infos pratiques'], ['emplacement', 'Emplacement'], ['avis', 'Avis']]);
    var sub = '<nav class="subnav" aria-label="Sections du logement"><div class="wrap">' + navItems.map(function (x) { return '<a href="#' + x[0] + '">' + x[1] + '</a>'; }).join('') + '</div></nav>';

    /* ---- aperçu ---- */
    var kf = '<div class="keyfig"><div><b>' + b.occupants + '</b><span>personnes</span></div><div><b>' + b.chambres + '</b><span>' + (b.chambres > 1 ? 'chambres' : 'chambre') + '</span></div><div><b>' + b.sdb + '</b><span>salle' + (b.sdb > 1 ? 's' : '') + ' de bain</span></div>' +
      (b.m2 ? '<div><b>' + b.m2 + '</b><span>m²</span></div>' : '') + '<div><b>' + (rateTxt || '–') + '</b><span>' + (rateTxt ? 'note /10' : 'pas encore noté') + '</span></div></div>';
    var desc = b.description.filter(function (l) { return l !== '-' + b.vehicule + '-' && l.replace(/^-|-$/g, '') !== b.vehicule; });
    var descHtml = '<div class="desc" id="desc">' + (b.vehicule ? '<span class="vehicule">' + esc(b.vehicule) + '</span>' : '') +
      '<div class="clip">' + desc.map(function (l, i) { return i === 0 ? '<p class="h-m" style="font-size:clamp(22px,2.2vw,30px);margin-bottom:18px">' + esc(l) + '</p>' : '<p>' + esc(l) + '</p>'; }).join('') + '</div>' +
      '<button class="linkbtn" type="button" id="descMore" aria-expanded="false">Lire toute la description</button></div>';
    var rooms = b.chambres_detail.length ? '<h3 class="h-m" style="font-size:26px;margin:44px 0 18px">Couchages</h3><div class="rooms">' + b.chambres_detail.map(function (r) {
      return '<div class="room">' + I.bed + '<b>' + esc(r.nom) + '</b><span>' + esc(r.lits.join(', ')) + '</span></div>';
    }).join('') + (b.sdb_detail.length ? '<div class="room">' + I.bath + '<b>Salles de bain</b><span>' + esc(b.sdb_detail.join(', ')) + '</span></div>' : '') + '</div>' : '';
    var apercu = '<section id="apercu">' + kf + '<h2>Le logement</h2>' + descHtml + rooms + '</section>';

    /* ---- vidéo ---- */
    var video = '';
    if (hasVideo) {
      video = '<section id="video"><h2>En <em style="font-style:italic;color:var(--sea)">vidéo.</em></h2>';
      if (b.ref === '53') video += '<div class="video-box"><video controls playsinline preload="none" poster="v/visite-poster.jpg"><source src="v/visite.mp4" type="video/mp4">Votre navigateur ne lit pas cette vidéo.</video></div><p class="video-cap">Visite filmée de l’appartement par Tela Home.</p>';
      if (b.youtube) video += '<div class="video-box" style="margin-top:' + (b.ref === '53' ? '24px' : '0') + '"><button class="yt-facade" type="button" data-yt="' + esc(b.youtube) + '" style="background-image:url(https://i.ytimg.com/vi/' + esc(b.youtube) + '/hqdefault.jpg)" aria-label="Lire la vidéo YouTube du logement"><span></span></button></div><p class="video-cap">Vidéo publiée par l’agence sur YouTube. Elle se charge seulement si vous cliquez.</p>';
      video += '</section>';
    }

    /* ---- équipements ---- */
    var eq = '<section id="equipements"><h2>Équipements</h2><div class="feat-groups">' + b.caracteristiques.map(function (g) {
      return '<div class="feat-group"><h3>' + esc(g.titre === 'Vue' ? 'Vue sur' : g.titre) + '</h3><ul>' + g.items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    }).join('') + '</div>' +
      '<div class="svc2" style="margin-top:30px"><div><h3>Services inclus ou obligatoires</h3><ul>' + b.services_inclus.map(function (s) {
        return '<li><span>' + esc(s.nom) + '</span><span class="' + (/^inclus/i.test(s.prix) ? 'inc' : '') + '">' + esc(s.prix) + '</span></li>';
      }).join('') + '</ul></div><div><h3>Services en option</h3><ul>' + (b.services_options.length ? b.services_options.map(function (s) {
        return '<li><span>' + esc(s.nom) + '</span><span>' + esc(s.prix) + '</span></li>';
      }).join('') : '<li><span>Aucun service optionnel publié</span><span></span></li>') + '</ul></div></div></section>';

    /* ---- tarifs ---- */
    var tar = '<section id="tarifs"><h2>Tarifs</h2>' + (b.tarifs.length ? '<table class="tbl"><thead><tr><th scope="col">Période</th><th scope="col">Prix par nuit</th></tr></thead><tbody>' + b.tarifs.map(function (t) {
      var now = today >= t.from && today <= t.to;
      return '<tr' + (now ? ' class="now"' : '') + '><td>Du ' + EXO.frD(t.from) + ' au ' + EXO.frD(t.to) + (now ? ' · <small>en ce moment</small>' : '') + '</td><td><b>' + eur(t.price, 0) + '</b></td></tr>';
    }).join('') + '</tbody></table>' : '<p>Tarifs sur demande.</p>') +
      '<p class="note">Prix par nuit, TVA incluse, tels que publiés par l’agence' + (b.tarifs.length ? ' (périodes publiées jusqu’au ' + EXO.frD(b.tarifs[b.tarifs.length - 1].to) + ')' : '') + '.' + (b.menage ? ' Ménage de fin de séjour : ' + eur(b.menage, 0) + ' par réservation.' : '') + ' Le prix exact et les disponibilités sont donnés par le moteur de réservation officiel.</p></section>';

    /* ---- infos pratiques ---- */
    var infos = '<section id="infos"><h2>Infos pratiques</h2><div class="info-grid">' +
      '<div class="info"><small>Arrivée</small><b>' + esc(b.arrivee || 'À convenir') + '</b></div>' +
      '<div class="info"><small>Départ</small><b>' + esc(b.depart || 'À convenir') + '</b></div>' +
      '<div class="info"><small>Caution remboursable</small><b>' + esc(b.caution || '–') + '</b>' + (b.caution_paiement.length ? '<p>' + esc(b.caution_paiement.join(' · ')) + '</p>' : '') + '</div></div>' +
      (b.observations.length ? '<h3 class="h-m" style="font-size:24px;margin:40px 0 4px">Règles de la maison</h3><ul class="rules">' + b.observations.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ul>' : '') +
      (b.annulation.length ? '<h3 class="h-m" style="font-size:24px;margin:40px 0 18px">Conditions d’annulation</h3><ul class="timeline">' + b.annulation.map(function (a) { return '<li><b>' + esc(a.periode) + '</b><span>' + esc(a.frais) + '</span></li>'; }).join('') + '</ul>' : '') +
      (b.notes.length ? '<div class="notice" style="margin-top:20px">' + b.notes.map(esc).join('<br>') + '</div>' : '') +
      (b.licence ? '<p class="note">Numéro d’enregistrement touristique : ' + esc(b.licence) + '</p>' : '') + '</section>';

    /* ---- emplacement ---- */
    var emp = '<section id="emplacement"><h2>Emplacement</h2><p style="margin-top:-12px;color:var(--muted)">' + esc(b.crumbs.map(function (c) { return c.replace(/^.*de vacances\s+/, ''); }).join(' · ')) + '</p>' +
      (b.lat ? '<div id="pmap" aria-label="Carte de l’emplacement"></div><p class="map-note">Position indicative. L’adresse exacte est communiquée après la réservation.</p>' : '') +
      (b.distances.length ? '<div class="dists">' + b.distances.map(function (d) { return '<div><span>' + esc(d.lieu) + '</span><b>' + esc(d.distance) + '</b></div>'; }).join('') + '</div>' : '') + '</section>';

    /* ---- avis ---- */
    var labels = Object.keys(b.notes_detail);
    var revs = b.avis.filter(function (r) { return r.titre; });
    var avis = '<section id="avis"><h2>Avis des voyageurs</h2>' + (b.rating ? '<div class="score"><div class="big">' + rateTxt + '<small>/10</small></div><div><b>' + EXO.plural(b.avis_count, 'avis vérifié', 'avis vérifiés') + '</b><br><span style="color:var(--muted);font-size:14px">Seuls les voyageurs ayant réservé peuvent laisser un avis.</span></div>' +
      (labels.length ? '<div class="subscores">' + labels.map(function (k) { return '<div>' + esc(k) + ' <b style="float:right">' + String(b.notes_detail[k]).replace('.', ',') + '/5</b><i><span style="width:' + (b.notes_detail[k] / 5 * 100) + '%"></span></i></div>'; }).join('') + '</div>' : '') + '</div>' : '<p>Ce logement n’a pas encore d’avis publié.</p>') +
      (revs.length ? '<div class="rev-list" id="revList">' + revs.map(function (r, i) {
        return '<figure class="rev" style="margin:0' + (i > 3 ? ';display:none' : '') + '"><p class="t">' + esc(r.titre) + '</p>' + (r.texte.length ? '<q>' + esc(r.texte[0]) + '</q>' + r.texte.slice(1).map(function (t) { return '<p style="font-size:14.5px;color:var(--muted);margin:10px 0 0">' + esc(t) + '</p>'; }).join('') : '') +
          '<figcaption class="who"><b>' + esc(r.auteur) + '</b>' + (r.pays ? ' · ' + esc(r.pays) : '') + (r.age ? ' · il y a ' + esc(r.age) : '') + '</figcaption></figure>';
      }).join('') + '</div>' + (revs.length > 4 ? '<button class="btn btn-ghost" type="button" id="revMore" style="margin-top:22px">Voir les ' + revs.length + ' avis</button>' : '') : '') + '</section>';

    /* ---- panneau de réservation ---- */
    var adOpts = '', enOpts = '';
    for (var i = 1; i <= b.occupants; i++) adOpts += '<option' + (String(i) === q.ad ? ' selected' : '') + '>' + i + '</option>';
    for (var j = 0; j <= Math.max(0, b.occupants - 1); j++) enOpts += '<option' + (String(j) === q.en ? ' selected' : '') + '>' + j + '</option>';
    var book = '<aside class="p-aside" aria-label="Réserver"><div class="book" id="book" data-lenis-prevent><button class="x" type="button" id="bookX" aria-label="Fermer">×</button>' +
      '<div class="from">dès <b>' + (b.prix_min ? eur(b.prix_min, 0) : '–') + '</b> / nuit</div>' +
      (rateTxt ? '<div class="rate">' + I.star + '<b>' + rateTxt + '</b><span style="color:var(--muted)">· ' + EXO.plural(b.avis_count, 'avis', 'avis') + '</span></div>' : '') +
      '<div class="bfields"><div class="bf"><label for="bA">Arrivée</label><input type="date" id="bA" min="' + today + '" value="' + esc(q.a) + '"></div><div class="bf"><label for="bD">Départ</label><input type="date" id="bD" min="' + today + '" value="' + esc(q.d) + '"></div>' +
      '<div class="bf"><label for="bAd">Adultes</label><select id="bAd">' + adOpts + '</select></div><div class="bf"><label for="bEn">Enfants</label><select id="bEn">' + enOpts + '</select></div></div>' +
      '<div class="est" id="est" aria-live="polite"></div>' +
      '<a class="btn btn-primary btn-big" id="bGo" href="' + esc(b.url) + '" target="_blank" rel="noopener">Réserver</a>' +
      '<a class="btn btn-wa" id="bWa" href="#" target="_blank" rel="noopener">' + I.wa + 'Poser une question sur WhatsApp</a>' +
      '<p class="sec-note">« Réserver » ouvre la fiche officielle de ce logement sur le moteur sécurisé d’EXO IMMO : vous y choisissez vos dates, voyez les disponibilités et payez.</p>' +
      (b.conditions_resume ? '<p class="cancel">' + esc(b.conditions_resume) + '</p>' : '') + '</div></aside><div class="scrim" id="scrim"></div>';

    /* ---- similaires ---- */
    var sim = B.filter(function (x) { return x.ref !== b.ref; }).map(function (x) {
      var s = 0;
      if (x.type === b.type) s += 3; if (x.town === b.town) s += 2;
      s += 2 - Math.min(2, Math.abs(x.occupants - b.occupants) / 2);
      s += 2 - Math.min(2, Math.abs((x.prix_min || 0) - (b.prix_min || 0)) / 50);
      return { x: x, s: s };
    }).sort(function (a, c) { return c.s - a.s; }).slice(0, 3).map(function (o) { return o.x; });
    var simHtml = '<section class="sec-tight bg-sand2"><div class="wrap"><div class="sec-head"><div><p class="kicker">Vous aimerez aussi</p><h2 class="h-l">Logements <em>similaires.</em></h2></div><a class="btn btn-ghost" href="biens.html">Tous nos biens</a></div><div class="grid-cards" id="sim">' + sim.map(function (x) { return EXO.card(x, { rv: true }); }).join('') + '</div></div></section>';

    var mbar = '<div class="mbar" id="mbar"><div class="p" id="mbarP">dès <b>' + (b.prix_min ? eur(b.prix_min, 0) : '–') + '</b> / nuit<br>' + (rateTxt ? '★ ' + rateTxt + ' · ' : '') + 'Réf. ' + esc(b.ref) + '</div><button class="btn btn-primary" type="button" id="mbarGo">Réserver</button></div>';

    root.innerHTML = h + mos + sub + '<div class="wrap p-layout"><div class="p-main">' + apercu + video + eq + tar + infos + emp + avis + '</div>' + book + '</div>' + simHtml + mbar;
    root.removeAttribute('aria-busy');
    heroEl = document.getElementById('pHero');
    requestAnimationFrame(function () { heroEl.classList.add('ready'); });
    EXO.bindCards(document.getElementById('sim'));
    EXO.reveal();

    /* ---- interactions ---- */
    var descEl = document.getElementById('desc'), dm = document.getElementById('descMore');
    if (descEl.querySelector('.clip').scrollHeight <= 360) { descEl.classList.add('open'); dm.hidden = true; }
    dm.onclick = function () { var o = descEl.classList.toggle('open'); dm.textContent = o ? 'Réduire' : 'Lire toute la description'; dm.setAttribute('aria-expanded', o); };
    var rm = document.getElementById('revMore');
    if (rm) rm.onclick = function () { document.querySelectorAll('#revList .rev').forEach(function (r) { r.style.display = ''; }); rm.remove(); };
    document.querySelectorAll('.yt-facade').forEach(function (f) {
      f.onclick = function () {
        var ifr = document.createElement('iframe');
        ifr.src = 'https://www.youtube-nocookie.com/embed/' + f.dataset.yt + '?autoplay=1&rel=0';
        ifr.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; ifr.allowFullscreen = true; ifr.title = 'Vidéo du logement ' + b.ref;
        f.replaceWith(ifr);
      };
    });

    // sous-nav active
    var links = [].slice.call(document.querySelectorAll('.subnav a'));
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); }); });
      }, { rootMargin: '-35% 0px -60% 0px' });
      navItems.forEach(function (x) { var s = document.getElementById(x[0]); if (s) io.observe(s); });
    }

    // carte
    if (b.lat && window.L) {
      var m = L.map('pmap', { scrollWheelZoom: false }).setView([b.lat, b.lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© contributeurs OpenStreetMap' }).addTo(m);
      L.circle([b.lat, b.lng], { radius: 350, color: '#1D6A86', weight: 1.5, fillOpacity: 0.15 }).addTo(m);
      L.marker([b.lat, b.lng], { icon: L.divIcon({ className: '', html: '<span class="pin">Réf. ' + esc(b.ref) + '</span>', iconSize: [0, 0] }), alt: 'Réf. ' + b.ref }).addTo(m);
      m.on('click', function () { m.scrollWheelZoom.enable(); });
    }

    // réservation : estimation
    var bA = document.getElementById('bA'), bD = document.getElementById('bD'), bAd = document.getElementById('bAd'), bEn = document.getElementById('bEn');
    var est = document.getElementById('est'), bWa = document.getElementById('bWa'), mbarP = document.getElementById('mbarP');
    function update() {
      var pers = +bAd.value + +bEn.value, e = EXO.estimate(b, bA.value, bD.value), html = '';
      if (bA.value) bD.min = EXO.isoD(new Date(EXO.parseD(bA.value).getTime() + 864e5));
      if (e) {
        html += '<span class="lab">Estimation</span>';
        e.groups.forEach(function (g) { html += '<div class="row"><span>' + eur(g.price, 0) + ' × ' + EXO.plural(g.n, 'nuit') + '</span><span>' + eur(g.price * g.n, 0) + '</span></div>'; });
        if (b.menage) html += '<div class="row"><span>Ménage de fin de séjour (obligatoire)</span><span>' + eur(b.menage, 0) + '</span></div>';
        if (e.missing) html += '<p class="warn">' + EXO.plural(e.missing, 'nuit') + ' hors des périodes tarifaires publiées : prix à confirmer par l’agence.</p>';
        if (!e.missing) html += '<div class="row tot"><span>Total estimé · ' + EXO.plural(e.nights, 'nuit') + '</span><span>' + eur(e.total, 0) + '</span></div>';
        else html += '<div class="row tot"><span>Total</span><span>à confirmer</span></div>';
        html += '<p class="hint">Estimation à partir des tarifs publiés, TVA incluse. Hors services en option et caution. Disponibilité et prix final sur le moteur officiel.</p>';
        mbarP.innerHTML = (e.missing ? '<b>Prix à confirmer</b>' : '<b>' + eur(e.total, 0) + '</b> estimation') + '<br>' + EXO.plural(e.nights, 'nuit') + ' · ' + EXO.frD(bA.value) + ' → ' + EXO.frD(bD.value);
      } else {
        html = '<p class="hint">Choisissez vos dates pour voir une estimation du prix de votre séjour.</p>';
      }
      if (pers > b.occupants) html += '<p class="warn">Ce logement accueille au maximum ' + b.occupants + ' personnes.</p>';
      est.innerHTML = html;
      var msg = 'Bonjour EXO IMMO, j’ai une question sur le logement réf. ' + b.ref + ' (' + b.short + ', ' + (b.town || '') + ')';
      if (bA.value && bD.value) msg += ' pour un séjour du ' + EXO.frD(bA.value) + ' au ' + EXO.frD(bD.value);
      msg += ', pour ' + EXO.plural(+bAd.value, 'adulte') + (+bEn.value ? ' et ' + EXO.plural(+bEn.value, 'enfant') : '') + '. ';
      bWa.href = EXO.waLink(msg);
    }
    bA.onchange = function () {
      if (bA.value && (!bD.value || bD.value <= bA.value)) bD.value = EXO.isoD(new Date(EXO.parseD(bA.value).getTime() + 7 * 864e5));
      update();
    };
    bD.onchange = bAd.onchange = bEn.onchange = update;
    update();

    // tiroir mobile
    function sheet(o) { document.body.classList.toggle('book-open', o); EXO.lock(o); }
    document.getElementById('mbarGo').onclick = function () { sheet(true); };
    document.getElementById('bookX').onclick = document.getElementById('scrim').onclick = function () { sheet(false); };

    /* ---- visionneuse ---- */
    lightbox(photos, b.short);
  }

  function lightbox(photos, name) {
    var lb = document.createElement('div');
    lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photos du logement');
    lb.innerHTML = '<div class="bar"><span id="lbC"></span><button type="button" id="lbX" aria-label="Fermer la galerie">×</button></div>' +
      '<div class="stage"><button class="nv p" type="button" aria-label="Photo précédente">‹</button><img id="lbI" alt=""><button class="nv n" type="button" aria-label="Photo suivante">›</button></div>' +
      '<div class="thumbs" id="lbT">' + photos.map(function (p, i) { return '<button type="button" data-i="' + i + '" aria-label="Photo ' + (i + 1) + '"><img src="' + esc(EXO.thumb(p)) + '" alt="" loading="lazy"></button>'; }).join('') + '</div>';
    document.body.appendChild(lb);
    var img = lb.querySelector('#lbI'), cnt = lb.querySelector('#lbC'), th = lb.querySelector('#lbT'), cur = 0, lastFocus;
    function show(i) {
      cur = (i + photos.length) % photos.length;
      img.style.opacity = 0.3;
      img.onload = function () { img.style.opacity = 1; };
      img.src = photos[cur]; img.alt = name + ' — photo ' + (cur + 1) + ' sur ' + photos.length;
      cnt.textContent = (cur + 1) + ' / ' + photos.length;
      th.querySelectorAll('button').forEach(function (b, k) { b.classList.toggle('on', k === cur); });
      var t = th.children[cur]; if (t) th.scrollTo({ left: t.offsetLeft - th.clientWidth / 2 + 37, behavior: 'smooth' });
      [cur + 1, cur - 1].forEach(function (k) { var im = new Image(); im.src = photos[(k + photos.length) % photos.length]; });
    }
    function open(i) { lastFocus = document.activeElement; lb.classList.add('open'); EXO.lock(true); show(i); lb.querySelector('#lbX').focus(); }
    function close() { lb.classList.remove('open'); EXO.lock(false); if (lastFocus) lastFocus.focus(); }
    document.addEventListener('click', function (e) { var t = e.target.closest('[data-lb]'); if (t) open(+t.dataset.lb); });
    lb.querySelector('#lbX').onclick = close;
    lb.querySelector('.nv.p').onclick = function () { show(cur - 1); };
    lb.querySelector('.nv.n').onclick = function () { show(cur + 1); };
    th.onclick = function (e) { var b = e.target.closest('button'); if (b) show(+b.dataset.i); };
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') show(cur + 1); else if (e.key === 'ArrowLeft') show(cur - 1);
    });
    var x0 = null, y0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(cur + (dx < 0 ? 1 : -1));
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
      x0 = null;
    }, { passive: true });
  }
})();

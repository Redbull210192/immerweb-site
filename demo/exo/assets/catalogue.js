/* Catalogue : filtres, tri, grille, carte */
(function () {
  'use strict';
  EXO.init({ active: 'biens.html', float: false });
  var $ = function (id) { return document.getElementById(id); };
  var TYPES = ['Appartement', 'Maison mitoyenne', 'Villa'];
  var EQ = [['piscine', 'Piscine'], ['piscine_privee', 'Piscine privée'], ['chauffage', 'Chauffage'], ['climatisation', 'Climatisation'], ['barbecue', 'Barbecue'], ['lave_linge', 'Machine à laver'], ['parking', 'Parking'], ['lave_vaisselle', 'Lave-vaisselle'], ['terrasse', 'Terrasse'], ['jardin', 'Jardin'], ['vue_mer', 'Vue mer'], ['ascenseur', 'Ascenseur']];
  var PLAGE = [['', 'Toutes'], ['500', '≤ 500 m'], ['1000', '≤ 1 km'], ['3000', '≤ 3 km']];
  var CH = [['', 'Toutes'], ['1', '1+'], ['2', '2+'], ['3', '3+'], ['4', '4+']];

  var P = new URLSearchParams(location.search);
  var S = {
    arrivee: P.get('arrivee') || '', depart: P.get('depart') || '',
    adultes: P.get('adultes') || '', enfants: P.get('enfants') || '',
    type: (P.get('type') || '').split(',').filter(Boolean),
    chambres: P.get('chambres') || '', ville: P.get('ville') || '', plage: P.get('plage') || '',
    prix: P.get('prix') || '', eq: (P.get('eq') || '').split(',').filter(Boolean),
    tri: P.get('tri') || 'ref', vue: P.get('vue') || 'grid', favoris: P.get('favoris') === '1'
  };
  var B = [], map, layer, markers = {};

  function syncUrl() {
    var p = new URLSearchParams();
    ['arrivee', 'depart', 'adultes', 'enfants', 'chambres', 'ville', 'plage', 'prix'].forEach(function (k) { if (S[k]) p.set(k, S[k]); });
    if (S.type.length) p.set('type', S.type.join(','));
    if (S.eq.length) p.set('eq', S.eq.join(','));
    if (S.tri !== 'ref') p.set('tri', S.tri);
    if (S.vue !== 'grid') p.set('vue', S.vue);
    if (S.favoris) p.set('favoris', '1');
    history.replaceState(null, '', 'biens.html' + (p.toString() ? '?' + p : ''));
  }

  function build() {
    // voyageurs
    var ad = $('fAd'), en = $('fEn');
    ad.add(new Option('–', '')); for (var i = 1; i <= 9; i++) ad.add(new Option(i, i));
    for (var j = 0; j <= 6; j++) en.add(new Option(j, j === 0 ? '' : j));
    ad.value = S.adultes; en.value = S.enfants;
    ad.onchange = function () { S.adultes = ad.value; render(); };
    en.onchange = function () { S.enfants = en.value; render(); };
    // dates
    var fA = $('fA'), fD = $('fD'), today = EXO.isoD(new Date());
    fA.min = today; fD.min = today; fA.value = S.arrivee; fD.value = S.depart;
    fA.onchange = function () {
      S.arrivee = fA.value;
      if (fA.value && (!fD.value || fD.value <= fA.value)) { fD.value = EXO.isoD(new Date(EXO.parseD(fA.value).getTime() + 7 * 864e5)); S.depart = fD.value; }
      render();
    };
    fD.onchange = function () { S.depart = fD.value; render(); };
    // types
    $('fType').innerHTML = TYPES.map(function (t) {
      var n = B.filter(function (b) { return b.type === t; }).length;
      return '<label class="chk"><input type="checkbox" value="' + t + '"' + (S.type.indexOf(t) > -1 ? ' checked' : '') + '> ' + t + '<small>' + n + '</small></label>';
    }).join('');
    $('fType').onchange = function () { S.type = [].map.call($('fType').querySelectorAll('input:checked'), function (i) { return i.value; }); render(); };
    // pastilles
    function pills(el, opts, key) {
      el.innerHTML = opts.map(function (o) { return '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (S[key] === o[0]) + '"' + (S[key] === o[0] ? ' class="on"' : '') + '>' + o[1] + '</button>'; }).join('');
      el.onclick = function (e) {
        var b = e.target.closest('button'); if (!b) return;
        S[key] = b.dataset.v;
        el.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
        render();
      };
    }
    pills($('fCh'), CH, 'chambres');
    pills($('fPlage'), PLAGE, 'plage');
    // villes
    var towns = {}; B.forEach(function (b) { if (b.town) towns[b.town] = (towns[b.town] || 0) + 1; });
    Object.keys(towns).sort().forEach(function (t) { $('fVille').add(new Option(t + ' (' + towns[t] + ')', t)); });
    $('fVille').value = S.ville;
    $('fVille').onchange = function () { S.ville = this.value; render(); };
    // prix
    var fp = $('fPrix'); fp.value = S.prix || 400;
    function pv() { $('fPrixV').textContent = +fp.value >= 400 ? 'Tous les prix' : 'jusqu’à ' + fp.value + ' €'; }
    pv();
    fp.oninput = function () { pv(); S.prix = +fp.value >= 400 ? '' : fp.value; render(); };
    // équipements
    $('fEq').innerHTML = EQ.map(function (e) {
      var n = B.filter(function (b) { return b.equip[e[0]]; }).length;
      return '<label class="chk"><input type="checkbox" value="' + e[0] + '"' + (S.eq.indexOf(e[0]) > -1 ? ' checked' : '') + '> ' + e[1] + '<small>' + n + '</small></label>';
    }).join('');
    $('fEq').onchange = function () { S.eq = [].map.call($('fEq').querySelectorAll('input:checked'), function (i) { return i.value; }); render(); };
    // tri / vue
    $('sort').value = S.tri; $('sort').onchange = function () { S.tri = this.value; render(); };
    document.querySelectorAll('.seg button').forEach(function (b) {
      b.onclick = function () { S.vue = b.dataset.view; render(); };
    });
    // tiroir mobile
    function openF(o) { document.body.classList.toggle('filters-open', o); EXO.lock(o); }
    $('fOpen').onclick = function () { openF(true); };
    $('fClose').onclick = $('fApply').onclick = function () { openF(false); };
    $('fReset').onclick = $('eReset').onclick = reset;
    $('chips').onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var k = b.dataset.k, v = b.dataset.v;
      if (k === 'type' || k === 'eq') S[k] = S[k].filter(function (x) { return x !== v; });
      else if (k === 'favoris') S.favoris = false;
      else if (k === 'voyageurs') { S.adultes = ''; S.enfants = ''; }
      else if (k === 'dates') { S.arrivee = ''; S.depart = ''; }
      else S[k] = '';
      refreshInputs(); render();
    };
    document.addEventListener('favs-change', function () { if (S.favoris) render(); });
  }
  function refreshInputs() {
    $('fAd').value = S.adultes; $('fEn').value = S.enfants; $('fA').value = S.arrivee; $('fD').value = S.depart;
    $('fVille').value = S.ville; $('fPrix').value = S.prix || 400; $('fPrix').oninput && $('fPrixV') && ($('fPrixV').textContent = S.prix ? 'jusqu’à ' + S.prix + ' €' : 'Tous les prix');
    $('fType').querySelectorAll('input').forEach(function (i) { i.checked = S.type.indexOf(i.value) > -1; });
    $('fEq').querySelectorAll('input').forEach(function (i) { i.checked = S.eq.indexOf(i.value) > -1; });
    [['fCh', 'chambres'], ['fPlage', 'plage']].forEach(function (p) { $(p[0]).querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.v === S[p[1]]); }); });
  }
  function reset() {
    S.arrivee = S.depart = S.adultes = S.enfants = S.chambres = S.ville = S.plage = S.prix = '';
    S.type = []; S.eq = []; S.favoris = false;
    refreshInputs(); render();
  }

  function filtered() {
    var pers = (+S.adultes || 0) + (+S.enfants || 0), favs = EXO.favs();
    return B.filter(function (b) {
      if (S.favoris && favs.indexOf(b.ref) < 0) return false;
      if (S.type.length && S.type.indexOf(b.type) < 0) return false;
      if (S.chambres && b.chambres < +S.chambres) return false;
      if (S.ville && b.town !== S.ville) return false;
      if (pers && b.occupants < pers) return false;
      if (S.plage && (b.plage_m == null || b.plage_m > +S.plage)) return false;
      if (S.prix && (b.prix_min == null || b.prix_min > +S.prix)) return false;
      for (var i = 0; i < S.eq.length; i++) if (!b.equip[S.eq[i]]) return false;
      return true;
    }).sort(function (a, b) {
      switch (S.tri) {
        case 'prix': return (a.prix_min || 1e9) - (b.prix_min || 1e9);
        case 'prix-desc': return (b.prix_min || 0) - (a.prix_min || 0);
        case 'capacite': return b.occupants - a.occupants || b.chambres - a.chambres;
        case 'note': return (b.rating || 0) - (a.rating || 0) || b.avis_count - a.avis_count;
        case 'plage': return (a.plage_m == null ? 1e9 : a.plage_m) - (b.plage_m == null ? 1e9 : b.plage_m);
        default: return +a.ref - +b.ref;
      }
    });
  }

  function chips() {
    var c = [];
    if (S.favoris) c.push(['favoris', '1', 'Mes favoris']);
    if (S.arrivee && S.depart) c.push(['dates', '', EXO.frD(S.arrivee) + ' → ' + EXO.frD(S.depart)]);
    var pers = (+S.adultes || 0) + (+S.enfants || 0);
    if (pers) c.push(['voyageurs', '', EXO.plural(pers, 'voyageur')]);
    S.type.forEach(function (t) { c.push(['type', t, t]); });
    if (S.chambres) c.push(['chambres', '', S.chambres + '+ chambres']);
    if (S.ville) c.push(['ville', '', S.ville]);
    if (S.plage) c.push(['plage', '', 'Plage ≤ ' + EXO.fmtDist(+S.plage)]);
    if (S.prix) c.push(['prix', '', '≤ ' + S.prix + ' € / nuit']);
    S.eq.forEach(function (e) { var l = EQ.filter(function (x) { return x[0] === e; })[0]; c.push(['eq', e, l ? l[1] : e]); });
    $('chips').innerHTML = c.map(function (x) { return '<button type="button" data-k="' + x[0] + '" data-v="' + EXO.esc(x[1]) + '" aria-label="Retirer le filtre ' + EXO.esc(x[2]) + '">' + EXO.esc(x[2]) + '</button>'; }).join('');
    $('fN').textContent = c.length ? '(' + c.length + ')' : '';
  }

  function render() {
    var R = filtered();
    $('cnt').textContent = R.length;
    $('cntL').textContent = R.length > 1 ? 'logements' : 'logement';
    $('catTitle').innerHTML = S.favoris ? 'Mes <em>favoris.</em>' : 'Nos <em>biens.</em>';
    chips();
    $('empty').hidden = R.length > 0;
    if (S.favoris && !R.length) $('empty').querySelector('.h-m').textContent = 'Aucun favori pour l’instant.';
    else $('empty').querySelector('.h-m').textContent = 'Aucun logement ne correspond.';
    document.querySelectorAll('.seg button').forEach(function (b) { var on = b.dataset.view === S.vue; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    var o = { a: S.arrivee, d: S.depart };
    if (S.vue === 'map') {
      $('list').hidden = true; $('mapWrap').hidden = !R.length; drawMap(R, o);
    } else {
      $('mapWrap').hidden = true; $('list').hidden = false;
      $('list').innerHTML = R.map(function (b) { return EXO.card(b, o); }).join('');
      EXO.bindCards($('list'));
      document.querySelectorAll('#list .card').forEach(function (c) { c.classList.add('rv'); });
      EXO.reveal($('list'));
    }
    // les liens vers la fiche gardent les dates
    if (S.arrivee && S.depart) document.querySelectorAll('#list a[href^="bien.html"]').forEach(function (a) {
      a.href = a.getAttribute('href') + '&arrivee=' + S.arrivee + '&depart=' + S.depart + (S.adultes ? '&adultes=' + S.adultes : '') + (S.enfants ? '&enfants=' + S.enfants : '');
    });
    syncUrl();
  }

  function drawMap(R, o) {
    if (!window.L) { $('mapWrap').innerHTML = '<p class="empty">La carte n’a pas pu se charger.</p>'; return; }
    if (!map) {
      map = L.map('map', { scrollWheelZoom: false, zoomControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© contributeurs OpenStreetMap' }).addTo(map);
      layer = L.layerGroup().addTo(map);
      map.on('click', function () { map.scrollWheelZoom.enable(); });
    }
    layer.clearLayers(); markers = {};
    var pts = [];
    R.forEach(function (b) {
      if (b.lat == null || b.lng == null) return;
      var ic = L.divIcon({ className: '', html: '<span class="pin">' + (b.prix_min ? EXO.eur(b.prix_min, 0) : 'Réf. ' + b.ref) + '</span>', iconSize: [0, 0] });
      var href = 'bien.html?ref=' + b.ref + (o.a && o.d ? '&arrivee=' + o.a + '&depart=' + o.d : '');
      var m = L.marker([b.lat, b.lng], { icon: ic, title: 'Réf. ' + b.ref + ' — ' + b.short, alt: 'Réf. ' + b.ref }).bindPopup(
        '<a class="mpop" href="' + href + '"><img src="' + EXO.esc(EXO.thumb(b.photos[0])) + '" alt=""><div><small>Réf. ' + b.ref + ' · ' + EXO.esc(b.town || '') + '</small><b>' + EXO.esc(b.short) + '</b><small>' + b.occupants + ' pers. · ' + EXO.plural(b.chambres, 'chambre') + ' · dès ' + EXO.eur(b.prix_min, 0) + ' / nuit</small></div></a>', { maxWidth: 250, minWidth: 250 });
      m.addTo(layer); markers[b.ref] = m; pts.push([b.lat, b.lng]);
    });
    setTimeout(function () {
      map.invalidateSize();
      if (pts.length) map.fitBounds(pts, { padding: [50, 50], maxZoom: 14 });
    }, 30);
  }

  EXO.biens().then(function (data) {
    B = data; build(); render();
  }).catch(function () { $('list').innerHTML = '<p class="empty">Impossible de charger les logements.</p>'; });
})();

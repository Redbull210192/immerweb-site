/* Pages de contenu : services, qui sommes-nous, contact, pages légales */
(function () {
  'use strict';
  EXO.init({ active: document.body.dataset.active || '' });

  var legal = document.getElementById('legal');
  if (legal) {
    var key = legal.dataset.page;
    var titles = { conditions: ['conditions générales'], confidentialite: ['politique de confidentialité'], cookies: [], mentions: ['mentions légales'] };
    EXO.pages().then(function (P) {
      var t = (P[key] || '').trim();
      var lines = t.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      var drop = (titles[key] || []).concat(['cliquez ici', 'pour modifier la configuration des cookies']);
      lines = lines.filter(function (l) { return drop.indexOf(l.toLowerCase()) < 0; });
      if (!lines.length) {
        legal.innerHTML = '<div class="notice">Le site officiel n’affiche pas encore de texte pour cette page. Il sera repris ici dès qu’il sera publié.</div>' +
          '<h2>Éditeur du site</h2><p>EXO IMMO MARBELLA<br>29649 Mijas-Calahonda, Espagne<br><a href="mailto:office@exoimmo-marbella.com">office@exoimmo-marbella.com</a><br>WhatsApp : <a href="https://wa.me/34664626414">+34 664 626 414</a></p>' +
          '<h2>Réservations</h2><p>Les réservations et les paiements sont effectués sur le moteur de réservation officiel d’EXO IMMO MARBELLA.</p>';
        return;
      }
      legal.innerHTML = EXO.prose(lines.join('\n'), { drop: drop });
      if (key === 'conditions') legal.insertAdjacentHTML('beforeend', '<div class="notice" style="margin-top:40px">Chaque logement peut avoir ses propres conditions d’annulation : elles sont indiquées sur sa fiche, rubrique « Infos pratiques ».</div>');
    }).catch(function () { legal.innerHTML = '<p>Texte indisponible pour le moment.</p>'; });
  }

  var cm = document.getElementById('cmap');
  if (cm && window.L) {
    var c = [36.4885, -4.7155];
    var m = L.map(cm, { scrollWheelZoom: false }).setView(c, 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© contributeurs OpenStreetMap' }).addTo(m);
    L.marker(c, { icon: L.divIcon({ className: '', html: '<span class="pin">Mijas-Calahonda</span>', iconSize: [0, 0] }), alt: 'Mijas-Calahonda' }).addTo(m);
    m.on('click', function () { m.scrollWheelZoom.enable(); });
  }
})();

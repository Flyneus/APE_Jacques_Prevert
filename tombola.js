// Onglet Tombola de l'espace bénévoles : liste des commerçants lue depuis un Google Sheets,
// recherche tolérante aux fautes, filtres par bénévole et par lieu, formulaire d'ajout (Google Forms).
(function () {
  'use strict';

  var SHEET_ID = '1xiFy-2lTsnRQfnrv7EjvTDdrHe16Daj_wCWrsT32Sgk';
  var SHEET_NAME = 'Liste';
  var FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSckOL9bT3QjDCqbEawJQga2Ok8pxwW4MewS29qDLHThvn5Vzg/viewform';
  var FORM_ACTION = FORM_URL.replace('/viewform', '/formResponse');
  var ENTRY = { name: 'entry.1671062358', place: 'entry.2107192009', person: 'entry.655551247' };

  var data = [];
  var pending = [];
  var state = { person: '', place: '', query: '' };
  var loaded = false;

  // ---------- Utilitaires ----------

  function parseCSV(text) {
    var rows = [], row = [], field = '', quoted = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (quoted) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else { quoted = false; }
        } else { field += c; }
      } else if (c === '"') { quoted = true; }
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c !== '\r') { field += c; }
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function lev(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur[0] = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur.slice();
    }
    return prev[b.length];
  }

  function limitFor(len) { return len <= 3 ? 0 : (len <= 5 ? 1 : 2); }

  // Coût d'un mot de la recherche par rapport aux mots du nom (Infinity si aucun rapprochement).
  function tokenCost(t, words) {
    var limit = limitFor(t.length), best = Infinity;
    for (var i = 0; i < words.length; i++) {
      var u = words[i];
      if (u === t) return 0;
      if (u.indexOf(t) === 0) best = Math.min(best, 0.25);
      else if (t.length >= 3 && u.indexOf(t) > 0) best = Math.min(best, 0.5);
      if (limit > 0) {
        var head = u.length > t.length ? u.slice(0, t.length) : u;
        best = Math.min(best, lev(t, u), lev(t, head) + 0.5);
      }
    }
    return best <= limit + 0.5 ? best : Infinity;
  }

  // Score d'un nom pour une recherche : plus petit = meilleur, Infinity = pas de correspondance.
  function score(nameNorm, queryNorm) {
    if (!queryNorm) return 0;
    var words = nameNorm.split(' ');
    var tokens = queryNorm.split(' ');
    var total = 0, ok = true;
    for (var i = 0; i < tokens.length; i++) {
      var c = tokenCost(tokens[i], words);
      if (c === Infinity) { ok = false; break; }
      total += c;
    }
    var best = ok ? total : Infinity;
    var qs = queryNorm.replace(/ /g, ''), ns = nameNorm.replace(/ /g, '');
    if (qs.length >= 4) {
      if (ns.indexOf(qs) !== -1) best = Math.min(best, 0.3);
      else {
        var d = Math.min(lev(qs, ns.slice(0, qs.length)), lev(qs, ns));
        if (d <= limitFor(qs.length)) best = Math.min(best, d + 0.6);
      }
    }
    return best;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseCSV: parseCSV, norm: norm, lev: lev, score: score, partialScore: partialScore };
  }

  var panel = document.getElementById('panel-tombola');
  if (!panel) return;

  var els = {
    search: document.getElementById('lotsSearch'),
    persons: document.getElementById('lotsPersons'),
    place: document.getElementById('lotsPlace'),
    status: document.getElementById('lotsStatus'),
    table: document.getElementById('lotsTable'),
    body: document.getElementById('lotsBody'),
    empty: document.getElementById('lotsEmpty'),
    refresh: document.getElementById('lotsRefresh'),
    box: document.getElementById('lotsFormBox'),
    link: document.getElementById('lotsFormLink'),
    form: document.getElementById('lotsAddForm'),
    addName: document.getElementById('addName'),
    addPlace: document.getElementById('addPlace'),
    addPerson: document.getElementById('addPerson'),
    addWebsite: document.getElementById('addWebsite'),
    addDup: document.getElementById('addDup'),
    addMsg: document.getElementById('addMsg'),
    addSubmit: document.getElementById('addSubmit'),
    personList: document.getElementById('addPersonList')
  };

  // Résultat approché : au moins la moitié des mots de la recherche sont reconnus dans le nom.
  function partialScore(nameNorm, queryNorm) {
    var words = nameNorm.split(' '), tokens = queryNorm.split(' ');
    var matched = 0, total = 0;
    for (var i = 0; i < tokens.length; i++) {
      var c = tokenCost(tokens[i], words);
      if (c !== Infinity) { matched++; total += c; }
    }
    if (!matched || matched < Math.ceil(tokens.length / 2)) return Infinity;
    return (tokens.length - matched) * 3 + total;
  }

  // ---------- Données ----------

  function csvUrl() {
    return 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:csv&sheet=' +
      encodeURIComponent(SHEET_NAME) + '&_=' + Date.now();
  }

  function setStatus(text) { els.status.textContent = text; }

  function load() {
    setStatus('Chargement de la liste…');
    els.refresh.disabled = true;
    fetch(csvUrl(), { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (text) {
        var rows = parseCSV(text).slice(1);
        data = rows.filter(function (r) { return (r[0] || '').trim(); }).map(function (r) {
          var name = r[0].trim();
          return { name: name, place: (r[1] || '').trim(), person: (r[2] || '').trim(), key: norm(name) };
        });
        var now = Date.now();
        pending = pending.filter(function (p) { return now - p.at < 15 * 60 * 1000; });
        pending.forEach(function (p) {
          if (!data.some(function (d) { return d.key === p.key; })) data.push(p);
        });
        loaded = true;
        buildFilters();
        render();
        els.table.hidden = false;
      })
      .catch(function () {
        els.table.hidden = true;
        els.empty.hidden = true;
        setStatus('La liste est momentanément indisponible. Vérifiez votre connexion puis cliquez sur « Actualiser ».');
      })
      .then(function () { els.refresh.disabled = false; });
  }

  // ---------- Affichage ----------

  function personKey(p) { return p ? norm(p) : '__none'; }

  function buildFilters() {
    var groups = {}, order = [];
    data.forEach(function (d) {
      var k = personKey(d.person);
      if (!groups[k]) { groups[k] = { key: k, label: d.person || 'Sans responsable', count: 0 }; order.push(k); }
      groups[k].count++;
    });
    order.sort(function (a, b) {
      if (a === '__none') return 1;
      if (b === '__none') return -1;
      return groups[a].label.localeCompare(groups[b].label, 'fr');
    });
    els.persons.textContent = '';
    [{ key: '', label: 'Tous', count: data.length }].concat(order.map(function (k) { return groups[k]; }))
      .forEach(function (g) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'lots-chip';
        b.dataset.person = g.key;
        b.setAttribute('aria-pressed', state.person === g.key ? 'true' : 'false');
        b.textContent = g.label + ' (' + g.count + ')';
        els.persons.appendChild(b);
      });
    els.personList.textContent = '';
    order.forEach(function (k) {
      if (k === '__none') return;
      var o = document.createElement('option');
      o.value = groups[k].label;
      els.personList.appendChild(o);
    });
    var places = {};
    data.forEach(function (d) { if (d.place) places[d.place] = true; });
    var current = els.place.value;
    els.place.textContent = '';
    var all = document.createElement('option');
    all.value = '';
    all.textContent = 'Tous les lieux';
    els.place.appendChild(all);
    Object.keys(places).sort(function (a, b) { return a.localeCompare(b, 'fr'); }).forEach(function (p) {
      var o = document.createElement('option');
      o.value = p;
      o.textContent = p;
      els.place.appendChild(o);
    });
    els.place.value = places[current] ? current : '';
    state.place = els.place.value;
  }

  function render() {
    var q = norm(state.query);
    var rows = [];
    data.forEach(function (d) {
      if (state.person && personKey(d.person) !== state.person) return;
      if (state.place && d.place !== state.place) return;
      var s = score(d.key, q);
      if (s !== Infinity) rows.push({ d: d, s: s });
    });
    var approx = false;
    if (!rows.length && q) {
      data.forEach(function (d) {
        if (state.person && personKey(d.person) !== state.person) return;
        if (state.place && d.place !== state.place) return;
        var s = partialScore(d.key, q);
        if (s !== Infinity) rows.push({ d: d, s: s });
      });
      approx = rows.length > 0;
    }
    rows.sort(function (a, b) { return a.s - b.s || a.d.name.localeCompare(b.d.name, 'fr'); });
    els.body.textContent = '';
    rows.forEach(function (r) {
      var tr = document.createElement('tr');
      [['Commerçant', r.d.name], ['Lieu', r.d.place || '-'], ['Personne en charge', r.d.person || '-']].forEach(function (c) {
        var td = document.createElement('td');
        td.dataset.label = c[0];
        td.textContent = c[1];
        tr.appendChild(td);
      });
      els.body.appendChild(tr);
    });
    els.empty.hidden = rows.length > 0;
    els.table.hidden = rows.length === 0;
    var n = rows.length;
    setStatus(approx
      ? 'Aucune correspondance exacte : ' + n + ' résultat' + (n > 1 ? 's approchants' : ' approchant')
      : n + ' commerçant' + (n > 1 ? 's' : '') + (state.query || state.person || state.place ? ' correspondant' + (n > 1 ? 's' : '') : ' dans la liste'));
    Array.prototype.forEach.call(els.persons.children, function (b) {
      b.setAttribute('aria-pressed', b.dataset.person === state.person ? 'true' : 'false');
    });
  }

  // ---------- Formulaire ----------

  function setupForm() {
    if (!FORM_URL) { els.link.hidden = true; return; }
    els.link.href = FORM_URL;
    els.link.hidden = false;
  }

  function findSimilar(name) {
    var q = norm(name);
    if (q.length < 3) return [];
    return data.map(function (d) { return { d: d, s: score(d.key, q) }; })
      .filter(function (r) { return r.s !== Infinity && r.s <= 1; })
      .sort(function (x, y) { return x.s - y.s; })
      .slice(0, 3);
  }

  function showMessage(text, isError) {
    els.addMsg.textContent = text;
    els.addMsg.className = 'lots-msg' + (isError ? ' lots-msg-error' : ' lots-msg-ok');
  }

  function onNameInput() {
    var similar = findSimilar(els.addName.value);
    if (!similar.length) { els.addDup.hidden = true; return; }
    els.addDup.textContent = 'Déjà dans la liste ? ' + similar.map(function (r) {
      return r.d.name + (r.d.person ? ' (' + r.d.person + ')' : '');
    }).join(' · ');
    els.addDup.hidden = false;
  }

  function onSubmit(e) {
    e.preventDefault();
    var name = els.addName.value.replace(/\s+/g, ' ').trim();
    var person = els.addPerson.value.replace(/\s+/g, ' ').trim();
    var place = els.addPlace.value;
    if (!name || !person) {
      showMessage('Merci d\u2019indiquer le nom du commerçant et la personne en charge.', true);
      return;
    }
    if (els.addWebsite.value) { showMessage('Merci !', false); return; }
    var exact = data.filter(function (d) { return d.key === norm(name); })[0];
    if (exact) {
      showMessage('« ' + exact.name + ' » est déjà dans la liste' +
        (exact.person ? ' (pris en charge par ' + exact.person + ')' : '') + '.', true);
      return;
    }
    var body = new URLSearchParams();
    body.set(ENTRY.name, name);
    if (place) body.set(ENTRY.place, place);
    body.set(ENTRY.person, person);
    els.addSubmit.disabled = true;
    showMessage('Envoi en cours…', false);
    fetch(FORM_ACTION, { method: 'POST', mode: 'no-cors', body: body })
      .then(function () {
        var item = { name: name, place: place, person: person, key: norm(name), at: Date.now() };
        pending.push(item);
        data.push(item);
        buildFilters();
        render();
        els.form.reset();
        els.addDup.hidden = true;
        showMessage('Merci ! « ' + name + ' » a été ajouté à la liste.', false);
      })
      .catch(function () {
        showMessage('L\u2019envoi a échoué. Réessayez, ou utilisez le formulaire Google d\u2019origine ci-dessous.', true);
      })
      .then(function () { els.addSubmit.disabled = false; });
  }

  // ---------- Événements ----------

  els.search.addEventListener('input', function () { state.query = els.search.value; if (loaded) render(); });
  els.place.addEventListener('change', function () { state.place = els.place.value; if (loaded) render(); });
  els.persons.addEventListener('click', function (e) {
    var b = e.target.closest('.lots-chip');
    if (!b) return;
    state.person = b.dataset.person;
    render();
  });
  els.refresh.addEventListener('click', load);
  els.addName.addEventListener('input', onNameInput);
  els.form.addEventListener('submit', onSubmit);

  var wide = window.matchMedia('(min-width: 960px)');
  els.box.open = wide.matches;
  if (wide.addEventListener) wide.addEventListener('change', function (e) { els.box.open = e.matches; });

  // Les données et le formulaire ne sont demandés à Google qu'à la première ouverture de l'onglet.
  var started = false;
  function start() {
    if (started || panel.hidden) return;
    started = true;
    setupForm();
    load();
  }
  new MutationObserver(start).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  start();
})();

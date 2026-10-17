// Onglet Procédures : recherche et filtre par catégorie.
(function () {
  'use strict';

  var groups = Array.prototype.slice.call(document.querySelectorAll('.proc-group'));
  var search = document.getElementById('procSearch');
  var chips = document.getElementById('procChips');
  var empty = document.getElementById('procEmpty');
  if (!groups.length || !search || !chips) return;

  var cards = Array.prototype.slice.call(document.querySelectorAll('.procedure[data-cat]'));
  var state = { cat: '', q: '' };

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }

  // Texte de chaque fiche, normalisé une fois pour toutes
  var texts = cards.map(function (c) { return norm(c.textContent); });

  function buildChips() {
    var defs = [{ cat: '', label: 'Toutes', count: cards.length }].concat(groups.map(function (g) {
      return {
        cat: g.dataset.cat,
        label: g.querySelector('.proc-group-title span').textContent,
        count: g.querySelectorAll('.procedure').length
      };
    }));
    defs.forEach(function (d) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lots-chip';
      b.dataset.cat = d.cat;
      b.setAttribute('aria-pressed', d.cat === '' ? 'true' : 'false');
      b.textContent = d.label + ' (' + d.count + ')';
      chips.appendChild(b);
    });
  }

  function apply() {
    var tokens = norm(state.q).split(' ').filter(Boolean);
    var visible = [];
    cards.forEach(function (card, i) {
      var ok = (!state.cat || card.dataset.cat === state.cat) &&
        tokens.every(function (t) { return texts[i].indexOf(t) !== -1; });
      card.hidden = !ok;
      if (ok) visible.push(card);
    });
    groups.forEach(function (g) {
      var n = g.querySelectorAll('.procedure:not([hidden])').length;
      g.hidden = n === 0;
      g.querySelector('.proc-count').textContent = '(' + n + ')';
    });
    empty.hidden = visible.length > 0;
    if (tokens.length && visible.length === 1) visible[0].open = true;
    Array.prototype.forEach.call(chips.children, function (b) {
      b.setAttribute('aria-pressed', b.dataset.cat === state.cat ? 'true' : 'false');
    });
  }

  function reset() {
    state.cat = '';
    state.q = '';
    search.value = '';
    apply();
  }

  buildChips();
  apply();

  chips.addEventListener('click', function (e) {
    var b = e.target.closest('.lots-chip');
    if (!b) return;
    state.cat = b.dataset.cat;
    apply();
  });

  search.addEventListener('input', function () {
    state.q = search.value;
    apply();
  });

  // Un lien vers une fiche masquée par un filtre : on remet tout à zéro avant d'y aller.
  window.addEventListener('hashchange', function () {
    var id = decodeURIComponent(location.hash.replace('#', ''));
    var target = id && document.getElementById(id);
    if (target && target.hidden) {
      reset();
      target.open = true;
      target.scrollIntoView();
    }
  });
})();

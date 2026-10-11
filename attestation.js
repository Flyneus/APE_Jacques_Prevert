// Générateur de l'attestation de recherche de lots (onglet Tombola) :
// le PDF est créé dans le navigateur, aucune donnée n'est envoyée.
(function () {
  'use strict';

  var SIGNATAIRES = {
    directrice: {
      titre: "La directrice de l'école,", nom: 'Isabelle Rivière',
      coordonnees: ["Directrice de l'école primaire Jacques Prévert", '30 rue Henri Dunant', '29000 Quimper', 'ec.0291701S@ac-rennes.fr']
    },
    president: {
      titre: "Le président de l'APE,", nom: 'Florian Masseube',
      coordonnees: ["Président de l'Association des Parents d'Élèves de l'école Jacques Prévert (APE)", '30 rue Henri Dunant', '29000 Quimper', 'apejacquesprevertquimper@gmail.com']
    }
  };
  var LIB = 'vendor/jspdf.umd.min.js';
  var LOGO = 'images/logo.png';

  function longDate(iso) {
    var p = String(iso).split('-');
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function clean(s) {
    return String(s || '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  }

  function slug(s) {
    return clean(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  // Construit le document PDF (A4) à partir de { date: 'AAAA-MM-JJ', prenom, nom }.
  function buildAttestation(jsPDF, data, logoDataUrl) {
    var doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    var left = 25, right = 185, width = right - left;
    var person = clean(data.prenom) + ' ' + clean(data.nom);

    // En-tête : coordonnées de la directrice (à gauche) et du président de l'APE (à droite)
    var colW = 72, rightX = right - colW;
    if (logoDataUrl) {
      try { doc.addImage(logoDataUrl, 'PNG', rightX, 14, 22, 12.9); } catch (e) { /* sans logo */ }
    }
    var headerBottom = 0;
    [[left, SIGNATAIRES.directrice], [rightX, SIGNATAIRES.president]].forEach(function (c) {
      var s = c[1], y0 = 33;
      doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(30, 24, 20);
      doc.text(s.nom, c[0], y0);
      doc.setFont('helvetica', 'normal').setFontSize(10);
      var lines = [];
      s.coordonnees.forEach(function (l) { lines = lines.concat(doc.splitTextToSize(l, colW)); });
      doc.text(lines, c[0], y0 + 5.2, { lineHeightFactor: 1.35 });
      headerBottom = Math.max(headerBottom, y0 + 5.2 + lines.length * 4.9);
    });

    // Date et objet
    var dateY = Math.max(headerBottom + 14, 70);
    doc.setFontSize(11.5);
    doc.text('À Quimper, le ' + longDate(data.date), right, dateY, { align: 'right' });
    doc.setFont('helvetica', 'bold').text('Objet :', left, dateY + 18);
    doc.setFont('helvetica', 'normal').text('Attestation', left + 16, dateY + 18);

    // Corps
    doc.setFontSize(12);
    var para1 = "Nous, soussignés, Isabelle Rivière, directrice de l'école Jacques Prévert de Quimper, et Florian Masseube, " +
      "président de l'Association des Parents d'Élèves de l'école Jacques Prévert (APE), attestons que";
    var lines = doc.splitTextToSize(para1, width);
    var y = dateY + 42;
    doc.text(lines, left, y, { lineHeightFactor: 1.6 });
    y += lines.length * 7.6 + 2;
    doc.setFont('helvetica', 'bold');
    var nameLines = doc.splitTextToSize(person, width);
    doc.text(nameLines, left, y, { lineHeightFactor: 1.6 });
    doc.setFont('helvetica', 'normal');
    y += nameLines.length * 7.6 + 0.4;
    var para2 = "est missionné(e) par l'Association des Parents d'Élèves de l'école Jacques Prévert pour une recherche de lots " +
      "en vue de la kermesse de l'école.";
    lines = doc.splitTextToSize(para2, width);
    doc.text(lines, left, y, { lineHeightFactor: 1.6 });
    y += lines.length * 7.6 + 6;
    var para3 = "Cette attestation est délivrée à l'APE pour servir et valoir ce que de droit.";
    lines = doc.splitTextToSize(para3, width);
    doc.text(lines, left, y, { lineHeightFactor: 1.6 });
    y += lines.length * 7.6 + 24;

    // Deux signatures
    var cols = [left, left + width / 2 + 5];
    [SIGNATAIRES.directrice, SIGNATAIRES.president].forEach(function (s, i) {
      doc.setFont('helvetica', 'normal').setFontSize(11.5);
      doc.text(s.titre, cols[i], y);
      doc.setFont('helvetica', 'bold').text(s.nom, cols[i], y + 6);
      doc.setDrawColor(190, 184, 178).setLineWidth(0.3);
      doc.line(cols[i], y + 36, cols[i] + 68, y + 36);
      doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(110, 104, 98);
      doc.text('Signature', cols[i], y + 40);
      doc.setTextColor(30, 24, 20);
    });
    return doc;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildAttestation: buildAttestation, slug: slug, longDate: longDate, clean: clean };
  }

  var form = typeof document !== 'undefined' && document.getElementById('attestForm');
  if (!form) return;

  var dateInput = document.getElementById('attestDate');
  var firstInput = document.getElementById('attestPrenom');
  var lastInput = document.getElementById('attestNom');
  var button = document.getElementById('attestSubmit');
  var message = document.getElementById('attestMsg');

  (function setToday() {
    var n = new Date();
    var m = String(n.getMonth() + 1).padStart(2, '0');
    var d = String(n.getDate()).padStart(2, '0');
    dateInput.value = n.getFullYear() + '-' + m + '-' + d;
  })();

  function say(text, error) {
    message.textContent = text;
    message.className = 'lots-msg ' + (error ? 'lots-msg-error' : 'lots-msg-ok');
  }

  function loadLib() {
    return new Promise(function (resolve, reject) {
      if (window.jspdf && window.jspdf.jsPDF) { resolve(window.jspdf.jsPDF); return; }
      var s = document.createElement('script');
      s.src = LIB;
      s.onload = function () { resolve(window.jspdf.jsPDF); };
      s.onerror = function () { reject(new Error('lib')); };
      document.head.appendChild(s);
    });
  }

  function loadLogo() {
    return fetch(LOGO).then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) {
      if (!b) return null;
      return new Promise(function (resolve) {
        var fr = new FileReader();
        fr.onload = function () { resolve(fr.result); };
        fr.onerror = function () { resolve(null); };
        fr.readAsDataURL(b);
      });
    }).catch(function () { return null; });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = { date: dateInput.value, prenom: clean(firstInput.value), nom: clean(lastInput.value) };
    if (!data.date || !data.prenom || !data.nom) {
      say('Merci d’indiquer la date, le prénom et le nom.', true);
      return;
    }
    button.disabled = true;
    say('Création du PDF…', false);
    Promise.all([loadLib(), loadLogo()]).then(function (r) {
      var doc = buildAttestation(r[0], data, r[1]);
      doc.save('attestation-recherche-lots-' + slug(data.nom) + '-' + slug(data.prenom) + '.pdf');
      say('Le PDF est téléchargé. Pensez à le faire signer par la directrice et le président.', false);
    }).catch(function () {
      say('Impossible de créer le PDF. Rechargez la page et réessayez.', true);
    }).then(function () { button.disabled = false; });
  });
})();

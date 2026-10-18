// Générateurs de PDF de l'onglet Tombola : attestation de recherche de lots et courrier de demande de lots.
// Les PDF sont créés dans le navigateur, aucune donnée n'est envoyée.
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
  // Courrier de demande de lots (texte modifiable ici). Le paragraphe de contact est construit avec les
  // coordonnées saisies dans le formulaire (voir contactParagraphe).
  var COURRIER = {
    objet: 'Demande de lots pour la tombola de notre kermesse (19 ou 26 juin 2027)',
    avant: [
      'Bonjour,',
      "Je suis membre de l'association des parents d'élèves de l'école Jacques Prévert (quartier de Kerfeunteun, à Quimper).",
      "Nous organisons notre kermesse de fin d'année, qui aura lieu le samedi 19 ou le samedi 26 juin 2027, selon l'accord de la mairie.",
      "Je viens vers vous afin de savoir si vous pourriez aider notre association en nous offrant des lots pour notre tombola/loterie. " +
        "Vous trouverez en PJ le document signé de la directrice de l'école et de notre président attestant de ma démarche. " +
        "Nous imprimons 2000 tickets et, pour les plus gros lots, nous pouvons, en contrepartie, placer le logo de l'entreprise donatrice sur les tickets.",
      "D'autre part, pour diversifier l'offre d'aide à notre association, lorsque les lots ne sont pas possibles, nous proposons " +
        "aussi un encart payant sur nos supports de communication lors de cet événement : l'encart logo est au minimum à 50 €.",
      "Tout don, même minime, est une aide pour nous lors de cet événement et chaque offre trouvera sa place pendant cette journée conviviale."
    ],
    apres: [
      "En vous remerciant par avance pour votre aide précieuse."
    ]
  };
  var LIB = 'vendor/jspdf.umd.min.js';
  var LOGO = 'images/logo.png';
  // Signatures scannées (PNG transparents) et taille d'affichage en mm [largeur, hauteur].
  var SIGNATURES = {
    directrice: { src: 'images/signature-directrice.png', size: [39, 24] },
    president: { src: 'images/signature-president.png', size: [34, 24] }
  };

  function longDate(iso) {
    var p = String(iso).split('-');
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function clean(s, max) {
    return String(s || '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, max || 60);
  }

  function slug(s) {
    return clean(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  // Construit le document PDF (A4) à partir de { date: 'AAAA-MM-JJ', prenom, nom }.
  // assets : { logo, directrice, president } (images en data URL, toutes facultatives).
  function buildAttestation(jsPDF, data, assets) {
    if (typeof assets === 'string') assets = { logo: assets };
    assets = assets || {};
    var logoDataUrl = assets.logo;
    var doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    var left = 25, right = 185, width = right - left;
    var dots = '..............................................';
    var person = (clean(data.prenom) + ' ' + clean(data.nom)).trim() || dots;

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
    doc.text('À Quimper, le ' + (data.date ? longDate(data.date) : dots.slice(0, 26)), right, dateY, { align: 'right' });
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
      "en vue de la kermesse de l'école, qui aura lieu le samedi 19 ou le samedi 26 juin 2027, selon l'accord de la mairie.";
    lines = doc.splitTextToSize(para2, width);
    doc.text(lines, left, y, { lineHeightFactor: 1.6 });
    y += lines.length * 7.6 + 6;
    var para3 = "Cette attestation est délivrée à l'APE pour servir et valoir ce que de droit.";
    lines = doc.splitTextToSize(para3, width);
    doc.text(lines, left, y, { lineHeightFactor: 1.6 });
    y += lines.length * 7.6 + 24;

    // Deux signatures
    var cols = [left, left + width / 2 + 5];
    ['directrice', 'president'].forEach(function (k, i) {
      var s = SIGNATAIRES[k];
      doc.setFont('helvetica', 'normal').setFontSize(11.5);
      doc.text(s.titre, cols[i], y);
      doc.setFont('helvetica', 'bold').text(s.nom, cols[i], y + 6);
      if (assets[k]) {
        var sz = SIGNATURES[k].size;
        try { doc.addImage(assets[k], 'PNG', cols[i] + 6, y + 34 - sz[1], sz[0], sz[1]); } catch (e) { /* sans signature */ }
      }
      doc.setDrawColor(190, 184, 178).setLineWidth(0.3);
      doc.line(cols[i], y + 36, cols[i] + 68, y + 36);
      doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(110, 104, 98);
      doc.text('Signature', cols[i], y + 40);
      doc.setTextColor(30, 24, 20);
    });
    return doc;
  }

  // Phrase de contact : les coordonnées du bénévole si elles sont renseignées, puis l'adresse de l'association.
  function contactParagraphe(data) {
    var moi = [data.email, data.tel].filter(Boolean).join(', ');
    if (moi) {
      return 'Vous pouvez directement me répondre (' + moi + ') ou bien écrire à notre adresse de contact : apejacquesprevertquimper@gmail.com.';
    }
    return 'Vous pouvez nous répondre à notre adresse de contact : apejacquesprevertquimper@gmail.com.';
  }

  // Courrier de demande de lots, signé du bénévole.
  // data : { date: 'AAAA-MM-JJ', prenom, nom, adresse, tel, email } (adresse, tel et email facultatifs).
  function buildDemande(jsPDF, data, assets) {
    assets = assets || {};
    var doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    var left = 25, right = 185, width = right - left;
    var dots = '..............................';

    if (assets.logo) {
      try { doc.addImage(assets.logo, 'PNG', left, 14, 22, 12.9); } catch (e) { /* sans logo */ }
    }
    doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(30, 24, 20);
    doc.text('APE École Jacques Prévert', left, 33);
    doc.setFont('helvetica', 'normal').setFontSize(10);
    var head = ["Association des parents d'élèves", 'École publique maternelle et primaire Jacques Prévert',
      '30 rue Henri Dunant - 29000 Quimper', 'apejacquesprevertquimper@gmail.com'];
    doc.text(head, left, 38.2, { lineHeightFactor: 1.35 });

    var y = 38.2 + head.length * 4.9 + 9;
    doc.setFontSize(11);
    doc.text('À Quimper, le ' + (data.date ? longDate(data.date) : dots), right, y, { align: 'right' });
    y += 12;
    doc.setFont('helvetica', 'bold').text('Objet :', left, y);
    var objet = doc.splitTextToSize(COURRIER.objet, width - 18);
    doc.setFont('helvetica', 'normal').text(objet, left + 17, y, { lineHeightFactor: 1.5 });
    y += objet.length * 6.2 + 6;

    var paragraphes = COURRIER.avant.concat([contactParagraphe(data)], COURRIER.apres);
    paragraphes.forEach(function (para) {
      var lines = doc.splitTextToSize(para, width);
      doc.text(lines, left, y, { lineHeightFactor: 1.45 });
      y += lines.length * 6.4 + 2.6;
    });

    // Signature : coordonnées du bénévole
    y += 2;
    var x = 110, w = right - x;
    doc.text('Bien cordialement,', x, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    var nom = (clean(data.prenom) + ' ' + clean(data.nom)).trim() || dots;
    doc.text(doc.splitTextToSize(nom, w), x, y + 8);
    doc.setFont('helvetica', 'normal').setFontSize(10.5);
    var sig = [];
    if (data.adresse) sig = sig.concat(doc.splitTextToSize(data.adresse, w));
    if (data.tel) sig.push(data.tel);
    if (data.email) sig = sig.concat(doc.splitTextToSize(data.email, w));
    doc.text(sig, x, y + 14.5, { lineHeightFactor: 1.35 });
    return doc;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildAttestation: buildAttestation, buildDemande: buildDemande, slug: slug, longDate: longDate, clean: clean };
  }

  if (typeof document === 'undefined' || !document.getElementById('attestForm')) return;

  var attest = {
    form: document.getElementById('attestForm'),
    date: document.getElementById('attestDate'),
    first: document.getElementById('attestPrenom'),
    last: document.getElementById('attestNom'),
    submit: document.getElementById('attestSubmit'),
    blank: document.getElementById('attestBlank'),
    msg: document.getElementById('attestMsg')
  };
  var courrier = {
    form: document.getElementById('courrierForm'),
    date: document.getElementById('courrierDate'),
    prenom: document.getElementById('courrierPrenom'),
    nom: document.getElementById('courrierNom'),
    adresse: document.getElementById('courrierAdresse'),
    tel: document.getElementById('courrierTel'),
    email: document.getElementById('courrierEmail'),
    submit: document.getElementById('courrierSubmit'),
    msg: document.getElementById('courrierMsg')
  };

  function today() {
    var n = new Date();
    return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
  }

  function say(el, text, error) {
    el.textContent = text;
    el.className = 'lots-msg ' + (error ? 'lots-msg-error' : 'lots-msg-ok');
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

  function loadImage(url) {
    return fetch(url).then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) {
      if (!b) return null;
      return new Promise(function (resolve) {
        var fr = new FileReader();
        fr.onload = function () { resolve(fr.result); };
        fr.onerror = function () { resolve(null); };
        fr.readAsDataURL(b);
      });
    }).catch(function () { return null; });
  }

  // Charge la bibliothèque et les images, construit le PDF puis le télécharge.
  function generate(builder, buttons, msgEl, data, filename, done) {
    buttons.forEach(function (b) { b.disabled = true; });
    say(msgEl, 'Création du PDF…', false);
    Promise.all([loadLib(), loadImage(LOGO), loadImage(SIGNATURES.directrice.src), loadImage(SIGNATURES.president.src)]).then(function (r) {
      builder(r[0], data, { logo: r[1], directrice: r[2], president: r[3] }).save(filename);
      say(msgEl, done, false);
    }).catch(function () {
      say(msgEl, 'Impossible de créer le PDF. Rechargez la page et réessayez.', true);
    }).then(function () { buttons.forEach(function (b) { b.disabled = false; }); });
  }

  attest.date.value = today();
  attest.form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = { date: attest.date.value, prenom: clean(attest.first.value), nom: clean(attest.last.value) };
    if (!data.date || !data.prenom || !data.nom) {
      say(attest.msg, 'Merci d’indiquer la date, le prénom et le nom.', true);
      return;
    }
    generate(buildAttestation, [attest.submit, attest.blank], attest.msg, data,
      'attestation-recherche-lots-' + slug(data.nom) + '-' + slug(data.prenom) + '.pdf',
      'Le PDF est téléchargé, avec les signatures de la directrice et du président.');
  });

  attest.blank.addEventListener('click', function () {
    generate(buildAttestation, [attest.submit, attest.blank], attest.msg, { date: '', prenom: '', nom: '' },
      'attestation-recherche-lots-vierge.pdf',
      'La version vierge est téléchargée, avec les deux signatures : date et nom sont à compléter à la main.');
  });

  if (courrier.form) {
    courrier.date.value = today();
    courrier.form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {
        date: courrier.date.value,
        prenom: clean(courrier.prenom.value),
        nom: clean(courrier.nom.value),
        adresse: clean(courrier.adresse.value, 120),
        tel: clean(courrier.tel.value, 30),
        email: clean(courrier.email.value, 80)
      };
      if (!data.date || !data.prenom || !data.nom) {
        say(courrier.msg, 'Merci d’indiquer la date, votre prénom et votre nom.', true);
        return;
      }
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        say(courrier.msg, 'L’adresse e-mail ne semble pas valide.', true);
        return;
      }
      generate(buildDemande, [courrier.submit], courrier.msg, data,
        'courrier-demande-de-lots-' + slug(data.nom) + '-' + slug(data.prenom) + '.pdf',
        'Le courrier est téléchargé. Joignez-y l’attestation de recherche de lots signée.');
    });
  }
})();

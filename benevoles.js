// Espace bénévoles : filtre par code d'accès.
//
// ATTENTION : CE N'EST PAS UNE VRAIE SÉCURITÉ. Le fichier HTML complet (y compris le
// contenu "réservé") est téléchargé par le navigateur dès le chargement de la
// page ; ce script se contente de le masquer visuellement tant que le bon code
// n'a pas été saisi. Toute personne un peu technique peut contourner ce filtre
// via les outils développeur. Ne placez donc ici que des informations non
// sensibles (planning, comptes-rendus, contacts internes).
//
// Pour changer le code d'accès :
//   1. Ouvrez une console JavaScript (n'importe quel navigateur) et tapez :
//        await crypto.subtle.digest('SHA-256', new TextEncoder().encode('VOTRE_NOUVEAU_CODE'))
//          .then(buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join(''))
//   2. Copiez le résultat (64 caractères) dans la constante CODE_HASH ci-dessous.

const CODE_HASH = 'e0155488e5793b95a27673074b677875224027ab6e2e124d3ac94454a4528290';
const STORAGE_KEY = 'ape-benevoles-unlocked';

// SHA-256 en JS pur : crypto.subtle n'existe qu'en HTTPS, ce repli permet de vérifier le code en HTTP.
function sha256Fallback(text) {
  const bytes = new TextEncoder().encode(text);
  const K = [];
  for (let n = 2, c = 0; c < 64; n++) {
    let prime = true;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) { prime = false; break; }
    if (prime) { K[c++] = (Math.cbrt(n) % 1 * 4294967296) | 0; }
  }
  const H = [];
  for (let n = 2, c = 0; c < 8; n++) {
    let prime = true;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) { prime = false; break; }
    if (prime) { H[c++] = (Math.sqrt(n) % 1 * 4294967296) | 0; }
  }
  const len = bytes.length;
  const padded = new Uint8Array(((len + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[len] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(len * 8 / 4294967296));
  view.setUint32(padded.length - 4, (len * 8) >>> 0);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  const w = new Array(64);
  for (let i = 0; i < padded.length; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = view.getUint32(i + t * 4);
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[t] + w[t]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

async function sha256Hex(text) {
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return sha256Fallback(text);
}

function unlock() {
  document.getElementById('gate').hidden = true;
  document.getElementById('volunteerContent').hidden = false;
}

document.addEventListener('DOMContentLoaded', function () {
  const gateForm = document.getElementById('gateForm');
  const gateError = document.getElementById('gateError');
  const accessCodeInput = document.getElementById('accessCode');

  if (localStorage.getItem(STORAGE_KEY) === 'true') {
    unlock();
    return;
  }

  gateForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const enteredHash = await sha256Hex(accessCodeInput.value.trim());

    if (enteredHash === CODE_HASH) {
      localStorage.setItem(STORAGE_KEY, 'true');
      gateError.hidden = true;
      unlock();
    } else {
      gateError.hidden = false;
      accessCodeInput.value = '';
      accessCodeInput.focus();
    }
  });
});

// Espace bénévoles : filtre par code d'accès.
//
// ⚠️ CE N'EST PAS UNE VRAIE SÉCURITÉ. Le fichier HTML complet (y compris le
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
//   Ou plus simple : redemandez à Claude de le faire pour vous.

const CODE_HASH = 'e0155488e5793b95a27673074b677875224027ab6e2e124d3ac94454a4528290'; // code par défaut : BENEVOLE2026
const STORAGE_KEY = 'ape-benevoles-unlocked';

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
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

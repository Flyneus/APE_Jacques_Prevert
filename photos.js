// Page Photos : un album à la fois (#id-de-l-album) et visionneuse plein écran.
(function () {
  document.documentElement.classList.add('js');

  var index = document.getElementById('albums-index');
  var albums = Array.prototype.slice.call(document.querySelectorAll('.album'));

  function showAlbum() {
    var id = decodeURIComponent(location.hash.replace('#', ''));
    var target = albums.filter(function (a) { return a.id === id; })[0];
    albums.forEach(function (a) { a.classList.toggle('is-open', a === target); });
    index.hidden = !!target;
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', showAlbum);
  showAlbum();

  var dialog = document.getElementById('lightbox');
  var image = document.getElementById('lbImage');
  var caption = document.getElementById('lbCaption');
  var links = [];
  var position = 0;

  function show() {
    var link = links[position];
    image.src = link.href;
    image.alt = link.dataset.caption;
    caption.textContent = link.dataset.caption + ' (' + (position + 1) + '/' + links.length + ')';
    if (!dialog.open) dialog.showModal();
  }

  function move(step) {
    position = (position + step + links.length) % links.length;
    show();
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('.photo-link');
    if (!link) return;
    event.preventDefault();
    links = Array.prototype.slice.call(link.closest('.photo-grid').querySelectorAll('.photo-link'));
    position = links.indexOf(link);
    show();
  });

  dialog.querySelector('.lb-close').addEventListener('click', function () { dialog.close(); });
  dialog.querySelector('.lb-prev').addEventListener('click', function () { move(-1); });
  dialog.querySelector('.lb-next').addEventListener('click', function () { move(1); });
  dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
  document.addEventListener('keydown', function (event) {
    if (!dialog.open) return;
    if (event.key === 'ArrowLeft') move(-1);
    if (event.key === 'ArrowRight') move(1);
  });
})();

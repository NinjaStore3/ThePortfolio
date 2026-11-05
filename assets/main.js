// Portfolio lightbox: opens a demo's full-page screenshot with Desktop / Mobile tabs.
(function () {
  var dialog = document.querySelector('.lb');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.work'));
  if (!dialog || !cards.length || typeof dialog.showModal !== 'function') return;

  var img = dialog.querySelector('.lb__img');
  var title = dialog.querySelector('#lb-title');
  var type = dialog.querySelector('#lb-type');
  var openLink = dialog.querySelector('.lb__open');
  var body = dialog.querySelector('.lb__body');
  var tabs = Array.prototype.slice.call(dialog.querySelectorAll('[role="tab"]'));
  var index = 0;
  var view = 'desktop';

  function render() {
    var card = cards[index];
    var slug = card.dataset.slug;
    type.textContent = card.dataset.type;
    title.textContent = card.dataset.name;
    openLink.href = 'demos/' + slug + '/';
    dialog.dataset.view = view;
    tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.dataset.view === view)); });
    img.alt = card.dataset.type + ' ' + card.dataset.name + ', ολόκληρη η σελίδα (' + (view === 'desktop' ? 'υπολογιστής' : 'κινητό') + ')';
    var src = 'assets/shots/' + slug + '-' + view + '.webp';
    if (img.getAttribute('src') !== src) {
      dialog.classList.add('is-loading');
      img.src = src;
    }
    body.scrollTop = 0;
  }

  function open(i) {
    index = i;
    view = 'desktop';
    render();
    dialog.showModal();
    document.documentElement.classList.add('lb-lock');
  }

  function step(dir) {
    index = (index + dir + cards.length) % cards.length;
    render();
  }

  img.addEventListener('load', function () { dialog.classList.remove('is-loading'); });
  img.addEventListener('error', function () { dialog.classList.remove('is-loading'); });

  cards.forEach(function (card, i) {
    card.addEventListener('click', function () { open(i); });
  });
  tabs.forEach(function (t) {
    t.addEventListener('click', function () { view = t.dataset.view; render(); });
  });
  dialog.querySelector('.lb__close').addEventListener('click', function () { dialog.close(); });
  dialog.querySelector('.lb__nav--prev').addEventListener('click', function () { step(-1); });
  dialog.querySelector('.lb__nav--next').addEventListener('click', function () { step(1); });
  dialog.addEventListener('close', function () {
    document.documentElement.classList.remove('lb-lock');
    cards[index].focus();
  });
  // click on the dark backdrop closes
  dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
  });
})();

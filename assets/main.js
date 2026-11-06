// Header: mobile menu, shadow once scrolled, highlight the section in view.
(function () {
  var top = document.querySelector('.top');
  if (!top) return;
  var toggle = top.querySelector('.top__toggle');
  var links = Array.prototype.slice.call(top.querySelectorAll('.top__nav a[href^="#"]'));

  function setOpen(open) {
    top.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Κλείσιμο μενού' : 'Άνοιγμα μενού');
  }
  if (toggle) {
    toggle.addEventListener('click', function () { setOpen(!top.classList.contains('is-open')); });
    links.forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && top.classList.contains('is-open')) { setOpen(false); toggle.focus(); } });
    document.addEventListener('click', function (e) { if (top.classList.contains('is-open') && !top.contains(e.target)) setOpen(false); });
  }

  function onScroll() {
    top.classList.toggle('is-scrolled', window.scrollY > 8);
    if (window.scrollY < 120) links.forEach(function (a) { a.classList.remove('is-active'); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        var link = byId[entry.target.id];
        if (link && !link.classList.contains('top__menu-cta')) link.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (sec) { observer.observe(sec); });
  }
})();

// Logo: replay the "drag the dot into an underline" animation on hover (once per hover).
(function () {
  var brand = document.querySelector('.top .brand');
  var logo = brand && brand.querySelector('.logo');
  if (!logo || !window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var busy = true;
  logo.addEventListener('animationstart', function () { busy = true; });
  logo.addEventListener('animationend', function (e) { if (e.target.classList.contains('logo__home')) busy = false; });
  brand.addEventListener('mouseenter', function () {
    if (busy) return;
    logo.classList.add('was-hovered');  // no start delay on replays
    logo.classList.toggle('is-replay');   // switching keyframe names restarts the animation
  });
})();

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

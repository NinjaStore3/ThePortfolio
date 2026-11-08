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

  var opener = null;
  function open(i) {
    opener = document.activeElement;
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
    (opener && opener.focus ? opener : cards[index]).focus({ preventScroll: true });
  });
  // click on the dark backdrop closes
  dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
  });
})();

// Interest form: sent to Web3Forms with fetch so the visitor stays on the page.
// Without JS the form still posts normally and Web3Forms redirects back (redirect field).
(function () {
  var form = document.querySelector('.cform');
  if (!form) return;

  // "Θέλω το Βασικό / Πλήρες" preselect the package in the form.
  document.querySelectorAll('[data-paketo]').forEach(function (a) {
    a.addEventListener('click', function () {
      form.querySelectorAll('input[name="Πακέτο"]').forEach(function (r) { r.checked = r.value === a.dataset.paketo; });
    });
  });

  if (!window.fetch) return;
  var send = form.querySelector('.cform__send');
  var status = form.querySelector('.cform__status');
  var label = send.textContent;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (send.disabled) return;
    var data = {};
    new FormData(form).forEach(function (value, key) {
      if (key !== 'redirect' && String(value).trim() !== '') data[key] = value;
    });
    send.disabled = true;
    send.textContent = 'Αποστολή…';
    status.textContent = '';
    fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.success !== true) throw new Error(res.message || 'not sent');
        var done = form.querySelector('.cform__done');
        form.classList.add('is-sent');
        done.hidden = false;
        done.focus();
      })
      .catch(function (err) {
        if (window.console) console.warn('Form not sent:', err && err.message);
        status.textContent = 'Κάτι πήγε στραβά και το μήνυμα δεν στάλθηκε. Δοκιμάστε ξανά ή πάρτε μας τηλέφωνο στο 698 013 5331.';
      })
      .then(function () { send.disabled = false; send.textContent = label; });
  });
})();

// Hero showcase: a browser and a phone scroll through one demo at a time.
// The chips pick the business type; it moves on by itself every ~9.5s.
(function () {
  var stage = document.querySelector('.stage');
  if (!stage) return;
  var chips = Array.prototype.slice.call(document.querySelectorAll('.stage__chips .chip'));
  var screens = stage.querySelector('.stage__screens');
  var browser = stage.querySelector('.stage__browser');
  var desk = stage.querySelector('.stage__desk');
  var mob = stage.querySelector('.stage__mob');
  var url = stage.querySelector('.stage__url b');
  var caption = stage.querySelector('.stage__caption');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cards = {};
  document.querySelectorAll('.work').forEach(function (c) { cards[c.dataset.slug] = c; });

  var HOLD = 1200, SCROLL = 7000, END = 1300;
  var index = 0, anims = [], token = 0, hovered = false, inView = true;

  function src(slug, kind) { return 'assets/shots/' + slug + '-' + kind + '-hero.webp'; }
  function decoded(img) { return img.decode ? img.decode().catch(function () {}) : Promise.resolve(); }
  function preload(slug) {
    return Promise.all(['desktop', 'mobile'].map(function (k) { var im = new Image(); im.src = src(slug, k); return decoded(im); }));
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function stop() { anims.forEach(function (a) { a.cancel(); }); anims = []; }
  function halted() { return hovered || !inView || document.hidden; }
  function sync() {
    var h = halted();
    anims.forEach(function (a) {
      if (h && a.playState === 'running') a.pause();
      else if (!h && a.playState === 'paused') a.play();
    });
  }
  function scrollDistance(img) { return Math.max(0, img.getBoundingClientRect().height - img.parentNode.clientHeight); }

  function run() {
    stop();
    if (reduce || !desk.animate) return;
    var opts = { duration: SCROLL, delay: HOLD, easing: 'cubic-bezier(.45, 0, .55, 1)', fill: 'forwards' };
    [desk, mob].forEach(function (img) {
      anims.push(img.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(' + (-scrollDistance(img)) + 'px)' }], opts));
    });
    var bar = chips[index].querySelector('i').animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: HOLD + SCROLL + END, fill: 'forwards' });
    bar.onfinish = function () { show((index + 1) % chips.length); };
    anims.push(bar);
    sync();
  }

  function centerChip(chip) {
    var row = chip.parentNode;
    if (row.scrollWidth <= row.clientWidth) return;
    row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  }

  function show(i) {
    var mine = ++token;
    var slug = chips[i].dataset.slug;
    var card = cards[slug];
    stop();
    chips.forEach(function (c, j) {
      c.classList.toggle('is-on', j === i);
      c.setAttribute('aria-pressed', String(j === i));
      c.querySelector('i').style.transform = '';
    });
    centerChip(chips[i]);
    screens.classList.add('is-switching');
    Promise.all([preload(slug), wait(260)]).then(function () {
      if (mine !== token) return;
      index = i;
      desk.src = src(slug, 'desktop');
      mob.src = src(slug, 'mobile');
      url.textContent = slug;
      if (card) {
        desk.alt = card.dataset.name.replace(/[«»]/g, '') + ', ' + card.dataset.type.toLowerCase() + ': η σελίδα σε υπολογιστή';
        browser.setAttribute('aria-label', 'Δείτε ολόκληρο το δείγμα ' + card.dataset.name);
        caption.textContent = card.dataset.type + ' ' + card.dataset.name;
      }
      return Promise.all([decoded(desk), decoded(mob)]);
    }).then(function () {
      if (mine !== token) return;
      screens.classList.remove('is-switching');
      run();
      preload(chips[(i + 1) % chips.length].dataset.slug);
    });
  }

  chips.forEach(function (chip, i) {
    chip.addEventListener('click', function () { if (i !== index || !anims.length) show(i); });
  });
  browser.addEventListener('click', function () {
    var card = cards[chips[index].dataset.slug];
    if (card) card.click();
  });
  if (window.matchMedia('(hover: hover)').matches) {
    screens.addEventListener('mouseenter', function () { hovered = true; sync(); });
    screens.addEventListener('mouseleave', function () { hovered = false; sync(); });
  }
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; sync(); }).observe(stage);
  }

  Promise.all([decoded(desk), decoded(mob)]).then(function () {
    run();
    preload(chips[1].dataset.slug);
  });
})();

// Sample cards: on hover the whole page scrolls inside the card's browser window.
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll('.work .browser__view[data-full]').forEach(function (view) {
    view.closest('.work').addEventListener('mouseenter', function () {
      if (view.querySelector('.browser__full')) return;
      var img = new Image();
      img.className = 'browser__full';
      img.alt = '';
      img.onload = function () { img.classList.add('is-ready'); };
      img.src = view.dataset.full;
      view.appendChild(img);
    });
  });
})();

// Sections fade up as they scroll into view. Only elements that start below the
// fold get hidden, so nothing visible on load ever disappears.
(function () {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var items = Array.prototype.slice.call(document.querySelectorAll(
    '.section-head, .works__grid > li, .how__steps > li, .plans__grid > *, .faq details, .contact__intro, .cform'
  )).filter(function (el) { return el.getBoundingClientRect().top > window.innerHeight; });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -6% 0px' });
  items.forEach(function (el) {
    var i = Array.prototype.indexOf.call(el.parentNode.children, el);
    el.style.setProperty('--rd', (i % 2) * 90 + 'ms');
    el.classList.add('reveal');
    io.observe(el);
  });
})();

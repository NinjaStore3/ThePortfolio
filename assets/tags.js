// Google Ads / Google Analytics, loaded only after the visitor accepts cookies.
//
// Fill in the IDs when the accounts exist. While they are empty nothing loads,
// no cookie banner is shown and the «Ρυθμίσεις cookies» link stays hidden.
// After editing this file run `npm run bust` so browsers fetch the new version.
(function () {
  var CONFIG = {
    googleAds: '',   // Google Ads tag ID, e.g. 'AW-123456789'
    ga4: '',         // Google Analytics 4 measurement ID, e.g. 'G-ABC123XYZ9' (optional)
    conversions: {   // Google Ads conversion labels (Goals → Conversions → tag setup)
      lead: '',      // the interest form was sent
      call: '',      // tap on the phone number
      viber: ''      // tap on Viber
    }
  };

  var KEY = 'istoselidakias-consent';
  var ids = [CONFIG.googleAds, CONFIG.ga4].filter(Boolean);
  var GA_EVENTS = { lead: 'generate_lead', call: 'click_call', viber: 'click_viber' };
  var loaded = false;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function stored() { try { return window.localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(value) { try { window.localStorage.setItem(KEY, value); } catch (e) { /* private mode */ } }

  function consent(state) {
    return { ad_storage: state, ad_user_data: state, ad_personalization: state, analytics_storage: state };
  }

  function load() {
    if (loaded || !ids.length) return;
    loaded = true;
    gtag('consent', 'default', consent('granted'));
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ids[0]);
    document.head.appendChild(s);
    gtag('js', new Date());
    ids.forEach(function (id) { gtag('config', id); });
  }

  // Conversions. Safe to call any time: nothing is sent without consent.
  window.siteTrack = function (name) {
    if (!loaded) return;
    var label = CONFIG.conversions[name];
    if (CONFIG.googleAds && label) gtag('event', 'conversion', { send_to: CONFIG.googleAds + '/' + label });
    if (CONFIG.ga4 && GA_EVENTS[name]) gtag('event', GA_EVENTS[name]);
  };

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"], a[href^="viber:"]');
    if (a) window.siteTrack(a.getAttribute('href').indexOf('tel:') === 0 ? 'call' : 'viber');
  });

  if (!ids.length) return;

  var banner = null;
  function hideBanner() { if (banner) { banner.remove(); banner = null; } }
  function choose(value) {
    store(value);
    hideBanner();
    if (value === 'granted') load();
    else if (loaded) gtag('consent', 'update', consent('denied'));
  }
  function showBanner() {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookies');
    banner.innerHTML =
      '<p>Με τη συγκατάθεσή σας, χρησιμοποιούμε cookies της Google για να μετράμε την απόδοση των διαφημίσεών μας. ' +
      '<a href="/politiki-aporritou">Πολιτική απορρήτου</a></p>' +
      '<div class="consent__actions">' +
      '<button class="btn btn--ink btn--sm" type="button" data-consent="granted">Αποδοχή</button>' +
      '<button class="btn btn--ink btn--sm" type="button" data-consent="denied">Απόρριψη</button>' +
      '</div>';
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]');
      if (b) choose(b.getAttribute('data-consent'));
    });
    document.body.appendChild(banner);
  }

  function init() {
    document.querySelectorAll('.foot__cookies').forEach(function (b) {
      b.hidden = false;
      b.addEventListener('click', showBanner);
    });
    var saved = stored();
    if (saved === 'granted') load();
    else if (saved !== 'denied') showBanner();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

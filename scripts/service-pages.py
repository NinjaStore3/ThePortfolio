#!/usr/bin/env python3
"""Generates the service landing pages (one per service, for SEO and for Google Ads).

    python3 scripts/service-pages.py && npm run bust

Edit the PAGES data below and re-run. The pages reuse assets/style.css (the .sp-* blocks, and the
calendar / video / chat visuals from the home page's «Και κάτι παραπάνω» section).
"""
import html, json, re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://istoselidakias.gr'
TEL = 'tel:+302112186538'

ICONS = {
    'cart': '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 8H6"/>',
    'card': '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/>',
    'dash': '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    'bell': '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    'tag': '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
    'cal': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 15h3"/>',
    'palette': '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.3-1.7-.4-1.2.4-2.3 1.6-2.3H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1.1"/><circle cx="10" cy="7" r="1.1"/><circle cx="15" cy="7.5" r="1.1"/>',
    'pen': '<path d="M4 20l4.5-1 10-10-3.5-3.5-10 10z"/><path d="M13.5 6.5 17 10"/>',
    'video': '<rect x="2.5" y="5.5" width="14" height="13" rx="3"/><path d="M16.5 10.5 21.5 7.5v9l-5-3"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'chat': '<path d="M4 5h16v11H9l-5 4z"/>',
    'chart': '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    'mic': '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    'subs': '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M6 14h5M13 14h5M6 10.5h12"/>',
    'music': '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    'formats': '<rect x="2.5" y="7" width="12" height="10" rx="2"/><rect x="17" y="4" width="4.5" height="16" rx="1.5"/>',
    'spark': '<path d="M12 3.5l1.9 4.6 4.6 1.9-4.6 1.9L12 16.5l-1.9-4.6L5.5 10l4.6-1.9z"/><path d="M18.5 15.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8z"/>',
    'book': '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"/>',
    'person': '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    'zap': '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    'target': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    'pin': '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    'phone': '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    'filter': '<path d="M3 5h18l-7 8.5V19l-4 2v-7.5z"/>',
    'reply': '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 5 5v5"/>',
}

def icon(name):
    return f'<svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>'

def text(s):
    """HTML fragment -> plain text (for meta and JSON-LD)."""
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s))).replace('\xa0', ' ').strip()

def cta(paketo):
    return f'/?paketo={quote(paketo)}#epikoinonia'

# ---------- the visuals (same building blocks as the home page) ----------

def v_calendar():
    P = {2: 8, 6: 8, 9: 8, 13: 8, 16: 8, 20: 8, 23: 8, 27: 8, 4: 12, 11: 12, 18: 12, 25: 12}
    R = {7: 12, 21: 12}
    cells = ['<i class="d"></i>'] * 2
    for d in range(1, 31):
        if d in P:
            cells.append(f'<i class="d p c{d % 3 + 1} is-on"><b>{d}</b></i>')
        elif d in R:
            cells.append(f'<i class="d p r is-on"><b>{d}</b></i>')
        else:
            cells.append(f'<i class="d"><b>{d}</b></i>')
    cells += ['<i class="d"></i>'] * 3
    return ('<div class="cal"><div class="cal__head"><b>Ο μήνας σας</b><span class="cal__count">12 posts · 2 reels</span></div>'
            '<div class="cal__dow"><span>Δ</span><span>Τ</span><span>Τ</span><span>Π</span><span>Π</span><span>Σ</span><span>Κ</span></div>'
            f'<div class="cal__grid">{"".join(cells)}</div>'
            '<div class="cal__legend"><span><i class="c1"></i>Post</span><span><i class="r"></i>Reel</span></div></div>')

def v_video():
    bars = '<i></i>' * 22
    return ('<div class="vid"><div class="vid__screen"><span class="vid__brand">Ο Φούρνος</span>'
            '<span class="vid__blob"></span><span class="vid__blob"></span><span class="vid__blob"></span>'
            '<span class="vid__title"><b>Φρέσκο ψωμί,</b><b>κάθε πρωί.</b></span>'
            '<span class="vid__subs"><i>Ζυμωμένο με το χέρι.</i><i>Παραγγείλτε το online.</i><i>Σας περιμένουμε!</i></span></div>'
            '<div class="vid__bar"><span class="vid__pause"><i></i><i></i></span><span class="vid__track"><i></i></span><span class="vid__time">0:30</span></div>'
            f'<div class="vid__vo">{icon("mic")}<span>Voice over</span><span class="vid__wave">{bars}</span></div></div>')

def v_chat():
    check = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
    return ('<div class="chat"><div class="chat__head"><span class="chat__avatar">' + icon('spark') + '</span>'
            '<span><b>Ψηφιακή γραμματεία</b><small><i></i>Online τώρα</small></span><span class="chat__time">23:47</span></div>'
            '<div class="chat__body">'
            '<p class="msg msg--in">Καλησπέρα! Έχετε κάτι ελεύθερο αύριο;</p>'
            '<p class="msg msg--out">Καλησπέρα! Αύριο έχουμε 11:00 ή 17:30. Ποια ώρα σας βολεύει;</p>'
            '<p class="msg msg--in">17:30</p>'
            '<p class="msg msg--out">Έγινε! Σας περιμένουμε αύριο στις 17:30. Θα σας στείλω υπενθύμιση το πρωί.</p>'
            f'<p class="msg msg--note">{check}Νέο ραντεβού στο ημερολόγιο</p></div></div>')

def v_shop():
    return ('<div class="sp-device"><div class="sp-device__browser">'
            '<span class="stage__bar"><i></i><i></i><i></i><span class="stage__url">istoselidakias.gr/demos/<b>01-butcher/eshop</b></span></span>'
            '<img src="/assets/shots/01-butcher-eshop-desktop-thumb.webp" width="960" height="600" alt="" fetchpriority="high"></div>'
            '<span class="sp-device__phone"><img src="/assets/shots/01-butcher-eshop-mobile-thumb.webp" width="390" height="844" alt=""></span></div>')

def v_ads():
    return ('<div class="gad"><div class="gad__search">' + '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>'
            '<span>ηλεκτρολόγος λάρισα</span><i class="gad__caret"></i></div>'
            '<div class="gad__ad"><p class="gad__sp">Χορηγούμενο</p>'
            '<p class="gad__site"><i>Η</i><span><b>Η επιχείρησή σας</b><small>www.η-επιχείρησή-σας.gr</small></span></p>'
            '<p class="gad__title">Ηλεκτρολόγος στη Λάρισα | Ερχόμαστε σε 1 ώρα</p>'
            '<p class="gad__desc">Βλάβες, εγκαταστάσεις και πιστοποιητικά. Τιμές χωρίς εκπλήξεις, 7 μέρες την εβδομάδα.</p>'
            '<p class="gad__links"><span>Τιμές</span><span>Περιοχές</span><span>Επικοινωνία</span></p>'
            '<span class="gad__call">' + icon('phone') + 'Κλήση</span></div>'
            '<div class="gad__org"><i></i><i></i><i></i></div></div>')

# ---------- page data ----------

ALL = [('/kataskevi-eshop', 'E-shop &amp; ραντεβού'), ('/social-media', 'Social media'), ('/video', 'Βίντεο &amp; animation'),
       ('/chatbot', 'Chatbot &amp; ψηφιακή γραμματεία'), ('/google-ads', 'Google Ads')]

PAGES = [
  dict(slug='kataskevi-eshop', crumb='E-shop', paketo='Πλήρες', service_type='Κατασκευή e-shop',
    title='Κατασκευή e-shop από 450 € | Istoselidakias',
    desc='E-shop ή online ραντεβού για την επιχείρησή σας: καλάθι αγορών, πληρωμή με κάρτα ή αντικαταβολή και δικός σας πίνακας διαχείρισης. 450 €, χωρίς μηνιαία συνδρομή.',
    kicker='E-shop &amp; online ραντεβού',
    h1='Κατασκευή e-shop που πουλάει και όταν είστε κλειστά.',
    lead='Ηλεκτρονικό κατάστημα με καλάθι αγορών, πληρωμή με κάρτα ή αντικαταβολή και δικό σας πίνακα διαχείρισης. Αν δουλεύετε με ραντεβού, οι πελάτες σας τα κλείνουν online. Έτοιμο σε 7 έως 10 ημέρες.',
    from_='450&nbsp;€ εφάπαξ · χωρίς μηνιαία συνδρομή', visual=v_shop,
    feats_title='Ό,τι χρειάζεται ένα e-shop.',
    feats=[('cart', 'Καλάθι και παραγγελίες', 'Οι πελάτες σας διαλέγουν προϊόντα και ποσότητες, και επιλέγουν παραλαβή ή αποστολή.'),
           ('card', 'Κάρτα ή αντικαταβολή', 'Οι πελάτες σας πληρώνουν με κάρτα ή με αντικαταβολή, όπως τους βολεύει.'),
           ('dash', 'Πίνακας διαχείρισης', 'Βλέπετε όλες τις παραγγελίες και τα ραντεβού σε ένα σημείο, από κινητό ή υπολογιστή.'),
           ('bell', 'Ειδοποίηση για κάθε παραγγελία', 'Μόλις έρθει μια παραγγελία ή ένα ραντεβού, το μαθαίνετε αμέσως.'),
           ('tag', 'Τιμές και προϊόντα στο χέρι σας', 'Αλλάζετε τιμές, φωτογραφίες και απόθεμα μόνοι σας, χωρίς να μας περιμένετε.'),
           ('cal', 'Online ραντεβού', 'Για ιατρεία, κομμωτήρια και κάθε επιχείρηση με ραντεβού: ο πελάτης κλείνει ώρα μόνος του.')],
    prices_intro='Πληρώνετε μία φορά την κατασκευή. Χωρίς μηνιαία συνδρομή.',
    prices=[('Πλήρες πακέτο', 'E-shop ή online ραντεβού, με πίνακα διαχείρισης', '450&nbsp;€', 'εφάπαξ', 450),
            ('Από τον 2ο χρόνο', 'Domain, φιλοξενία και SSL', '190&nbsp;€', 'ετησίως', None),
            ('Απόθεμα από τον προμηθευτή', 'Αυτόματη ενημέρωση από αρχείο XML, CSV ή Excel', '150&nbsp;€', '+ 10&nbsp;€ τον μήνα', 150),
            ('Αγγλική έκδοση', 'Για πελάτες από το εξωτερικό', '120&nbsp;€', 'εφάπαξ', 120)],
    note='Domain, φιλοξενία και SSL για τον πρώτο χρόνο περιλαμβάνονται.',
    links=[('/demos/01-butcher/eshop.html', 'Δείτε το δείγμα e-shop'), ('/demos/admin/orders.html', 'Δείτε τον πίνακα διαχείρισης')],
    steps=[('Μιλάμε στο τηλέφωνο', 'Μας λέτε τι πουλάτε και πώς θέλετε να παραλαμβάνουν οι πελάτες σας.'),
           ('Στήνουμε το e-shop', 'Βάζουμε προϊόντα, τιμές και φωτογραφίες, και σας το δείχνουμε πριν ανέβει.'),
           ('Ξεκινάτε τις πωλήσεις', 'Σας δείχνουμε τον πίνακα διαχείρισης και είμαστε δίπλα σας για ό,τι χρειαστείτε.')],
    faq=[('Πόσο κοστίζει η κατασκευή ενός e-shop;', 'Το e-shop κοστίζει 450&nbsp;€ εφάπαξ, με domain, φιλοξενία και SSL για τον πρώτο χρόνο. Από τον δεύτερο χρόνο υπάρχει μια ετήσια χρέωση 190&nbsp;€. Δεν υπάρχει μηνιαία συνδρομή.'),
         ('Μπορώ να αλλάζω μόνος μου τιμές και προϊόντα;', 'Ναι. Από τον πίνακα διαχείρισης αλλάζετε τιμές, φωτογραφίες, περιγραφές και απόθεμα, όποτε θέλετε.'),
         ('Ενημερώνεται αυτόματα το απόθεμα από τον προμηθευτή;', 'Αν ο προμηθευτής σας δίνει αρχείο XML, CSV ή Excel, το συνδέουμε με το e-shop ώστε τιμές και διαθεσιμότητα να ενημερώνονται μόνες τους. Κοστίζει 150&nbsp;€ εφάπαξ και 10&nbsp;€ τον μήνα ανά προμηθευτή.'),
         ('Σε πόσο καιρό είναι έτοιμο;', 'Συνήθως σε 7 έως 10 ημέρες από τη στιγμή που θα έχουμε τα προϊόντα και τις φωτογραφίες. Αν έχετε πολλά προϊόντα, το συζητάμε από πριν.')],
    cta_title='Έτοιμοι να πουλάτε online;', cta_text='Πείτε μας τι πουλάτε και σας λέμε πώς θα στηθεί το e-shop σας.'),

  dict(slug='social-media', crumb='Social media', paketo='Social media', service_type='Διαχείριση social media',
    title='Διαχείριση social media από 120 € τον μήνα | Istoselidakias',
    desc='Διαχείριση Facebook και Instagram για την επιχείρησή σας: σχεδιασμός, κείμενα, προγραμματισμός και reels. 8, 12 ή 20 posts τον μήνα, χωρίς δέσμευση.',
    kicker='Social media',
    h1='Διαχείριση social media, χωρίς να ασχολείστε εσείς.',
    lead='Σχεδιάζουμε, γράφουμε και ανεβάζουμε τα posts σας σε Facebook και Instagram, με το ύφος της επιχείρησής σας. Εσείς απλώς τα βλέπετε να ανεβαίνουν.',
    from_='από 120&nbsp;€ τον μήνα · χωρίς δέσμευση', visual=v_calendar,
    feats_title='Τι κάνουμε για τα social σας.',
    feats=[('palette', 'Σχέδια με το ύφος σας', 'Κάθε post φτιάχνεται με τα χρώματα, το λογότυπο και τις φωτογραφίες σας.'),
           ('pen', 'Κείμενα σε σωστά ελληνικά', 'Λεζάντες που διαβάζονται εύκολα, με τα σωστά hashtags.'),
           ('video', 'Reels', 'Σύντομα κάθετα βίντεο που φτάνουν σε περισσότερο κόσμο.'),
           ('clock', 'Προγραμματισμός', 'Τα posts ανεβαίνουν τις μέρες και τις ώρες που τα βλέπουν οι περισσότεροι.'),
           ('reply', 'Σχόλια και μηνύματα', 'Στο πακέτο των 12 posts απαντάμε στα σχόλια. Στο πακέτο των 20, και στα μηνύματα.'),
           ('chart', 'Μηνιαία αναφορά', 'Στο πακέτο των 20 posts βλέπετε πόσους έφτασαν τα posts σας και τι πήγε καλύτερα.')],
    prices_intro='Μηνιαία χρέωση, χωρίς δέσμευση. Σταματάτε όποτε θέλετε.',
    prices=[('8 posts', 'Σχεδιασμός, κείμενα και προγραμματισμός', '120&nbsp;€', 'τον μήνα', 120),
            ('12 posts', 'Μαζί με 2 reels και απαντήσεις στα σχόλια', '170&nbsp;€', 'τον μήνα', 170),
            ('20 posts', 'Μαζί με 4 reels, μηνιαία αναφορά και απαντήσεις σε σχόλια και μηνύματα', '250&nbsp;€', 'τον μήνα', 250),
            ('Διαφήμιση σε Facebook και Instagram', 'Στήσιμο καμπάνιας, εφάπαξ', '120&nbsp;€', '+ 40&nbsp;€ τον μήνα διαχείριση', 120)],
    note='Το κόστος της διαφήμισης το πληρώνετε απευθείας στο Facebook.', links=[],
    steps=[('Γνωριζόμαστε', 'Μας λέτε για την επιχείρησή σας, τους πελάτες σας και το ύφος που σας αρέσει.'),
           ('Εγκρίνετε το πρόγραμμα', 'Κάθε μήνα σας στέλνουμε τα posts πριν ανέβουν.'),
           ('Ανεβαίνουν μόνα τους', 'Τα προγραμματίζουμε, απαντάμε στα σχόλια και σας λέμε πώς πήγαν.')],
    faq=[('Πόσο κοστίζει η διαχείριση social media;', 'Τα 8 posts τον μήνα κοστίζουν 120&nbsp;€, τα 12 posts με 2 reels 170&nbsp;€ και τα 20 posts με 4 reels 250&nbsp;€. Δεν υπάρχει δέσμευση: σταματάτε όποτε θέλετε.'),
         ('Ποιος βγάζει τις φωτογραφίες;', 'Μπορείτε να μας στέλνετε φωτογραφίες από το κινητό σας και τις επεξεργαζόμαστε. Αν δεν έχετε, χρησιμοποιούμε σχέδια και επαγγελματικές φωτογραφίες με άδεια χρήσης.'),
         ('Βλέπω τα posts πριν ανέβουν;', 'Ναι. Σας στέλνουμε το πρόγραμμα του μήνα και ανεβαίνει μόνο ό,τι εγκρίνετε.'),
         ('Περιλαμβάνεται το κόστος της διαφήμισης;', 'Όχι. Αν θέλετε διαφήμιση, το κόστος της το πληρώνετε απευθείας στο Facebook. Το στήσιμο της καμπάνιας κοστίζει 120&nbsp;€ και η διαχείρισή της 40&nbsp;€ τον μήνα.')],
    cta_title='Ας ζωντανέψουμε τα social σας.', cta_text='Πείτε μας για την επιχείρησή σας και σας προτείνουμε το κατάλληλο πακέτο.'),

  dict(slug='video', crumb='Βίντεο', paketo='Βίντεο', service_type='Παραγωγή βίντεο και animation',
    title='Βίντεο με voice over και animation | Istoselidakias',
    desc='Reels, διαφημιστικά βίντεο με επαγγελματικό voice over και custom animation για την επιχείρησή σας. Από 90 €, έτοιμα για τα social και το site σας.',
    kicker='Βίντεο &amp; animation',
    h1='Βίντεο με επαγγελματικό voice over, που τραβούν το βλέμμα.',
    lead='Reels, διαφημιστικά βίντεο και animation για την επιχείρησή σας, με μουσική, υπότιτλους και επαγγελματική φωνή. Έτοιμα για Instagram, Facebook, TikTok και το site σας.',
    from_='από 90&nbsp;€ ανά βίντεο', visual=v_video,
    feats_title='Τι περιλαμβάνει κάθε βίντεο.',
    feats=[('mic', 'Επαγγελματικό voice over', 'Καθαρή, φυσική φωνή, στα ελληνικά ή στα αγγλικά.'),
           ('pen', 'Γράφουμε το σενάριο', 'Το γράφουμε μαζί σας, ώστε σε λίγα δευτερόλεπτα να λέει ό,τι χρειάζεται.'),
           ('subs', 'Υπότιτλοι', 'Τα περισσότερα βίντεο βλέπονται χωρίς ήχο. Με υπότιτλους, το μήνυμα περνάει ακόμη και χωρίς ήχο.'),
           ('music', 'Μουσική με άδεια', 'Χωρίς προβλήματα πνευματικών δικαιωμάτων στα social.'),
           ('formats', 'Σε κάθε μορφή', 'Κάθετο για reels και stories, οριζόντιο για το site και το YouTube.'),
           ('spark', 'Custom animation', 'Κινούμενο λογότυπο ή βίντεο με γραφικά που εξηγεί τι κάνετε.')],
    prices_intro='Τιμή ανά βίντεο, χωρίς κρυφές χρεώσεις.',
    prices=[('Reel έως 30″', 'Κάθετο βίντεο για Instagram, Facebook και TikTok', '90&nbsp;€', '', 90),
            ('Βίντεο έως 60″ με voice over', 'Επαγγελματική φωνή, μουσική και υπότιτλοι', '180&nbsp;€', '', 180),
            ('Custom animation', 'Κινούμενο λογότυπο ή βίντεο που εξηγεί τι κάνετε, έως 60″', '290&nbsp;€', '', 290)],
    note='Μουσική με άδεια χρήσης και δύο γύροι διορθώσεων σε κάθε βίντεο.', links=[],
    steps=[('Σενάριο', 'Συμφωνούμε τι θα λέει το βίντεο και πού θα το δείξετε.'),
           ('Παραγωγή', 'Πλάνα ή animation, voice over, μουσική και υπότιτλοι.'),
           ('Παράδοση', 'Το παίρνετε έτοιμο, σε όποια μορφή χρειάζεστε, με δύο γύρους διορθώσεων.')],
    faq=[('Πόσο κοστίζει ένα βίντεο;', 'Ένα reel έως 30 δευτερόλεπτα κοστίζει 90&nbsp;€, ένα βίντεο έως 60 δευτερόλεπτα με voice over 180&nbsp;€ και ένα custom animation 290&nbsp;€.'),
         ('Χρειάζεται να γυρίσω εγώ πλάνα;', 'Όχι απαραίτητα. Μπορούμε να χρησιμοποιήσουμε φωτογραφίες και βίντεο από το κινητό σας, επαγγελματικά πλάνα με άδεια χρήσης ή animation.'),
         ('Μπορώ να ζητήσω αλλαγές;', 'Ναι. Κάθε βίντεο περιλαμβάνει δύο γύρους διορθώσεων.'),
         ('Σε πόσο καιρό είναι έτοιμο;', 'Συνήθως σε 3 έως 5 εργάσιμες, από τη στιγμή που θα συμφωνήσουμε το σενάριο.')],
    cta_title='Έχετε κάτι να πείτε; Ας το κάνουμε βίντεο.', cta_text='Πείτε μας τι θέλετε να προβάλετε και σας στέλνουμε πρόταση.'),

  dict(slug='chatbot', crumb='Chatbot &amp; AI', paketo='AI / bot', service_type='AI chatbot και αυτοματισμοί',
    title='AI chatbot &amp; ψηφιακή γραμματεία | Istoselidakias',
    desc='Chatbot που απαντά στους πελάτες σας όλο το 24ωρο και ψηφιακή γραμματεία που κλείνει ραντεβού και στέλνει υπενθυμίσεις. Από 290 €. Και αυτοματισμοί από 150 €.',
    kicker='AI &amp; αυτοματισμοί',
    h1='Chatbot και ψηφιακή γραμματεία, 24 ώρες το 24ωρο.',
    lead='Bots που απαντούν στους πελάτες σας στο site, στο Messenger και στο Instagram, κλείνουν ραντεβού στο ημερολόγιό σας και κάνουν τις επαναλαμβανόμενες δουλειές για εσάς.',
    from_='από 290&nbsp;€ + 19&nbsp;€ τον μήνα', visual=v_chat,
    feats_title='Τι κάνει το bot για εσάς.',
    feats=[('chat', 'Απαντά αμέσως, μέρα και νύχτα', 'Ωράριο, τιμές, διαθεσιμότητα: ο πελάτης παίρνει απάντηση σε δευτερόλεπτα, ακόμη και στις 23:47.'),
           ('cal', 'Κλείνει ραντεβού', 'Βλέπει τις ελεύθερες ώρες στο ημερολόγιό σας και κλείνει το ραντεβού μόνο του.'),
           ('bell', 'Στέλνει υπενθυμίσεις', 'Λιγότερα ξεχασμένα ραντεβού, χωρίς τηλέφωνα.'),
           ('book', 'Μαθαίνει την επιχείρησή σας', 'Το εκπαιδεύουμε με τις δικές σας πληροφορίες, τιμές και διαδικασίες.'),
           ('person', 'Σας ειδοποιεί όταν χρειάζεται', 'Ό,τι δεν ξέρει να απαντήσει, το στέλνει σε εσάς, για να μη χάνεται κανένας πελάτης.'),
           ('zap', 'Αυτοματισμοί', 'Παραγγελίες στο Excel, email, αναφορές: ό,τι κάνετε ξανά και ξανά, γίνεται μόνο του.')],
    prices_intro='Ένα ποσό για το στήσιμο και μια μικρή μηνιαία χρέωση για τη λειτουργία.',
    prices=[('Chatbot', 'Απαντά στους πελάτες σας στο site, στο Messenger και στο Instagram', '290&nbsp;€', '+ 19&nbsp;€ τον μήνα', 290),
            ('Ψηφιακή γραμματεία', 'Κλείνει ραντεβού στο ημερολόγιό σας και στέλνει υπενθυμίσεις', '490&nbsp;€', '+ 39&nbsp;€ τον μήνα', 490),
            ('Bot για την εταιρεία σας', 'Απαντά στις ερωτήσεις της ομάδας σας με βάση τα έγγραφά σας', 'από 690&nbsp;€', '+ 49&nbsp;€ τον μήνα', 690),
            ('Αυτοματισμοί', 'Π.χ. κάθε νέα παραγγελία περνά στο Excel και σας έρχεται email', 'από 150&nbsp;€', 'ο καθένας', 150)],
    note='Η μηνιαία χρέωση καλύπτει τη λειτουργία του bot (AI και φιλοξενία).', links=[],
    steps=[('Μαθαίνουμε την επιχείρησή σας', 'Ωράριο, τιμές, υπηρεσίες και τις ερωτήσεις που ακούτε συχνότερα.'),
           ('Στήνουμε το bot', 'Το συνδέουμε με το site, το Messenger, το Instagram και το ημερολόγιό σας.'),
           ('Δοκιμάζετε και ξεκινά', 'Το δοκιμάζετε εσείς πρώτα και το βελτιώνουμε όσο το χρησιμοποιείτε.')],
    faq=[('Τι ακριβώς κάνει η ψηφιακή γραμματεία;', 'Απαντά στα μηνύματα των πελατών σας στο site, στο Messenger και στο Instagram, κλείνει ραντεβού στο ημερολόγιό σας και στέλνει υπενθυμίσεις. Ό,τι δεν μπορεί να απαντήσει, το προωθεί σε εσάς.'),
         ('Πόσο κοστίζει ένα chatbot;', 'Το chatbot κοστίζει 290&nbsp;€ για το στήσιμο και 19&nbsp;€ τον μήνα για τη λειτουργία του. Η ψηφιακή γραμματεία, που κλείνει και ραντεβού, κοστίζει 490&nbsp;€ και 39&nbsp;€ τον μήνα.'),
         ('Θα καταλάβουν οι πελάτες ότι μιλούν με bot;', 'Το bot απαντά με φυσικό τρόπο, στα ελληνικά, και συστήνεται ως ψηφιακός βοηθός της επιχείρησής σας. Αν ο πελάτης θέλει να μιλήσει με άνθρωπο, το μήνυμα έρχεται σε εσάς.'),
         ('Τι είναι το bot για εταιρείες;', 'Ένα bot για την ομάδα σας: απαντά στις ερωτήσεις των συνεργατών σας με βάση τα έγγραφα και τις διαδικασίες της εταιρείας, π.χ. τιμοκαταλόγους, πολιτικές ή οδηγίες.'),
         ('Τι αυτοματισμούς φτιάχνετε;', 'Ό,τι επαναλαμβάνεται: νέες παραγγελίες που περνούν στο Excel, email και SMS σε πελάτες, υπενθυμίσεις, αναφορές. Κάθε αυτοματισμός κοστίζει από 150&nbsp;€, ανάλογα με το τι χρειάζεται.')],
    cta_title='Αφήστε τα επαναλαμβανόμενα στο bot.', cta_text='Πείτε μας τι σας τρώει χρόνο και σας λέμε τι μπορεί να γίνει αυτόματα.'),

  dict(slug='google-ads', crumb='Google Ads', paketo='Google Ads', service_type='Διαχείριση Google Ads',
    title='Διαχείριση Google Ads από 40 € τον μήνα | Istoselidakias',
    desc='Στήσιμο και διαχείριση καμπάνιας Google Ads για την επιχείρησή σας: 120 € εφάπαξ και 40 € τον μήνα. Σας βρίσκουν όσοι ψάχνουν αυτό που προσφέρετε.',
    kicker='Google Ads',
    h1='Διαχείριση Google Ads, για να σας βρίσκουν από την πρώτη μέρα.',
    lead='Στήνουμε και διαχειριζόμαστε την καμπάνια σας, ώστε να σας βρίσκουν όσοι ψάχνουν ακριβώς αυτό που προσφέρετε, εκεί που εξυπηρετείτε. Πληρώνετε μόνο όταν κάποιος πατήσει τη διαφήμισή σας.',
    from_='120&nbsp;€ στήσιμο · 40&nbsp;€ τον μήνα', visual=v_ads,
    feats_title='Τι κάνουμε στην καμπάνια σας.',
    feats=[('target', 'Λέξεις-κλειδιά που φέρνουν πελάτες', 'Στοχεύουμε όσους ψάχνουν για να αγοράσουν, όχι από απλή περιέργεια.'),
           ('pen', 'Διαφημίσεις σε σωστά ελληνικά', 'Κείμενα που ξεχωρίζουν, με τιμές, ωράριο και κουμπί κλήσης.'),
           ('pin', 'Μόνο εκεί που εξυπηρετείτε', 'Η διαφήμιση εμφανίζεται στις περιοχές και τις ώρες που θέλετε.'),
           ('phone', 'Μέτρηση κλήσεων και φορμών', 'Ξέρετε πόσοι σας πήραν τηλέφωνο ή σας έστειλαν μήνυμα από τη διαφήμιση.'),
           ('filter', 'Αρνητικές λέξεις-κλειδιά', 'Κόβουμε τις άσχετες αναζητήσεις, για να μην πληρώνετε άδικα κλικ.'),
           ('chart', 'Μηνιαία αναφορά', 'Απλά νούμερα: πόσα ξοδέψατε και τι σας έφερε η διαφήμιση.')],
    prices_intro='Η δική μας χρέωση. Το κόστος των κλικ πληρώνεται απευθείας στη Google.',
    prices=[('Στήσιμο καμπάνιας', 'Λογαριασμός, λέξεις-κλειδιά, διαφημίσεις και μέτρηση', '120&nbsp;€', 'εφάπαξ', 120),
            ('Διαχείριση', 'Έλεγχος, βελτιώσεις και μηνιαία αναφορά', '40&nbsp;€', 'τον μήνα', 40),
            ('Διαφήμιση σε Facebook και Instagram', 'Στήσιμο και διαχείριση, με τις ίδιες τιμές', '120&nbsp;€', '+ 40&nbsp;€ τον μήνα', 120)],
    note='Προτείνουμε budget διαφήμισης από 100&nbsp;€ έως 300&nbsp;€ τον μήνα, που πληρώνεται απευθείας στη Google.', links=[],
    steps=[('Στόχος και budget', 'Τι θέλετε να φέρει η διαφήμιση και πόσα θέλετε να ξοδεύετε τον μήνα.'),
           ('Στήνουμε την καμπάνια', 'Λέξεις-κλειδιά, διαφημίσεις και μέτρηση κλήσεων και φορμών.'),
           ('Βελτιώνουμε κάθε μήνα', 'Κόβουμε ό,τι δεν φέρνει πελάτες και σας στέλνουμε μια απλή αναφορά.')],
    faq=[('Πόσα χρήματα χρειάζομαι για διαφήμιση;', 'Προτείνουμε να ξεκινήσετε με 100&nbsp;€ έως 300&nbsp;€ τον μήνα, που πληρώνονται απευθείας στη Google. Η δική μας χρέωση είναι 120&nbsp;€ για το στήσιμο και 40&nbsp;€ τον μήνα για τη διαχείριση.'),
         ('Πληρώνω κάθε φορά που εμφανίζεται η διαφήμιση;', 'Όχι. Πληρώνετε μόνο όταν κάποιος πατήσει τη διαφήμισή σας.'),
         ('Χρειάζεται να έχω ιστοσελίδα;', 'Βοηθάει πολύ, γιατί εκεί καταλήγει ο πελάτης. Αν δεν έχετε, τη φτιάχνουμε μαζί με την καμπάνια.'),
         ('Σε πόσο καιρό φαίνονται αποτελέσματα;', 'Οι διαφημίσεις εμφανίζονται συνήθως μέσα σε μία εργάσιμη. Οι πρώτες 2 με 3 εβδομάδες χρειάζονται για να βελτιωθεί η καμπάνια.')],
    cta_title='Θέλετε να σας βρίσκουν πρώτους;', cta_text='Πείτε μας τι κάνετε και πού, και σας λέμε τι budget χρειάζεται.'),
]

PHONE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 2.6 9.5 2l1.9 4.6-2.3 1.6a12 12 0 0 0 6.7 6.7l1.6-2.3 4.6 1.9-.6 2.9c-.2 1.1-1.2 1.9-2.3 1.9C10 19.3 4.7 14 4.7 4.9c0-1.1.8-2.1 1.9-2.3z"/></svg>'

FOOTER = '''  <footer class="foot">
    <div class="foot__top">
      <div class="foot__brand">
        <a class="brand" href="/"><img src="/assets/logo.svg" width="256" height="48" alt="Istoselidakias"></a>
        <p>Ιστοσελίδες, e-shop, social media, βίντεο και AI bots για κάθε επιχείρηση, σε όλη την Ελλάδα.</p>
      </div>
      <nav class="foot__nav" aria-label="Istoselidakias"><p class="foot__title">Istoselidakias</p><a href="/#deigmata">Δείγματα</a><a href="/#pos-doulevoume">Πώς δουλεύουμε</a><a href="/#paketa">Πακέτα</a><a href="/#ypiresies">Υπηρεσίες</a><a href="/#erotiseis">Ερωτήσεις</a><a href="/#sxetika">Σχετικά</a><a href="/#epikoinonia">Επικοινωνία</a></nav>
      <nav class="foot__nav foot__nav--one" aria-label="Υπηρεσίες"><p class="foot__title">Υπηρεσίες</p>{services}</nav>
      <div class="foot__contact">
        <a href="tel:+302112186538">211 218 6538</a>
        <span>Σε όλη την Ελλάδα</span>
        <div class="foot__social"><a href="https://www.instagram.com/istoselidakias.gr/" target="_blank" rel="noopener" aria-label="Instagram"><svg class="i-ig" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle class="dot" cx="17.4" cy="6.6" r="1.2"/></svg></a><a href="https://www.facebook.com/profile.php?id=61596532544969" target="_blank" rel="noopener" aria-label="Facebook"><svg class="i-fb" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.5 1.6-1.5H17V4.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.4H8v3.2h2.6v8z"/></svg></a></div>
      </div>
    </div>
    <div class="foot__bottom">
      <p>© 2026 Istoselidakias</p>
      <p><a href="/politiki-aporritou">Πολιτική απορρήτου</a><button class="foot__cookies" type="button" hidden>Ρυθμίσεις cookies</button></p>
    </div>
  </footer>'''

def services_links(current=None):
    return ''.join(f'<a href="{u}"{" aria-current=\"page\"" if u == current else ""}>{n}</a>' for u, n in ALL)

def page(p):
    url = f'{SITE}/{p["slug"]}'
    feats = '\n'.join(f'        <li>{icon(i)}<b>{t}</b><span>{d}</span></li>' for i, t, d in p['feats'])
    rows = '\n'.join(f'            <li class="svc__row"><span><b>{n}</b><small>{d}</small></span><em>{pr}{f"<small>{per}</small>" if per else ""}</em></li>'
                     for n, d, pr, per, _ in p['prices'])
    links = ''.join(f'<a href="{u}">{t} <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg></a>' for u, t in p['links'])
    links = f'\n          <p class="sp-links">{links}</p>' if links else ''
    steps = '\n'.join(f'        <li><b>{t}</b><span>{d}</span></li>' for t, d in p['steps'])
    faq = '\n'.join(f'        <details>\n          <summary>{q}</summary>\n          <p>{a}</p>\n        </details>' for q, a in p['faq'])
    more = ''.join(f'<a href="{u}">{n}</a>' for u, n in ALL if u != '/' + p['slug']) + '<a href="/#paketa">Ιστοσελίδες</a>'
    ld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'ProfessionalService', '@id': f'{SITE}/#business', 'name': 'Istoselidakias', 'url': f'{SITE}/',
         'telephone': '+30 211 218 6538', 'image': f'{SITE}/assets/og-image.jpg?v=4', 'priceRange': '90 € – 690 €',
         'address': {'@type': 'PostalAddress', 'addressCountry': 'GR'},
         'sameAs': ['https://www.instagram.com/istoselidakias.gr/', 'https://www.facebook.com/profile.php?id=61596532544969']},
        {'@type': 'Service', '@id': f'{url}#service', 'name': text(p['crumb']) if p['slug'] != 'chatbot' else 'AI chatbot και ψηφιακή γραμματεία',
         'serviceType': p['service_type'], 'description': text(p['desc']), 'url': url,
         'provider': {'@id': f'{SITE}/#business'}, 'areaServed': {'@type': 'Country', 'name': 'Ελλάδα'},
         'offers': [{'@type': 'Offer', 'name': text(n), 'description': text(d), 'price': str(v), 'priceCurrency': 'EUR'}
                    for n, d, _, _, v in p['prices'] if v]},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Αρχική', 'item': f'{SITE}/'},
            {'@type': 'ListItem', 'position': 2, 'name': text(p['crumb']), 'item': url}]},
        {'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': text(q), 'acceptedAnswer': {'@type': 'Answer', 'text': text(a)}} for q, a in p['faq']]},
    ]}
    title = p['title']
    return f'''<!doctype html>
<html lang="el">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{p['desc']}">
  <link rel="canonical" href="{url}">
  <meta name="theme-color" content="#F6F5F2">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{p['desc']}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{SITE}/assets/og-image.jpg?v=4">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="el_GR">
  <meta property="og:site_name" content="Istoselidakias">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/assets/icon-192.png" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preload" href="/assets/fonts/inter-greek-700-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/inter-greek-400-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/style.css">
  <script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>

  <header class="top">
    <div class="top__bar top__bar--simple">
      <a class="brand" href="/"><img src="/assets/logo.svg" width="256" height="48" alt="Istoselidakias"></a>
      <div class="top__end">
        <a class="top__phone" href="{TEL}" aria-label="Τηλέφωνο 211 218 6538">{PHONE_SVG}<span>211 218 6538</span></a>
        <a class="btn btn--ink btn--sm" href="{cta(p['paketo'])}">Επικοινωνία</a>
      </div>
    </div>
  </header>

  <main class="sp">
    <section class="sp-hero">
      <div class="sp-hero__text">
        <nav class="crumbs" aria-label="Διαδρομή"><a href="/">Αρχική</a><span aria-hidden="true">/</span><span aria-current="page">{p['crumb']}</span></nav>
        <p class="kicker">{p['kicker']}</p>
        <h1>{p['h1']}</h1>
        <p class="sp-hero__lead">{p['lead']}</p>
        <p class="sp-from">{p['from_']}</p>
        <div class="sp-hero__actions">
          <a class="btn btn--accent" href="{cta(p['paketo'])}">Ζητήστε προσφορά</a>
          <a class="btn btn--line" href="{TEL}">Καλέστε 211 218 6538</a>
        </div>
      </div>
      <div class="sp-hero__visual" aria-hidden="true">{p['visual']()}</div>
    </section>

    <section class="sp-sec">
      <h2>{p['feats_title']}</h2>
      <ul class="sp-feats">
{feats}
      </ul>
    </section>

    <section class="sp-sec">
      <div class="sp-prices">
        <div class="sp-prices__head">
          <h2>Τιμές</h2>
          <p>{p['prices_intro']}</p>
        </div>
        <div>
          <ul class="svc__list">
{rows}
          </ul>
          <p class="svc__note">{p['note']}</p>{links}
        </div>
      </div>
    </section>

    <section class="sp-sec">
      <h2>Πώς δουλεύουμε</h2>
      <ol class="sp-steps">
{steps}
      </ol>
    </section>

    <section class="faq">
      <div class="section-head">
        <div class="section-head__title"><h2>Συχνές ερωτήσεις</h2></div>
      </div>
      <div class="faq__list">
{faq}
      </div>
    </section>

    <section class="sp-cta">
      <h2>{p['cta_title']}</h2>
      <p>{p['cta_text']}</p>
      <div class="sp-cta__actions">
        <a class="btn btn--accent" href="{cta(p['paketo'])}">Ζητήστε προσφορά</a>
        <a class="btn btn--line" href="{TEL}">Καλέστε 211 218 6538</a>
      </div>
      <nav class="sp-more" aria-label="Άλλες υπηρεσίες"><span>Δείτε και:</span>{more}</nav>
    </section>
  </main>

{FOOTER.replace('{services}', services_links('/' + p['slug']))}

  <script src="/assets/tags.js" defer></script>
</body>
</html>
'''

if __name__ == '__main__':
    for p in PAGES:
        (ROOT / f'{p["slug"]}.html').write_text(page(p), encoding='utf-8')
        print('wrote', p['slug'] + '.html', '| title', len(text(p['title'])), '| desc', len(text(p['desc'])))

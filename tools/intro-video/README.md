# Βίντεο γνωριμίας (social)

Κάθετο βίντεο 1080×1920 για Instagram, TikTok και Facebook, φτιαγμένο με HTML/CSS. Δεν ανήκει στο site και είναι κρυμμένο από τις μηχανές αναζήτησης (`_headers`).

- `video.html`: οι 9 σκηνές. Οι διάρκειες βρίσκονται στο `window.DUR`.
- `render.mjs`: αποδίδει καρέ με το Playwright: `node tools/intro-video/render.mjs <φάκελος> 30`.
- `assemble.py`: προσαρμόζει κάθε σκηνή στη φωνή της, αποδίδει την εικόνα και ενώνει φωνή και μουσική (με ducking):
  `python3 tools/intro-video/assemble.py tools/intro-video/audio`. Ο φάκελος πρέπει να έχει τα `01.mp3` έως `09.mp3` και το `music.mp3`.
- `VOICE-OVER.md`: οι ατάκες για το ElevenLabs και η περιγραφή για τη μουσική.

Τα καρέ, ο ήχος και τα mp4 δεν αποθηκεύονται στο git (`.gitignore`).

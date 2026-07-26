# TripLine Scanner — plan (wycinek roadmapy)

> **Źródło:** to jest wycinek głównej roadmapy projektu, `ROADMAP.md`
> w repo `SinSkylark/TripLine` — skopiowane tu tylko części dotyczące
> **skanera** (to repo). Kanon treści, redakcja i pipeline żyją w TripLine;
> skaner utrzymujemy jako osobny, publiczny artefakt na GitHub Pages.
> Zadania z tej roadmapy śledzą issues w tym repo (patrz odsyłacze).

## Rola skanera w wydaniu

Talia wychodzi jako **kolekcjonerski merch** (drukowane karty w pudełku),
model **BYOS** (Bring Your Own Service): zero audio w produkcie, gracz
skanuje QR własnym telefonem. Utrzymujemy dwa artefakty cyfrowe poza
pudełkiem: **skaner** (to repo — statyczna strona na GH Pages, publiczny
darmowy hosting) i **redakcję** (wewnętrzne narzędzie zespołu w repo
TripLine, nie dla graczy). Nie budujemy natywnych paczek na App Store /
Google Play.

Skaner to jeden plik `index.html` (HTML+JS, bez backendu) + lokalnie
hostowana biblioteka `vendor/html5-qrcode.min.js`. Kontrakt QR w README
skanera jest **źródłem prawdy** dla każdego narzędzia generującego karty.

## Kontrakt QR — stabilność to wymóg, nie życzenie

Format karty: `tripline:it=<id>&yt=<id>` (pełny schemat pól w README →
sekcja „Kontrakt QR"). Parser po stronie skanera to `parseQR()` w
`index.html`; README i parser muszą pozostawać zgodne (pilnuje tego
`tests/test_i18n.js`, który sprawdza też parytet słowników i18n).

Dla produktu z długim życiem **kontrakt QR musi być zamrożony przy
wydaniu** (README skanera = źródło prawdy). Dziś schemat wymaga
skanera-pośrednika (rozwiązuje ID → serwis gracza, obsługuje BYOS /
wiele serwisów) — świadomy wybór, ale rodzi zależność od żywego hostingu.

**Rozważana warstwa awaryjna — QR z bezpośrednim deep-linkiem** (np.
wprost do iTunes/Apple Music): plus — działa zwykłym aparatem bez naszej
appki, odporny na śmierć hostingu; minus — gorszy UX (gracz sam
przewija/ucisza, żeby nie zdradzić roku; traci się neutralny odsłuch i
multi-serwisowość BYOS). Rekomendacja: **nie zamieniać** schematu, tylko
ewentualnie **dołożyć** deep-link jako fallback. Decyzja przy freeze,
z ekipą. Zależy od freeze kanonu (TripLine #29) — kontrakt QR zamrażamy
razem z kanonem.

## Trwałość skanera i edycja self-contained

Założenie: kolekcjonerska talia ma **przetrwać nawet, gdy padnie hosting
skanera** (GH Pages znika, domena wygasa). Karta z QR jest bezużyteczna,
jeśli zależy od jednej żywej strony.

**Podejście (zmienione):** skaner to malutka strona statyczna — **~416 kB
do wdrożenia** (`index.html` ~50 kB + `vendor/html5-qrcode.min.js` ~375 kB
+ favicon), grubo poniżej 1 MB (~600 kB zapasu). Więc trwałość to problem
**hostingu/mirrorowania**, nie sztuczka z rozmiarem kodu. Zamiast jednego
awaryjnego self-hostu — **research darmowych i trwałych hostów**, na
których lustrzemy stronę pod QR/URL, który dalej się rozwiązuje. Zadanie
badawcze: **issue #4**.

**Decyzja (na teraz) — niski priorytet.** Na czas developmentu zostajemy
przy **self-hostingu na GitHub Pages** (albo innym darmowym hoście); własnej
domeny na razie brak (może kiedyś). Docelowa trwałość = **self-custody / DIY**
w duchu produktu: skaner to publiczne, forkowalne repo — kto kupił talię DIY,
może **sforkować i postawić własny scaner** na swoim GH Pages (fork → Pages
daje HTTPS od ręki, więc aparat działa, czego kopia `file://` nie umie).
Zachęcamy do self-hostingu w nocie w pudełku / README. **Edycje festiwalowe**
(Red Smoke i ew. inne): ekipy, które i tak hostują własne strony, mogą hostić
skaner dla swojej edycji — do pogadania przy współpracy. Utrzymanie po naszej
stronie: tak długo, jak realnie damy radę, bez gwarancji (z czasem może
wymagać update'ów) — dlatego prawdziwą odpowiedzią na trwałość jest fork +
własny hosting, nie obietnica. Plan własna-domena / adres-treści / wiele
mirrorów zostaje jako kształt docelowy, **nie realizowany teraz** — do rewizji
przy freeze albo gdy pojawi się domena.

Sedno — **co koduje nadrukowany QR** (decyzja przy freeze, razem z kanonem
TripLine #29): (a) **własna domena** (indirekcja, którą przekierujemy na
dowolny żywy mirror; trwałe póki domena odnawiana), (b) **adres treści**
(IPFS CID / Arweave tx — niezależny od dostawcy, przeżyje śmierć hosta, ale
wymaga bramki), albo (c) **oba** (URL główny + nadrukowany fallback).

Kryteria (ważone trwałością) i kandydaci do zbadania — patrz issue #4:
grupa A darmowe hosty statyczne (GH/GitLab/**Codeberg** Pages, Cloudflare,
Netlify, Vercel, Surge, sourcehut), grupa B adresowanie treścią / trwałość
(**IPFS** + pinning, **Arweave**/permaweb — pay-once, Wayback jako
snapshot-fallback), grupa C indie/longevity (Neocities). Dostarczyć:
macierz porównawcza + rekomendacja (**host główny + ≥2 mirrory + decyzja
o kodowaniu QR**), zamknięta przy freeze.

Z dawnego planu zostaje: **awaryjny odsyłacz w pudełku** (URL repo +
instrukcja self-hostingu, TripLine #30) jako ludzki fallback; **Wayback +
tag wydania** wpadają do grupy B jako opcje trwałości. **Odpada** nadruk
całego kodu w QR — biblioteka `html5-qrcode` (~375 kB) grubo przekracza
limit gęstego QR (~2–3 kB).

## Lokalizacja i język

- **i18n skanera — ZROBIONE.** UI dwujęzyczny (słowniki `pl`/`en` w
  `index.html`, atrybuty `data-i18n`), **domyślnie EN** (talia jedzie w
  pudełku dla graczy międzynarodowych), auto-PL dla polskich przeglądarek,
  przełącznik PL/EN, wybór w `localStorage` (`tl_lang`). Regresję pilnuje
  `tests/test_i18n.js` (parytet słowników + niezmienność `parseQR`).
- **Do zrobienia:** README skanera na angielski (dziś PL; UI już
  dwujęzyczny, ale dokumentacja repo została po polsku). Angielski jako
  język bazowy repo otwiera projekt na współtwórców spoza PL.

## Odchudzenie przed freeze (kod tylko-prototypowy)

Skaner niesie kod zbierania feedbacku dodany **na potrzeby testu prototypu**
na festiwalu: ankieta po rundzie (znałeś? / trudność / 👍👎), licznik
„Zebrane oceny: N", panel eksportu CSV/JSON, zapis do `localStorage`
(`tl_feedback`). W wydaniu kolekcjonerskim (BYOS, gracz z pudełkiem) ta
warstwa jest **martwym balastem** — nikt nie eksportuje ocen z talii w
pudełku.

Do zrobienia przed freeze: **wyciąć kod tylko-prototypowy** ze skanera
(≈150–200 linii `index.html`: blok ankiety w ekranie DONE, ekran
`screen-feedback`, funkcje `selectFeedback`/`exportFeedback`/`loadFeedback`/
`saveFeedback`/`updateFeedbackCount`/`clearFeedback`, klucze i18n `fb.*`,
klucz `tl_feedback`). Efekt: leaner `index.html`, mniejsza powierzchnia do
utrzymania i prostszy freeze. Uwaga: to **nie** sprawi, że kod zmieści się
w QR (dominuje `vendor/html5-qrcode.min.js` ~375 kB — patrz „Trwałość"),
ale porządkuje produkt przed wydaniem. Decyzja: usunąć całkowicie vs zostawić
za flagą/`?debug` na przyszłe testy — rekomendacja: usunąć (git pamięta).

## Warsztat techniczny (ciągłe)

- CI zielone na tym repo (`.github/workflows/ci.yml`); testy
  bezpieczeństwa (`tests/test_scanner_security.js` — allow-lista hostów,
  brak `javascript:`) i i18n (`tests/test_i18n.js`) blokują regresje.
- Biblioteka skanera (`html5-qrcode`) hostowana lokalnie w `vendor/` —
  brak zależności od CDN (istotne dla trwałości, patrz wyżej).
- Kontrakt QR w README = źródło prawdy; każde narzędzie generujące karty
  (np. `generate_cards.py` w TripLine) musi produkować dokładnie ten
  format, inaczej skaner ich nie odczyta.

## Powiązane issues (to repo)

- Trwałość skanera / edycja self-contained → wycinek TripLine #32.
- Angielskie README + status i18n skanera → wycinek TripLine #31.

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
jeśli zależy od jednej żywej strony. Trzy warstwy zabezpieczenia, od
najtańszej:

1. **Awaryjny odsyłacz w pudełku** (wewnętrzna strona pokrywki): QR +
   krótki URL do repozytorium skanera + jednozdaniowa instrukcja „jak
   odpalić samemu". Zapaleniec klonuje repo i serwuje stronę lokalnie
   (`python3 -m http.server`). Koszt: jeden nadruk. Głównie zadanie
   graficzne — po stronie TripLine #30. Skaner dostarcza: stabilny URL
   repo + krótką instrukcję self-hostingu.
2. **Kod skanera w pudełku / na karcie.** Do zweryfikowania był rozmiar
   zbudowanej strony vs praktyczny limit gęstego QR (~2–3 kB/kod).
   **Zweryfikowane (2026-07):** `index.html` ~50 kB (≈13,8 kB po gzip),
   `vendor/html5-qrcode.min.js` ~375 kB. **Całość nie mieści się w QR** —
   nawet sam gzipowany `index.html` (13,8 kB) grubo przekracza limit, a
   biblioteka skanera (375 kB) tym bardziej. Nadruk całego kodu w QR
   **odpada** przy obecnej zależności od `html5-qrcode`. Otwarte: czy
   warto dążyć do wariantu bez ciężkiej biblioteki (dużo pracy, niski
   priorytet). Domyślnie polegamy na warstwach 1 i 3.
3. **Utrwalenie w sieci:** zrzut skanera do **Internet Archive** (Wayback),
   **tag wydania w gicie** (zamrożona wersja), ewentualnie IPFS/seed.
   Tanie, robione raz przy freeze.

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

**Decyzja (etap 1 — zrobione):** zamiast od razu wycinać, **schowaliśmy tryb
głosowania za flagą**, domyślnie **wyłączoną** — gracz talii nigdy go nie widzi
po odkryciu karty. Włączenie (admin/debug): `?vote=1` w URL (utrwalone w
`localStorage` `tl_voting`) albo **prosty toggle 📊 w lewym górnym rogu**
(jedno kliknięcie). Cały kod feedbacku jest zebrany za jedną flagą `votingEnabled`
(blok ankiety w ekranie DONE, ekran `screen-feedback`, `selectFeedback`/
`exportFeedback`/`commitPending`/`updateFeedbackCount`/`clearFeedback`, klucze
i18n `fb.*` + `vote.*`, klucz `tl_feedback`), więc da się go wyrwać w jednym
przejściu.

**Etap 2 (przed freeze):** **całkowicie usunąć** kod tylko-prototypowy, gdy nie
będzie już potrzebny. Efekt: leaner `index.html`, mniejsza powierzchnia do
utrzymania i prostszy freeze. Uwaga: to **nie** sprawi, że kod zmieści się
w QR (dominuje `vendor/html5-qrcode.min.js` ~375 kB — patrz „Trwałość"),
ale porządkuje produkt przed wydaniem.

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

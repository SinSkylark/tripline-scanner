# TripLine

Skaner kart QR do muzycznej gry „zgadnij rok". Gracz skanuje kartę, aplikacja
odtwarza utwór i odlicza 30 sekund, a po czasie ujawnia odpowiedź (tytuł,
wykonawca, rok). Całość to jeden plik `index.html` — działa na GitHub Pages,
bez backendu.

## Jak grać

1. Otwórz stronę na telefonie (Safari na iPhone, Chrome na Androidzie).
2. Wybierz źródło dźwięku. **Domyślnie „Fragment 30s"** — gra w aplikacji,
   bez konta, bez przełączania się do innej apki. Zalecane na test/festiwal.
3. Dotknij **Skanuj kartę** i przytrzymaj kartę w ramce.
4. Dotknij **Dotknij, by odtworzyć** — leci 30-sekundowe odliczanie.
5. Po czasie pojawia się **odpowiedź** i krótka ankieta.

## Tryby odtwarzania

| Tryb          | Konto       | Gdzie gra            | Uwagi                                   |
|---------------|-------------|----------------------|-----------------------------------------|
| Fragment 30s  | nie         | w aplikacji          | **zalecane** — pewny timer, offline-ish |
| YouTube       | nie         | apka/karta YouTube   | wychodzi z aplikacji                     |
| Spotify       | Premium     | apka Spotify         | otwiera wyszukiwarkę utworu              |
| Apple Music   | subskrypcja | apka Apple Music     | dokładny link z iTunes                   |
| Tidal         | subskrypcja | apka Tidal           | otwiera wyszukiwarkę utworu              |

> Odliczanie liczy czas z zegara (`Date.now()`), więc nie rozjeżdża się,
> gdy aplikacja działa w tle (np. po przełączeniu do YouTube).

## Format kodu QR na karcie

```
tripline:yt=VIDEO_ID&it=ITUNES_ID&dz=DEEZER_ID&t=TYTUŁ&a=WYKONAWCA&y=ROK
```

- `it` (iTunes track ID) jest potrzebne do fragmentu 30s i metadanych.
- `t` / `a` / `y` są opcjonalne — jeśli podane, mają **pierwszeństwo** na
  ekranie odpowiedzi (autorytatywny rok gry). Bez nich rok pochodzi z daty
  wydania w iTunes (uwaga: dla wznowień może być nietrafny).
- Obsługiwane są też zwykłe linki YouTube i czyste 11-znakowe ID (kompat.).

## Zbieranie feedbacku (test prototypu)

Po każdej rundzie gracz może zaznaczyć: czy znał utwór, poziom trudności i
ocenę (👍/👎). Każda runda zapisuje się **lokalnie** w `localStorage`
(klucz `tl_feedback`) — działa bez sieci.

Eksport: na ekranie startowym pojawia się **„📊 Zebrane oceny: N"** → otwiera
panel z **Eksportuj CSV / JSON**. CSV ma BOM UTF-8 (poprawne polskie znaki w
Excelu). Kolumny: `ts, service, yt, it, title, artist, year, known,
difficulty, rating`.

> Dane są per-przeglądarka i per-urządzenie. Jeśli test prowadzi kilka
> telefonów, eksportuj z każdego osobno. **Wyczyść dane** kasuje historię na
> danym urządzeniu (nieodwracalne).

## Bezpieczeństwo

Kody QR to niezaufane wejście. Linki ze starego formatu są przepuszczane
tylko przez allow-listę znanych serwisów muzycznych (HTTPS); `javascript:`
i obce domeny są blokowane.

## Rozwój lokalnie

```bash
python3 -m http.server 8099   # otwórz http://127.0.0.1:8099/index.html
```

Biblioteka skanera (`html5-qrcode`) jest hostowana lokalnie w `vendor/`,
więc aplikacja nie zależy od żadnego CDN-u podczas działania.

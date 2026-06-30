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

## Kontrakt QR (źródło prawdy)

> **To jest kanoniczna specyfikacja formatu kodu na karcie.** Każde narzędzie,
> które *generuje* karty (np. osobne repo z generatorem), musi produkować
> dokładnie ten format — w przeciwnym razie skaner ich nie odczyta. Parser po
> stronie skanera to `parseQR()` w `index.html`; ta sekcja i ten parser muszą
> pozostawać zgodne.

### Format podstawowy (zalecany)

```
tripline:yt=VIDEO_ID&it=ITUNES_ID&dz=DEEZER_ID&t=TYTUŁ&a=WYKONAWCA&y=ROK
```

Po prefiksie `tripline:` następuje ciąg w formacie query-string
(`URLSearchParams`). Wartości muszą być **URL-encoded** (np. spacje jako `%20`),
bo `&` i `=` rozdzielają pola.

| Pole | Wymagane | Znaczenie | Uwagi |
|------|----------|-----------|-------|
| `yt` | zalecane | ID filmu YouTube (11 znaków `[A-Za-z0-9_-]`) | używane do odtwarzania YouTube i jako fallback |
| `it` | zalecane | iTunes track ID (liczba) | potrzebne do fragmentu 30 s i metadanych (tytuł/wykonawca/rok) |
| `dz` | opcjonalne | Deezer track ID | tylko kompatybilność wsteczna |
| `t`  | opcjonalne | tytuł utworu | **pierwszeństwo** na ekranie odpowiedzi |
| `a`  | opcjonalne | wykonawca | **pierwszeństwo** na ekranie odpowiedzi |
| `y`  | opcjonalne | rok (np. `1975`) | **pierwszeństwo** — autorytatywny rok gry |

Zasady:

- Musi wystąpić **co najmniej jedno** z `yt` / `it` / `dz`, inaczej kod jest
  traktowany jako nieznany.
- `t` / `a` / `y` jeśli podane, **nadpisują** metadane z iTunes na ekranie
  odpowiedzi. Bez `y` rok pochodzi z daty wydania w iTunes — dla wznowień i
  kompilacji bywa nietrafny, więc dla precyzji w grze podawaj `y` jawnie.
- Nieznane pola są ignorowane (bezpieczne dla przyszłych rozszerzeń).

### Przykład

```
tripline:yt=fJ9rUzIMcZQ&it=1440806041&t=Bohemian%20Rhapsody&a=Queen&y=1975
```

### Formaty zgodności wstecznej

Skaner przyjmuje też (bez prefiksu `tripline:`):

- pełny link YouTube — `https://www.youtube.com/watch?v=…` lub `https://youtu.be/…`,
- czyste 11-znakowe ID YouTube,
- inne linki — przepuszczane tylko przez allow-listę bezpiecznych hostów
  (patrz **Bezpieczeństwo**).

Nowe karty generuj wyłącznie w formacie `tripline:` — pozostałe istnieją tylko
dla starych talii.

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

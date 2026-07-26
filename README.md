# TripLine

A QR-card scanner for the "guess the year" music game. A player scans a card,
the app plays the track and counts down 30 seconds, then reveals the answer
(title, artist, year). The whole thing is a single `index.html` file — it runs
on GitHub Pages, with no backend.

## Language (PL / EN)

The interface is bilingual. **English by default** (the scanner ships in the box
of the collectible edition, aimed at an international audience); Polish browsers
get Polish automatically. The **PL / EN** switcher is in the top-right corner,
and the choice is saved in `localStorage` (`tl_lang`). All UI text goes through
i18n keys (`pl`/`en` dictionaries in `index.html`); the QR contract is
language-independent. *(Note: redakcja-app in the TripLine repo has the opposite
default — PL.)*

## How to play

1. Open the page on your phone (Safari on iPhone, Chrome on Android).
2. Pick an audio source. **"30s preview" by default** — it plays inside the app,
   no account, no switching to another app. Recommended for testing/festivals.
3. Tap **Scan card** and hold the card inside the frame.
4. Tap **Tap to play** — a 30-second countdown starts.
5. When time is up, the **answer** appears along with a short survey.

## Playback modes

| Mode         | Account      | Where it plays      | Notes                                    |
|--------------|--------------|---------------------|------------------------------------------|
| 30s preview  | no           | in the app          | **recommended** — reliable timer, offline-ish |
| YouTube      | no           | YouTube app/tab     | leaves the app                           |
| Spotify      | Premium      | Spotify app         | opens a track search                     |
| Apple Music  | subscription | Apple Music app     | exact link from iTunes                   |
| Tidal        | subscription | Tidal app           | opens a track search                     |

> The countdown reads time from the clock (`Date.now()`), so it doesn't drift
> when the app runs in the background (e.g. after switching to YouTube).

## QR contract (source of truth)

> **This is the canonical specification of the code format on a card.** Any tool
> that *generates* cards (e.g. a separate generator repo) must produce exactly
> this format — otherwise the scanner won't read them. The parser on the scanner
> side is `parseQR()` in `index.html`; this section and that parser must stay in
> sync.

### Basic format (recommended)

```
tripline:yt=VIDEO_ID&it=ITUNES_ID&dz=DEEZER_ID&t=TITLE&a=ARTIST&y=YEAR
```

After the `tripline:` prefix comes a query-string (`URLSearchParams`). Values
must be **URL-encoded** (e.g. spaces as `%20`), because `&` and `=` separate the
fields.

| Field | Required    | Meaning | Notes |
|-------|-------------|---------|-------|
| `yt`  | recommended | YouTube video ID (11 chars `[A-Za-z0-9_-]`) | used for YouTube playback and as a fallback |
| `it`  | recommended | iTunes track ID (number) | needed for the 30s preview and metadata (title/artist/year) |
| `dz`  | optional    | Deezer track ID | backward compatibility only |
| `t`   | optional    | track title | **takes precedence** on the answer screen |
| `a`   | optional    | artist | **takes precedence** on the answer screen |
| `y`   | optional    | year (e.g. `1975`) | **takes precedence** — the authoritative game year |

Rules:

- **At least one** of `yt` / `it` / `dz` must be present, otherwise the code is
  treated as unknown.
- `t` / `a` / `y`, if given, **override** the iTunes metadata on the answer
  screen. Without `y`, the year comes from the iTunes release date — which can be
  wrong for reissues and compilations, so for precise gameplay pass `y`
  explicitly.
- Unknown fields are ignored (safe for future extensions).

### Example

```
tripline:yt=fJ9rUzIMcZQ&it=1440806041&t=Bohemian%20Rhapsody&a=Queen&y=1975
```

### Backward-compatible formats

The scanner also accepts (without the `tripline:` prefix):

- a full YouTube link — `https://www.youtube.com/watch?v=…` or `https://youtu.be/…`,
- a bare 11-character YouTube ID,
- other links — allowed only through an allow-list of safe hosts
  (see **Security**).

Generate new cards exclusively in the `tripline:` format — the rest exist only
for old decks.

## Feedback collection (prototype test)

> **Prototype-only, OFF by default.** Players of the shipped deck never see it.
> It's hidden behind a flag for occasional testing, and is slated for full
> removal before the release freeze (see issue #6).

**Enabling it** (admin/debug), either way persists in `localStorage` (`tl_voting`):

- add **`?vote=1`** to the URL (`?vote=0` turns it back off), or
- tap the small **📊 toggle in the top-left corner** (a single tap flips it on/off).

When on, after each round the player can mark: whether they knew the track, the
difficulty, and a rating (👍/👎). Each round is saved **locally** in
`localStorage` (key `tl_feedback`) — it works offline.

Export: the start screen shows **"📊 Collected ratings: N"** → opens a panel with
**Export CSV / JSON**. The CSV has a UTF-8 BOM (correct Polish characters in
Excel). Columns: `ts, service, yt, it, title, artist, year, known, difficulty,
rating`.

> Data is per-browser and per-device. If several phones are used for testing,
> export from each separately. **Clear data** wipes the history on a given device
> (irreversible).

## Security

QR codes are untrusted input. Links in the old format are allowed only through
an allow-list of known music services (HTTPS); `javascript:` and foreign domains
are blocked.

## Local development

```bash
python3 -m http.server 8099   # open http://127.0.0.1:8099/index.html
```

The scanner library (`html5-qrcode`) is hosted locally in `vendor/`, so the app
doesn't depend on any CDN at runtime.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

![홈 화면 — 글래스모피즘 명언 카드](docs/screenshots/home.png)
![내 보관함 화면 — 좋아요한 명언 그리드](docs/screenshots/collection.png)

## 작업 이력 (최근 세션 요약)

**1. 초기 구현 — 레트로 시티팝 감성 (기술명세서 기반)**
디즈니 명대사 20개를 레트로 OS 창 카드 UI로 감상하는 1차 버전을 구현. 이 과정에서 동시에 같은 프로젝트를 작업 중이던 다른 세션들의 결과물과 충돌이 있었고, 정리하며 다음 문제를 발견·수정함:
- `render.js`가 만들어내는 `.quote-mark`, `.window-counter`, `.quote-tags`/`.quote-tag`, `.quote-translation`, `.titlebar-dots` 클래스에 대응하는 CSS 규칙이 아예 없어 스타일이 깨져 있던 문제 → CSS 규칙 추가.
- `index.html`에 웹폰트(Pretendard·JetBrains Mono·Galmuri) `<link>`가 누락돼 지정한 폰트가 전혀 로드되지 않던 문제 → CDN 링크 추가.
- HTML은 옛 모달 구조, CSS는 새 바텀시트 구조로 서로 어긋나 있던 상태를 하나의 일관된 버전(index.html/css/js)으로 재작성.
- Playwright로 헤드리스 브라우저를 띄워 화면 전환·즐겨찾기·폰트 로드·콘솔 에러까지 직접 검증.

**2. 전면 리디자인 — 인스타그램 감성 글래스모피즘**
사용자 요청으로 디자인/기능을 다음과 같이 전면 교체:
- 배경을 Unsplash API 연동 사진(명언 전환 시 크로스페이드)으로, 카드를 글래스모피즘 스타일로 변경.
- 카테고리 필터(인생/동기부여/인간관계) 추가 — 기존 20개 명언에 카테고리 태깅.
- 좋아요(하트, 카드 더블탭 시 인스타그램식 하트 애니메이션) + `localStorage` 기반 "내 보관함" 탭 구현.
- 텍스트 복사 + `html2canvas` 기반 "이미지로 저장하기"(1080×1350 오프스크린 전용 템플릿 캡처) 구현.
- CSS/JS를 `data.js`/`background.js`/`render.js`/`app.js`로 관심사 분리.

이 과정에서 발견·수정한 오류:
- 최초 대체 이미지로 `picsum.photos`를 썼으나 실제로 이 네트워크 환경에서 연결이 계속 타임아웃되는 것을 확인 → `images.unsplash.com` 직링크(카테고리별 5장, CORS 헤더 `Access-Control-Allow-Origin: *` 직접 확인) 고정 풀로 교체해 키 없이도 항상 배경이 뜨도록 수정.
- html2canvas는 `backdrop-filter` 블러를 캡처하지 못해 화면의 글래스 카드를 그대로 캡처하면 이미지가 깨지는 문제 → 저장 전용 오프스크린 템플릿(`#export-template`)을 별도로 만들어 캡처하도록 설계.
- 이미지 저장 시 캔버스가 오염(tainted)되지 않도록 배경 `<img>`에 `crossOrigin="anonymous"`를 명시.

## What this is

"Twilight Quotes" (황혼의 명언) — a single-page Disney-quotes card app. Pure static HTML/CSS/vanilla JS, no build step, no package manager, no framework. It's designed to be opened directly as a file (`index.html`), not served.

## Running / testing changes

There is no build, lint, or test tooling in this repo (no `package.json`). To verify a change:

- Open `index.html` directly in a browser (double-click it, or on Windows: `start index.html`). It works over `file://` with no local server.
- There is no automated test suite. Verify UI changes by actually loading the page and clicking through: category filter chips → card swipe/arrows → like (heart button or double-tap the card) → "내 보관함" (collection) tab → copy-text button → "이미지로 저장" (save-as-image) button. Check the browser console for errors, since nothing else will catch a runtime bug.
- If you need headless verification (e.g. to screenshot or confirm no console errors), Playwright works against the `file://` path directly — no dev server needed, e.g. `page.goto('file:///.../index.html')`.

## Architecture

### Script load order is load-bearing

There are no ES modules and no bundler — every JS file is a plain `<script>` tag sharing one global scope, loaded in this exact order in `index.html`:

```
js/data.js        → defines global QUOTES
js/background.js  → defines global backgroundUrlCache, getBackgroundUrlForQuote(), etc. (uses QUOTES)
js/render.js      → defines global ICONS and all DOM-building functions (uses background.js's helpers)
js/app.js         → wires up state + events (uses everything above)
```

Functions and constants from earlier files are used unqualified (no imports) in later files. If you rename something in `data.js` or `background.js`, grep the other three files — nothing will flag a broken reference until it throws at runtime.

### Data model (`js/data.js`)

`QUOTES` is a flat array of Disney quote objects: `{ id, quote, translation, source, sourceEn, year, keywords[], category }`. `category` is one of exactly three values — `"인생"` / `"동기부여"` / `"인간관계"` — and drives both the home-screen filter chips and which background-photo pool a quote pulls from. `quotes.json` mirrors this same data for reference/external use but the app itself never fetches it (see below); if you edit quote content, update both files.

### Background photos (`js/background.js`)

Every quote gets a full-bleed background photo, crossfaded in on quote change via two stacked `<img id="bg-photo-a/b">` layers (opacity-swap, see `crossfadeBackgroundTo`). Photo resolution order, per quote, cached in `backgroundUrlCache` keyed by quote id:

1. Real Unsplash API (`api.unsplash.com/photos/random`) — only if `UNSPLASH_ACCESS_KEY` at the top of the file is filled in (it ships empty).
2. `FALLBACK_PHOTOS_BY_CATEGORY` — a hardcoded, CORS-verified pool of `images.unsplash.com/photo-<id>` URLs (5 per category), deterministically picked per quote via `hashStringToIndex(quote.id, ...)` so the same quote always shows the same fallback photo across the home card and the collection grid thumbnail.

Background `<img>` elements are loaded with `crossOrigin = "anonymous"` — this is required for the html2canvas export to work (see below), not optional polish. If you swap in a different image host for the fallback pool, it must send `Access-Control-Allow-Origin: *` or image export will silently produce a blank/tainted canvas.

### State (`js/app.js`)

One plain `state` object holds everything: `activeCategory`, `filteredQuotes` (QUOTES filtered by category), `currentIndex` (into `filteredQuotes`), `currentView` (`"home"` | `"collection"`), and `likes` (a `Set` of quote ids, persisted to `localStorage` under `likedQuoteIds`). There's no framework reactivity — every state change is followed by an explicit `render*()` call to redraw the affected DOM. `getCurrentQuote()` is the canonical way to read "what's on screen right now."

### "Save as image" (`downloadCurrentAsImage` in `app.js`)

This does **not** screenshot the visible glass card — `backdrop-filter` blur isn't captured correctly by html2canvas, so the on-screen card would export looking broken. Instead there's a separate, purpose-built off-screen node (`#export-template` in `index.html`, sized 1080×1350, styled in the `.export-template` block of `style.css`) that gets populated fresh (`fillExportTemplate` in `render.js`) and captured with `html2canvas`. If you change the visible card's content, you likely also need to update `fillExportTemplate`/`#export-template` to match, since they're two independent DOM trees rendering the same quote.

### Views

There are exactly two views (`home`, `collection`), toggled via `[hidden]` on `<section data-view="...">` elements — see `switchView()`. There is no router and no per-quote detail modal; tapping a collection grid tile jumps the home view's `currentIndex` to that quote and switches back to `home` (see the `collection-mount` click handler in `app.js`).

## Other notes

- `xref/` contains reference material only (the original quote source list and mood-board images) — not consumed by the app at runtime.
- All fonts (Pretendard, Playfair Display, JetBrains Mono) and `html2canvas` are loaded from CDNs in `index.html`'s `<head>`; there's no local vendoring.
- Comments in the JS files are intentionally explanatory (not terse) — this project is meant to be readable by beginners extending it, so match that style rather than stripping comments down.

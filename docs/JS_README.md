# JavaScript & Service Worker Documentation

This document explains the behavior and responsibilities of the three runtime scripts powering the site.

- `js/main.js`: main site interactions and UI logic
- `js/offline.js`: offline page features (ASCII, mini‑game, chatbot, coding challenge)
- `service-worker.js`: offline caching, navigation strategy, and notifications

Each section below references exact functions, classes, and selectors used in the code to keep explanations grounded.

---

## js/main.js — Site UI Logic

Location: `js/main.js`

### 1) Early Offline Redirect
- Function: immediately redirects to `404.html` when `navigator.onLine === false` on entry.
- Reason: prevents showing a cached “working” main page while offline.
- Debug: add `?debugOnline=1` to bypass during development.

Relevant snippet:
```js
(function earlyOfflineRedirect(){
  try {
    const debugBypass = /(?:[?&])debugOnline=1\b/.test(location.search);
    if (!debugBypass && typeof navigator !== 'undefined' && 'onLine' in navigator) {
      if (!navigator.onLine) {
        location.replace('/404.html');
        return;
      }
    }
  } catch {}
})();
```

### 2) Mobile Menu (Hamburger)
- Elements: `.hamburger`, `.nav-links`
- Behavior: toggle menu open/closed, close on outside click, close before smooth scrolling.

Key calls:
- Toggle: `hamburger.addEventListener('click', ...)`
- Close when clicking outside: `document.addEventListener('click', ...)`

### 3) Smooth Scroll to Sections
- Links: `a[href^="#"]`
- Convert `#home` to `.home`, call `Element.scrollIntoView({ behavior: 'smooth' })`.
- Ensures menu closes first to avoid layout issues during the scroll.

### 4) Toast Helper
- Element: dynamically created `.toast` div appended to `document.body`.
- Usage: `showToast(message, type)`; auto hides after 3s.
- Accessibility: `role="status"`, `aria-live="polite"`, `aria-atomic="true"`.

### 5) Contact Form Validation & Cooldown
- Element: `.contact-form`
- Features:
  - Cooldown between submits using `sessionStorage` (`last_submit_at`).
  - Honeypot field `#company` blocks bots.
  - Strong email regex and disposable domain check (`DISPOSABLE_DOMAINS`).
  - Message checks: length, URLs blocked, repeated chars, min word count.
  - Simple challenge (`.challenge-q` and `.challenge-input` or `#challenge`).
  - Email send via `emailjs.send(...)`.
- Feedback: success/error via `showToast()`.

Key functions:
- `containsUrl(text)`: quick URL presence check.
- `isDisposableEmail(email)`: domain and base-domain checks.
- `markInvalid(el)`: focuses and sets `aria-invalid`.

### 6) Scroll Reveal and Stagger
- Elements: `.reveal`, `.stagger`
- Uses `IntersectionObserver` to toggle `.in-view`.
- Stagger: sets `transitionDelay` per child initially, later resets to `0ms`.

### 7) Scroll-to-Top Button
- Element: `.scroll-to-top-btn`
- Logic: show after `window.scrollY > 300`, smooth scroll to top on click.

### 8) Language Switcher
- Elements: `.lang-btn`, `.translatable`
- Applies values from `data-nl`/`data-en`, stores preference in `localStorage` (`preferred_lang`), sets `<html lang>`.

### 9) Theme Toggle (Light/Dark)
- Element: `.theme-toggle` with an `<i>` icon inside.
- Applies classes: `html.light` (custom CSS) and `html.dark` (if used by utilities).
- Stores to `localStorage` as `preferred_theme`.

### 10) Hero: Canvas “Code Rain”
- Element: `<canvas id="code-bg">`
- Respects `prefers-reduced-motion`.
- DPR-aware sizing, throttled ~28 FPS for efficiency.
- Fades previous frame for trails and occasionally hard clears to avoid ghosting.
- Reacts to theme changes and tab visibility.

Key functions: `resize()`, `draw(ts)`, `themeColors()`, and visibility/resize handlers.

### 11) Hero: 3D Coding Nebula (Three.js)
- Element: `.code-3d` or `#code-3d`
- Requires `THREE` on `window` (loaded via modules in `index.html`).
- Renders starfield, holographic grid, code panels (canvas textures), and wireframes.
- Responds to theme changes by recoloring fog, grid, stars, and panel textures.
- Pauses when `prefers-reduced-motion` is set.

---

## js/offline.js — Offline Page Features

Location: `js/offline.js`

### 1) Typewriter ASCII header
- Element: `.typewriter`
- Loops through lines with a blinking cursor.

### 2) Mini-game: “Catch the bugs before deploy!”
- Elements:
  - Board: `.board`
  - HUD: `.score`, `.time`, `.bug-count`, `.lines`, `.level`, `.result`
  - Controls: `.start`, `.stop`
- Features:
  - Delta-time animation for consistent movement.
  - Power-ups: React (slow enemies), Node (shield for missed bug).
  - Level increases and faster spawn rates over time.
  - Clear end result message with threshold.

### 3) Offline Chatbot
- Elements: `.chat-log`, `.chat-input`, `.chat-send`
- Rule-based replies with jokes, quotes, and tips.
- Easter egg keywords: `let`, `const`, `map`, `reduce`, `fetch`, `async`, `css`, `grid`, `git`, `npm`, etc.

### 4) Offline Coding Challenge — Editor + Console
- Elements:
  - `.ch-task`: task description
  - `.ch-editor`: textarea for code
  - `.ch-console`: captured console output
  - `.ch-run`, `.ch-reset`, `.ch-new`: controls
- Engine:
  - Puzzles have `{ id, task, starter, validate(out) }`.
  - Runs user code inside an async IIFE via `new Function('console', 'return (async()=>{ ... })()')`.
  - Captures `console.log` into an array; validator checks expected output.
  - Persists editor code per puzzle in `localStorage` (`offline_ch_editor_<id>`), live-updates on input.

Included puzzles:
- `square`, `map-vs-foreach`, `optional-chaining`, `async-answer`, `sum-reduce`, `reverse-string`, `palindrome`.

### 5) Reconnect Toast + Auto Return
- Shows a reconnect toast on `online` and returns to `/` after a short delay.
- If `offline.html` is opened while online (without `?debugOffline=1`), shows hint and sends back to `/`.

---

## service-worker.js — PWA Caching & Fallbacks

Location: `service-worker.js`

### Strategy Overview
- Precache small set of core assets on `install` using `CACHE_NAME` and `PRECACHE` list.
- On `activate`, delete old caches and claim clients immediately.
- Fetch handling:
  - Navigations (HTML): network-first; on failure serve `404.html`.
  - Same-origin static assets: cache-first with background update.
- Push notifications: supports DevTools push with optional JSON payload; shows notification and focuses/open tab on click.

Important constants:
- `const CACHE_NAME = 'portfolio-cache-v1.0.7'`
- `const OFFLINE_URL = '/offline.html'` (kept for precache; navigation fallback is `404.html` by design)

Key fetch snippet:
```js
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const isNavigation = request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() => caches.match('/404.html'))
    );
    return;
  }

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin && (/\.(?:css|js|png|jpg|jpeg|gif|webp|svg|ico|json)$/i).test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
            return networkResponse;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
```

### Testing notes
- First visit online to register SW and precache.
- In DevTools → Application → Service Workers:
  - Use “Update on reload” and “Skip waiting” while developing.
- Simulate offline and test navigation fallbacks and cached assets.

---

## Appendix: How to navigate the code

- The source files already contain clear Dutch comments for every major feature, e.g.:
  - `js/main.js`: headers and per-feature inline comments.
  - `js/offline.js`: headers and comments for typewriter, mini‑game, chatbot, and coding challenge.
  - `service-worker.js`: top-of-file strategy summary and fetch handler comments.

If you want a fully annotated version with the entire code copied inline under each section, I can generate split docs:
- `docs/main-js.annotated.md`
- `docs/offline-js.annotated.md`
- `docs/service-worker.annotated.md`

These would include full code blocks and line-by-line commentary.

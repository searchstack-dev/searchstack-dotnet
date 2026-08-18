# @searchstack/autocomplete

[![npm version](https://img.shields.io/npm/v/@searchstack/autocomplete.svg)](https://www.npmjs.com/package/@searchstack/autocomplete)
![license](https://img.shields.io/npm/l/@searchstack/autocomplete.svg)

**Drop-in autocomplete and typeahead search UI for any text input.** Anchored dropdown on
desktop, full-screen modal on mobile, search history built in — and no framework required.
Works with React, Vue, Svelte, or plain HTML, because it attaches to an element you already have.

👉 **[Try it live](https://searchstack.dev/demos)** — no signup.

Suggestions are served by the [Search Stack](https://searchstack.dev) search API, fetched via
[`@searchstack/public-api`](https://www.npmjs.com/package/@searchstack/public-api). You'll need a
free API key ([10,000 records, every feature, no card](https://searchstack.dev)).

## Install

```
npm install @searchstack/autocomplete
```

## 30-second start

```html
<input id="search" type="text" placeholder="Search…" />
```

```js
import { attachList } from '@searchstack/autocomplete';

await attachList('search', 'sk_...', 'my-account', 'my-list', 1);
```

That's a working typeahead. Everything below is optional customisation.

## Usage

```js
import { attachList, attachGroup } from '@searchstack/autocomplete';

// Suggest over a single List:
await attachList('my-textbox-id', 'sk_...', 'my-account', 'my-list', 1, {
    template: (data) => `<div>${data.name}</div>`,
    selected: (data) => console.log('selected', data),
    search: (query) => console.log('search', query),
});

// ...or across every List in a Group (pass the group's membership version):
await attachGroup('my-textbox-id', 'sk_...', 'my-account', 'my-group', 3, {
    template: (data) => `<div>${data.name}</div>`,
});
```

Both resolve with the list element once attached. If the textbox is not yet in the DOM they wait for up to 30 seconds before rejecting.

- `attachList(textboxId, apiKey, accountName, listName, version, options)` — suggest over a single List.
- `attachGroup(textboxId, apiKey, accountName, groupName, version, options)` — suggest across a Group of Lists, using the group's membership version.
- `attachAsk(textboxId, apiKey, accountName, listName, version, options)` — everything `attachList` does, plus a grounded answer panel. See below.

The first two are identical apart from which endpoint they hit; `apiKey` is the second argument and is required (it authenticates the request and overrides any `api_key` in `options`).

## Ask

> **Requires 2.4.0 or later.** `attachAsk` and `attachAskLauncher` were added in 2.4.0. Importing
> them from an older build fails the **whole module**, not just the Ask call — a missing named export
> is an ES-module *link* error, so `attachList` never runs either and the search box goes down with
> it. Loading from a CDN? Pin the exact version (`@2.4.0`), not the `@2` range: jsDelivr can keep
> serving a cached older build behind a range for hours after a release.

`attachAsk` is `attachList` plus an answer. Typing behaves exactly as before — same suggestions, same
speed — and an **"Ask this" row** appears beneath the suggestions, opening an overlay that streams an
answer and links back to every section it used.

Four ways to reach it, so it never becomes a mouse-only feature:

| | |
| --- | --- |
| **Click** the row | |
| **↓ past the last suggestion** | The row is the last stop in the same list the arrow keys walk |
| **Type a `?`** | Ends the query in a question mark and the row is pre-selected, so **Enter** answers straight away |
| **Cmd-K / Ctrl-K** | From anywhere on the page |

Inside the overlay, a trailing `?` **starts the answer on its own** — no Enter needed. It waits
`ask_auto_delay` (700ms) after the last keystroke so a sentence is only answered once it is finished,
and it will not answer the same wording twice; both guards exist because every answer is a paid call.
**↓** and **↑** walk the cited and related sections, and **Esc** closes.

**Enter is unchanged unless the Ask row is selected.** With no `?` and no arrowing, Enter still fires
`searchstack-search` exactly as it always did, so an existing jump-to-top-match handler keeps working.
Arrowing into the suggestions clears the question-mark selection — an explicit move beats an inferred
default.

```js
import { attachAsk } from '@searchstack/autocomplete';

await attachAsk('search', 'sk_...', 'my-account', 'my-list', 1, {
    ask_endpoint: '/api/ask',            // your backend — see below
    template: (data) => `<div>${data.name}</div>`,
});
```

**Suggestions go straight from the browser to the search API on the key above. The answer does not.**
Generating an answer needs a model key, and a model key must never ship in a page — so `ask_endpoint`
points at your own backend, which retrieves, calls the model, and streams the result back.

Your endpoint receives `POST { "question": "…" }` and replies with server-sent events:

| Event | Payload | When |
| --- | --- | --- |
| `sources` | `{ sources: [{ marker, title, page, url, content }] }` | First, before generation — so the panel paints results immediately instead of sitting blank |
| `delta` | `{ text }` | Each chunk of the answer |
| `done` | `{ answered, reason, citations, cached }` | Last |
| `error` | `{ message }` | Instead of `done` |

Cite sections in the answer text as `[^1]`, matching a source's `marker`. The widget renders each one
as a link to that source's `url`.

**Strip any marker your retrieval did not produce before you send it.** The widget will not render a
marker it cannot resolve, but that is a last line of defence, not the guarantee — the guarantee has to
be that an uncited claim never leaves your server. A cited answer is the only reason a reader should
trust one, so a citation that goes nowhere is worse than no answer.

An answer that cannot be grounded should come back with `answered: false`, a plain sentence, and the
sources still populated: the sections are usually what the reader wanted anyway, and a refusal over an
empty panel reads as a broken feature.

Ask options — all optional, all on the same options object:

| Option | Default | Description |
| --- | --- | --- |
| `ask_endpoint` | `/api/docs/ask` | Your SSE endpoint |
| `ask_row_label` | `Ask this` | Label on the pinned row |
| `ask_placeholder` | `Ask a question…` | Placeholder in the overlay |
| `ask_thinking_label` | `Looking through the documentation…` | Shown while streaming |
| `ask_sources_label` | `Answered from` | Heading above cited sources |
| `ask_results_label` | `Related sections` | Heading above the rest |
| `ask_error_label` | `Something went wrong producing that answer.` | Shown on failure |
| `ask_hotkey` | `true` | Bind Cmd-K / Ctrl-K |
| `ask_on_question_mark` | `true` | Treat a trailing `?` as intent to ask — pre-selects the row, and auto-starts in the overlay |
| `ask_auto_delay` | `700` | Pause after the last keystroke before an auto-started answer fires, in ms |
| `ask_feedback` | `true` | Show the thumbs row |
| `ask_link` | — | `(url) => url`, to rewrite links before navigation |
| `ask_rated` | — | `(rating, question) => void`, for your own telemetry |

### Ask without a search box

For a page that has no search box to hang Ask off — a home page, a footer, a help menu — use
`attachAskLauncher`. It wires any element to open the same overlay, fetches no suggestions, and needs
no search key:

```html
<button id="ask" type="button">Ask this site a question…</button>
```
```js
import { attachAskLauncher } from '@searchstack/autocomplete';

await attachAskLauncher('ask', { ask_endpoint: '/api/ask' });
```

The element decides the shape:

| Element | Opens on | Use it when |
| --- | --- | --- |
| `<button>` | Click, Enter, Space | It's a doorway — a footer link, a help menu entry |
| `<input>` | **Enter**, or a trailing **`?`** | Typing is the obvious gesture — a hero, a search bar |

An `<input>` is a real field: the reader types in it, and what they typed is **carried into the
overlay**. That hand-off is the point — a box you can type into whose text is thrown away when the
dialog opens is a trap.

The `?` is debounced by `ask_auto_delay`, because a question mark can land mid-sentence ("what?" on
the way to "what does it cost?") and taking the page over on that keystroke would interrupt the very
question it's meant to answer.

**Neither opens on focus, and an `<input>` does not open on click either.** Focus is how you reach a
control, not how you activate it — someone tabbing through the page would have a modal spring open
unbidden. And clicking into a field is how you start typing in it; if that opened the overlay, the
box could never be typed in at all.

Give an element a `data-ask-question` and it opens the overlay already asking it — example questions
are far more persuasive on a landing page than an empty box the visitor has to think of something to
type into:

```html
<button data-ask-question="How much does it cost?">How much does it cost?</button>
```

**A launcher does not bind Cmd-K.** `ask_hotkey` applies to `attachAsk` only. Cmd-K is a convention
from developer tools — Algolia DocSearch, Linear, Vercel — and it belongs where the audience already
knows it. Hijacking it on a marketing page teaches nobody anything, so don't show a ⌘K badge on one
either: a badge for a shortcut that isn't bound is a promise the page doesn't keep.

It resolves once attached, so you can keep the element hidden until Ask is confirmed working and
never show a button that does nothing:

```js
attachAskLauncher('ask', { ask_endpoint: '/api/ask' })
    .then(el => { el.hidden = false; })
    .catch(() => { /* leave it hidden */ });
```

### Theming

Theming uses `--searchstack-ask-*` variables (`accent-color`, `background-color`, `text-color`,
`border-color`, `muted-color`, `hover-color`, `width`, `max-height`, `border-radius`, `z`). The
overlay ships unbranded and follows light/dark automatically; set the variables to match your site.

If your site has its own light/dark toggle, set them on `.searchstack-ask-card` (e.g.
`html .searchstack-ask-card { … }`) rather than only on `:root`. The package's own
`prefers-color-scheme` rule declares them on the card, and a declaration on the element beats an
inherited one — so a `:root`-only override loses to the visitor's OS setting.

Class hooks: `searchstack-ask-backdrop`, `-card`, `-head`, `-input`, `-body`, `-answer`, `-cite`,
`-source`, `-section`, `-label`, `-foot`, `-row`, `-row-focused` (the row while selected).

Note the `searchstack-search` event carries the query as a property **on the event** (`e.query`), not
as `CustomEvent` detail.

## Options

| Option | Default | Description |
|---|---|---|
| `api_key` | – | API key, sent as the `X-API-Key` header. Supply this or `access_token`. |
| `access_token` | – | JWT access token, sent as `Authorization: Bearer`. |
| `base_url` | production endpoint | Override the API base URL. |
| `delay` | `200` | Debounce delay in ms before a suggest request fires. |
| `minimum_characters` | `2` | Minimum query length before suggesting. |
| `suggestion_options` | – | Extra `SuggestOptions` passed to the API (`size`, `filter`, `radius`, `skip`, `cache`). |
| `template` | demo template | Renders a suggestion. Receives the suggestion record. |
| `history_template` | `template` | Renders a history item. |
| `history_header` | `"Recent"` | Label shown in a header row (with a clock icon) above history results, so the user can tell they are recent selections. Set to `""` to hide it. |
| `footer_template` | – | Renders a footer below the suggestions. |
| `enable_history` | `true` | Store selected items in `localStorage` and show them while the query is empty. |
| `headless` | `false` | Fetch and dispatch suggestions without showing the list. |
| `allow_multiple` | `true` | When `false`, attaching destroys previously attached instances. |
| `list_style` / `list_item_style` / `history_item_style` | – | Inline style overrides. |
| `selected` / `suggested` / `search` / `selected_failed` / `suggested_failed` | – | Callbacks (the same payloads are also dispatched as DOM events, below). |
| `full_screen_on_mobile` | `true` | Use the full-screen modal on small touch screens. |
| `mobile_max_screen_width` | `500` | Max width (px) treated as mobile. |
| `enable_repositioning` | `false` | Desktop: let the list flip to the right/top/left when it does not fit. |
| `full_length` | `true` | Desktop: make the list at least as wide as the textbox. |

## Events

Dispatched on the list element and bubble up the DOM:

- `searchstack-selected` — `{ query, data, id }`
- `searchstack-suggestions` — `{ query, data }`
- `searchstack-search` — `{ query }` (Enter pressed)
- `searchstack-selected-failed` / `searchstack-suggestions-failed` — `{ status, message, ... }`

## Styling

The widget injects its own stylesheet and exposes CSS custom properties, all prefixed `--searchstack-list-*` (desktop) and `--searchstack-mobile-*` (mobile), e.g.:

```css
:root {
    --searchstack-list-width: 500px;
    --searchstack-list-border-color: #888;
    --searchstack-list-item-background-hover-color: rgba(10, 10, 10, .08);
}
```

Class hooks: `searchstack-list`, `searchstack-list-item`, `searchstack-list-item-focused`, `searchstack-history-item`, `searchstack-history-header`, `searchstack-mobile-*`.

## Other exports

```js
import { destroy, reset, clearHistory, removeHistory } from '@searchstack/autocomplete';
```

- `destroy()` — detach and remove every attached instance (desktop, mobile and the ask overlay).
- `reset()` — forget attached instances without touching the DOM.
- `clearHistory()` / `removeHistory(key)` — manage the stored suggestion history.

## Migrating from 1.x

- The single `attach` entry point is gone. Use `attachList(...)` for a List and `attachGroup(...)` for a Group — same arguments, no `is_group` option. Replace `attach(id, key, account, name, version)` with `attachList(id, key, account, name, version)`, and `attach(id, key, account, name, version, { is_group: true })` with `attachGroup(id, key, account, name, version)`.
- The `is_group` option was removed (the choice is now the function you call).

## Migrating from @searchability/autocomplete

- Package renamed to `@searchstack/autocomplete`; all `searchability-*` DOM events, CSS classes, and CSS custom properties are now `searchstack-*`.
- The API now requires credentials: pass `api_key` or `access_token` in options.
- Group endpoints now require a `version` (the Group's membership version). Passing `undefined` as `version` no longer selects group mode.
- `pre_cache` was removed (the public API has no cache warm-up endpoints).
- `destroy()`/`reset()` now cover mobile instances too, and `clearHistory`/`removeHistory` are exported from the bundled package.

## Build

```
npm install
npm run build
```

Outputs ESM (`dist/searchstack-autocomplete.js`), CommonJS (`.cjs`), a versioned ESM file for CDN use, and bundled type declarations (`dist/types.d.ts`).

# @searchstack/public-api

[![npm version](https://img.shields.io/npm/v/@searchstack/public-api.svg)](https://www.npmjs.com/package/@searchstack/public-api)
![license](https://img.shields.io/npm/l/@searchstack/public-api.svg)
[![node](https://img.shields.io/node/v/@searchstack/public-api.svg)](https://nodejs.org)

**The official TypeScript client for the [Search Stack](https://searchstack.dev)
public API — search, ingest, and manage your indexes from Node or the browser.
Fully typed, zero runtime dependencies.**

A typed, `fetch`-based client for the Search Stack public API
(`api.searchstack.dev`). It exposes a `SearchStackClient` with a service per area
of the API and request/response types that match the API's JSON wire format
(snake_case) one-to-one.

It authenticates at the client level with an **API key** or an **access token**
and covers the full public surface — search and suggest, list/group management
and versioning, ingestion, evals and judges, analytics, and account details.

## Install

```bash
npm install @searchstack/public-api
```

Requires Node 18+ (or any runtime with a global `fetch`).

## Quickstart

```ts
import { SearchStackClient } from "@searchstack/public-api";

const client = new SearchStackClient({ apiKey: "sk_live_..." });

// Search version 1 of the "products" list in the "acme" account.
const result = await client.Search.searchList("acme", "products", 1, {
  query: "running shoes",
  size: 10,
});

if (result.isSuccess) {
  for (const hit of result.toSuccess().results) {
    console.log(hit.name, fieldText(hit, "colour"), fieldNumber(hit, "price"));
  }
} else {
  // Methods never throw — errors come back as a typed Problem (see below).
  console.error(result.toProblem().status, result.toProblem().detail);
}
```

## Reading a result's fields

```ts
import { fieldText, fieldValues, fieldNumber } from "@searchstack/public-api";

fieldText(hit, "colour");   // "red"             — one value, as itself
fieldText(hit, "genre");    // "Comedy, Drama"   — several, joined
fieldValues(hit, "genre");  // ["Comedy", "Drama"]
fieldNumber(hit, "price");  // 19.99
```

A **facet is always an array** in a response — `["red"]`, `[2006]`, `[]` when the record carries no
value — whatever its cardinality and however many values it holds, so the shape follows the schema
rather than the row. Searchable fields and resources stay scalar. These readers cover both, so nothing
you write has to know which kind of field it is asking about.

`String(["red"])` is already `"red"`, so in TypeScript this is a convenience rather than a rescue — but
`String(["Comedy","Drama"])` is `"Comedy,Drama"` with no space, and `Number()` on a two-value field is a
quiet `NaN`. An absent, null or empty field reads as `null` (or `[]`), and a name in the wrong case
still finds its field.

They read **both shapes a record arrives in**. A search hit nests its custom fields in a `fields` bag; a
suggestion from `/suggest` is flat, with each field beside `name`. Pass either:

```ts
import { attachList } from "@searchstack/autocomplete";
import { fieldText } from "@searchstack/public-api";

// `data` here is a suggestion — flat — and the same reader works on it.
await attachList("txt1", "YOUR_SUGGEST_KEY", "my-account", "movies", 1, {
  template: (data) => `<strong>${data.name}</strong> <small>${fieldText(data, "genre")}</small>`,
});
```

## Authentication

The API accepts either of two credentials. Configure one when constructing the
client:

```ts
import { SearchStackClient } from "@searchstack/public-api";

// API key -> sent as the `X-API-Key` header
const client = new SearchStackClient({ apiKey: "sk_live_..." });

// or an access token -> sent as `Authorization: Bearer <token>`
const client = new SearchStackClient({ accessToken: "eyJ..." });
```

If both are supplied, the access token takes precedence. You can also point the
client at a non-production host:

```ts
const client = new SearchStackClient({
  apiKey: "sk_live_...",
  baseUrl: "https://api.searchstack.dev/",
});
```

Credentials can be swapped at runtime (e.g. after refreshing a token):

```ts
client.setAccessToken(newToken);
client.setApiKey(newKey);
```

## Result handling

No method throws on an HTTP error. Each resolves to a `Response` that is either a
success carrying the typed payload or a `Problem` (RFC 7807). Network/JSON errors
are surfaced as a `Problem` with `status: 500`.

```ts
const result = await client.Search.searchList("acme", "products", 1, { query: "boots" });

if (result.isSuccess) {
  const page = result.toSuccess();      // SearchResponse
  console.log(page.total_count, page.results);
} else {
  const problem = result.toProblem();   // Problem
  console.error(problem.status, problem.detail);
}
```

## Services

| Property | Service | Highlights |
| --- | --- | --- |
| `client.Accounts` | Account | `get`, `getName` |
| `client.Lists` | List | `create`, `get`, `edit`, `clone`, `restore`, `setSynonyms`, `delete` |
| `client.Groups` | Group | `create`, `get`, `versions`, `versionMembers`, `edit`, `clone`, `bumpVersion`, `restore`, `addList`, `removeList`, `setModel`, `removeModel`, `setReranker`, `removeReranker`, `transfer`, `delete` |
| `client.Facets` | Facet | `create`, `rename`, `remove` |
| `client.Resources` | Resource | `create`, `rename`, `remove` |
| `client.Searchables` | Searchable field | `create`, `rename`, `remove` |
| `client.Contributors` | Contributor | `add`, `remove` |
| `client.Coordinates` | Coordinates | `add`, `remove` |
| `client.MediaStores` | Media store | `deleteMedia` |
| `client.SearchResults` | Search result writes | `create`, `bulkInsert`, `bulkInsertWithFields`, `edit`, `editVector`, `remove`, `deleteByFilter`, `softDeleteByFilter` |
| `client.Search` | Search / query | `searchList`, `searchGroup`, `related`, `searchListByImage`, `searchGroupByImage`, `searchListByImageBase64`, `searchGroupByImageBase64`, `extractDocumentText`, `recordListClick`, `recordGroupClick` |
| `client.Suggest` | Suggest | `list`, `group` |
| `client.Ask` | Ask (grounded, cited answers) | `list`, `group` |
| `client.Analytics` | Analytics | `getList`, `getGroup` |
| `client.Evals` | Eval sets | `list`, `get`, `runs`, `runStatus`, `create`, `bootstrap`, `run`, `delete` |
| `client.Evals` | Eval cases | `listCases`, `getCase`, `createCase`, `editCase`, `deleteCase` |
| `client.Judges` | Judge graders | `list`, `get`, `runStatus`, `create`, `edit`, `delete` |
| `client.Judges` | Judge instructions | `listInstructions`, `getInstruction`, `createInstruction`, `editInstruction`, `deleteInstruction`, `listInstructionVersions`, `getInstructionVersion`, `restoreInstructionVersion`, `run`, `try` |
| `client.QueryRules` | Query rules (query optimisation) | `templates`, `list`, `get`, `create`, `test`, `reorder`, `edit`, `setState`, `setStance`, `infer`, `metrics`, `fieldProfiles`, `inferFromSearches`, `delete` |
| `client.Discovery` | Discovery (anonymous) | `info`, `examples`, `catalog` |

> Search and suggest methods use the API's `POST` variants so options are passed
> as a typed object rather than a hand-built query string.

## Examples

Text search a list version:

```ts
const res = await client.Search.searchList("acme", "products", 3, {
  query: "running shoes",
  size: 20,
  filter: "brand eq 'Acme'",
  minimum_text_score: 0.6,
});
```

Find related results and record a click-through:

```ts
const related = await client.Search.related("acme", "products", "sku-123", { size: 5 });

if (related.isSuccess) {
  const { results, query_id } = related.toSuccess();
  if (query_id) {
    await client.Search.recordListClick("acme", "products", {
      query_id,
      result_id: results[0].name,
    });
  }
}
```

Bulk insert documents. Each row carries its name under `name` — bulk insert reads that key and no
other, so a row named `title` or `search_result_name` is dropped:

```ts
await client.SearchResults.bulkInsertWithFields("acme", "products", [
  { name: "Trail Shoe", sku: "sku-1", price: 99 },
  { name: "Road Shoe", sku: "sku-2", price: 79 },
]);
```

Manage a group and its membership versions:

```ts
await client.Groups.addList("acme", "catalog", { list_name: "products", version: 4 });
await client.Groups.bumpVersion("acme", "catalog");   // pin members to their latest
const versions = await client.Groups.versions("acme", "catalog");
// search a specific, frozen membership version:
await client.Search.searchGroup("acme", "catalog", versions.toSuccess().current_version, { query: "boots" });
```

Try a judge instruction (the prompt a judge grades against), then track search quality with an eval set:

```ts
const verdict = await client.Judges.try("acme", "relevance-check", {
  context: { text: "waterproof hiking boots" },
  candidate: { id: "sku-1", text: "Trail Runner — mesh, not waterproof" },
});
if (verdict.isSuccess) console.log(verdict.toSuccess().passed);

const run = await client.Evals.run("acme", "relevance");        // async (202)
if (run.isSuccess) {
  const status = await client.Evals.runStatus("acme", "relevance", run.toSuccess().run_id);
}
```

List analytics for a date range:

```ts
const report = await client.Analytics.getList("acme", "products", "2026-05-01", "2026-05-31");
```

## Development

```bash
npm install
npm run build   # tsc -> dist/ (ESM + .d.ts)
npm test        # vitest
```

## Changelog

### 5.0.0

- **Breaking:** the group IP allow-list is gone. `client.Groups.addIpAddress` / `removeIpAddress`,
  `AddIpAddressRequest` and the `ip_addresses` field on `ListResponse` and `GroupResponse` are
  removed. The API never enforced the list, so nothing else changes.

### 4.3.0

- Adds `client.Ask` — `list` and `group`. One call retrieves from your own records and answers
  from them, returning the answer plus the records it cited. Every citation is checked against the
  retrieved set server-side, so it can never point at a record that was not retrieved, and a refusal
  is a normal success carrying the records that matched.
- Needs the `ask:run` permission on the key, and a Judge on the account: generation runs on that
  Judge's model and provider credential, so it costs money at **your** provider, not ours.

### 4.2.0

- Adds list-level gates: a gate can belong to one list, and is listed and deleted with it.

### 4.1.0

- Adds the field readers `fieldText` / `fieldValues` / `fieldNumber`, so reading a field no longer
  means knowing how many values it holds.

### 2.0.0

- **Breaking:** query routes moved from `/search-result/*` to `/search/*` on the
  server, and the client's `Search` service now calls the new routes
  (`search/...` for list/group search, related, image search, and click
  analytics). No method signatures changed — but this version only works
  against servers that expose the new `/search/*` routes.
- Record-level routes are unchanged: `SearchResults` writes and
  `Search.extractDocumentText` still use `/search-result/*`.

### 1.0.x

- Initial release: full coverage of the public API surface.

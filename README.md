# SearchStack SDKs

Official client libraries for [SearchStack](https://searchstack.dev) — a hosted search API where
full-text, vector, geo and image search all run over the same JSON endpoint, and relevance is
something you can measure rather than guess at.

| Package | Language | Install |
|---|---|---|
| [`@searchstack/public-api`](./packages/public-api) | TypeScript / JavaScript | `npm install @searchstack/public-api` |
| [`@searchstack/autocomplete`](./packages/autocomplete) | Browser (framework-agnostic) | `npm install @searchstack/autocomplete` |
| [`SearchStack.PublicApi`](./dotnet/SearchStack.PublicApi) | .NET | `dotnet add package SearchStack.PublicApi` |

## Quick start

```ts
import { SearchStackClient } from "@searchstack/public-api";

const client = new SearchStackClient({ apiKey: process.env.SEARCHSTACK_API_KEY });
const results = await client.search.list("movies", { query: "heist", limit: 10 });
```

```csharp
var client = new SearchStackClient(new ApiKeyCredentials("YOUR_API_KEY"));
var results = await client.SearchListAsync("movies", new SearchRequest { Query = "heist" });
```

Each package has its own README with the full surface.

## What SearchStack does

- **One query, several kinds of matching** — keyword, semantic (vector), geo-radius and image
  similarity against the same records, without standing up separate engines.
- **Relevance you can test** — pinned relevance evals and LLM judges score whether the results an
  agent gets back are actually right, so a ranking change is a measurement rather than a hunch.
- **Built for agents** — a hosted [MCP server](https://mcp.searchstack.dev) exposes the same surface
  as tools, so Claude, ChatGPT, Cursor or Copilot can search and manage your data directly. Every
  tool here has a matching HTTP endpoint; nothing is agent-only.
- **Facets, groups, synonyms, query rules and feeds** — the ordinary catalogue-search machinery,
  managed through the same API.

## Using it with an agent

Point any MCP client at `https://mcp.searchstack.dev/` and sign in, or pass an API key header. See
[Use with Claude](https://searchstack.dev/learn/use-with-claude),
[Cursor](https://searchstack.dev/learn/use-with-cursor) or
[Copilot](https://searchstack.dev/learn/use-with-copilot).

The API is self-describing: `https://api.searchstack.dev/api/info` and `/api/examples` return an
always-current manifest and worked examples, so a tool can learn the surface at runtime.

## Docs and support

- Reference: <https://searchstack.dev/reference>
- Support: <https://searchstack.dev/support>
- Status: <https://status.searchstack.dev>

## Licences

The packages keep the licences they publish under: `@searchstack/public-api` and
`SearchStack.PublicApi` are ISC, `@searchstack/autocomplete` is MIT. Each package directory carries
its own `LICENSE`.

© Retriv, Inc

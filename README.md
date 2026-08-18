# SearchStack.PublicApi

Typed, `HttpClient`-based .NET client for the [SearchStack](https://searchstack.dev) API — full-text,
vector, geo and image search over one JSON endpoint, with relevance you can measure.

```bash
dotnet add package SearchStack.PublicApi
```

```csharp
using SearchStack.PublicApi;

var client = new SearchStackClient("sk_live_...");

var result = await client.Search.SearchListAsync("acme", "movies", 1,
    new SearchOptions { Query = "heist", Size = 10 });
```

Targets `net8.0` and `netstandard2.0`. The full surface is documented in
[the package README](./README.md) and at <https://searchstack.dev/reference>.

## The other clients

- [`@searchstack/public-api`](https://github.com/searchstack-dev/searchstack-public-api) — TypeScript
- [`@searchstack/autocomplete`](https://github.com/searchstack-dev/searchstack-autocomplete) — browser search UI

## Agents

A hosted [MCP server](https://mcp.searchstack.dev) exposes the same surface as tools, so Claude,
ChatGPT, Cursor or Copilot can search and manage your data directly. Every tool has a matching HTTP
endpoint; nothing is agent-only.

## Docs and support

Reference <https://searchstack.dev/reference> · Support <https://searchstack.dev/support> ·
Status <https://status.searchstack.dev>

Licensed ISC. © Retriv, Inc

# SearchStack.PublicApi

[![NuGet](https://img.shields.io/nuget/v/SearchStack.PublicApi.svg)](https://www.nuget.org/packages/SearchStack.PublicApi)
[![Targets](https://img.shields.io/badge/targets-netstandard2.0%20%7C%20net8.0-blue.svg)](#targets--dependencies)

**The official .NET client for the [Search Stack](https://searchstack.dev) public
API — search, ingest, and manage your indexes from any .NET app. Typed,
`HttpClient`-based, with near-zero dependencies.**

A typed client for the Search Stack public API (`api.searchstack.dev`). It exposes
a `SearchStackClient` with a service per area of the API and request/response types
that match the API's JSON wire format (snake_case) one-to-one, covering the full
public surface — search and suggest, list/group management and versioning,
ingestion, evals and judges, analytics, and account details.

This is the C# counterpart of the [`@searchstack/public-api`](https://www.npmjs.com/package/@searchstack/public-api)
TypeScript package and mirrors its surface closely.

## Targets & dependencies

Multi-targets **`netstandard2.0`** (works on .NET Framework 4.6.1+, Mono, Xamarin,
Unity, .NET Core 2.0+) and **`net8.0`**. The only dependency is `System.Text.Json`,
and that is pulled in **only** on `netstandard2.0` — on `net8.0` it is in-box, so
the package has zero transitive dependencies there.

## Install

```bash
dotnet add package SearchStack.PublicApi
```

## Quickstart

```csharp
using SearchStack.PublicApi;

var client = new SearchStackClient("sk_live_...");

// Search version 1 of the "products" list in the "acme" account.
var result = await client.Search.SearchListAsync("acme", "products", 1,
    new SearchOptions { Query = "running shoes", Size = 10 });

if (result.IsSuccess)
{
    foreach (var hit in result.ToSuccess().Results)
        Console.WriteLine($"{hit.Name}: {hit.Text("colour")} — {hit.Number("price")}");
}
else
{
    // Methods never throw — errors come back as a typed Problem (see below).
    Console.Error.WriteLine($"{result.ToProblem().Status}: {result.ToProblem().Detail}");
}
```

## Reading a result's fields

`hit.Fields` is a `Dictionary<string, object?>`, because a field can hold text, a number, a date, or
several of any of those. What comes out of it is a `JsonElement` — so read fields through the readers
rather than through the dictionary:

```csharp
hit.Text("colour")     // "red"             — one value, as itself
hit.Text("genre")      // "Comedy, Drama"   — several, joined
hit.Values("genre")    // ["Comedy", "Drama"]
hit.Number("price")    // 19.99
```

A **facet is always an array** in a response — `["red"]`, `[2006]`, `[]` when the record carries no
value — whatever its cardinality and however many values it holds, so the shape follows the schema
rather than the row. Searchable fields and resources stay scalar. The readers cover both, so your code
never has to know which kind of field it is asking about.

A field that is absent, null or empty reads as `null` (or an empty list) rather than throwing, and a
name in the wrong case still finds its field. The same readers work on `VerifiedOffer.Fields`, which
is where `Number` matters most — that one is the price you are about to charge.

## Authentication

The API accepts either of two credentials. Configure one when constructing the
client:

```csharp
using SearchStack.PublicApi;

// API key -> sent as the `X-API-Key` header
var client = new SearchStackClient("sk_live_...");

// or, with full options:
var client = new SearchStackClient(new SearchStackClientOptions
{
    AccessToken = "eyJ...",                       // sent as Authorization: Bearer <token>
    BaseUrl = "https://api.searchstack.dev/",     // optional, defaults to production
});
```

If both an API key and an access token are supplied, the access token takes
precedence. Credentials can be swapped at runtime (e.g. after refreshing a token):

```csharp
client.SetAccessToken(newToken);
client.SetApiKey(newKey);
```

### Bring your own HttpClient

By default the client creates and owns an `HttpClient` (disposed with the client).
To control handlers, pooling or timeouts — or to use `IHttpClientFactory` — pass
your own; it will **not** be disposed by the client:

```csharp
var client = new SearchStackClient(new SearchStackClientOptions
{
    ApiKey = "sk_live_...",
    HttpClient = httpClientFactory.CreateClient("searchstack"),
});
```

## Result handling

No method throws on an HTTP error. Each resolves to a `Response<T>` (or `Response`
for no-body calls) that is either a success carrying the typed payload or a
`Problem` (RFC 7807). Network and JSON errors are surfaced as a `Problem` with
`Status` 500. Cancellation still throws `OperationCanceledException`.

```csharp
var result = await client.Search.SearchListAsync("acme", "products", 1,
    new SearchOptions { Query = "boots" });

if (result.IsSuccess)
{
    SearchResponse page = result.ToSuccess();
    Console.WriteLine($"{page.TotalCount}, {page.Results.Count}");
}
else
{
    Problem problem = result.ToProblem();
    Console.Error.WriteLine($"{problem.Status}: {problem.Detail}");
}
```

`result.Data` and `result.Problem` are also exposed directly for pattern-style
checks.

## Services

| Property | Service | Highlights |
| --- | --- | --- |
| `client.Accounts` | Account | `GetAsync`, `GetNameAsync` |
| `client.Lists` | List | `CreateAsync`, `GetAsync`, `EditAsync`, `CloneAsync`, `RestoreVersionAsync`, `SetSynonymsAsync`, `DeleteAsync` |
| `client.Groups` | Group | `CreateAsync`, `GetAsync`, `GetVersionsAsync`, `GetVersionMembersAsync`, `UpdateAsync`, `CloneAsync`, `BumpVersionAsync`, `RestoreVersionAsync`, `AddListAsync`, `RemoveListAsync`, `SetModelAsync`, `RemoveModelAsync`, `SetRerankerAsync`, `RemoveRerankerAsync`, `TransferAsync`, `DeleteAsync` |
| `client.Facets` | Facet | `CreateAsync`, `RenameAsync`, `RemoveAsync` |
| `client.Resources` | Resource | `CreateAsync`, `RenameAsync`, `RemoveAsync` |
| `client.Searchables` | Searchable field | `CreateAsync`, `RenameAsync`, `RemoveAsync` |
| `client.Contributors` | Contributor | `AddAsync`, `RemoveAsync` |
| `client.Coordinates` | Coordinates | `AddAsync`, `RemoveAsync` |
| `client.MediaStores` | Media store | `DeleteMediaAsync` |
| `client.SearchResults` | Search result writes | `CreateAsync`, `BulkInsertAsync`, `BulkInsertWithFieldsAsync`, `EditAsync`, `EditVectorAsync`, `RemoveAsync`, `DeleteByFilterAsync`, `SoftDeleteByFilterAsync` |
| `client.Search` | Search / query | `SearchListAsync`, `SearchGroupAsync`, `RelatedAsync`, `SearchListByImageAsync`, `SearchGroupByImageAsync`, `SearchListByImageBase64Async`, `SearchGroupByImageBase64Async`, `ExtractDocumentTextAsync`, `RecordListClickAsync`, `RecordGroupClickAsync` |
| `client.Suggest` | Suggest | `ListAsync`, `GroupAsync` |
| `client.Ask` | Ask (grounded, cited answers) | `AskListAsync`, `AskGroupAsync`, `AskGroupLatestAsync` |
| `client.Analytics` | Analytics | `GetListAsync`, `GetGroupAsync` |
| `client.Evals` | Eval sets | `ListAsync`, `GetAsync`, `GetRunsAsync`, `GetRunStatusAsync`, `CreateAsync`, `BootstrapAsync`, `RunAsync`, `DeleteAsync` |
| `client.Evals` | Eval cases | `ListCasesAsync`, `GetCaseAsync`, `CreateCaseAsync`, `EditCaseAsync`, `DeleteCaseAsync` |
| `client.Judges` | Judge graders | `ListAsync`, `GetAsync`, `GetRunStatusAsync`, `CreateAsync`, `EditAsync`, `DeleteAsync` |
| `client.Judges` | Judge instructions | `ListInstructionsAsync`, `GetInstructionAsync`, `CreateInstructionAsync`, `EditInstructionAsync`, `DeleteInstructionAsync`, `ListInstructionVersionsAsync`, `GetInstructionVersionAsync`, `RestoreInstructionVersionAsync`, `RunAsync`, `TryAsync` |
| `client.QueryRules` | Query rules (query optimisation) | `TemplatesAsync`, `ListAsync`, `GetAsync`, `CreateAsync`, `TestAsync`, `ReorderAsync`, `EditAsync`, `SetStateAsync`, `SetStanceAsync`, `InferAsync`, `GetMetricsAsync`, `GetFieldProfilesAsync`, `InferFromSearchesAsync`, `DeleteAsync` |
| `client.Discovery` | Discovery (anonymous) | `InfoAsync`, `ExamplesAsync`, `CatalogAsync` |

> Search and suggest methods use the API's `POST` variants so options are passed
> as a typed object rather than a hand-built query string.

## Examples

Text search a list version:

```csharp
var res = await client.Search.SearchListAsync("acme", "products", 3, new SearchOptions
{
    Query = "running shoes",
    Size = 20,
    Filter = "brand eq 'Acme'",
    MinimumTextScore = 0.6,
});
```

Find related results and record a click-through:

```csharp
var related = await client.Search.RelatedAsync("acme", "products", "sku-123",
    new RelatedOptions { Size = 5 });

if (related.IsSuccess)
{
    var page = related.ToSuccess();
    if (!string.IsNullOrEmpty(page.QueryId))
    {
        await client.Search.RecordListClickAsync("acme", "products", new RecordClickRequest
        {
            QueryId = page.QueryId!,
            ResultId = page.Results[0].Name,
        });
    }
}
```

Bulk insert documents. Each row carries its name under `name` — bulk insert reads that key and no
other, so a row named `title` or `search_result_name` is dropped:

```csharp
await client.SearchResults.BulkInsertWithFieldsAsync("acme", "products", new[]
{
    new Dictionary<string, object?> { ["name"] = "Trail Shoe", ["sku"] = "sku-1", ["price"] = 99 },
    new Dictionary<string, object?> { ["name"] = "Road Shoe", ["sku"] = "sku-2", ["price"] = 79 },
});
```

Manage a group and its membership versions:

```csharp
await client.Groups.AddListAsync("acme", "catalog",
    new AddListToGroupRequest { ListName = "products", Version = 4 });
await client.Groups.BumpVersionAsync("acme", "catalog");   // pin members to their latest
var versions = await client.Groups.GetVersionsAsync("acme", "catalog");

// search a specific, frozen membership version:
await client.Search.SearchGroupAsync("acme", "catalog",
    versions.ToSuccess().CurrentVersion, new SearchOptions { Query = "boots" });
```

Try a judge instruction (the prompt a judge grades against), then track search quality with an eval set:

```csharp
var verdict = await client.Judges.TryAsync("acme", "relevance-check", new TryJudgeRequest
{
    Context = new JudgeContextDto { Text = "waterproof hiking boots" },
    Candidate = new JudgeCandidateDto { Id = "sku-1", Text = "Trail Runner — mesh, not waterproof" },
});
if (verdict.IsSuccess) Console.WriteLine(verdict.ToSuccess().Passed);

var run = await client.Evals.RunAsync("acme", "relevance");   // async (202)
if (run.IsSuccess)
{
    var status = await client.Evals.GetRunStatusAsync("acme", "relevance", run.ToSuccess().RunId);
}
```

List analytics for a date range:

```csharp
var report = await client.Analytics.GetListAsync("acme", "products", "2026-05-01", "2026-05-31");
```

## Development

```bash
dotnet build
dotnet pack -c Release
```

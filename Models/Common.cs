using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SearchStack.PublicApi;

// Type definitions for the Search Stack public API. Member names map to the JSON
// wire format via the SnakeCaseLower naming policy (see Json.cs); the "@*_score"
// fields are the only ones that need an explicit [JsonPropertyName].

/// <summary>A geographic point.</summary>
public sealed class GeoPoint
{
    public double Lat { get; set; }
    public double Lon { get; set; }
}

/// <summary>A named facet / searchable / resource field, used both when writing one and when reading one back.</summary>
public sealed class NameAndValue
{
    public string Name { get; set; } = "";

    /// <summary>
    /// The field's value. <b>Writing and reading are not symmetric, deliberately.</b>
    /// <para>
    /// When WRITING, pass whatever is natural — a scalar for a field holding one value, a collection for a
    /// facet whose cardinality is <c>Many</c>, e.g.
    /// <c>Value = new[] { "Anne Hathaway", "Meryl Streep" }</c>. Each value then becomes independently
    /// filterable. Passing a collection to a <c>Single</c> facet is refused rather than quietly reduced to
    /// its first element.
    /// </para>
    /// <para>
    /// When READING a search result, a FACET's value is <b>always an array</b> — <c>["red"]</c>,
    /// <c>[2006]</c>, <c>[]</c> when the record carries no value — whatever its cardinality and however
    /// many values it holds. The shape follows the schema, not the row, so one facet cannot come back as a
    /// scalar on one result and an array on the next. Read the facet's <c>Cardinality</c> to know whether
    /// the first element is the whole story. Searchable fields and resources are single-valued text and
    /// stay scalar.
    /// </para>
    /// </summary>
    public object? Value { get; set; }
}

// ─── Search results ──────────────────────────────────────────────────────────

/// <summary>
/// A single search result. The per-modality score fields are prefixed with
/// <c>@</c> exactly as the API emits them, and <see cref="Fields"/> carries the
/// result's custom data.
/// </summary>
public sealed class SearchHit
{
    [JsonPropertyName("@text_score")] public double? TextScore { get; set; }
    [JsonPropertyName("@image_score")] public double? ImageScore { get; set; }
    [JsonPropertyName("@document_score")] public double? DocumentScore { get; set; }
    [JsonPropertyName("@video_score")] public double? VideoScore { get; set; }
    [JsonPropertyName("@audio_score")] public double? AudioScore { get; set; }

    public string Name { get; set; } = "";
    public string? ListName { get; set; }
    public int? Version { get; set; }
    public double? Distance { get; set; }
    public GeoPoint? Location { get; set; }

    /// <summary>
    /// Freshness stamp: when this record was last written/synced from its source. Null when the
    /// API did not report one. Search is best-effort fresh; use verify_offer for a point-of-action
    /// guarantee on volatile fields (price, stock).
    /// </summary>
    public System.DateTimeOffset? AsOf { get; set; }

    /// <summary>
    /// Matched snippets, keyed by the field you asked to highlight, with matching terms wrapped in
    /// <c>&lt;em&gt;</c>. Null unless <c>highlight_fields</c> was set, and a field with no match is simply
    /// absent. Lexical only: a vector-only or browse query matched by meaning, so there is nothing to point
    /// at and none are returned.
    /// </summary>
    public Dictionary<string, List<string>>? Highlights { get; set; }

    public Dictionary<string, object?> Fields { get; set; } = new Dictionary<string, object?>();
}

public sealed class SearchResponse
{
    public List<SearchHit> Results { get; set; } = new List<SearchHit>();
    public int Count { get; set; }
    public int TotalCount { get; set; }
    public string? QueryId { get; set; }

    /// <summary>
    /// How the query was read before it was executed. Null when no rule fired, so a non-null value is the
    /// signal that the search you got is not literally the search you asked for — render it, and give the
    /// customer a way back. Set <see cref="SearchOptions.InterpretationMode"/> to <c>off</c> to skip it.
    /// </summary>
    public QueryInterpretation? Interpretation { get; set; }
}

/// <summary>How a raw query was read: the text that survived, and the constraints lifted out of it.</summary>
public sealed class QueryInterpretation
{
    /// <summary>The query as sent.</summary>
    public string Query { get; set; } = "";

    /// <summary>What was left for text search once the constraints were lifted out.</summary>
    public string Text { get; set; } = "";

    public List<ExtractedConstraint>? Constraints { get; set; }

    /// <summary>What rules in shadow WOULD have done. Never applied to the results you just got back.</summary>
    public List<ShadowConstraint>? Shadow { get; set; }
}

/// <summary>One constraint lifted out of the query and applied to the search.</summary>
public sealed class ExtractedConstraint
{
    public string Field { get; set; } = "";

    /// <summary>Exactly as the customer typed it — this, not <see cref="Value"/>, is what a chip shows.</summary>
    public string RawText { get; set; } = "";

    /// <summary>The canonical form the filter was built from: <c>nn13er</c> arrives here as <c>NN1 3ER</c>.</summary>
    public string Value { get; set; } = "";

    public string Rule { get; set; } = "";

    /// <summary><c>Filter</c>, <c>ExactLookup</c> (pins one record above the results) or <c>Boost</c>.</summary>
    public string Action { get; set; } = "";

    /// <summary>False when your own filter already covered this field, so the constraint was dropped.</summary>
    public bool Applied { get; set; }

    public string? SupersededByCallerFilter { get; set; }
}

/// <summary>What a rule in shadow would have extracted. Never applied.</summary>
public sealed class ShadowConstraint
{
    public string Field { get; set; } = "";
    public string RawText { get; set; } = "";
    public string Value { get; set; } = "";
    public string Rule { get; set; } = "";
    public string Action { get; set; } = "";

    /// <summary>The rule matched the shape but the field does not hold the value — it would have returned nothing.</summary>
    public bool VerificationFailed { get; set; }
}

public sealed class ExtractedDocument
{
    public string Uri { get; set; } = "";
    public int? PageCount { get; set; }
    public string? Text { get; set; }
    public string? Error { get; set; }
}

public sealed class ExtractDocumentTextResponse
{
    public string SearchResultName { get; set; } = "";
    public int MaxPages { get; set; }
    public List<ExtractedDocument> Documents { get; set; } = new List<ExtractedDocument>();
}

/// <summary>A typeahead suggestion is an opaque record of the suggested fields.</summary>
public sealed class Suggestion : Dictionary<string, object?>
{
}

// ─── Media ───────────────────────────────────────────────────────────────────

public sealed class DeleteMediaResponse
{
    public bool Deleted { get; set; }
}

/// <summary>Acknowledgement that a (soft-)delete-by-filter background job has been accepted.</summary>
public sealed class DeleteByFilterResponse
{
    public bool Accepted { get; set; }
}

/// <summary>Concrete outcome of a synchronous delete-by-ids: how many supplied ids were removed,
/// and which were not found (a no-op, since delete-by-key is idempotent).</summary>
public sealed class DeleteByIdsResponse
{
    public int Deleted { get; set; }
    public IReadOnlyList<string> NotFound { get; set; } = new List<string>();
}

/// <summary>How many records' overlay state actually changed (a replay of already-current values is 0).</summary>
public sealed class ApplyVolatileDeltasResponse
{
    public int Applied { get; set; }
}

/// <summary>Result of a verify_offer confirmation: the current volatile values per requested record.</summary>
public sealed class VerifyOfferResponse
{
    public List<VerifiedOffer> Offers { get; set; } = new List<VerifiedOffer>();
}

public sealed class VerifiedOffer
{
    public string Id { get; set; } = "";
    public string? Name { get; set; }
    /// <summary>Freshness of the returned values. Null when the record was not found.</summary>
    public System.DateTimeOffset? AsOf { get; set; }
    /// <summary><c>overlay</c> (seconds-fresh), <c>index</c> (last-indexed), or <c>not_found</c>.</summary>
    public string Source { get; set; } = "";
    /// <summary>The current volatile field values (name → value).</summary>
    public Dictionary<string, object?> Fields { get; set; } = new Dictionary<string, object?>();
}

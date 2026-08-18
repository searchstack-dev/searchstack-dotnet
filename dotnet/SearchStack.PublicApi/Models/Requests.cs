using System.Collections.Generic;

namespace SearchStack.PublicApi;

// Request bodies. Optional members are nullable and omitted from the wire when
// null (see Json.cs DefaultIgnoreCondition), mirroring the TS client's behaviour.

public sealed class CreateSearchResultRequest
{
    public string AccountName { get; set; } = "";
    public string ListName { get; set; } = "";
    public string SearchResultName { get; set; } = "";
    public bool? Active { get; set; }
    /// <summary>Relative time-to-live in seconds; resolved to an absolute expiry. Ignored when <see cref="ExpiresAt"/> is set.
    /// 0 means this record never expires, overriding the list default rather than falling back to it — that is how you
    /// exempt one record from a list-wide expiry. Null falls back to the list default.</summary>
    public long? TtlSeconds { get; set; }
    /// <summary>Absolute expiry instant. Takes precedence over <see cref="TtlSeconds"/> and the list default, and is
    /// honoured even if it has already passed.</summary>
    public System.DateTimeOffset? ExpiresAt { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public List<NameAndValue>? Facets { get; set; }
    public List<NameAndValue>? SearchableFields { get; set; }
    public List<NameAndValue>? Resources { get; set; }
}

public sealed class UpdateSearchResultRequest
{
    public string? SearchResultName { get; set; }
    public bool? Active { get; set; }
    /// <summary>Relative TTL in seconds, anchored to the record's creation time. 0 clears the expiry (never expires);
    /// null leaves it unchanged.</summary>
    public long? TtlSeconds { get; set; }
    /// <summary>Absolute expiry instant. Takes precedence over <see cref="TtlSeconds"/>.</summary>
    public System.DateTimeOffset? ExpiresAt { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public List<NameAndValue>? Facets { get; set; }
    public List<NameAndValue>? SearchableFields { get; set; }
    public List<NameAndValue>? Resources { get; set; }
}

/// <summary>
/// Body of the non-vectorizing volatile-field patch: sets frequently-changing values (price, stock,
/// availability) on a record WITHOUT re-embedding it. Only facets and non-vectorized searchable /
/// resource fields are accepted; fields that feed the embedding must use <c>EditAsync</c>.
/// </summary>
public sealed class PatchVolatileFieldsRequest
{
    public List<NameAndValue>? Facets { get; set; }
    public List<NameAndValue>? SearchableFields { get; set; }
    public List<NameAndValue>? Resources { get; set; }
}

/// <summary>
/// A batch of volatile deltas: fast-changing overlay values (price, quantity) written WITHOUT
/// re-indexing or re-embedding, decorated onto search results at response time (freshness M3).
/// </summary>
public sealed class ApplyVolatileDeltasRequest
{
    public List<VolatileDeltaItem>? Deltas { get; set; }
}

/// <summary>
/// verify_offer body: the engine ids (the <c>id</c> values from search hits) whose current volatile
/// values should be confirmed.
/// </summary>
public sealed class VerifyOfferRequest
{
    public List<string> Ids { get; set; } = new List<string>();
}

public sealed class VolatileDeltaItem
{
    /// <summary>The record's engine id (the <c>id</c> on a search hit), not its name.</summary>
    public string Id { get; set; } = "";
    /// <summary>When the values were observed at the source. Optional; defaults to server time. Drives last-write-wins.</summary>
    public System.DateTimeOffset? AsOf { get; set; }
    /// <summary>Flat map of field name to new value, e.g. { "price": 42.0, "quantity": 7 }.</summary>
    public Dictionary<string, object?> Fields { get; set; } = new Dictionary<string, object?>();
}

public sealed class UpdateSearchResultVectorRequest
{
    public float[]? TextVector { get; set; }
    public float[]? ImageVector { get; set; }
    public float[]? DocumentVector { get; set; }
}

/// <summary>Free-text / vector search options. All members are optional.</summary>
public sealed class SearchOptions
{
    public string? Query { get; set; }
    public int? Size { get; set; }
    public int? Skip { get; set; }
    public string? Filter { get; set; }
    public string? Radius { get; set; }
    public bool? Cache { get; set; }
    public bool? VectorSearch { get; set; }
    public bool? Reranker { get; set; }
    public string? Ranking { get; set; }
    public double? MinimumTextScore { get; set; }
    public double? MinimumImageScore { get; set; }
    public double? MinimumDocumentScore { get; set; }
    public double? MinimumVideoScore { get; set; }
    public double? MinimumAudioScore { get; set; }
    public string? OrderBy { get; set; }
    public bool? TypoTolerance { get; set; }

    /// <summary>
    /// How much of the query a record has to contain: <c>any</c>, <c>all</c> or <c>phrase</c>.
    /// <para>
    /// <c>any</c> is the default and suits a search box — a record holding one of the terms matches, and
    /// ranking sorts out the rest. <c>all</c> requires every term, in any order. <c>phrase</c> requires the
    /// terms together and in order, and is exact (typo tolerance does not apply to it).
    /// </para>
    /// <para>
    /// Reach for <c>all</c> or <c>phrase</c> when you need the SET of records containing something rather
    /// than a ranked page: only then does <c>TotalCount</c> count real matches, so you can report a total,
    /// page to the end, or sort by something other than relevance without dragging near-misses along.
    /// </para>
    /// </summary>
    public string? Match { get; set; }

    /// <summary>
    /// Fields to return matched snippets for, comma-separated: <c>name</c>, or a searchable field's name.
    /// Each hit then carries <c>Highlights</c>. Omit for none.
    /// <para>
    /// Lexical only. A vector-only search matched by meaning rather than by a term, so there is nothing to
    /// point at and no highlights come back.
    /// </para>
    /// </summary>
    public string? HighlightFields { get; set; }

    /// <summary>
    /// <c>auto</c> (the default) reads the query through the List's query rules, so a postcode or an order
    /// number becomes a constraint rather than words to match. <c>off</c> searches for exactly what was typed.
    /// <para>
    /// Per-request, so one literal search — a "search for this exactly" affordance, or a diagnostic — costs
    /// nobody else their rules.
    /// </para>
    /// </summary>
    public string? InterpretationMode { get; set; }
}

/// <summary>Options for finding results related to a seed result.</summary>
public sealed class RelatedOptions
{
    public string? Filter { get; set; }
    public int? Size { get; set; }
    public int? Skip { get; set; }
    public string? Radius { get; set; }
    public double? MinimumTextScore { get; set; }
    public double? MinimumImageScore { get; set; }
    public double? MinimumDocumentScore { get; set; }
    public double? MinimumVideoScore { get; set; }
    public double? MinimumAudioScore { get; set; }
    public bool? Cache { get; set; }
    public string? Ranking { get; set; }
}

public sealed class SearchByImageRequest
{
    public string ImagePath { get; set; } = "";
    public string? Filter { get; set; }
    public string? Radius { get; set; }
    public int? Size { get; set; }
    public int? Skip { get; set; }
    public double? MinimumTextScore { get; set; }
    public double? MinimumImageScore { get; set; }
    public double? MinimumDocumentScore { get; set; }
    public double? MinimumVideoScore { get; set; }
    public double? MinimumAudioScore { get; set; }
    public bool? Cache { get; set; }
    public string? Ranking { get; set; }
}

public sealed class SearchByImageBase64Request
{
    public string ImageBase64 { get; set; } = "";
    public string? Filter { get; set; }
    public string? Radius { get; set; }
    public int? Size { get; set; }
    public int? Skip { get; set; }
    public double? MinimumTextScore { get; set; }
    public double? MinimumImageScore { get; set; }
    public double? MinimumDocumentScore { get; set; }
    public double? MinimumVideoScore { get; set; }
    public double? MinimumAudioScore { get; set; }
    public bool? Cache { get; set; }
    public string? Ranking { get; set; }
}

public sealed class RecordClickRequest
{
    public string QueryId { get; set; } = "";
    public string ResultId { get; set; } = "";
    /// <summary>Required when recording a click against a group; the list the result came from.</summary>
    public string? ListName { get; set; }
}

public sealed class CloneListRequest
{
    /// <summary>Name for the new List. Must not already exist on the account.</summary>
    public string NewListName { get; set; } = "";

    /// <summary>When true, every eval set targeting the source List is copied onto the new List as "{set}-{new list}", cases included. Off by default.</summary>
    public bool CopyEvalSets { get; set; }
}

public sealed class CreateListRequest
{
    public string AccountName { get; set; } = "";
    public string ListName { get; set; } = "";
    public string SubscriptionName { get; set; } = "";
    public string? ModelName { get; set; }
    public string? CacheService { get; set; }
    public string? RerankerName { get; set; }
    /// <summary>Default record time-to-live, in seconds. Null or 0 = records never expire by default.
    /// Otherwise must be between 300 seconds (5 minutes) and 10 years.</summary>
    public long? DefaultTtlSeconds { get; set; }

    /// <summary>Optional BYO credential (a saved credential name, e.g. "anthropic-1") used for LLM
    /// catalog-cleaning attribute extraction on records imported into this list. Must exist on the account.
    /// Null/empty leaves cleaning off (deterministic cleaning still runs).</summary>
    public string? CleaningCredential { get; set; }

    /// <summary>Optional wire model for cleaning extraction (must belong to the cleaning credential's vendor).
    /// Null uses the per-vendor default (anthropic→claude-haiku-4-5, openai→gpt-4o-mini, google→gemini-3.5-flash-lite).</summary>
    public string? CleaningModel { get; set; }
}

public sealed class UpdateListRequest
{
    public int? DefaultSuggestSize { get; set; }
    public int? DefaultSearchSize { get; set; }
    public bool? UseMiles { get; set; }
    public bool? TypoTolerance { get; set; }
    /// <summary>Default record time-to-live, in seconds, applied to records written from now on — existing
    /// records keep the expiry they were stamped with. Send 0 to turn record expiry off; otherwise it must be
    /// between 300 seconds (5 minutes) and 10 years. Null leaves the current setting unchanged.</summary>
    public long? DefaultTtlSeconds { get; set; }

    /// <summary>Permanently delete deactivated (inactive) records once they have been inactive this many days.
    /// Send 0 to turn automatic purging off; otherwise it must be between 7 and 3650 days. Null leaves the
    /// current setting unchanged.
    /// <para>The irreversible half of retention: a record expires (deactivates) first, and this decides how
    /// long it is kept before the delete is final.</para></summary>
    public int? PurgeInactiveAfterDays { get; set; }

    /// <summary>The BYO credential (a saved credential name, e.g. "anthropic-1") used for LLM catalog-cleaning
    /// attribute extraction on records imported into this list. Must exist on the account. Empty string clears
    /// it (extraction off; deterministic cleaning still runs); null leaves it unchanged.</summary>
    public string? CleaningCredential { get; set; }

    /// <summary>Optional wire model for cleaning extraction (must belong to the cleaning credential's vendor).
    /// Null uses the per-vendor default (anthropic→claude-haiku-4-5, openai→gpt-4o-mini, google→gemini-3.5-flash-lite).</summary>
    public string? CleaningModel { get; set; }
}

/// <summary>
/// One synonym rule. Structured rather than a line of rule text — the rule syntax is not something a caller
/// should have to get right, and a malformed rule does not error at search time, it silently stops working.
/// </summary>
public sealed class SynonymRuleRequest
{
    /// <summary>"equivalent" — every word in <see cref="Terms"/> means every other, both ways.
    /// "rewrite" — searching any word in <see cref="Terms"/> finds <see cref="ReplaceWith"/> instead, one way only.</summary>
    public string? Kind { get; set; }

    /// <summary>The words or phrases. At least two for "equivalent"; for "rewrite", what someone types. A
    /// phrase may contain spaces ("t shirt"); no word may contain a comma, an arrow, a # or a backslash.</summary>
    public List<string> Terms { get; set; } = new List<string>();

    /// <summary>For "rewrite" only: what those words are searched as instead.</summary>
    public List<string> ReplaceWith { get; set; } = new List<string>();
}

/// <summary>The complete set of synonym rules for a list — this replaces whatever is there.</summary>
public sealed class SetListSynonymsRequest
{
    /// <summary>Every rule to put in force. An empty array removes all synonyms.</summary>
    public List<SynonymRuleRequest> Rules { get; set; } = new List<SynonymRuleRequest>();
}

public sealed class CreateFacetRequest
{
    public string AccountName { get; set; } = "";
    public string ListName { get; set; } = "";
    public string FacetName { get; set; } = "";

    /// <summary>What KIND of value the field holds: String (default), Number, Date or Boolean.</summary>
    public string? FieldType { get; set; }

    /// <summary>
    /// How MANY values one record may hold: <c>Single</c> (default) or <c>Many</c>. Orthogonal to
    /// <see cref="FieldType"/> — <c>Many</c> is legal on every type, so a set of sizes is a Number field
    /// with <c>Many</c>. A <c>Many</c> field is filterable and facetable but never sortable or
    /// range-filterable; send its values as an array.
    /// </summary>
    public string? Cardinality { get; set; }
}

public sealed class RenameFacetRequest
{
    public string NewFacetName { get; set; } = "";
}

public sealed class CreateResourceRequest
{
    public string AccountName { get; set; } = "";
    public string ListName { get; set; } = "";
    public string ResourceName { get; set; } = "";
    public bool? Vectorize { get; set; }
}

public sealed class RenameResourceRequest
{
    public string ResourceName { get; set; } = "";
    public string NewResourceName { get; set; } = "";
    public bool? Vectorize { get; set; }
}

public sealed class CreateSearchableFieldRequest
{
    public string AccountName { get; set; } = "";
    public string ListName { get; set; } = "";
    public string SearchableFieldName { get; set; } = "";
    /// <summary>When false, the field is excluded from the semantic text embedding (stays keyword-searchable). Defaults to true.</summary>
    public bool Vectorize { get; set; } = true;
}

public sealed class RenameSearchableFieldRequest
{
    public string NewSearchableFieldName { get; set; } = "";
    /// <summary>When false, the field is excluded from the semantic text embedding (stays keyword-searchable). Defaults to true.</summary>
    public bool Vectorize { get; set; } = true;
}

public sealed class AddContributorRequest
{
    public string AccountName { get; set; } = "";
    public string ListName { get; set; } = "";
    public string ContributorName { get; set; } = "";
}

public sealed class CreateGroupRequest
{
    public string AccountName { get; set; } = "";
    public string SubscriptionName { get; set; } = "";
    public string GroupName { get; set; } = "";
    public string? ModelName { get; set; }
    public string? RerankerName { get; set; }
}

public sealed class CloneGroupRequest
{
    public string NewGroupName { get; set; } = "";
    /// <summary>When true (default) each member List is re-pinned to its latest version; when false the source's pinned versions are copied verbatim.</summary>
    public bool PinLatest { get; set; } = true;
}

public sealed class UpdateGroupRequest
{
    public int? DefaultSearchSize { get; set; }
    public int? DefaultSuggestSize { get; set; }
    public bool? UseMiles { get; set; }
}

public sealed class AddListToGroupRequest
{
    public string ListName { get; set; } = "";
    public int Version { get; set; }
    /// <summary>Adapt the added List's model to match the Group's first List. Defaults to false.</summary>
    public bool AdaptToFirstList { get; set; }
}

/// <summary>Filter selecting the Search Results to delete. Omit (null) to match all.</summary>
public sealed class DeleteByFilterRequest
{
    public string? Filter { get; set; }
}

/// <summary>The explicit, bounded set of Search Result ids to permanently delete in-request.</summary>
public sealed class DeleteByIdsRequest
{
    public IReadOnlyList<string> Ids { get; set; } = new List<string>();
}

public sealed class SetGroupModelRequest
{
    public string ModelName { get; set; } = "";
}

public sealed class SetGroupRerankerRequest
{
    public string Reranker { get; set; } = "";
}

public sealed class TransferGroupRequest
{
    public string NewSubscriptionName { get; set; } = "";
}

public sealed class SuggestOptions
{
    public int? Size { get; set; }
    public int? Skip { get; set; }
    public string? Filter { get; set; }
    public string? Radius { get; set; }
    public bool? Cache { get; set; }
}

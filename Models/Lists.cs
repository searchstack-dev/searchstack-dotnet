using System.Collections.Generic;

namespace SearchStack.PublicApi;

public sealed class FacetResponse
{
    public string FacetName { get; set; } = "";

    /// <summary>What KIND of value this field holds: String, Number, Date or Boolean.</summary>
    public string FieldType { get; set; } = "";

    /// <summary>
    /// How MANY values one record may hold here: <c>Single</c> or <c>Many</c>. Independent of
    /// <see cref="FieldType"/>, so a Number field can hold several numbers. A <c>Many</c> field cannot be
    /// sorted on or range-filtered.
    /// </summary>
    public string Cardinality { get; set; } = "";
}

public sealed class ResourceResponse
{
    public string ResourceName { get; set; } = "";
    public bool Vectorize { get; set; }
}

public sealed class SearchableFieldResponse
{
    public string SearchableFieldName { get; set; } = "";
    public bool Vectorize { get; set; }
}

public sealed class ContributorResponse
{
    public string ContributorName { get; set; } = "";
}

public sealed class SuggestionTargetResponse
{
    public string TargetListName { get; set; } = "";
    public int MinimumResultCount { get; set; }
    public bool IsActive { get; set; }
    public int MinimumCharacters { get; set; }
    public int MinimumOccurrences { get; set; }
    public int LookbackDays { get; set; }
    public bool RequireClick { get; set; }
}

/// <summary>One synonym rule as it reads back — the same shape it is written in.</summary>
public sealed class SynonymRuleResponse
{
    /// <summary>"equivalent" or "rewrite".</summary>
    public string Kind { get; set; } = "";
    public List<string> Terms { get; set; } = new List<string>();
    /// <summary>Empty for an equivalence rule, which has no sides.</summary>
    public List<string> ReplaceWith { get; set; } = new List<string>();
}

public sealed class ListResponse
{
    public string AccountName { get; set; } = "";
    public string ListName { get; set; } = "";
    public long Created { get; set; }
    public int DefaultSearchSize { get; set; }
    public int DefaultSuggestSize { get; set; }
    public int SearchResultCount { get; set; }
    public long SearchResultByteSize { get; set; }
    public bool UseMiles { get; set; }
    public bool TypoTolerance { get; set; }
    public long? DefaultTtlSeconds { get; set; }
    public int? PurgeInactiveAfterDays { get; set; }

    /// <summary>This list's synonym rules. Empty means none. Set through <c>Lists.SetSynonymsAsync</c>.</summary>
    public List<SynonymRuleResponse> SynonymRules { get; set; } = new List<SynonymRuleResponse>();

    /// <summary>Stored rule lines that could not be represented as structured rules — 0 unless the rules
    /// predate the structured editor.</summary>
    public int UnreadableSynonymLines { get; set; }
    public int Version { get; set; }
    public string SubscriptionName { get; set; } = "";
    public bool ShowCoordinates { get; set; }
    public SuggestionTargetResponse? SuggestionTarget { get; set; }
    public string ModelName { get; set; } = "";
    public string? MediaStore { get; set; }
    public string? CacheService { get; set; }
    public string? RerankerName { get; set; }
    public string? CleaningCredential { get; set; }
    public string? CleaningModel { get; set; }
    public List<FacetResponse> Facets { get; set; } = new List<FacetResponse>();
    public List<ContributorResponse> Contributors { get; set; } = new List<ContributorResponse>();
    public List<SearchableFieldResponse> SearchableFields { get; set; } = new List<SearchableFieldResponse>();
    public List<ResourceResponse> Resources { get; set; } = new List<ResourceResponse>();
}

public sealed class ListIdentityResponse
{
    public string ListName { get; set; } = "";
    public int Version { get; set; }
    public long Created { get; set; }
    public string AccountName { get; set; } = "";
}

public sealed class GroupVersionsResponse
{
    public int CurrentVersion { get; set; } = 1;
    public List<int> Versions { get; set; } = new List<int>();
}

public sealed class GroupVersionMembersResponse
{
    public int GroupVersion { get; set; } = 1;
    public List<ListIdentityResponse> Lists { get; set; } = new List<ListIdentityResponse>();
}

public sealed class GroupResponse
{
    public string AccountName { get; set; } = "";
    public string GroupName { get; set; } = "";
    public string SubscriptionName { get; set; } = "";
    public string ModelName { get; set; } = "";
    public string? RerankerName { get; set; }
    public int CurrentVersion { get; set; } = 1;
    public bool UpdateAvailable { get; set; }
    public int DefaultSearchSize { get; set; }
    public int DefaultSuggestSize { get; set; }
    public long Created { get; set; }
    public List<ListIdentityResponse> Lists { get; set; } = new List<ListIdentityResponse>();
    public bool? UseMiles { get; set; }
}

// Result of restoring a Group to a historical membership version. SkippedLists holds members from that
// version whose List was deleted since — they are reported rather than re-added as dead references.
public sealed class GroupRestoreResponse
{
    public GroupResponse Group { get; set; } = new GroupResponse();
    public int RestoredFromVersion { get; set; }
    public List<ListIdentityResponse> SkippedLists { get; set; } = new List<ListIdentityResponse>();
}

// Result of restoring a List to a historical schema version. The restored schema becomes a new latest
// version, so NewVersion is greater than RestoredFromVersion. Schema only — Search Result data is not versioned.
public sealed class ListRestoreResponse
{
    public ListResponse List { get; set; } = new ListResponse();
    public int RestoredFromVersion { get; set; }
    public int NewVersion { get; set; }
}

// Result of cloning a List. The clone carries the source's configuration and none of its Search Results.
// GateAttachmentsCopied counts per-List bindings, not gate definitions — those are account-scoped and shared.
public sealed class ListCloneResponse
{
    public ListResponse List { get; set; } = new ListResponse();
    public string ClonedFrom { get; set; } = "";
    public int QueryRulesCopied { get; set; }
    public int GateAttachmentsCopied { get; set; }
    public int EvalSetsCopied { get; set; }
}

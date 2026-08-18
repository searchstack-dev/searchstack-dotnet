using System.Collections.Generic;

namespace SearchStack.PublicApi;

/// <summary>A search provider a subscription can run on, with the capabilities it supports.</summary>
public sealed class SubscriptionProviderResponse
{
    public string Name { get; set; } = "";
    public string Value { get; set; } = "";
    public bool IsDefault { get; set; }
    public bool SupportsVectorSearch { get; set; }
    public bool SupportsGeoDistance { get; set; }
    public bool SupportsSuggest { get; set; }
    public bool SupportsFacets { get; set; }
    public bool SupportsTypoTolerance { get; set; }

    /// <summary>
    /// Whether this provider honours <see cref="SearchOptions.Match"/> — whether it can be asked for
    /// all-terms or phrase matching rather than the recall-first any-term default. A provider that cannot
    /// rejects a non-default <c>Match</c> rather than quietly running the any-term search instead.
    /// </summary>
    public bool SupportsMatchMode { get; set; }
}

public sealed class SubscriptionProvidersResponse
{
    public List<SubscriptionProviderResponse> Providers { get; set; } = new List<SubscriptionProviderResponse>();
}

/// <summary>A plan in the catalog: its price and every limit it carries.</summary>
public sealed class SubscriptionPlanResponse
{
    public string Value { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal CostPerMonth { get; set; }
    public decimal CostPerYear { get; set; }
    public int Version { get; set; }
    public string Provider { get; set; } = "";
    public bool RequiresPerAccountIndex { get; set; }
    public int MaxLists { get; set; }
    public int? MaxSearchResults { get; set; }
    public int MaxContributorsPerList { get; set; }
    public int MaxApiKeys { get; set; }
    public int MaxGroups { get; set; }
    public int MaxListsPerGroup { get; set; }
    public int MaxSearchesPerHour { get; set; }
    public double? MaxSizeGb { get; set; }
    public int? MaxJudges { get; set; }
    public int? MaxEvalSets { get; set; }
    public int? MaxRerankers { get; set; }
    public int? MaxModels { get; set; }
    public int? MaxMediaStores { get; set; }
    public int? MaxFeeds { get; set; }
    public int? MaxWatches { get; set; }
    public int? MaxWebhookSubscriptions { get; set; }
    public int? VersionRetentionDepth { get; set; }
    public int? AutoSyncPauseAfterIdleDays { get; set; }
}

/// <summary>
/// A search service a subscription can bind to. <see cref="Region"/> is the point of this type: the
/// shared entries are the region catalog, and <see cref="SearchServiceName"/> is what you pass when
/// starting a subscription to place it in that region.
/// </summary>
public sealed class SubscriptionSearchServiceResponse
{
    public string SearchServiceName { get; set; } = "";
    public string Region { get; set; } = "";
    public string RegionName { get; set; } = "";
    public string Provider { get; set; } = "";
    public bool IsShared { get; set; }
}

/// <summary>The Stripe checkout URL. Nothing has been charged: a person has to open it and pay.</summary>
public sealed class SubscriptionCheckoutResponse
{
    public string Url { get; set; } = "";
}

/// <summary>
/// No auto-upgrade opt-in, deliberately: auto-upgrade commits future spend by itself, and the endpoint
/// forces it off server-side regardless of what is sent. Turning it on is console-plane.
/// </summary>
public sealed class SubscriptionCheckoutRequest
{
    public string PlanName { get; set; } = "";
    public string SubscriptionName { get; set; } = "";
    /// <summary>Where the customer lands after paying. Must be https, with no embedded credentials.</summary>
    public string ReturnUrl { get; set; } = "";
    public string SearchServiceName { get; set; } = "";
    /// <summary>"monthly" (default) or "yearly". Yearly costs one month less.</summary>
    public string? BillingInterval { get; set; }
}

public sealed class StartFreeByoSubscriptionRequest
{
    public string PlanName { get; set; } = "";
    public string SubscriptionName { get; set; } = "";
    /// <summary>One of the account's OWN search services; a shared one is refused.</summary>
    public string SearchServiceName { get; set; } = "";
}


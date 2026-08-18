using System.Collections.Generic;

namespace SearchStack.PublicApi;

public sealed class ListRefResponse
{
    public string ListName { get; set; } = "";
    public string AccountName { get; set; } = "";
    public long Created { get; set; }
}

public sealed class ModelResponse
{
    public string ModelName { get; set; } = "";
    public string ModelValue { get; set; } = "";
    public string ModelProvider { get; set; } = "";
    public bool SupportsDocuments { get; set; }
    public int MaxTextCharacters { get; set; }
    public int MaxImages { get; set; }
    public long MaxImagePayloadBytes { get; set; }
    public int MaxDocumentPages { get; set; }
    public int MaxVideos { get; set; }
    public long MaxVideoPayloadBytes { get; set; }
    public int MaxAudios { get; set; }
    public long MaxAudioPayloadBytes { get; set; }
    public long CreatedUtc { get; set; }
}

public sealed class RerankerDetailsResponse
{
    public string AccountName { get; set; } = "";
    public string Name { get; set; } = "";
    public string Provider { get; set; } = "";
    public string ProviderDisplayName { get; set; } = "";
    public string Model { get; set; } = "";
    public long CreatedUtc { get; set; }
}

public sealed class ApiKeyResponse
{
    public string AccountName { get; set; } = "";
    public string ApiKeyName { get; set; } = "";
    public long Created { get; set; }
    public List<string> Permissions { get; set; } = new List<string>();
    public long? ExpiresUtc { get; set; }
}

public sealed class SubscriptionResponse
{
    public string SubscriptionName { get; set; } = "";
    public string SubscriptionDisplayName { get; set; } = "";
    public string Status { get; set; } = "";
    public long ExpiresUtc { get; set; }
    public long CreatedUtc { get; set; }
    public bool IsActive { get; set; }
    public int MaxLists { get; set; }
    public int? MaxResults { get; set; }
    public int MaxListsPerGroup { get; set; }
    public double CostPerMonth { get; set; }
    public string Region { get; set; } = "";
    public string SearchServiceName { get; set; } = "";
    public string Provider { get; set; } = "";
    public string ProviderName { get; set; } = "";
    public string Type { get; set; } = "";
    public long SearchResultByteSize { get; set; }
    public int SearchResultCount { get; set; }
    public double? MaxSizeGb { get; set; }

    // Cancellation lifecycle for the "your data will be deleted" warning: "active", "canceled_in_grace"
    // (still recoverable), or "pending_deletion". DataDeletionUtc is the projected deletion instant (ticks),
    // null unless the subscription is cancelled.
    public string LifecycleState { get; set; } = "";
    public long? DataDeletionUtc { get; set; }
}

public sealed class MediaStoreResponse
{
    public string AccountName { get; set; } = "";
    public string StoreName { get; set; } = "";
    public string Provider { get; set; } = "";
    public string ProviderDisplayName { get; set; } = "";
    public long CreatedUtc { get; set; }
    public bool IsDefault { get; set; }
}

public sealed class CacheServiceDetailsResponse
{
    public string AccountName { get; set; } = "";
    public string Name { get; set; } = "";
    public string Provider { get; set; } = "";
    public string ProviderDisplayName { get; set; } = "";
    public string? Region { get; set; }
    public long CreatedUtc { get; set; }
}

public sealed class WebhookSubscriptionResponse
{
    public string Id { get; set; } = "";
    public string AccountName { get; set; } = "";
    public string Url { get; set; } = "";
    public List<string> Events { get; set; } = new List<string>();
    public bool IsActive { get; set; }
    public bool IsSuspended { get; set; }
    public long CreatedOn { get; set; }
}

public sealed class SearchServiceResponse
{
    public string SearchServiceName { get; set; } = "";
    public string Region { get; set; } = "";
    public string Provider { get; set; } = "";
    public long Created { get; set; }
    public bool SearchServiceIsShared { get; set; }
}

public sealed class AccountResponse
{
    public string AccountName { get; set; } = "";
    public string Owner { get; set; } = "";
    public string ImagePath { get; set; } = "";
    public long Created { get; set; }
    public List<ListRefResponse> Lists { get; set; } = new List<ListRefResponse>();
    public List<ModelResponse> Models { get; set; } = new List<ModelResponse>();
    public List<RerankerDetailsResponse> Rerankers { get; set; } = new List<RerankerDetailsResponse>();
    public string Country { get; set; } = "";
    public List<ApiKeyResponse> ApiKeys { get; set; } = new List<ApiKeyResponse>();
    public List<SubscriptionResponse> Subscriptions { get; set; } = new List<SubscriptionResponse>();
    public List<GroupResponse> Groups { get; set; } = new List<GroupResponse>();
    public bool GithubConnected { get; set; }
    public List<MediaStoreResponse> MediaStores { get; set; } = new List<MediaStoreResponse>();
    public List<CacheServiceDetailsResponse> CacheServices { get; set; } = new List<CacheServiceDetailsResponse>();
    public List<WebhookSubscriptionResponse> WebhookSubscriptions { get; set; } = new List<WebhookSubscriptionResponse>();
    public List<SearchServiceResponse> SearchServices { get; set; } = new List<SearchServiceResponse>();
}

public sealed class AccountNameResponse
{
    public string AccountName { get; set; } = "";
}

/// <summary>
/// Anything currently wrong with an account. Derived on every read and never stored, so an issue
/// disappears as soon as the problem does.
/// </summary>
public sealed class AccountHealthResponse
{
    public List<AccountHealthIssue> Issues { get; set; } = new List<AccountHealthIssue>();

    /// <summary>
    /// How many checks had a source to read. Fewer than <see cref="ChecksTotal"/> means something could
    /// not be looked at — which is not the same answer as "nothing is wrong".
    /// </summary>
    public int ChecksRun { get; set; }

    public int ChecksTotal { get; set; }

    /// <summary>
    /// How many real issues the account owner has snoozed in the console, and which are therefore missing
    /// from <see cref="Issues"/>. Read it like <see cref="ChecksRun"/>: an empty list with this above zero
    /// is not a healthy account. A snooze lapses after seven days, or sooner if the issue gets worse.
    /// </summary>
    public int Dismissed { get; set; }
}

public sealed class AccountHealthIssue
{
    public string CheckId { get; set; } = "";

    /// <summary>"error" (the data is stale or broken now) or "warning".</summary>
    public string Severity { get; set; } = "";

    public string Title { get; set; } = "";

    public string Detail { get; set; } = "";

    /// <summary>When the problem started; null for a state rather than an event.</summary>
    public System.DateTimeOffset? Since { get; set; }

    public AccountHealthTarget Target { get; set; } = new AccountHealthTarget();
}

/// <summary>What the issue is about: a kind and a name, never a URL.</summary>
public sealed class AccountHealthTarget
{
    /// <summary>feed, list, account, media-store, search-service, cache-service, model or telemetry-sink.</summary>
    public string Kind { get; set; } = "";

    public string Name { get; set; } = "";
}

using System.Collections.Generic;

namespace SearchStack.PublicApi;

// Request body for minting a read-only API key. Optional members are nullable and omitted from the
// wire when null (see Json.cs DefaultIgnoreCondition). Only read/view permissions are honoured
// server-side; any others are dropped.
public sealed class CreateReadOnlyApiKeyRequest
{
    /// <summary>A unique name for the new key within the account.</summary>
    public string ApiKeyName { get; set; } = "";

    /// <summary>The account the key belongs to.</summary>
    public string AccountName { get; set; } = "";

    /// <summary>Read permissions to grant, e.g. "search-result:read", "list:read". Non-read permissions are ignored; at least one read permission is required.</summary>
    public List<string> Permissions { get; set; } = new();

    /// <summary>Optional absolute expiry. Omit for a non-expiring key.</summary>
    public System.DateTimeOffset? ExpiresUtc { get; set; }

    /// <summary>Optional scope: "account" (default), "list" or "group".</summary>
    public string? Scope { get; set; }

    /// <summary>For list/group scope, the name of the list or group the key is confined to.</summary>
    public string? ScopeTarget { get; set; }

    /// <summary>Optional routing region override (account-scoped keys only), e.g. "uk-south".</summary>
    public string? Region { get; set; }
}

/// <summary>The minted key's usable value and version.</summary>
public sealed class ApiKeyValueResponse
{
    public string Value { get; set; } = "";
    public string Version { get; set; } = "";
}

namespace SearchStack.PublicApi;

/// <summary>
/// Credentials for the client. Supply at least one of the two. When both are set,
/// the access token takes precedence.
/// </summary>
public sealed class Credentials
{
    /// <summary>API key, sent as the <c>X-API-Key</c> header.</summary>
    public string? ApiKey { get; set; }

    /// <summary>JWT access token, sent as <c>Authorization: Bearer &lt;token&gt;</c>.</summary>
    public string? AccessToken { get; set; }
}

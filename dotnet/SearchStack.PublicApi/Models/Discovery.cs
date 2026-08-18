using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SearchStack.PublicApi;

// Anonymous discovery endpoints describing the API itself. Member names map to
// snake_case via the shared policy; OpenApiUrl is the one field whose wire name
// ("openapi_url") doesn't follow from the policy and carries an explicit attribute.

public sealed class ApiAuthInfo
{
    public string Type { get; set; } = "";
    public string Description { get; set; } = "";
}

public sealed class ApiErrorCode
{
    public string Code { get; set; } = "";
    public int Status { get; set; }
    public string Description { get; set; } = "";
}

public sealed class ApiMcpInfo
{
    public bool Supported { get; set; }
    public string Description { get; set; } = "";
    public string ExampleConfigUrl { get; set; } = "";
}

public sealed class ApiInfo
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Version { get; set; } = "";
    [JsonPropertyName("openapi_url")] public string OpenApiUrl { get; set; } = "";
    public string DocumentationUrl { get; set; } = "";
    public string ExamplesUrl { get; set; } = "";
    public ApiAuthInfo Authentication { get; set; } = new ApiAuthInfo();
    public List<ApiErrorCode> ErrorCodes { get; set; } = new List<ApiErrorCode>();
    public ApiMcpInfo Mcp { get; set; } = new ApiMcpInfo();

    /// <summary>
    /// The producer half of the feed contract: what your own endpoint has to do to be a source a
    /// feed can poll. Absent on older hosts, so treat a default instance as "this host did not say".
    /// </summary>
    public ApiFeedsInfo Feeds { get; set; } = new ApiFeedsInfo();
}

public sealed class ApiFeedsInfo
{
    public bool Supported { get; set; }
    public string Description { get; set; } = "";
    public string DocumentationUrl { get; set; } = "";
    public List<ApiFeedProducerRule> ProducerRules { get; set; } = new List<ApiFeedProducerRule>();
}

public sealed class ApiFeedProducerRule
{
    public string Rule { get; set; } = "";
    public string Why { get; set; } = "";
}

public sealed class ApiExample
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Method { get; set; } = "";
    public string Path { get; set; } = "";
    public object? RequestBody { get; set; }
    public int ResponseStatus { get; set; }
    public object? ResponseExample { get; set; }
}

public sealed class ApiExamples
{
    public List<ApiExample> Examples { get; set; } = new List<ApiExample>();
}

public sealed class ApiCatalogLink
{
    public string Anchor { get; set; } = "";
    public string Rel { get; set; } = "";
    public string Href { get; set; } = "";
    public string Type { get; set; } = "";
    public string Title { get; set; } = "";
}

/// <summary>IETF api-catalog document (RFC 9727) linking to the API's resources.</summary>
public sealed class ApiCatalog
{
    public List<ApiCatalogLink> Linkset { get; set; } = new List<ApiCatalogLink>();
}

using System.Threading;
using System.Threading.Tasks;

namespace SearchStack.PublicApi;

/// <summary>
/// Anonymous discovery endpoints describing the API itself. No credentials are
/// required (any configured on the client are simply ignored by these routes).
/// </summary>
public sealed class DiscoveryService
{
    private readonly Transport _transport;

    internal DiscoveryService(Transport transport) => _transport = transport;

    /// <summary>Machine-readable manifest: version, docs/OpenAPI URLs, auth, error codes, MCP.</summary>
    public Task<Response<ApiInfo>> InfoAsync(CancellationToken cancellationToken = default) =>
        _transport.GetAsync<ApiInfo>("api/info", cancellationToken);

    /// <summary>Worked request/response examples for common operations.</summary>
    public Task<Response<ApiExamples>> ExamplesAsync(CancellationToken cancellationToken = default) =>
        _transport.GetAsync<ApiExamples>("api/examples", cancellationToken);

    /// <summary>IETF api-catalog document (RFC 9727) linking to the API's resources.</summary>
    public Task<Response<ApiCatalog>> CatalogAsync(CancellationToken cancellationToken = default) =>
        _transport.GetAsync<ApiCatalog>(".well-known/api-catalog", cancellationToken);
}

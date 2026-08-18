using System.Threading;
using System.Threading.Tasks;

namespace SearchStack.PublicApi;

/// <summary>
/// The one API-key management operation on the data plane: mint a strictly read-only key of any
/// scope. Requires an authenticating key that carries the <c>api-key:create-read-only</c> permission.
/// Full key management (create with any permission, view, edit, delete) stays console-plane.
/// </summary>
public sealed class ApiKeyService
{
    private const string Path = "api-key";
    private readonly Transport _transport;

    internal ApiKeyService(Transport transport) => _transport = transport;

    /// <summary>
    /// Mints a strictly read-only API key and returns its usable value. Only the read/view permissions
    /// in <see cref="CreateReadOnlyApiKeyRequest.Permissions"/> are kept; any write permissions are
    /// dropped, and the minted key can never itself mint another key.
    /// </summary>
    public Task<Response<ApiKeyValueResponse>> CreateReadOnlyAsync(CreateReadOnlyApiKeyRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<ApiKeyValueResponse>($"{Path}/read-only", request, cancellationToken);
}

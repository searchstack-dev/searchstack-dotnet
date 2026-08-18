using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>Resource create / rename / remove operations.</summary>
public sealed class ResourceService
{
    private const string Path = "resource";
    private readonly Transport _transport;

    internal ResourceService(Transport transport) => _transport = transport;

    /// <summary>Creates a Resource - a non-searchable, non-filterable field (commonly a URL).</summary>
    public Task<Response<ResourceResponse>> CreateAsync(CreateResourceRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<ResourceResponse>(Path, request, cancellationToken);

    /// <summary>Renames a Resource. Breaking change - automatically updates the List version.</summary>
    public Task<Response<ResourceResponse>> RenameAsync(string accountName, string listName, string resourceName, RenameResourceRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<ResourceResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Enc(resourceName)}", request, cancellationToken);

    /// <summary>Removes a Resource. Breaking change - automatically updates the List version.</summary>
    public Task<Response> RemoveAsync(string accountName, string listName, string resourceName, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Enc(resourceName)}", cancellationToken);
}

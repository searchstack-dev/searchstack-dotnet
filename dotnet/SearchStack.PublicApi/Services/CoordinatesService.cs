using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>Coordinates field add / remove operations.</summary>
public sealed class CoordinatesService
{
    private const string Path = "coordinates";
    private readonly Transport _transport;

    internal CoordinatesService(Transport transport) => _transport = transport;

    /// <summary>Adds a Coordinates field, enabling geographical queries.</summary>
    public Task<Response<ListResponse>> AddAsync(string accountName, string listName, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<ListResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}", new object(), cancellationToken);

    /// <summary>Removes the Coordinates field. Breaking change - automatically updates the List version.</summary>
    public Task<Response<ListResponse>> RemoveAsync(string accountName, string listName, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync<ListResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}", cancellationToken);
}

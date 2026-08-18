using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>Searchable field create / rename / remove operations.</summary>
public sealed class SearchableFieldService
{
    private const string Path = "searchable";
    private readonly Transport _transport;

    internal SearchableFieldService(Transport transport) => _transport = transport;

    /// <summary>Creates a Searchable field.</summary>
    public Task<Response<SearchableFieldResponse>> CreateAsync(CreateSearchableFieldRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<SearchableFieldResponse>(Path, request, cancellationToken);

    /// <summary>Renames a Searchable. Breaking change - automatically updates the List version.</summary>
    public Task<Response<SearchableFieldResponse>> RenameAsync(string accountName, string listName, string searchableName, RenameSearchableFieldRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<SearchableFieldResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Enc(searchableName)}", request, cancellationToken);

    /// <summary>Removes a Searchable. Breaking change - automatically updates the List version.</summary>
    public Task<Response> RemoveAsync(string accountName, string listName, string searchableName, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Enc(searchableName)}", cancellationToken);
}

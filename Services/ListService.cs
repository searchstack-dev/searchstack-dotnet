using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>List create / read / edit / delete operations.</summary>
public sealed class ListService
{
    private const string Path = "list";
    private readonly Transport _transport;

    internal ListService(Transport transport) => _transport = transport;

    /// <summary>Creates a List - a collection of related Search Results.</summary>
    public Task<Response<ListIdentityResponse>> CreateAsync(CreateListRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<ListIdentityResponse>(Path, request, cancellationToken);

    /// <summary>Clones a List: a new List with the same configuration (schema, settings, model, reranker, media store, cleaning credential, IP whitelist, contributors) plus its query rules and gate attachments, and none of its Search Results. The source List is unchanged.</summary>
    public Task<Response<ListCloneResponse>> CloneAsync(string accountName, string listName, CloneListRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<ListCloneResponse>($"{Path}/clone/{Enc(accountName)}/{Enc(listName)}", request, cancellationToken);

    /// <summary>Retrieves the details of a List.</summary>
    public Task<Response<ListResponse>> GetAsync(string accountName, string listName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<ListResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}", cancellationToken);

    /// <summary>Edits List defaults and settings.</summary>
    public Task<Response<ListResponse>> EditAsync(string accountName, string listName, UpdateListRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<ListResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}", request, cancellationToken);

    /// <summary>
    /// Replaces every synonym rule on the List. Rules are structured rather than rule text: each is either
    /// "equivalent" (every word means every other) or "rewrite" (searching one word finds another, one way
    /// only). Send an empty array to remove all synonyms. Takes effect on the next search — nothing is
    /// reindexed. Honoured on the SearchStack engine; a List on a BYO Azure/Elastic/OpenSearch/Postgres
    /// service ignores synonyms, because those bind them into index or server configuration.
    /// </summary>
    public Task<Response<ListResponse>> SetSynonymsAsync(string accountName, string listName, SetListSynonymsRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<ListResponse>($"{Path}/synonyms/{Enc(accountName)}/{Enc(listName)}", request, cancellationToken);

    /// <summary>Restores a historical schema version (facets, searchable fields, resources) as the List's new latest version (roll-forward, not rewind). Schema only — Search Result data is not versioned.</summary>
    public Task<Response<ListRestoreResponse>> RestoreVersionAsync(string accountName, string listName, int version, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<ListRestoreResponse>($"{Path}/restore/{Enc(accountName)}/{Enc(listName)}/{version}", new { }, cancellationToken);

    /// <summary>Permanently deletes a List.</summary>
    public Task<Response> DeleteAsync(string accountName, string listName, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync($"{Path}/{Enc(accountName)}/{Enc(listName)}", cancellationToken);
}

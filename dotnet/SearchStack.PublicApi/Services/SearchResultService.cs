using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>
/// Write-side operations for Search Results (create, bulk-insert, edit, delete).
/// Read / query operations live on <see cref="SearchService"/>.
/// </summary>
public sealed class SearchResultService
{
    private const string Path = "search-result";
    private readonly Transport _transport;

    internal SearchResultService(Transport transport) => _transport = transport;

    /// <summary>Fetches a single Search Result by id.</summary>
    public Task<Response<SearchHit>> GetAsync(string accountName, string listName, string id, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<SearchHit>($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Enc(id)}", cancellationToken);

    /// <summary>
    /// Browses (lists) the Search Results in a List with optional paging, filter, free-text query, geo
    /// radius, active flag and ordering. For a ranked/vector search use <see cref="SearchService"/>.
    /// </summary>
    public Task<Response<List<SearchHit>>> ListAsync(string accountName, string listName, SearchResultsListOptions? options = null, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<List<SearchHit>>($"{Path}/{Enc(accountName)}/{Enc(listName)}/list", options ?? new SearchResultsListOptions(), cancellationToken);

    /// <summary>Creates a single Search Result.</summary>
    public Task<Response<SearchHit>> CreateAsync(CreateSearchResultRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<SearchHit>(Path, request, cancellationToken);

    /// <summary>Imports a JSON/CSV file from a customer-controlled URL into a List.</summary>
    public Task<Response<ListResponse>> ImportAsync(string accountName, string listName, ImportUploadRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<ListResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/import", request, cancellationToken);

    /// <summary>
    /// Imports a file already staged in one of the Account's media stores into a List. Set
    /// <see cref="ImportFromMediaStoreRequest.KeepInSync"/> to re-import automatically whenever the file
    /// changes (the basis of the feed→list bind).
    /// </summary>
    public Task<Response<ListResponse>> ImportFromMediaAsync(string accountName, string listName, ImportFromMediaStoreRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<ListResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/import-from-media", request, cancellationToken);

    /// <summary>Bulk inserts multiple Search Results into an existing List.</summary>
    public Task<Response<ListResponse>> BulkInsertAsync(string accountName, string listName, IEnumerable<Dictionary<string, object?>> searchResults, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<ListResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}", searchResults, cancellationToken);

    /// <summary>Creates fields as needed and bulk inserts multiple Search Results.</summary>
    public Task<Response<ListResponse>> BulkInsertWithFieldsAsync(string accountName, string listName, IEnumerable<Dictionary<string, object?>> searchResults, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<ListResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/with-fields", searchResults, cancellationToken);

    /// <summary>Edits the properties of an existing Search Result.</summary>
    public Task<Response<SearchHit>> EditAsync(string accountName, string listName, string id, UpdateSearchResultRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<SearchHit>($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Enc(id)}", request, cancellationToken);

    /// <summary>
    /// Patches frequently-changing fields (price, stock, availability) on a Search Result WITHOUT
    /// re-embedding it — a cheap, second-fresh write for commerce data. Only facets and non-vectorized
    /// searchable/resource fields are accepted; fields that feed the embedding must use <see cref="EditAsync"/>.
    /// </summary>
    public Task<Response<SearchHit>> PatchVolatileAsync(string accountName, string listName, string id, PatchVolatileFieldsRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<SearchHit>($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Enc(id)}/volatile", request, cancellationToken);

    /// <summary>
    /// Batch-writes fast-changing "volatile" values (price, quantity) to the overlay store, which
    /// decorates them onto search results at response time WITHOUT re-indexing or re-embedding — the
    /// seconds-fresh path for commerce data. Each delta names a record by its engine id and carries a
    /// source timestamp (last-write-wins per field).
    /// </summary>
    public Task<Response<ApplyVolatileDeltasResponse>> ApplyVolatileDeltasAsync(string accountName, string listName, ApplyVolatileDeltasRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<ApplyVolatileDeltasResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/deltas", request, cancellationToken);

    /// <summary>
    /// Confirms the current volatile values (price, availability) of specific records at the moment of
    /// action — the guaranteed-fresh step to run before transacting. Per id it returns the values, an
    /// <c>as_of</c> timestamp, and the source (<c>overlay</c> = seconds-fresh, <c>index</c> = last-indexed,
    /// or <c>not_found</c>).
    /// </summary>
    public Task<Response<VerifyOfferResponse>> VerifyOfferAsync(string accountName, string listName, VerifyOfferRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<VerifyOfferResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/verify-offer", request, cancellationToken);

    /// <summary>
    /// Directly updates the text/image/document vectors of a Search Result. Vector
    /// dimensions are validated and the List must not be attached to a model.
    /// </summary>
    public Task<Response<SearchHit>> EditVectorAsync(string accountName, string listName, string searchResultName, UpdateSearchResultVectorRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<SearchHit>($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Enc(searchResultName)}/vector", request, cancellationToken);

    /// <summary>Permanently deletes a Search Result.</summary>
    public Task<Response> RemoveAsync(string accountName, string listName, string id, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Enc(id)}", cancellationToken);

    /// <summary>
    /// Synchronously and permanently deletes a bounded set of Search Results by id. Deletes the
    /// exact ids supplied, in-request, and returns the number deleted plus any ids that were not
    /// found. The id list is capped; over the cap the request fails - page the ids or use
    /// <see cref="DeleteByFilterAsync"/> for unbounded deletes.
    /// </summary>
    public Task<Response<DeleteByIdsResponse>> DeleteByIdsAsync(string accountName, string listName, DeleteByIdsRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<DeleteByIdsResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/delete-by-ids", request, cancellationToken);

    /// <summary>
    /// Permanently deletes every Search Result matching a filter. Queues a background
    /// job and resolves once accepted (HTTP 202).
    /// </summary>
    public Task<Response<DeleteByFilterResponse>> DeleteByFilterAsync(string accountName, string listName, DeleteByFilterRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<DeleteByFilterResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/delete-by-filter", request, cancellationToken);

    /// <summary>
    /// Soft-deletes (deactivates) every Search Result matching a filter. Queues a
    /// background job and resolves once accepted (HTTP 202).
    /// </summary>
    public Task<Response<DeleteByFilterResponse>> SoftDeleteByFilterAsync(string accountName, string listName, DeleteByFilterRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<DeleteByFilterResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/soft-delete-by-filter", request, cancellationToken);
}

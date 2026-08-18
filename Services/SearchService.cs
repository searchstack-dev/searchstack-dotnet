using System.Globalization;
using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>
/// Read / query operations against the search endpoints. Every method uses
/// the POST variant so options are passed as a typed body rather than a query
/// string. Searching requires the SearchResult.Read permission on the API key.
/// </summary>
public sealed class SearchService
{
    private const string Path = "search";
    private readonly Transport _transport;

    internal SearchService(Transport transport) => _transport = transport;

    private static string Ver(int version) => version.ToString(CultureInfo.InvariantCulture);

    /// <summary>Free-text and/or vector search of a List version.</summary>
    public Task<Response<SearchResponse>> SearchListAsync(string accountName, string listName, int version, SearchOptions? options = null, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<SearchResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Ver(version)}", options ?? new SearchOptions(), cancellationToken);

    /// <summary>Free-text and/or vector search across a Group of Lists at a specific membership version (use the Group's current_version, or an older version to search a frozen set of records).</summary>
    public Task<Response<SearchResponse>> SearchGroupAsync(string accountName, string groupName, int version, SearchOptions? options = null, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<SearchResponse>($"{Path}/group/{Enc(accountName)}/{Enc(groupName)}/{Ver(version)}", options ?? new SearchOptions(), cancellationToken);

    /// <summary>Finds Search Results within a List that are vector-similar to a seed result.</summary>
    public Task<Response<SearchResponse>> RelatedAsync(string accountName, string listName, string searchResultName, RelatedOptions? options = null, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<SearchResponse>($"{Path}/related/{Enc(accountName)}/{Enc(listName)}/{Enc(searchResultName)}", options ?? new RelatedOptions(), cancellationToken);

    /// <summary>Image-similarity search of a List using an absolute image URL.</summary>
    public Task<Response<SearchResponse>> SearchListByImageAsync(string accountName, string listName, int version, SearchByImageRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<SearchResponse>($"{Path}/images/{Enc(accountName)}/{Enc(listName)}/{Ver(version)}", request, cancellationToken);

    /// <summary>Image-similarity search of a Group at a specific membership version using an absolute image URL.</summary>
    public Task<Response<SearchResponse>> SearchGroupByImageAsync(string accountName, string groupName, int version, SearchByImageRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<SearchResponse>($"{Path}/images/group/{Enc(accountName)}/{Enc(groupName)}/{Ver(version)}", request, cancellationToken);

    /// <summary>Image-similarity search of a List using a base64-encoded image.</summary>
    public Task<Response<SearchResponse>> SearchListByImageBase64Async(string accountName, string listName, int version, SearchByImageBase64Request request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<SearchResponse>($"{Path}/images/base64/{Enc(accountName)}/{Enc(listName)}/{Ver(version)}", request, cancellationToken);

    /// <summary>Image-similarity search of a Group at a specific membership version using a base64-encoded image.</summary>
    public Task<Response<SearchResponse>> SearchGroupByImageBase64Async(string accountName, string groupName, int version, SearchByImageBase64Request request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<SearchResponse>($"{Path}/images/base64/group/{Enc(accountName)}/{Enc(groupName)}/{Ver(version)}", request, cancellationToken);

    /// <summary>
    /// Extracts text from PDF documents on a Search Result. Only available when the
    /// List's model declares a positive MaxDocumentPages limit.
    /// </summary>
    public Task<Response<ExtractDocumentTextResponse>> ExtractDocumentTextAsync(string accountName, string listName, string searchResultName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<ExtractDocumentTextResponse>($"search-result/document-text/{Enc(accountName)}/{Enc(listName)}/{Enc(searchResultName)}", cancellationToken);

    /// <summary>Records a click-through on a List search result, correlated by query_id.</summary>
    public Task<Response> RecordListClickAsync(string accountName, string listName, RecordClickRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync($"{Path}/analytics/click/list/{Enc(accountName)}/{Enc(listName)}", request, cancellationToken);

    /// <summary>Records a click-through on a Group search result, correlated by query_id.</summary>
    public Task<Response> RecordGroupClickAsync(string accountName, string groupName, RecordClickRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync($"{Path}/analytics/click/group/{Enc(accountName)}/{Enc(groupName)}", request, cancellationToken);
}

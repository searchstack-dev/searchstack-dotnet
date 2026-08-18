using System.Collections.Generic;
using System.Globalization;
using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>
/// Typeahead suggestions. Uses the POST variants so options are passed as a typed
/// body. The query text is part of the route, so it is encoded into the path.
/// </summary>
public sealed class SuggestService
{
    private const string Path = "suggest";
    private readonly Transport _transport;

    internal SuggestService(Transport transport) => _transport = transport;

    /// <summary>Typeahead suggestions within a List version.</summary>
    public Task<Response<List<Suggestion>>> ListAsync(string accountName, string listName, int version, string query, SuggestOptions? options = null, CancellationToken cancellationToken = default)
    {
        var v = version.ToString(CultureInfo.InvariantCulture);
        return _transport.PostAsync<List<Suggestion>>($"{Path}/{Enc(accountName)}/{Enc(listName)}/{v}/{Enc(query)}", options ?? new SuggestOptions(), cancellationToken);
    }

    /// <summary>Typeahead suggestions within a Group of Lists at a specific membership version (use the Group's current_version, or an older version to search a frozen set of records).</summary>
    public Task<Response<List<Suggestion>>> GroupAsync(string accountName, string groupName, int version, string query, SuggestOptions? options = null, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<List<Suggestion>>($"{Path}/group/{Enc(accountName)}/{Enc(groupName)}/{version.ToString(CultureInfo.InvariantCulture)}/{Enc(query)}", options ?? new SuggestOptions(), cancellationToken);
}

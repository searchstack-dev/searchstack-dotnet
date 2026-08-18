using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>
/// Watch operations: standing queries. A query registered once, re-run on a cadence, alerting only on
/// records it has not already alerted on — optionally vetted by a Judge before it counts as a match.
/// </summary>
public sealed class WatchService
{
    private const string Path = "watch";
    private readonly Transport _transport;

    internal WatchService(Transport transport) => _transport = transport;

    /// <summary>Lists the Watches in an Account, optionally filtered to one list.</summary>
    public Task<Response<List<WatchResponse>>> ListAsync(string accountName, string? listName = null, CancellationToken cancellationToken = default)
    {
        var suffix = string.IsNullOrWhiteSpace(listName) ? string.Empty : $"?list_name={Enc(listName!)}";
        return _transport.GetAsync<List<WatchResponse>>($"{Path}/{Enc(accountName)}{suffix}", cancellationToken);
    }

    /// <summary>Retrieves a single Watch.</summary>
    public Task<Response<WatchResponse>> GetAsync(string accountName, string watchName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<WatchResponse>($"{Path}/{Enc(accountName)}/{Enc(watchName)}", cancellationToken);

    /// <summary>A Watch's alert history, newest first.</summary>
    public Task<Response<List<WatchMatchResponse>>> GetMatchesAsync(string accountName, string watchName, int? take = null, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<List<WatchMatchResponse>>(
            $"{Path}/{Enc(accountName)}/{Enc(watchName)}/matches{(take is null ? "" : $"?take={take.Value}")}", cancellationToken);

    /// <summary>Creates a Watch against one pinned version of a list.</summary>
    public Task<Response<WatchResponse>> CreateAsync(string accountName, CreateWatchRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<WatchResponse>($"{Path}/{Enc(accountName)}", request, cancellationToken);

    /// <summary>Rates one of a Watch's alerts (confirm/dismiss) and returns its precision so far.</summary>
    public Task<Response<WatchPrecisionResponse>> FeedbackAsync(string accountName, string watchName, WatchFeedbackRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<WatchPrecisionResponse>($"{Path}/{Enc(accountName)}/{Enc(watchName)}/feedback", request, cancellationToken);

    /// <summary>Re-tunes or pauses a Watch. A full replace: omitted fields revert to their defaults.</summary>
    public Task<Response<WatchResponse>> EditAsync(string accountName, string watchName, EditWatchRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<WatchResponse>($"{Path}/{Enc(accountName)}/{Enc(watchName)}", request, cancellationToken);

    /// <summary>
    /// Queues an immediate check of the Watch, ahead of its cadence. The same check the sweep runs, not a
    /// preview: it searches, judges, records matches and delivers. Refused for a paused Watch.
    /// </summary>
    public Task<Response> CheckNowAsync(string accountName, string watchName, CancellationToken cancellationToken = default) =>
        _transport.PostAsync($"{Path}/{Enc(accountName)}/{Enc(watchName)}/check", null, cancellationToken);

    /// <summary>Deletes a Watch and everything scoped to it.</summary>
    public Task<Response> DeleteAsync(string accountName, string watchName, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync($"{Path}/{Enc(accountName)}/{Enc(watchName)}", cancellationToken);
}

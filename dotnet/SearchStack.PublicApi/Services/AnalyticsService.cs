using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>
/// Analytics reports for Lists and Groups. Both endpoints take optional
/// <c>from</c>/<c>to</c> UTC dates (<c>yyyy-MM-dd</c>); omit them to let the API
/// default to the last 30 days.
/// </summary>
public sealed class AnalyticsService
{
    private const string Path = "analytics";
    private readonly Transport _transport;

    internal AnalyticsService(Transport transport) => _transport = transport;

    /// <summary>Top searches, zero-result queries, volume and click-through for a List.</summary>
    public Task<Response<AnalyticsReportResponse>> GetListAsync(string accountName, string listName, string? from = null, string? to = null, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<AnalyticsReportResponse>($"{Path}/list/{Enc(accountName)}/{Enc(listName)}{RangeQuery(from, to)}", cancellationToken);

    /// <summary>Top searches, zero-result queries, volume and click-through for a Group.</summary>
    public Task<Response<AnalyticsReportResponse>> GetGroupAsync(string accountName, string groupName, string? from = null, string? to = null, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<AnalyticsReportResponse>($"{Path}/group/{Enc(accountName)}/{Enc(groupName)}{RangeQuery(from, to)}", cancellationToken);

    private static string RangeQuery(string? from, string? to)
    {
        var parts = new List<string>(2);
        if (!string.IsNullOrEmpty(from)) parts.Add($"from={Enc(from!)}");
        if (!string.IsNullOrEmpty(to)) parts.Add($"to={Enc(to!)}");
        return parts.Count == 0 ? "" : "?" + string.Join("&", parts);
    }
}

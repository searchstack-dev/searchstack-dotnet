using System.Globalization;
using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>
/// Ask: one call that retrieves from your own records and answers from them, citing what it used.
/// <para>
/// Needs the <c>ask:run</c> permission on the API key — separate from <c>search-result:read</c> because an
/// Ask spends money at your own model provider, through the Judge whose model and credential it runs on.
/// </para>
/// <para>
/// A refusal is a normal success: <c>Answered</c> is false, <c>Reason</c> says why, and
/// <c>Results</c> still carries the records that matched.
/// </para>
/// </summary>
public sealed class AskService
{
    private const string Path = "ask";
    private readonly Transport _transport;

    internal AskService(Transport transport) => _transport = transport;

    private static string Ver(int version) => version.ToString(CultureInfo.InvariantCulture);

    /// <summary>Answers a question from the records in a List version, citing the records it used.</summary>
    public Task<Response<AskResponse>> AskListAsync(string accountName, string listName, int version, AskOptions? options = null, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<AskResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Ver(version)}", options ?? new AskOptions(), cancellationToken);

    /// <summary>
    /// Answers a question from the records across a Group of Lists, citing the records it used. Pass the
    /// Group's current_version to pin it, or an older version to ask a frozen set of records.
    /// </summary>
    public Task<Response<AskResponse>> AskGroupAsync(string accountName, string groupName, int version, AskOptions? options = null, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<AskResponse>($"{Path}/group/{Enc(accountName)}/{Enc(groupName)}/{Ver(version)}", options ?? new AskOptions(), cancellationToken);

    /// <summary>Answers a question across a Group at its CURRENT membership version, resolved server-side.</summary>
    public Task<Response<AskResponse>> AskGroupLatestAsync(string accountName, string groupName, AskOptions? options = null, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<AskResponse>($"{Path}/group/{Enc(accountName)}/{Enc(groupName)}/latest", options ?? new AskOptions(), cancellationToken);
}

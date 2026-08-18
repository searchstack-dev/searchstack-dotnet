using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>
/// Gate operations: what a record has to get past to be admitted to a List.
/// <para>
/// Gates run in an ordered chain at the single choke point every ingest path funnels through — import, upload,
/// feed sync, single create, edit — before a record is provisioned, mapped or indexed. A gate can admit a
/// record, rewrite its fields, compute a new one, hold it back, or refuse it outright with a reason.
/// </para>
/// <para>
/// Two things are worth knowing before calling anything here. Order ACROSS kinds is fixed by the system,
/// cheapest first, so a model-backed gate never scores a record an earlier gate would have removed — you order
/// only within a kind. And editing a gate does not change any list: each list stays pinned to the version it
/// was attached at until <see cref="BumpAsync"/> moves it, which is what stops one edit silently changing what
/// a dozen lists have been doing.
/// </para>
/// </summary>
public sealed class GateService
{
    private const string Path = "gate";
    private readonly Transport _transport;

    internal GateService(Transport transport) => _transport = transport;

    /// <summary>
    /// Lists the gates on an Account: the built-in cleaning steps plus any you have authored. Gates that belong
    /// to a single list are left out — pass scope "all" to include them.
    /// </summary>
    public Task<Response<List<GateResponse>>> ListAsync(string accountName, string? scope = null, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<List<GateResponse>>(
            $"{Path}/{Enc(accountName)}" + (string.IsNullOrEmpty(scope) ? "" : $"?scope={Enc(scope!)}"), cancellationToken);

    /// <summary>Retrieves one gate's definition: its kind, configuration and current version.</summary>
    public Task<Response<GateResponse>> GetAsync(string accountName, string gateName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<GateResponse>($"{Path}/{Enc(accountName)}/{Enc(gateName)}", cancellationToken);

    /// <summary>
    /// What happens to records arriving at one list: every gate on the Account, each marked with whether this
    /// list uses it and where. Attached gates come first, in the order they will actually run.
    /// </summary>
    public Task<Response<List<GateResponse>>> ListForListAsync(string accountName, string listName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<List<GateResponse>>($"{Path}/{Enc(accountName)}/list/{Enc(listName)}", cancellationToken);

    /// <summary>
    /// Creates a gate on the Account. Creating does not run it anywhere — attach it to a list next.
    /// </summary>
    public Task<Response<GateResponse>> CreateAsync(string accountName, CreateGateRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<GateResponse>($"{Path}/{Enc(accountName)}", request, cancellationToken);

    /// <summary>
    /// Replaces a gate's configuration and advances its version. No list changes behaviour until bumped.
    /// </summary>
    public Task<Response<GateResponse>> EditAsync(string accountName, string gateName, UpdateGateRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<GateResponse>($"{Path}/{Enc(accountName)}/{Enc(gateName)}", request, cancellationToken);

    /// <summary>Deletes a gate and detaches it from every list using it. Built-ins cannot be deleted.</summary>
    public Task<Response> DeleteAsync(string accountName, string gateName, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync($"{Path}/{Enc(accountName)}/{Enc(gateName)}", cancellationToken);

    /// <summary>
    /// Binds a gate to a list, and is also the edit path for an existing binding — the on/off toggle, the
    /// order and the credential picker all come through here. It does NOT move the pinned version.
    /// </summary>
    public Task<Response<GateResponse>> AttachAsync(string accountName, string listName, string gateName, AttachGateRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<GateResponse>($"{Path}/{Enc(accountName)}/list/{Enc(listName)}/{Enc(gateName)}", request, cancellationToken);

    /// <summary>Stops a gate running on this list. The definition and every other list are untouched.</summary>
    public Task<Response> DetachAsync(string accountName, string listName, string gateName, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync($"{Path}/{Enc(accountName)}/list/{Enc(listName)}/{Enc(gateName)}", cancellationToken);

    /// <summary>
    /// Moves this list onto the gate's current version. From here on, arriving records are judged by the new
    /// version; records already in the list keep the old value until backfilled. Set
    /// <see cref="BumpGateRequest.Backfill"/> to do both in one call — which spends your provider credential
    /// once per matching record. Bumping an already-current list is a no-op, not an error.
    /// </summary>
    public Task<Response<BumpGateVersionResponse>> BumpAsync(string accountName, string listName, string gateName, BumpGateRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<BumpGateVersionResponse>($"{Path}/{Enc(accountName)}/list/{Enc(listName)}/{Enc(gateName)}/bump", request, cancellationToken);

    /// <summary>
    /// Re-runs ONE gate over records already in the list. Only gates that compute a value can be backfilled.
    /// Answers immediately with a run id — poll it with <see cref="GetBackfillAsync"/>. <b>Spends your
    /// provider credential once per recomputed record</b>, over as much of the list as the filter matches.
    /// </summary>
    public Task<Response<GateBackfillResponse>> BackfillAsync(string accountName, string listName, string gateName, GateBackfillRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<GateBackfillResponse>($"{Path}/{Enc(accountName)}/list/{Enc(listName)}/{Enc(gateName)}/backfill", request, cancellationToken);

    /// <summary>How a backfill is going, by the run id the backfill call returned.</summary>
    public Task<Response<GateBackfillResponse>> GetBackfillAsync(string accountName, string runId, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<GateBackfillResponse>($"{Path}/{Enc(accountName)}/backfill/{Enc(runId)}", cancellationToken);

    /// <summary>
    /// Pulls remote media into the list's own store for records already in it. Distinct from
    /// <see cref="BackfillAsync"/>: capture changes stored files rather than recomputing a value. Re-running
    /// is safe — a file already in the store is not fetched twice.
    /// </summary>
    public Task<Response> CaptureBackfillAsync(string accountName, string listName, CaptureBackfillRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync($"{Path}/{Enc(accountName)}/list/{Enc(listName)}/capture/backfill", request, cancellationToken);
}

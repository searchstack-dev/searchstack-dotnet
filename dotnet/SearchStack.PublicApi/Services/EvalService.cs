using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>
/// Eval set operations: fixed query/expected-result suites scored by a Judge to
/// track search quality over time.
/// </summary>
public sealed class EvalService
{
    private const string Path = "eval";
    private const string CasePath = "eval-case";
    private readonly Transport _transport;

    internal EvalService(Transport transport) => _transport = transport;

    /// <summary>Lists the eval sets in an Account.</summary>
    public Task<Response<List<EvalSetResponse>>> ListAsync(string accountName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<List<EvalSetResponse>>($"{Path}/{Enc(accountName)}", cancellationToken);

    /// <summary>Retrieves a single eval set.</summary>
    public Task<Response<EvalSetResponse>> GetAsync(string accountName, string evalSetName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<EvalSetResponse>($"{Path}/{Enc(accountName)}/{Enc(evalSetName)}", cancellationToken);

    /// <summary>Retrieves the run history of an eval set. Pass a continuation token to page.</summary>
    public Task<Response<EvalRunHistoryResponse>> GetRunsAsync(string accountName, string evalSetName, string? continuationToken = null, CancellationToken cancellationToken = default)
    {
        var path = $"{Path}/{Enc(accountName)}/{Enc(evalSetName)}/runs";
        if (!string.IsNullOrEmpty(continuationToken)) path += $"?continuation-token={Enc(continuationToken!)}";
        return _transport.GetAsync<EvalRunHistoryResponse>(path, cancellationToken);
    }

    /// <summary>Retrieves the status (and results, once available) of a single eval run.</summary>
    public Task<Response<EvalRunStatusResponse>> GetRunStatusAsync(string accountName, string evalSetName, string runId, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<EvalRunStatusResponse>($"{Path}/{Enc(accountName)}/{Enc(evalSetName)}/run/{Enc(runId)}", cancellationToken);

    /// <summary>Creates an eval set.</summary>
    public Task<Response<EvalSetResponse>> CreateAsync(string accountName, CreateEvalSetRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<EvalSetResponse>($"{Path}/{Enc(accountName)}", request, cancellationToken);

    /// <summary>Creates an eval set from the judged candidates of past Judge runs.</summary>
    public Task<Response<EvalSetResponse>> BootstrapAsync(string accountName, BootstrapEvalSetRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<EvalSetResponse>($"{Path}/{Enc(accountName)}/bootstrap", request, cancellationToken);

    /// <summary>Starts an eval run. Runs asynchronously; resolves with the new run's id (HTTP 202).</summary>
    public Task<Response<RunEvalResponse>> RunAsync(string accountName, string evalSetName, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<RunEvalResponse>($"{Path}/{Enc(accountName)}/{Enc(evalSetName)}/run", new { }, cancellationToken);

    /// <summary>Deletes an eval set.</summary>
    public Task<Response> DeleteAsync(string accountName, string evalSetName, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync($"{Path}/{Enc(accountName)}/{Enc(evalSetName)}", cancellationToken);

    // ─── Cases ───────────────────────────────────────────────────────────────
    // The runnable unit inside a set: one query plus what a pass means for THAT query.

    /// <summary>Lists an eval set's cases.</summary>
    public Task<Response<List<EvalCaseResponse>>> ListCasesAsync(string accountName, string evalSetName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<List<EvalCaseResponse>>($"{CasePath}/{Enc(accountName)}/{Enc(evalSetName)}", cancellationToken);

    /// <summary>Retrieves one case: its query, retrieval settings and criteria.</summary>
    public Task<Response<EvalCaseResponse>> GetCaseAsync(string accountName, string evalSetName, string caseName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<EvalCaseResponse>($"{CasePath}/{Enc(accountName)}/{Enc(evalSetName)}/{Enc(caseName)}", cancellationToken);

    /// <summary>Adds a case to an eval set.</summary>
    public Task<Response<EvalCaseResponse>> CreateCaseAsync(string accountName, string evalSetName, CreateEvalCaseRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<EvalCaseResponse>($"{CasePath}/{Enc(accountName)}/{Enc(evalSetName)}", request, cancellationToken);

    /// <summary>Replaces a case's query, retrieval settings and criteria, keeping its name and creation stamp.</summary>
    public Task<Response<EvalCaseResponse>> EditCaseAsync(string accountName, string evalSetName, string caseName, EditEvalCaseRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<EvalCaseResponse>($"{CasePath}/{Enc(accountName)}/{Enc(evalSetName)}/{Enc(caseName)}", request, cancellationToken);

    /// <summary>Removes one case from an eval set. Idempotent.</summary>
    public Task<Response> DeleteCaseAsync(string accountName, string evalSetName, string caseName, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync($"{CasePath}/{Enc(accountName)}/{Enc(evalSetName)}/{Enc(caseName)}", cancellationToken);
}

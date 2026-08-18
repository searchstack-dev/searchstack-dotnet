using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>
/// Judge operations: BYO LLM graders that score candidates / search hits against
/// instructions and a structured output schema.
/// </summary>
public sealed class JudgeService
{
    private const string Path = "judge";
    private const string InstructionPath = "instruction";
    private readonly Transport _transport;

    internal JudgeService(Transport transport) => _transport = transport;

    // ─── Graders (model + credential) ────────────────────────────────────────

    /// <summary>Lists the Judge graders in an Account.</summary>
    public Task<Response<List<JudgeDetailsResponse>>> ListAsync(string accountName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<List<JudgeDetailsResponse>>($"{Path}/{Enc(accountName)}", cancellationToken);

    /// <summary>Retrieves a single Judge grader.</summary>
    public Task<Response<JudgeDetailsResponse>> GetAsync(string accountName, string judgeName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<JudgeDetailsResponse>($"{Path}/{Enc(accountName)}/{Enc(judgeName)}", cancellationToken);

    /// <summary>Retrieves the status (and per-candidate results) of a Judge run.</summary>
    public Task<Response<JudgeRunStatusResponse>> GetRunStatusAsync(string accountName, string runId, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<JudgeRunStatusResponse>($"{Path}/{Enc(accountName)}/run/{Enc(runId)}", cancellationToken);

    /// <summary>Creates a Judge grader (model + credential).</summary>
    public Task<Response<JudgeDetailsResponse>> CreateAsync(string accountName, CreateJudgeRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<JudgeDetailsResponse>($"{Path}/{Enc(accountName)}", request, cancellationToken);

    /// <summary>Edits a Judge grader (model + credential) in place.</summary>
    public Task<Response<JudgeDetailsResponse>> EditAsync(string accountName, string judgeName, EditJudgeRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<JudgeDetailsResponse>($"{Path}/{Enc(accountName)}/{Enc(judgeName)}", request, cancellationToken);

    /// <summary>Deletes a Judge grader (and cascade-deletes its instructions).</summary>
    public Task<Response> DeleteAsync(string accountName, string judgeName, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync($"{Path}/{Enc(accountName)}/{Enc(judgeName)}", cancellationToken);

    // ─── Instructions ────────────────────────────────────────────────────────

    /// <summary>Lists the judge instructions on an Account, optionally scoped to one judge.</summary>
    public Task<Response<List<JudgeInstructionResponse>>> ListInstructionsAsync(string accountName, string? judgeName = null, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<List<JudgeInstructionResponse>>(
            string.IsNullOrWhiteSpace(judgeName)
                ? $"{InstructionPath}/{Enc(accountName)}"
                : $"{InstructionPath}/{Enc(accountName)}?judgeName={Enc(judgeName)}",
            cancellationToken);

    /// <summary>Retrieves a single judge instruction.</summary>
    public Task<Response<JudgeInstructionResponse>> GetInstructionAsync(string accountName, string name, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<JudgeInstructionResponse>($"{InstructionPath}/{Enc(accountName)}/{Enc(name)}", cancellationToken);

    /// <summary>Adds an instruction to an existing judge.</summary>
    public Task<Response<JudgeInstructionResponse>> CreateInstructionAsync(string accountName, CreateJudgeInstructionRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<JudgeInstructionResponse>($"{InstructionPath}/{Enc(accountName)}", request, cancellationToken);

    /// <summary>Edits an instruction in place.</summary>
    public Task<Response<JudgeInstructionResponse>> EditInstructionAsync(string accountName, string name, EditJudgeInstructionRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<JudgeInstructionResponse>($"{InstructionPath}/{Enc(accountName)}/{Enc(name)}", request, cancellationToken);

    /// <summary>Deletes an instruction. The judge it ran on is left intact.</summary>
    public Task<Response> DeleteInstructionAsync(string accountName, string name, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync($"{InstructionPath}/{Enc(accountName)}/{Enc(name)}", cancellationToken);

    // ─── Instruction versions ─────────────────────────────────────────────────
    // Content is immutable per version — an edit appends a version; these list/view/restore the history.

    /// <summary>Lists every version of a judge instruction, newest first.</summary>
    public Task<Response<List<JudgeInstructionResponse>>> ListInstructionVersionsAsync(string accountName, string name, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<List<JudgeInstructionResponse>>($"{InstructionPath}/{Enc(accountName)}/{Enc(name)}/versions", cancellationToken);

    /// <summary>Retrieves one version of a judge instruction by its version number.</summary>
    public Task<Response<JudgeInstructionResponse>> GetInstructionVersionAsync(string accountName, string name, int version, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<JudgeInstructionResponse>($"{InstructionPath}/{Enc(accountName)}/{Enc(name)}/versions/{version}", cancellationToken);

    /// <summary>Restores an older instruction version by adding it again as the new current version. Returns the new current version.</summary>
    public Task<Response<JudgeInstructionResponse>> RestoreInstructionVersionAsync(string accountName, string name, int version, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<JudgeInstructionResponse>($"{InstructionPath}/{Enc(accountName)}/{Enc(name)}/restore/{version}", null, cancellationToken);

    /// <summary>Runs a judge instruction over explicit candidates or live search hits. Asynchronous (HTTP 202).</summary>
    public Task<Response<RunJudgeResponse>> RunAsync(string accountName, string instructionName, RunJudgeRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<RunJudgeResponse>($"{InstructionPath}/{Enc(accountName)}/{Enc(instructionName)}/run", request, cancellationToken);

    /// <summary>Synchronously tries a judge instruction against a single candidate and returns its verdict.</summary>
    public Task<Response<TryJudgeResponse>> TryAsync(string accountName, string instructionName, TryJudgeRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<TryJudgeResponse>($"{InstructionPath}/{Enc(accountName)}/{Enc(instructionName)}/try", request, cancellationToken);
}

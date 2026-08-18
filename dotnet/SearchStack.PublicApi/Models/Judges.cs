using System.Collections.Generic;

namespace SearchStack.PublicApi;

// Judges: BYO LLM graders that score candidates / search hits against instructions
// and a structured output schema. Used standalone and to score Eval runs.

// ─── Responses ───────────────────────────────────────────────────────────────

/// <summary>Health of a background-checked BYO service.</summary>
public sealed class ServiceHealthResponse
{
    /// <summary>One of: "unknown", "healthy", "degraded", "failing".</summary>
    public string Status { get; set; } = "";
    public long? LastCheckedUtc { get; set; }
    public long? LastSuccessUtc { get; set; }
    public string? Message { get; set; }
}

/// <summary>A judge: the reusable model + credential half. Holds no instructions — the instructions +
/// output schema + pass field live on its <see cref="JudgeInstructionResponse"/> children.</summary>
public sealed class JudgeDetailsResponse
{
    public string AccountName { get; set; } = "";
    public string Name { get; set; } = "";
    public string Provider { get; set; } = "";
    public string ProviderDisplayName { get; set; } = "";
    public string Model { get; set; } = "";
    /// <summary>Custom endpoint override, when set (a proxy/gateway/compatible host); null = the provider default.</summary>
    public string? Endpoint { get; set; }
    /// <summary>The shared credential this grader's key resolves from, or null for a legacy inline-key grader.</summary>
    public string? CredentialName { get; set; }
    public long CreatedUtc { get; set; }
    public ServiceHealthResponse? Health { get; set; }
}

/// <summary>A judge instruction (JudgeInstruction): the runnable unit belonging to a judge — the prompt, output schema and pass field.</summary>
public sealed class JudgeInstructionResponse
{
    public string AccountName { get; set; } = "";
    public string Name { get; set; } = "";
    /// <summary>The 1-based content version of this instruction. Content is immutable per version — an edit appends a
    /// new version rather than overwriting, so a run that recorded version N stays reproducible.</summary>
    public int Version { get; set; } = 1;
    /// <summary>The judge (model + credential) this instruction runs on.</summary>
    public string JudgeName { get; set; } = "";
    public string Instructions { get; set; } = "";
    /// <summary>JSON Schema (as a string) the verdict's structured output must satisfy.</summary>
    public string OutputSchema { get; set; } = "";
    /// <summary>Boolean field in the verdict output that decides pass/fail.</summary>
    public string? PassField { get; set; }
    public long CreatedUtc { get; set; }
}

public sealed class RunJudgeResponse
{
    public string RunId { get; set; } = "";
}

/// <summary>The synchronous result of trying a judge against a single candidate.</summary>
public sealed class TryJudgeResponse
{
    /// <summary>The judge's raw structured (JSON) output.</summary>
    public string Json { get; set; } = "";
    public bool Passed { get; set; }
    public string? Error { get; set; }
}

public sealed class JudgeResultResponse
{
    public string CandidateId { get; set; } = "";
    public string Json { get; set; } = "";
    public bool Passed { get; set; }
    public string? Error { get; set; }
}

public sealed class JudgeRunStatusResponse
{
    public string RunId { get; set; } = "";
    /// <summary>The instruction version this run pinned (a version never changes).</summary>
    public int InstructionVersion { get; set; }
    public string Status { get; set; } = "";
    public int TotalCandidates { get; set; }
    public int ProcessedCount { get; set; }
    public int PassedCount { get; set; }
    public int ErroredCount { get; set; }
    public long CreatedUtc { get; set; }
    public long? CompletedUtc { get; set; }
    public List<JudgeResultResponse> Results { get; set; } = new List<JudgeResultResponse>();
}

// ─── Requests ────────────────────────────────────────────────────────────────

/// <summary>Create a judge (model + credential). It holds no instructions — add them with
/// <see cref="CreateJudgeInstructionRequest"/>.</summary>
public sealed class CreateJudgeRequest
{
    /// <summary>
    /// Optional free-form identity for this grader. Omit to default to the <c>{provider}-{model}</c>
    /// composite (one grader per model); supply a name to hold several graders on the same model.
    /// </summary>
    public string? Name { get; set; }
    public string Provider { get; set; } = "";
    public string Model { get; set; } = "";
    public string ApiKey { get; set; } = "";
    /// <summary>An existing saved credential to reuse instead of pasting <see cref="ApiKey"/>.</summary>
    public string? CredentialName { get; set; }
    /// <summary>Custom endpoint for the provider, when self-hosted / proxied.</summary>
    public string? Endpoint { get; set; }
}

/// <summary>Edit a judge (model + credential) in place. The prompt, output schema and pass field are edited on its instructions.</summary>
public sealed class EditJudgeRequest
{
    /// <summary>The vendor of the model to run on. Omit to keep the grader's current provider.</summary>
    public string? Provider { get; set; }
    /// <summary>The model to run on. Omit to keep the grader's current model.</summary>
    public string? Model { get; set; }
    /// <summary>Optional — omit to keep the stored key.</summary>
    public string? ApiKey { get; set; }
    /// <summary>Re-point the grader at an existing saved credential. Omit to keep its current one.</summary>
    public string? CredentialName { get; set; }
    public string? Endpoint { get; set; }
}

/// <summary>Add an instruction (JudgeInstruction) to an existing judge: the runnable unit.</summary>
public sealed class CreateJudgeInstructionRequest
{
    /// <summary>The judge (model + credential) this instruction runs on. Must already exist.</summary>
    public string JudgeName { get; set; } = "";
    /// <summary>The instruction's free-form, account-scoped identity — the token evals/watches/imports reference.</summary>
    public string Name { get; set; } = "";
    public string Instructions { get; set; } = "";
    public string OutputSchema { get; set; } = "";
    public string? PassField { get; set; }
}

/// <summary>Edit an instruction in place. The judge it runs on is preserved.</summary>
public sealed class EditJudgeInstructionRequest
{
    public string Instructions { get; set; } = "";
    public string OutputSchema { get; set; } = "";
    public string? PassField { get; set; }
}

public sealed class JudgeContextDto
{
    public string Text { get; set; } = "";
    public List<string>? ImageUris { get; set; }
}

public sealed class JudgeCandidateDto
{
    public string Id { get; set; } = "";
    public string Text { get; set; } = "";
    public List<string>? ImageUris { get; set; }
}

/// <summary>Instead of supplying candidates, have the judge run over live search hits.</summary>
public sealed class JudgeSearchDto
{
    public string? ListName { get; set; }
    public int? Version { get; set; }
    public string? GroupName { get; set; }
    public int? GroupVersion { get; set; }
    public string? Query { get; set; }
    public int? Size { get; set; }
    public string? Filter { get; set; }
    public List<string>? TextFields { get; set; }
    public List<string>? ImageFields { get; set; }
}

public sealed class RunJudgeRequest
{
    public JudgeContextDto Context { get; set; } = new JudgeContextDto();
    /// <summary>Explicit candidates to judge. Mutually exclusive with <see cref="Search"/>.</summary>
    public List<JudgeCandidateDto>? Candidates { get; set; }
    /// <summary>Judge live search results instead of explicit candidates.</summary>
    public JudgeSearchDto? Search { get; set; }
    public bool Batch { get; set; }
}

public sealed class TryJudgeRequest
{
    public JudgeContextDto Context { get; set; } = new JudgeContextDto();
    public JudgeCandidateDto Candidate { get; set; } = new JudgeCandidateDto();
}

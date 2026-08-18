using System.Collections.Generic;

namespace SearchStack.PublicApi;

// Eval sets: fixed query/expected-result suites scored by a Judge to track search
// quality over time. Member names map to snake_case via the shared naming policy.

// ─── Responses ───────────────────────────────────────────────────────────────

public sealed class EvalQueryResponse
{
    public string Text { get; set; } = "";
    public int Size { get; set; }
    public string? Filter { get; set; }
    public List<string> TextFields { get; set; } = new List<string>();
    public List<string> ImageFields { get; set; } = new List<string>();
}

public sealed class EvalSetResponse
{
    public string AccountName { get; set; } = "";
    public string Name { get; set; } = "";
    public string? ListName { get; set; }
    public int? ListVersion { get; set; }
    public string? GroupName { get; set; }
    public int? GroupVersion { get; set; }
    public long TargetCreatedUtc { get; set; }
    public string? JudgeName { get; set; }
    public long? JudgeCreatedUtc { get; set; }
    public string ContextText { get; set; } = "";
    public List<string> ContextImageUris { get; set; } = new List<string>();
    /// <summary>Events that trigger an automatic run, e.g. "ingest", "schedule".</summary>
    public List<string> AutoRunOn { get; set; } = new List<string>();
    public List<EvalQueryResponse> Queries { get; set; } = new List<EvalQueryResponse>();
    public long CreatedUtc { get; set; }
}

public sealed class EvalQueryResultResponse
{
    public int QueryIndex { get; set; }
    public string QueryText { get; set; } = "";
    public List<string> OrderedCandidateIds { get; set; } = new List<string>();
    public string? JudgeRunId { get; set; }
    public int HitCount { get; set; }
    public int PassedCount { get; set; }
    public int ErroredCount { get; set; }
}

public sealed class EvalRunStatusResponse
{
    public string RunId { get; set; } = "";
    public string AccountName { get; set; } = "";
    public string EvalSetName { get; set; } = "";
    /// <summary>e.g. "pending", "running", "completed", "failed".</summary>
    public string Status { get; set; } = "";
    public string TriggerSource { get; set; } = "";
    public int TotalQueries { get; set; }
    public int ProcessedQueries { get; set; }
    public int ZeroResultQueries { get; set; }
    public int TotalCandidates { get; set; }
    public int PassedCount { get; set; }
    public int ErroredCount { get; set; }
    public double? PassRate { get; set; }
    public double? ZeroResultRate { get; set; }
    public string? ModelName { get; set; }
    public string? RerankerName { get; set; }
    public string? JudgeName { get; set; }
    public bool MembershipDrifted { get; set; }
    public long CreatedUtc { get; set; }
    public long? CompletedUtc { get; set; }
    /// <summary>Per-query detail; present once the run has produced results.</summary>
    public List<EvalQueryResultResponse>? Results { get; set; }
}

public sealed class EvalRunHistoryResponse
{
    public List<EvalRunStatusResponse> Runs { get; set; } = new List<EvalRunStatusResponse>();
    public string? ContinuationToken { get; set; }
}

public sealed class RunEvalResponse
{
    public string RunId { get; set; } = "";
    public int EstimatedJudgeCalls { get; set; }
}

// ─── Requests ────────────────────────────────────────────────────────────────

/// <summary>A query supplied when creating an eval set.</summary>
public sealed class EvalQueryDto
{
    public string Text { get; set; } = "";
    public int? Size { get; set; }
    public string? Filter { get; set; }
    public List<string>? TextFields { get; set; }
    public List<string>? ImageFields { get; set; }
}

public sealed class CreateEvalSetRequest
{
    public string Name { get; set; } = "";
    public string? ListName { get; set; }
    public int? ListVersion { get; set; }
    public string? GroupName { get; set; }
    public int? GroupVersion { get; set; }
    public string? JudgeName { get; set; }
    public string? ContextText { get; set; }
    public List<string>? ContextImageUris { get; set; }
    public List<string>? AutoRunOn { get; set; }
    public List<EvalQueryDto> Queries { get; set; } = new List<EvalQueryDto>();
}

public sealed class BootstrapEvalSetRequest
{
    public string Name { get; set; } = "";
    /// <summary>Judge run ids whose judged candidates seed the new eval set.</summary>
    public List<string> SourceRunIds { get; set; } = new List<string>();
    public string? ContextText { get; set; }
    public List<string>? ContextImageUris { get; set; }
}

// ─── Eval cases ──────────────────────────────────────────────────────────────
// One case in an eval set: a query to run against the set's pinned target, plus what a good result for
// THAT query looks like. Criteria are per case because the judge grades one result at a time and never
// sees the query that retrieved it, so a set spanning unrelated queries can't share one standard.

/// <summary>One case in an eval set: the unit a run scores and keeps history for.</summary>
public sealed class EvalCaseResponse
{
    public string AccountName { get; set; } = "";
    public string EvalSetName { get; set; } = "";
    public string Name { get; set; } = "";
    public string Query { get; set; } = "";
    /// <summary>How many hits this case retrieves and judges. Each one is a billed judge call.</summary>
    public int Size { get; set; }
    public string? Filter { get; set; }
    public List<string> TextFields { get; set; } = new List<string>();
    public List<string> ImageFields { get; set; } = new List<string>();
    /// <summary>What a pass means for this case. Empty means it inherits the set's context text.</summary>
    public string Criteria { get; set; } = "";
    public long CreatedUtc { get; set; }
}

/// <summary>Add a case to an eval set.</summary>
public sealed class CreateEvalCaseRequest
{
    /// <summary>Unique within the set, URL-safe. Names the case so it can be edited and followed across runs.</summary>
    public string Name { get; set; } = "";
    public string Query { get; set; } = "";
    /// <summary>What makes a result good for this query. Omit to inherit the set's context text.</summary>
    public string? Criteria { get; set; }
    /// <summary>Hits to retrieve and judge (default 10, max 25). Each one is a billed judge call.</summary>
    public int? Size { get; set; }
    public string? Filter { get; set; }
    /// <summary>Searchable field names joined into each candidate's judgeable text. Empty = every string field.</summary>
    public List<string>? TextFields { get; set; }
    /// <summary>Resource field names whose values become each candidate's image URIs.</summary>
    public List<string>? ImageFields { get; set; }
}

/// <summary>Replace a case's query, retrieval settings and criteria. Its name is the route.</summary>
public sealed class EditEvalCaseRequest
{
    public string Query { get; set; } = "";
    public string? Criteria { get; set; }
    public int? Size { get; set; }
    public string? Filter { get; set; }
    public List<string>? TextFields { get; set; }
    public List<string>? ImageFields { get; set; }
}

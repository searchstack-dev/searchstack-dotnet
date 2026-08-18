// Explicit: this package multi-targets netstandard2.0, which has no implicit usings.
using System.Collections.Generic;

namespace SearchStack.PublicApi;

// Watches: standing queries. A query registered once, re-run on a cadence, alerting only on records it
// has not already alerted on. Like an eval set, a watch pins one version of one list, which keeps its filter
// meaningful after the schema moves on; records are never versioned, so it still sees every new record.

// ─── Responses ───────────────────────────────────────────────────────────────

public sealed class WatchResponse
{
    public string AccountName { get; set; } = "";
    public string Name { get; set; } = "";
    /// <summary>The watched list.</summary>
    public string ListName { get; set; } = "";
    /// <summary>The pinned list version the sweep searches.</summary>
    public int ListVersion { get; set; }
    /// <summary>The standing query. Null matches everything in scope, bounded by filter + size.</summary>
    public string? Query { get; set; }
    public string? Filter { get; set; }
    public int Size { get; set; }
    public bool VectorSearch { get; set; }
    /// <summary>The judge vetting each fresh candidate. Null = every fresh candidate is a match.</summary>
    public string? JudgeName { get; set; }
    public string ContextText { get; set; } = "";
    /// <summary>Who this Watch's alerts are emailed to, one message each per check. Empty = no email.</summary>
    public List<string> NotifyEmails { get; set; } = new();
    public int IntervalMinutes { get; set; }
    public bool Enabled { get; set; }
    /// <summary>Bumped on every edit and stamped on each match, so a match records which question found it.</summary>
    public int Revision { get; set; }
    /// <summary>When the sweep last evaluated this watch, match or not. Null until the first sweep.</summary>
    public long? LastSweptUtc { get; set; }
    public long CreatedUtc { get; set; }
}

/// <summary>
/// One alert: a record a watch found, as it was at match time. The record's fields are deliberately absent —
/// they are live, and a stale copy would be a second source of truth; fetch the record by
/// <see cref="RecordId"/> to see it now.
/// </summary>
public sealed class WatchMatchResponse
{
    public string RecordId { get; set; } = "";
    public string RecordName { get; set; } = "";
    /// <summary>The list the record was found in.</summary>
    public string? ListName { get; set; }
    /// <summary>The list version searched at match time.</summary>
    public int Version { get; set; }
    /// <summary>The watch's revision at match time — which question found this.</summary>
    public int WatchRevision { get; set; }
    /// <summary>"matched", or "needs-review" when the watch's judge could not rule on it.</summary>
    public string Status { get; set; } = "";
    /// <summary>The judge's verbatim JSON verdict, or the error summary for needs-review. Null with no judge.</summary>
    public string? Verdict { get; set; }
    public long MatchedUtc { get; set; }
}

/// <summary>A watch's feedback tally: is it telling you useful things?</summary>
public sealed class WatchPrecisionResponse
{
    public int Confirmed { get; set; }
    public int Dismissed { get; set; }
    public int Labelled { get; set; }
    /// <summary>Of the alerts you ruled on, the fraction you wanted. Null until you have labelled one.</summary>
    public double? Precision { get; set; }
}

// ─── Requests ────────────────────────────────────────────────────────────────

/// <summary>
/// Tells the Watch whether one of its alerts was any good. Measured, never learned from: the point is to make
/// a mis-tuned Watch visible as a number, not to have the platform second-guess your query.
/// </summary>
public sealed class WatchFeedbackRequest
{
    /// <summary>The alerted record's id, as it appears on the match.</summary>
    public string RecordId { get; set; } = "";
    /// <summary>"confirm" or "dismiss". Re-rating a record replaces its earlier rating.</summary>
    public string Kind { get; set; } = "";
}

/// <summary>
/// Vets each fresh candidate with one of your saved API keys — no judge to author first. That key pays for
/// the vetting; what you want to be told about goes in the request's <c>ContextText</c>.
/// </summary>
public sealed class WatchJudgeRequest
{
    /// <summary>The saved credential whose key pays for the vetting, e.g. "anthropic-1".</summary>
    public string CredentialName { get; set; } = "";
    /// <summary>A model of that credential's own vendor. Omit for the vendor's cheap default.</summary>
    public string? Model { get; set; }
}

/// <summary>Targets one list and pins a version of it. Omit <see cref="ListVersion"/> to pin the current version.</summary>
public sealed class CreateWatchRequest
{
    public string Name { get; set; } = "";
    public string ListName { get; set; } = "";
    /// <summary>The list version to pin. Omit to pin the list's current version.</summary>
    public int? ListVersion { get; set; }
    /// <summary>Omit to alert on anything new in scope — what a mirrored feed wants.</summary>
    public string? Query { get; set; }
    public string? Filter { get; set; }
    /// <summary>Candidates per sweep. Bounds both alert volume and judge spend.</summary>
    public int? Size { get; set; }
    public bool VectorSearch { get; set; }
    /// <summary>A judge instruction already on the account. Use <see cref="Judge"/> instead to check records with a saved key.</summary>
    public string? JudgeName { get; set; }
    /// <summary>The criteria applied to each candidate. Requires <see cref="Judge"/> or <see cref="JudgeName"/>.</summary>
    public string? ContextText { get; set; }
    public int? IntervalMinutes { get; set; }
    /// <summary>
    /// Check each candidate with a saved API key. The judge instruction is created for this watch and deleted with it.
    /// Mutually exclusive with <see cref="JudgeName"/>.
    /// </summary>
    public WatchJudgeRequest? Judge { get; set; }
    /// <summary>
    /// Email this Watch's alerts to these addresses — one message per check that found something, never one
    /// per record. Each recipient gets their OWN copy, so each can unsubscribe without affecting the others.
    /// Omit for no email. Independent of webhooks: this is for people, those are for a machine.
    /// </summary>
    public List<string>? NotifyEmails { get; set; }
}

/// <summary>
/// A full replace, not a patch: every omitted field reverts to its default. The watched list is not editable —
/// that is a delete and a create — but <see cref="ListVersion"/> is: omit to keep the current pin, or name a
/// version to migrate the watch to it.
/// </summary>
public sealed class EditWatchRequest
{
    /// <summary>Re-pin to this version of the watched list. Omit to keep the current pin.</summary>
    public int? ListVersion { get; set; }
    public string? Query { get; set; }
    public string? Filter { get; set; }
    public int? Size { get; set; }
    public bool VectorSearch { get; set; }
    public string? JudgeName { get; set; }
    public string? ContextText { get; set; }
    public int? IntervalMinutes { get; set; }
    /// <summary>Pause or resume sweeping. Omit to leave as-is. Does not bump the revision.</summary>
    public bool? Enabled { get; set; }
    /// <summary>
    /// Vet each candidate with a saved API key. Omitting this AND <see cref="JudgeName"/> turns vetting off
    /// (this is a full replace) and deletes the judge instruction the watch owned.
    /// </summary>
    public WatchJudgeRequest? Judge { get; set; }
    /// <summary>
    /// Email this Watch's alerts to these addresses. Omitting them turns the emails off — this is a full
    /// replace — without touching any webhook subscribed to the same Watch.
    /// </summary>
    public List<string>? NotifyEmails { get; set; }
}

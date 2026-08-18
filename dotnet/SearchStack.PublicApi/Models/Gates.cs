// Explicit: this package multi-targets netstandard2.0, which has no implicit usings.
using System.Collections.Generic;

namespace SearchStack.PublicApi;

// Gates: what a record has to get past to be admitted to a List.
//
// A gate DEFINITION is account-scoped (what it does), and an ATTACHMENT binds it to a list (where it runs,
// reading and writing which fields, paid for by which credential). One response type carries both halves,
// because the question an operator actually asks is "what happens to records arriving at this list?" and the
// answer needs the definition and the binding together.

// ─── Responses ───────────────────────────────────────────────────────────────

public sealed class GateResponse
{
    public string Name { get; set; } = "";

    /// <summary>Builtin, Rules or Judge. Order across kinds is fixed by the system, cheapest first.</summary>
    public string Kind { get; set; } = "";

    /// <summary>Kind-specific configuration, as a JSON string.</summary>
    public string Config { get; set; } = "";

    public string? Description { get; set; }

    /// <summary>Ours, seeded, not editable — but switchable per list like any other.</summary>
    public bool IsBuiltin { get; set; }

    /// <summary>
    /// The list this gate belongs to, or null for an account-wide gate. One that belongs to a list is left out
    /// of the account listing, can only be attached to that list, and is deleted when the list is.
    /// </summary>
    public string? OwnerList { get; set; }

    /// <summary>The credential this gate uses on this list, if it has its own.</summary>
    public string? CredentialName { get; set; }

    public string? Model { get; set; }

    /// <summary>The key the gate will ACTUALLY use, which may be the list's rather than its own.</summary>
    public string? EffectiveCredentialName { get; set; }

    public bool CredentialInherited { get; set; }

    /// <summary>True when this gate's position is fixed by the system and cannot be changed.</summary>
    public bool OrderFixed { get; set; }

    /// <summary>The definition's version. Editing advances it; a list follows only when bumped.</summary>
    public int Version { get; set; }

    /// <summary>
    /// The version THIS LIST is pinned at. Lower than <see cref="Version"/> means the list has not followed a
    /// later edit. Null on the account-level listing, which has no attachment.
    /// </summary>
    public int? PinnedVersion { get; set; }

    public long Created { get; set; }

    public long Updated { get; set; }

    /// <summary>Whether the list this was listed for uses this gate. False on the account-level listing.</summary>
    public bool Attached { get; set; }

    public bool Enabled { get; set; }

    /// <summary>Position WITHIN this gate's kind.</summary>
    public int Order { get; set; }

    public List<string>? InputFields { get; set; }

    public string? OutputField { get; set; }

    public bool RunOnInsert { get; set; } = true;

    public bool RunOnEdit { get; set; } = true;

    /// <summary>The list's own settings for this gate, distinct from the definition's config.</summary>
    public string? ListConfig { get; set; }

    /// <summary>This gate runs unless somebody switches it off — it needs no attachment.</summary>
    public bool OnByDefault { get; set; }

    /// <summary>
    /// This gate is on every list's chain without being added, though it may be switched off (capture is).
    /// Turn it off or on to change it; detaching only restores the default.
    /// </summary>
    public bool AttachedByDefault { get; set; }
}

/// <summary>
/// One backfill: re-running a computing gate over records already in a list. Started with a 202 and a run id;
/// this is what polling that id returns.
/// </summary>
public sealed class GateBackfillResponse
{
    public string RunId { get; set; } = "";

    public string ListName { get; set; } = "";

    public string GateName { get; set; } = "";

    /// <summary>Queued, Running, Completed or Failed.</summary>
    public string Status { get; set; } = "";

    /// <summary>The gate version this run brings records up to — the list's pinned version.</summary>
    public int TargetVersion { get; set; }

    public string? Filter { get; set; }

    public int Scanned { get; set; }

    public int Recomputed { get; set; }

    /// <summary>Records already stamped at the target version, so nothing was spent on them.</summary>
    public int Skipped { get; set; }

    public int Failed { get; set; }

    /// <summary>Why the job itself could not run. Individual record failures are counted, not fatal.</summary>
    public string? Error { get; set; }

    public long Created { get; set; }

    public long? Completed { get; set; }
}

public sealed class BumpGateVersionResponse
{
    public GateResponse Gate { get; set; } = new();

    public int PreviousVersion { get; set; }

    public int PinnedVersion { get; set; }

    /// <summary>The backfill this bump started, when one was requested. Null otherwise.</summary>
    public GateBackfillResponse? Backfill { get; set; }
}

// ─── Requests ────────────────────────────────────────────────────────────────

public sealed class CreateGateRequest
{
    /// <summary>Account-unique name (letters, digits and hyphens), e.g. "no-profanity".</summary>
    public string Name { get; set; } = "";

    /// <summary>"Rules" for declarative checks, "Judge" for a model scoring against your criteria.</summary>
    public string Kind { get; set; } = "";

    /// <summary>Kind-specific configuration, as a JSON string.</summary>
    public string Config { get; set; } = "";

    public string? Description { get; set; }

    /// <summary>
    /// Make this gate belong to one list instead of the whole Account. It is then left out of the account
    /// listing, can only be attached to that list, and is deleted when the list is — right for a rule written
    /// for one file, wrong for anything you mean to reuse. Leave null for a normal account-wide gate.
    /// </summary>
    public string? ListName { get; set; }
}

public sealed class UpdateGateRequest
{
    /// <summary>Replacement configuration. Advances the version; lists stay on the version they were pinned at.</summary>
    public string Config { get; set; } = "";

    public string? Description { get; set; }
}

public sealed class AttachGateRequest
{
    /// <summary>Position within this gate's kind. Order across kinds is fixed by the system.</summary>
    public int Order { get; set; }

    /// <summary>
    /// Which fields the gate reads on this list. Empty means the gate's own default: for rules, every text
    /// field; for builtin-capture-media, every resource field. Name fields only to narrow it.
    /// </summary>
    public List<string>? InputFields { get; set; }

    /// <summary>Where a computing gate writes. Leave null for gates that only reject or modify.</summary>
    public string? OutputField { get; set; }

    /// <summary>The saved credential that pays for this gate ON THIS LIST. Judge gates only.</summary>
    public string? CredentialName { get; set; }

    public string? Model { get; set; }

    public bool RunOnInsert { get; set; } = true;

    public bool RunOnEdit { get; set; } = true;

    /// <summary>Per-list settings as JSON, for the gates that have any.</summary>
    public string? Config { get; set; }
}

public sealed class BumpGateRequest
{
    /// <summary>
    /// Also re-run the gate over records already in the list. Default false: bumping is instant and free,
    /// backfilling spends your provider key on every matching record.
    /// </summary>
    public bool Backfill { get; set; }

    /// <summary>Limits which existing records the backfill covers. Ignored unless Backfill is true.</summary>
    public string? Filter { get; set; }
}

public sealed class GateBackfillRequest
{
    /// <summary>Limits which records are recomputed. Omit for the whole list.</summary>
    public string? Filter { get; set; }

    /// <summary>
    /// Recompute even records already stamped at the pinned version. Default false, which is what makes a
    /// re-run after a partial failure cost nothing for the records that already succeeded.
    /// </summary>
    public bool Force { get; set; }
}

public sealed class CaptureBackfillRequest
{
    /// <summary>Limits which existing records are captured. Omit to run over the whole list.</summary>
    public string? Filter { get; set; }
}

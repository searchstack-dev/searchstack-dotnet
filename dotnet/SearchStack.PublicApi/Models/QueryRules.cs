// Explicit: this package multi-targets netstandard2.0, which has no implicit usings.
using System.Collections.Generic;

namespace SearchStack.PublicApi;

// Query rules: how a raw query is READ before it is executed.
//
// A rule spots a format in what somebody typed — a postcode, a barcode, an order number — and lifts that part
// of the query out as a CONSTRAINT rather than leaving it to be matched as words. "flat 2 zz1 1zz" becomes the
// text "flat 2" plus a filter on the postcode field.
//
// Rules are LIST-scoped, unlike gates. A rule binds a format to a field, and a field only means what it means
// on one list — "the column called postcode on THIS list holds UK postcodes" does not travel.
//
// Property names here are chosen so the package's SnakeCaseLower policy produces the wire name directly, which
// is why some read oddly in C# (Text, Shadow, Samples, From, To). The Shared record for the same payload names
// several of them differently (ResidualText, ShadowConstraints, SampleValues, FromUtc, ToUtc); following those
// names here would serialize to residual_text / shadow_constraints / sample_values and deserialize as silent
// nulls. Match the wire, not the server's C#.

// ─── Responses ───────────────────────────────────────────────────────────────

public sealed class QueryRuleResponse
{
    public string Name { get; set; } = "";

    public string ListName { get; set; } = "";

    /// <summary>The field a match constrains. Always a facet — only a facet can be filtered on.</summary>
    public string TargetField { get; set; } = "";

    /// <summary>The shipped rule type's id ("uk-postcode"), or the rule's own name for a custom pattern.</summary>
    public string Recognizer { get; set; } = "";

    /// <summary>BuiltIn, ValueSet or Pattern.</summary>
    public string RecognizerKind { get; set; } = "";

    /// <summary>Plain language — "UK postcode". Falls back to the id for a custom pattern.</summary>
    public string DisplayName { get; set; } = "";

    /// <summary>What the rule does, in the operator's language. Null for a custom pattern: we did not write it.</summary>
    public string? Description { get; set; }

    /// <summary>Null unless the rule carries a customer-supplied regex.</summary>
    public string? Pattern { get; set; }

    /// <summary>WholeQuery, Token or TokenSpan. TokenSpan is why a two-word postcode is recognised at all.</summary>
    public string MatchMode { get; set; } = "";

    /// <summary>Filter (narrow the results), ExactLookup (pin one record above them) or Boost.</summary>
    public string Action { get; set; } = "";

    /// <summary>
    /// Passive, Balanced or Aggressive — how much evidence the rule needs before it acts. Aggressive paired
    /// with Filter is the only combination that can return zero results.
    /// </summary>
    public string Stance { get; set; } = "";

    /// <summary>Enabled, Shadow (records what it would do, changes nothing) or Disabled.</summary>
    public string State { get; set; } = "";

    /// <summary>Remove the matched text from what the search sees.</summary>
    public bool ConsumeMatch { get; set; }

    /// <summary>Execution order. The first rule to consume a span wins; later rules see only the residual.</summary>
    public int Order { get; set; }

    public int Version { get; set; }

    /// <summary>Manual, Inferred, LlmSuggested or LogInferred. Drives what state the rule may start in.</summary>
    public string Origin { get; set; } = "";

    public double Confidence { get; set; }

    /// <summary>One sentence naming the evidence — "98% of 12,400 values matched".</summary>
    public string? Evidence { get; set; }

    /// <summary>True when the rule uses a shipped recognizer: ours, and its shape is not editable.</summary>
    public bool IsBuiltin { get; set; }

    public long Created { get; set; }

    public long Updated { get; set; }
}

/// <summary>A shipped rule type. Supplies everything a rule needs except the field.</summary>
public sealed class QueryRuleTemplateResponse
{
    public string Recognizer { get; set; } = "";

    public string DisplayName { get; set; } = "";

    public string Description { get; set; } = "";

    public string MatchMode { get; set; } = "";

    /// <summary>
    /// The default worth having. Cardinality decides Filter versus ExactLookup and is knowable in advance for
    /// these formats, so nobody has to guess the one thing a generated rule most visibly gets wrong.
    /// </summary>
    public string Action { get; set; } = "";

    public string Stance { get; set; } = "";
}

/// <summary>One constraint lifted out of a query.</summary>
public sealed class ExtractedConstraintResponse
{
    public string Field { get; set; } = "";

    /// <summary>Exactly as it was typed — for a "Showing results in ZZ1 1ZZ ✕" chip.</summary>
    public string RawText { get; set; } = "";

    public string Value { get; set; } = "";

    public string Rule { get; set; } = "";

    public string Action { get; set; } = "";

    /// <summary>False when the caller's own filter on this field took precedence.</summary>
    public bool Applied { get; set; }

    public string? SupersededByCallerFilter { get; set; }
}

/// <summary>What a rule in Shadow WOULD have extracted. Never applied.</summary>
public sealed class ShadowConstraintResponse
{
    public string Field { get; set; } = "";

    public string RawText { get; set; } = "";

    public string Value { get; set; } = "";

    public string Rule { get; set; } = "";

    public string Action { get; set; } = "";

    /// <summary>
    /// The rule matched the shape but the field does not hold the value — the most useful shadow signal there
    /// is, because it says the rule would have fired and returned nothing.
    /// </summary>
    public bool VerificationFailed { get; set; }
}

/// <summary>
/// A live rule that recognised a value and then declined to act on it. Nothing here changed the search: it
/// distinguishes "no rule recognised this" from "a rule recognised it and your data does not hold it".
/// </summary>
public sealed class StoodDownRuleResponse
{
    public string Field { get; set; } = "";

    public string RawText { get; set; } = "";

    public string Value { get; set; } = "";

    public string Rule { get; set; } = "";

    /// <summary>
    /// "ValueNotFound" — the field was checked and does not hold the value — or "CouldNotCheck", where the
    /// field's values were not available to check against, most often because they are still loading.
    /// </summary>
    public string Reason { get; set; } = "";
}

/// <summary>How a query is read: the text that survives, and the constraints lifted out of it.</summary>
public sealed class QueryInterpretationResponse
{
    public string Query { get; set; } = "";

    /// <summary>
    /// What is left for text search. Identical to the query when no rule fired, and empty when the whole query
    /// became constraints. Wire name is "text".
    /// </summary>
    public string Text { get; set; } = "";

    public List<ExtractedConstraintResponse>? Constraints { get; set; }

    /// <summary>What shadow rules would have done. Wire name is "shadow".</summary>
    public List<ShadowConstraintResponse>? Shadow { get; set; }

    /// <summary>
    /// Rules that matched and then left the query alone. Populated by the test call only. Wire name is
    /// "stood_down".
    /// </summary>
    public List<StoodDownRuleResponse>? StoodDown { get; set; }
}

/// <summary>What a sample of one field's values looked like — the evidence behind an inferred rule.</summary>
public sealed class FieldProfileResponse
{
    public string Field { get; set; } = "";

    /// <summary>Records read. A SAMPLE, not a census.</summary>
    public long SampledCount { get; set; }

    /// <summary>How many of those records actually carried a value here.</summary>
    public long NonNullCount { get; set; }

    public long DistinctCount { get; set; }

    /// <summary>
    /// Distinct divided by sampled. This, not the shape, is what decides whether a match narrows the results
    /// or pins one record.
    /// </summary>
    public double CardinalityRatio { get; set; }

    /// <summary>The rule type that claimed most of the field ("uk-postcode"), or null if none did.</summary>
    public string? LooksLike { get; set; }

    public string? DisplayName { get; set; }

    /// <summary>The share of present values that matched, 0-1.</summary>
    public double HitRate { get; set; }

    /// <summary>Three of the account's OWN values. Wire name is "samples".</summary>
    public List<string>? Samples { get; set; }

    /// <summary>True when the values are personal data and the samples above are masked.</summary>
    public bool SamplesMasked { get; set; }

    public long Profiled { get; set; }
}

/// <summary>A field that was profiled and produced no rule, and why.</summary>
public sealed class SkippedFieldResponse
{
    public string Field { get; set; } = "";

    /// <summary>
    /// The distinction that matters is between "we could not tell what this is" and "we could tell, and decided
    /// not to act" — the first is a gap in the catalogue, the second a judgement you may want to override.
    /// </summary>
    public string Reason { get; set; } = "";
}

/// <summary>What an inference run did.</summary>
public sealed class InferQueryRulesResponse
{
    public int ProfiledFields { get; set; }

    public List<QueryRuleResponse>? Created { get; set; }

    /// <summary>
    /// Reported rather than silently omitted: a postcode column that got no rule needs to say which kind of
    /// nothing happened to it.
    /// </summary>
    public List<SkippedFieldResponse>? Skipped { get; set; }
}

/// <summary>
/// What a query rule has actually been doing over a window of real traffic — the evidence a shadow rule is
/// promoted on.
/// <para>
/// There is deliberately no "results would drop from 340 to 4". The second number is a counterfactual: the
/// search was never run with the constraint, and running it would double the cost of every search carrying a
/// shadow rule.
/// </para>
/// </summary>
public sealed class QueryRuleMetricsResponse
{
    public string Rule { get; set; } = "";

    /// <summary>Enabled, Shadow or Disabled. Shadow means these numbers describe what WOULD have happened.</summary>
    public string State { get; set; } = "";

    /// <summary>Inclusive UTC window, yyyy-MM-dd. Wire names are "from" and "to".</summary>
    public string From { get; set; } = "";

    public string To { get; set; } = "";

    /// <summary>Searches of the list in the window, whether or not this rule fired. The denominator.</summary>
    public long Searches { get; set; }

    public long Fired { get; set; }

    /// <summary>0-1. "Would have fired on 6.2% of searches."</summary>
    public double FireRate { get; set; }

    /// <summary>
    /// Firings where the field does not hold the matched value — the rate at which switching this rule on
    /// would turn a working search into an empty one. The number that decides it.
    /// </summary>
    public long VerificationFailed { get; set; }

    public double VerificationFailureRate { get; set; }

    /// <summary>Median results returned by the searches it fired on, as they ran.</summary>
    public long MedianResults { get; set; }

    public double ZeroResultRate { get; set; }

    /// <summary>
    /// False when there have been too few firings for any of this to be evidence. Read this before the rates:
    /// a percentage from four searches looks exactly as convincing as one from four thousand.
    /// </summary>
    public bool Conclusive { get; set; }

    public int MinimumFirings { get; set; }
}

/// <summary>A format people searched for that produced no rule, and why.</summary>
public sealed class SkippedShapeResponse
{
    /// <summary>The character-class skeleton the searches were clustered by — "AAAA-0000-A". Diagnostic.</summary>
    public string Shape { get; set; } = "";

    /// <summary>One value that was really typed, so the shape means something to a human.</summary>
    public string? Example { get; set; }

    public int Searches { get; set; }

    public string Reason { get; set; } = "";
}

/// <summary>
/// What a run over the query log did. Everything it creates lands in SHADOW: what people type is a noisier
/// signal than what a list holds, so a log-inferred rule changes nothing until its measured evidence persuades
/// somebody to switch it on.
/// </summary>
public sealed class InferQueryRulesFromSearchesResponse
{
    /// <summary>Searches in the window. The denominator behind everything below.</summary>
    public int SearchesRead { get; set; }

    public string? From { get; set; }

    public string? To { get; set; }

    public List<QueryRuleResponse>? Created { get; set; }

    /// <summary>
    /// Formats seen and not acted on. "Searched eleven times, too few to go on yet" tells you to come back next
    /// month; an empty answer tells you the feature does not work.
    /// </summary>
    public List<SkippedShapeResponse>? Skipped { get; set; }
}

// ─── Requests ────────────────────────────────────────────────────────────────

/// <summary>
/// Everything except the name and the field is optional. Pick a shipped rule type and it supplies the match
/// mode, the action and the stance — demanding four more answers to create a working rule would be the
/// opposite of the point.
/// </summary>
public sealed class CreateQueryRuleRequest
{
    /// <summary>List-unique name. Letters, digits and hyphens.</summary>
    public string Name { get; set; } = "";

    /// <summary>The field a match constrains. Must be a facet on the list.</summary>
    public string TargetField { get; set; } = "";

    /// <summary>
    /// One of the shipped rule types — "uk-postcode", "isbn13", "iban". List them with
    /// <see cref="QueryRuleService.TemplatesAsync"/>. Supply exactly one of this,
    /// <see cref="Pattern"/> or <see cref="ValueSet"/>.
    /// </summary>
    public string? Recognizer { get; set; }

    /// <summary>
    /// A regex for a format the catalogue does not know — your own part numbers, internal codes. Validated when
    /// this request is handled, so a bad pattern fails here with a message rather than in the query path.
    /// <para>
    /// This is the developer and agent path. The console's equivalent is to describe the format and have a
    /// model draft the pattern, which the operator reviews against their own values before it is created.
    /// </para>
    /// </summary>
    public string? Pattern { get; set; }

    /// <summary>
    /// Use the field's own distinct values as the recognizer. No shape at all, so the rule is always
    /// evidence-only: it acts on a token when that token really is one of the field's values, never otherwise.
    /// </summary>
    public bool ValueSet { get; set; }

    /// <summary>WholeQuery, Token or TokenSpan. Defaults from the rule type.</summary>
    public string? MatchMode { get; set; }

    /// <summary>Filter, ExactLookup or Boost. Defaults from the rule type — which is where the useful answer is.</summary>
    public string? Action { get; set; }

    /// <summary>Passive, Balanced or Aggressive. Defaults from the rule type.</summary>
    public string? Stance { get; set; }

    /// <summary>
    /// Enabled, Shadow or Disabled. Defaults to Enabled for a hand-written rule. Send Shadow to try a rule
    /// against real traffic without changing any search.
    /// </summary>
    public string? State { get; set; }

    /// <summary>Remove the matched text from what the search sees. Defaults to true.</summary>
    public bool? ConsumeMatch { get; set; }

    public int? Order { get; set; }
}

/// <summary>
/// An edit to what the rule RECOGNISES, which advances its version. Deliberately carries no stance and no
/// state: those have their own calls, because a combined edit would quietly discard the shadow evidence you
/// are deciding on.
/// </summary>
public sealed class EditQueryRuleRequest
{
    public string TargetField { get; set; } = "";

    public string? Recognizer { get; set; }

    public string? Pattern { get; set; }

    public bool ValueSet { get; set; }

    public string? MatchMode { get; set; }

    public string? Action { get; set; }

    public bool? ConsumeMatch { get; set; }
}

public sealed class SetQueryRuleStateRequest
{
    /// <summary>Enabled, Shadow or Disabled.</summary>
    public string State { get; set; } = "";
}

public sealed class SetQueryRuleStanceRequest
{
    /// <summary>Passive, Balanced or Aggressive. Turning it up can only add constraints.</summary>
    public string Stance { get; set; } = "";
}

/// <summary>
/// The whole ordering, not a move. Two callers reordering at once can then only overwrite each other
/// wholesale, rather than interleaving into an order neither of them chose.
/// </summary>
public sealed class ReorderQueryRulesRequest
{
    /// <summary>Every rule on the list, exactly once, in the order they should run.</summary>
    public List<string>? Names { get; set; }
}

public sealed class TestQueryInterpretationRequest
{
    /// <summary>The query to interpret. Nothing is searched and nothing is stored.</summary>
    public string? Query { get; set; }
}

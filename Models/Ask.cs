using System.Collections.Generic;

namespace SearchStack.PublicApi;

/// <summary>
/// What to ask, and how much of it to ground the answer in. Everything that costs money is clamped
/// server-side, so this is the whole of what a caller controls.
/// </summary>
public sealed class AskOptions
{
    /// <summary>The question, in plain language. 1 to 1000 characters.</summary>
    public string? Question { get; set; }

    /// <summary>
    /// How many records to retrieve and answer from. Defaults to 8 and is clamped to 20 — more records cost
    /// linearly and can dilute an answer as easily as they improve it.
    /// </summary>
    public int? Size { get; set; }

    /// <summary>Narrows the records searched, exactly as on search.</summary>
    public string? Filter { get; set; }

    /// <summary>Only answer from records within radius — <c>latitude,longitude,distance in km</c>.</summary>
    public string? Radius { get; set; }

    /// <summary>
    /// The Judge whose model and provider credential answers — and pays. Optional when the account has
    /// exactly one; when it has several the error names them rather than picking a bill to spend.
    /// </summary>
    public string? Judge { get; set; }

    /// <summary>
    /// Extra direction for the answer's shape or tone. Applied only where it does not conflict with the
    /// grounding rules, which always win.
    /// </summary>
    public string? Instructions { get; set; }
}

/// <summary>
/// A record the answer cited. Every value is copied from the retrieved record rather than from the answer,
/// so a citation can never point at something that was not retrieved.
/// </summary>
public sealed class AskCitation
{
    /// <summary>The <c>[^n]</c> marker this resolves, matching the record's position in the retrieved set.</summary>
    public int Marker { get; set; }

    /// <summary>Id of the cited Search Result — fetch it to see the whole record.</summary>
    public string Id { get; set; } = "";

    /// <summary>Name of the cited Search Result.</summary>
    public string Name { get; set; } = "";

    /// <summary>The List it came from. Worth reading when asking a Group.</summary>
    public string ListName { get; set; } = "";

    /// <summary>The record's own <c>url</c>/<c>link</c> field, when it has one. A record is not a web page, so this is often null.</summary>
    public string? Url { get; set; }
}

/// <summary>
/// The result of an Ask. Returned with HTTP 200 whether or not the question was answered: a refusal that
/// still lists the records that matched is useful, and a refusal over an empty body reads as a fault.
/// </summary>
public sealed class AskResponse
{
    /// <summary>True when the records answered the question and at least one citation resolved.</summary>
    public bool Answered { get; set; }

    /// <summary>The answer, with a <c>[^n]</c> marker after each claim. When <see cref="Answered"/> is false, the refusal in the model's own words.</summary>
    public string Answer { get; set; } = "";

    /// <summary>
    /// Why there is no answer: <c>no_results</c> (nothing matched, so no model was called),
    /// <c>no_grounding</c> (records matched but nothing in them answers) or <c>blocked</c> (the provider
    /// refused). Null when <see cref="Answered"/> is true.
    /// </summary>
    public string? Reason { get; set; }

    /// <summary>The records the answer cited, in marker order.</summary>
    public List<AskCitation> Citations { get; set; } = new List<AskCitation>();

    /// <summary>The records that were retrieved and offered to the model. Always present, refusal included.</summary>
    public List<SearchHit> Results { get; set; } = new List<SearchHit>();

    public int Count { get; set; }

    public int TotalCount { get; set; }

    /// <summary>The id of the search behind this answer. Pass it to the click endpoints exactly as on search.</summary>
    public string? QueryId { get; set; }

    /// <summary>The model that answered, from the Judge whose credential paid for it.</summary>
    public string Model { get; set; } = "";
}

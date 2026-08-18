using System.Text.Json.Serialization;

namespace SearchStack.PublicApi;

/// <summary>
/// RFC 7807 problem details returned by the API for any non-success status.
/// Network and JSON errors are surfaced locally as a <see cref="Problem"/> with
/// <see cref="Status"/> 500.
/// </summary>
public sealed class Problem
{
    /// <summary>A URI reference identifying the problem type.</summary>
    public string Type { get; set; } = "";

    /// <summary>A short, human-readable summary of the problem type.</summary>
    public string Title { get; set; } = "";

    /// <summary>The HTTP status code generated for this occurrence of the problem.</summary>
    public int Status { get; set; }

    /// <summary>A URI reference identifying this specific occurrence of the problem.</summary>
    public string Instance { get; set; } = "";

    /// <summary>A human-readable explanation specific to this occurrence of the problem.</summary>
    public string Detail { get; set; } = "";

    /// <summary>
    /// A stable Search Stack error code, when the API supplies one. Branch on this rather than on
    /// <see cref="Detail"/>: the wording is prose and gets improved, the code does not change.
    /// <c>null</c> when the failure carries no code — which is not the same as code 0.
    /// </summary>
    /// <remarks>
    /// Useful values on an import: <c>35</c> nothing in the file names a record (add a name column, or a
    /// gate that composes one), <c>31</c> the file is over the import ceiling, <c>33</c> the file is
    /// malformed, <c>36</c> too large and not NDJSON, <c>37</c> importing into this list is stopped,
    /// <c>22</c> the subscription's record limit is reached. All of these mean the same request will fail
    /// identically until something changes, so a client should stop retrying rather than back off.
    /// </remarks>
    [JsonPropertyName("code")]
    public int? Code { get; set; }
}

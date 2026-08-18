namespace SearchStack.PublicApi;

/// <summary>
/// Options for browsing (listing) the Search Results in a List. Distinct from a ranked/vector search
/// (<see cref="SearchOptions"/>): this is a filtered, paged read of stored records. All members are
/// optional and omitted from the wire when null.
/// </summary>
public sealed class SearchResultsListOptions
{
    /// <summary>Maximum number of results to return.</summary>
    public int? Size { get; set; }

    /// <summary>Number of results to skip (paging).</summary>
    public int? Skip { get; set; }

    /// <summary>OData-style filter expression.</summary>
    public string? Filter { get; set; }

    /// <summary>Free-text query.</summary>
    public string? Query { get; set; }

    /// <summary>Geo radius filter: "latitude,longitude,distance in km".</summary>
    public string? Radius { get; set; }

    /// <summary>Restrict to active (true) or inactive (false) records.</summary>
    public bool? Active { get; set; }

    /// <summary>Include stored vectors on each result.</summary>
    public bool? Vectors { get; set; }

    /// <summary>Field to order by.</summary>
    public string? OrderBy { get; set; }
}

/// <summary>Import a JSON/CSV file from a customer-controlled URL into a List.</summary>
public sealed class ImportUploadRequest
{
    /// <summary>A name for the imported file (used for the staged copy).</summary>
    public string FileName { get; set; } = "";
    /// <summary>The source URL to fetch the file from.</summary>
    public string Link { get; set; } = "";
    /// <summary>Create any missing fields from the file's columns/keys.</summary>
    public bool CreateFields { get; set; }
    /// <summary>Column/key to use as each record's stable name.</summary>
    public string? NameField { get; set; }
    /// <summary>Array-valued column/key to explode into one record per element.</summary>
    public string? ExplodeField { get; set; }
}

/// <summary>Import a file already staged in one of the Account's media stores into a List.</summary>
public sealed class ImportFromMediaStoreRequest
{
    public string StoreName { get; set; } = "";
    public string FilePath { get; set; } = "";
    public bool CreateFields { get; set; }
    public string? NameField { get; set; }
    public string? ExplodeField { get; set; }
    /// <summary>Save the (store, file, options) binding and re-import automatically whenever the file changes.</summary>
    public bool KeepInSync { get; set; }
}

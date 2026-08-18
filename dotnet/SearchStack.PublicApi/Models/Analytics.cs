using System.Collections.Generic;

namespace SearchStack.PublicApi;

public sealed class AnalyticsTermCountResponse
{
    public string Term { get; set; } = "";
    public int Count { get; set; }
}

public sealed class AnalyticsDailyPointResponse
{
    /// <summary>UTC date, <c>yyyy-MM-dd</c>.</summary>
    public string Date { get; set; } = "";
    public int Searches { get; set; }
    public int ZeroResultSearches { get; set; }
    public int Clicks { get; set; }
}

public sealed class AnalyticsReportResponse
{
    public string Account { get; set; } = "";
    public string Scope { get; set; } = "";
    public string Target { get; set; } = "";
    /// <summary>UTC date, <c>yyyy-MM-dd</c>.</summary>
    public string From { get; set; } = "";
    /// <summary>UTC date, <c>yyyy-MM-dd</c>.</summary>
    public string To { get; set; } = "";
    public int TotalSearches { get; set; }
    public int ZeroResultSearches { get; set; }
    public int TotalClicks { get; set; }
    public double ClickThroughRate { get; set; }
    public List<AnalyticsTermCountResponse> TopSearches { get; set; } = new List<AnalyticsTermCountResponse>();
    public List<AnalyticsTermCountResponse> TopZeroResultSearches { get; set; } = new List<AnalyticsTermCountResponse>();
    public List<AnalyticsDailyPointResponse> Daily { get; set; } = new List<AnalyticsDailyPointResponse>();
    public int RerankedSearches { get; set; }
    public double RerankerTopChangedRate { get; set; }
    public double RerankerMeanDisplacement { get; set; }
    public double RerankerClickLift { get; set; }
    public int RerankerLiftSampleSize { get; set; }
}

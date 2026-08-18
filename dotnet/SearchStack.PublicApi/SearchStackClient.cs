using System;
using System.Net.Http;

namespace SearchStack.PublicApi;

/// <summary>Options for constructing a <see cref="SearchStackClient"/>.</summary>
public sealed class SearchStackClientOptions
{
    /// <summary>API key, sent as the <c>X-API-Key</c> header.</summary>
    public string? ApiKey { get; set; }

    /// <summary>JWT access token, sent as <c>Authorization: Bearer &lt;token&gt;</c>.</summary>
    public string? AccessToken { get; set; }

    /// <summary>Base URL of the API. Defaults to the production endpoint.</summary>
    public string? BaseUrl { get; set; }

    /// <summary>
    /// Optional <see cref="HttpClient"/> to use for requests. When null, the client
    /// creates and owns one. Supply your own to control handlers, pooling or timeouts
    /// (e.g. from <c>IHttpClientFactory</c>).
    /// </summary>
    public HttpClient? HttpClient { get; set; }
}

/// <summary>
/// Typed, <see cref="HttpClient"/>-based client for the Search Stack public API.
/// Authenticate with either an API key or an access token. No method throws on an
/// HTTP, network or JSON error: each resolves to a <see cref="Response"/> that is
/// either a success carrying the typed payload or a <see cref="Problem"/>.
/// </summary>
/// <example>
/// <code>
/// var client = new SearchStackClient(new SearchStackClientOptions { ApiKey = "sk_live_..." });
/// var result = await client.Search.SearchListAsync("acme", "products", 1, new SearchOptions { Query = "boots" });
/// if (result.IsSuccess) Console.WriteLine(result.ToSuccess().Results.Count);
/// else Console.WriteLine(result.ToProblem().Detail);
/// </code>
/// </example>
public sealed class SearchStackClient : IDisposable
{
    private const string DefaultBaseUrl = "https://api.searchstack.dev/";

    private readonly Transport _transport;
    private readonly HttpClient? _ownedHttpClient;

    /// <summary>Account read operations.</summary>
    public AccountService Accounts { get; }
    /// <summary>List create / read / edit / delete operations.</summary>
    public ListService Lists { get; }
    /// <summary>Group create / delete operations.</summary>
    public GroupService Groups { get; }
    /// <summary>Facet create / rename / remove operations.</summary>
    public FacetService Facets { get; }
    /// <summary>Resource create / rename / remove operations.</summary>
    public ResourceService Resources { get; }
    /// <summary>Searchable field create / rename / remove operations.</summary>
    public SearchableFieldService Searchables { get; }
    /// <summary>Contributor add / remove operations.</summary>
    public ContributorService Contributors { get; }
    /// <summary>Coordinates field add / remove operations.</summary>
    public CoordinatesService Coordinates { get; }
    /// <summary>Media store operations.</summary>
    public MediaStoreService MediaStores { get; }
    /// <summary>Reading the media a record points at, by its store path.</summary>
    public MediaService Media { get; }
    /// <summary>Search result write operations.</summary>
    public SearchResultService SearchResults { get; }
    /// <summary>Search / query operations.</summary>
    public SearchService Search { get; }
    /// <summary>Typeahead suggestion operations.</summary>
    public SuggestService Suggest { get; }
    /// <summary>Ask: a grounded, cited answer over your own records. Needs the <c>ask:run</c> permission, and spends money at your own model provider.</summary>
    public AskService Ask { get; }
    /// <summary>Analytics report operations.</summary>
    public AnalyticsService Analytics { get; }
    /// <summary>Eval set operations.</summary>
    public EvalService Evals { get; }
    /// <summary>Judge operations.</summary>
    public JudgeService Judges { get; }
    /// <summary>API-key operations (read-only key minting).</summary>
    public ApiKeyService ApiKeys { get; }
    /// <summary>Webhook subscription management.</summary>
    public WebhookService Webhooks { get; }
    /// <summary>Starting a subscription: the plan/provider/region catalog, checkout, free BYO, admin.</summary>
    public SubscriptionService Subscriptions { get; }
    /// <summary>Feed operations (list, read, sync-now, retune cadence / web scope).</summary>
    public FeedService Feeds { get; }
    /// <summary>Watch operations (standing queries that alert on new/changed records).</summary>
    public WatchService Watches { get; }
    /// <summary>Gate operations (what a record has to get past to be admitted to a List).</summary>
    public GateService Gates { get; }
    /// <summary>Query rule operations (how a raw query is read before it is executed).</summary>
    public QueryRuleService QueryRules { get; }
    /// <summary>Anonymous API discovery operations.</summary>
    public DiscoveryService Discovery { get; }

    /// <summary>Creates a client from the given options.</summary>
    public SearchStackClient(SearchStackClientOptions options)
    {
        if (options is null) throw new ArgumentNullException(nameof(options));

        var credentials = new Credentials { ApiKey = options.ApiKey, AccessToken = options.AccessToken };

        HttpClient http;
        if (options.HttpClient is not null)
        {
            http = options.HttpClient;
        }
        else
        {
            http = new HttpClient();
            _ownedHttpClient = http;
        }

        _transport = new Transport(http, options.BaseUrl ?? DefaultBaseUrl, credentials);

        Accounts = new AccountService(_transport);
        Lists = new ListService(_transport);
        Groups = new GroupService(_transport);
        Facets = new FacetService(_transport);
        Resources = new ResourceService(_transport);
        Searchables = new SearchableFieldService(_transport);
        Contributors = new ContributorService(_transport);
        Coordinates = new CoordinatesService(_transport);
        MediaStores = new MediaStoreService(_transport);
        Media = new MediaService(_transport);
        SearchResults = new SearchResultService(_transport);
        Search = new SearchService(_transport);
        Suggest = new SuggestService(_transport);
        Ask = new AskService(_transport);
        Analytics = new AnalyticsService(_transport);
        Evals = new EvalService(_transport);
        Judges = new JudgeService(_transport);
        ApiKeys = new ApiKeyService(_transport);
        Webhooks = new WebhookService(_transport);
        Subscriptions = new SubscriptionService(_transport);
        Feeds = new FeedService(_transport);
        Watches = new WatchService(_transport);
        Gates = new GateService(_transport);
        QueryRules = new QueryRuleService(_transport);
        Discovery = new DiscoveryService(_transport);
    }

    /// <summary>Convenience constructor for API-key authentication.</summary>
    public SearchStackClient(string apiKey, string? baseUrl = null)
        : this(new SearchStackClientOptions { ApiKey = apiKey, BaseUrl = baseUrl })
    {
    }

    /// <summary>Replaces the access token used for subsequent requests (e.g. after a refresh).</summary>
    public void SetAccessToken(string? accessToken) => _transport.SetAccessToken(accessToken);

    /// <summary>Replaces the API key used for subsequent requests.</summary>
    public void SetApiKey(string? apiKey) => _transport.SetApiKey(apiKey);

    /// <summary>Disposes the underlying <see cref="HttpClient"/> if this client created it.</summary>
    public void Dispose() => _ownedHttpClient?.Dispose();
}

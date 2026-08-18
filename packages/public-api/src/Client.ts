import Fetch, { Credentials } from "./Fetch.js";

import AccountService from "./AccountService.js";
import ListService from "./ListService.js";
import GroupService from "./GroupService.js";
import FacetService from "./FacetService.js";
import ResourceService from "./ResourceService.js";
import SearchableFieldService from "./SearchableFieldService.js";
import ContributorService from "./ContributorService.js";
import CoordinatesService from "./CoordinatesService.js";
import MediaStoreService from "./MediaStoreService.js";
import MediaService from "./MediaService.js";
import SearchResultService from "./SearchResultService.js";
import SearchService from "./SearchService.js";
import SuggestService from "./SuggestService.js";
import AskService from "./AskService.js";
import AnalyticsService from "./AnalyticsService.js";
import EvalService from "./EvalService.js";
import JudgeService from "./JudgeService.js";
import ApiKeyService from "./ApiKeyService.js";
import WebhookService from "./WebhookService.js";
import SubscriptionService from "./SubscriptionService.js";
import FeedService from "./FeedService.js";
import WatchService from "./WatchService.js";
import GateService from "./GateService.js";
import QueryRuleService from "./QueryRuleService.js";
import DiscoveryService from "./DiscoveryService.js";

const DEFAULT_BASE_URL = "https://api.searchstack.dev/";

/** Options for constructing a {@link SearchStackClient}. */
export type SearchStackClientOptions = Credentials & {
  /** Base URL of the API. Defaults to the production endpoint. */
  baseUrl?: string;
};

/**
 * Typed, fetch-based client for the Search Stack public API.
 *
 * Authenticate with either an API key or an access token:
 *
 * ```ts
 * const client = new SearchStackClient({ apiKey: "sk_..." });
 * const result = await client.Search.searchList("acme", "products", 1, { query: "boots" });
 * if (result.isSuccess) console.log(result.toSuccess().results);
 * else console.error(result.toProblem().detail);
 * ```
 */
export class SearchStackClient {
  private readonly fetch: Fetch;

  public readonly Accounts: AccountService;
  public readonly Lists: ListService;
  public readonly Groups: GroupService;
  public readonly Facets: FacetService;
  public readonly Resources: ResourceService;
  public readonly Searchables: SearchableFieldService;
  public readonly Contributors: ContributorService;
  public readonly Coordinates: CoordinatesService;
  public readonly MediaStores: MediaStoreService;
  /** Reading the media a record points at, by its store path. */
  public readonly Media: MediaService;
  public readonly SearchResults: SearchResultService;
  public readonly Search: SearchService;
  public readonly Suggest: SuggestService;
  /** Ask: a grounded, cited answer over your own records. Needs the `ask:run` permission, and spends money at your own model provider. */
  public readonly Ask: AskService;
  public readonly Analytics: AnalyticsService;
  public readonly Evals: EvalService;
  public readonly Judges: JudgeService;
  public readonly ApiKeys: ApiKeyService;
  public readonly Webhooks: WebhookService;
  public readonly Feeds: FeedService;
  public readonly Watches: WatchService;
  public readonly Gates: GateService;
  /** Query rule operations (how a raw query is read before it is executed). */
  public readonly QueryRules: QueryRuleService;
  public readonly Discovery: DiscoveryService;

  constructor(options: SearchStackClientOptions) {
    const { baseUrl, ...credentials } = options;
    this.fetch = new Fetch(baseUrl ?? DEFAULT_BASE_URL, credentials);

    this.Accounts = new AccountService(this.fetch);
    this.Lists = new ListService(this.fetch);
    this.Groups = new GroupService(this.fetch);
    this.Facets = new FacetService(this.fetch);
    this.Resources = new ResourceService(this.fetch);
    this.Searchables = new SearchableFieldService(this.fetch);
    this.Contributors = new ContributorService(this.fetch);
    this.Coordinates = new CoordinatesService(this.fetch);
    this.MediaStores = new MediaStoreService(this.fetch);
    this.Media = new MediaService(this.fetch);
    this.SearchResults = new SearchResultService(this.fetch);
    this.Search = new SearchService(this.fetch);
    this.Suggest = new SuggestService(this.fetch);
    this.Ask = new AskService(this.fetch);
    this.Analytics = new AnalyticsService(this.fetch);
    this.Evals = new EvalService(this.fetch);
    this.Judges = new JudgeService(this.fetch);
    this.ApiKeys = new ApiKeyService(this.fetch);
    this.Webhooks = new WebhookService(this.fetch);
    this.Feeds = new FeedService(this.fetch);
    this.Watches = new WatchService(this.fetch);
    this.Gates = new GateService(this.fetch);
    this.QueryRules = new QueryRuleService(this.fetch);
    this.Discovery = new DiscoveryService(this.fetch);
  }

  /** Replace the access token used for subsequent requests (e.g. after a refresh). */
  setAccessToken(accessToken: string | undefined): void {
    this.fetch.setAccessToken(accessToken);
  }

  /** Replace the API key used for subsequent requests. */
  setApiKey(apiKey: string | undefined): void {
    this.fetch.setApiKey(apiKey);
  }
}

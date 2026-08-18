// Type definitions for the Search Stack public API.
//
// Field names mirror the JSON sent on the wire (the API serializes with a
// snake_case naming policy), so these types map 1:1 to request and response
// bodies without any client-side renaming.

// ─── Foundation ───────────────────────────────────────────────────────────────

/** RFC 7807 problem details returned by the API for any non-success status. */
export type Problem = {
  type: string;
  title: string;
  status: number;
  instance: string;
  detail: string;
  /**
   * A stable Search Stack error code, when the API supplies one. Branch on this rather than on `detail`:
   * the wording is prose and gets improved, the code does not change. Absent when the failure carries no
   * code — which is not the same as code 0.
   *
   * Useful values on an import: `35` nothing in the file names a record (add a name column, or a gate that
   * composes one), `31` the file is over the import ceiling, `33` the file is malformed, `36` too large and
   * not NDJSON, `37` importing into this list is stopped, `22` the subscription's record limit is reached.
   * All of these mean the same request will fail identically until something changes, so stop retrying
   * rather than back off.
   */
  code?: number;
};

export type GeoPoint = {
  lat: number;
  lon: number;
};

/** A named facet / searchable / resource field, used both when writing one and when reading one back. */
export type NameAndValue = {
  name: string;
  /**
   * The field's value. **Writing and reading are not symmetric, deliberately:**
   *
   * When WRITING, pass whatever is natural — a scalar for a field holding one value, an array for a facet
   * whose cardinality is `"Many"`, e.g. `{ name: "cast", value: ["Anne Hathaway", "Meryl Streep"] }`. Each
   * value then becomes independently filterable. Passing an array to a `"Single"` facet is refused rather
   * than quietly reduced to its first element.
   *
   * When READING a search result, a FACET's value is **always an array** — `["red"]`, `[2006]`, `[]` when
   * the record carries no value — whatever its cardinality and however many values it holds. The shape
   * follows the schema, not the row, so one facet cannot come back as a scalar on one result and an array
   * on the next. Read the facet's `cardinality` to know whether `[0]` is the whole story. Searchable
   * fields and resources are single-valued text and stay scalar.
   */
  value: unknown;
};

/**
 * Request body for minting a read-only API key. Only read/view permissions are honoured server-side;
 * any others are dropped, and the minted key can never itself mint another key.
 */
export type CreateReadOnlyApiKeyRequest = {
  api_key_name: string;
  account_name: string;
  /** Read permissions to grant, e.g. ["search-result:read", "list:read"]. At least one is required. */
  permissions: string[];
  /** Optional absolute expiry (ISO-8601). Omit for a non-expiring key. */
  expires_utc?: string;
  /** Optional scope: "account" (default), "list" or "group". */
  scope?: string;
  /** For list/group scope, the name of the list or group the key is confined to. */
  scope_target?: string;
  /** Optional routing region override (account-scoped keys only), e.g. "uk-south". */
  region?: string;
};

/** The minted key's usable value and version. */
export type ApiKeyValueResponse = {
  value: string;
  version: string;
};

/**
 * Options for browsing (listing) the Search Results in a List. Distinct from a ranked/vector search:
 * this is a filtered, paged read of stored records. All members optional.
 */
export type SearchResultsListOptions = {
  size?: number;
  skip?: number;
  filter?: string;
  query?: string;
  /** Geo radius filter: "latitude,longitude,distance in km". */
  radius?: string;
  active?: boolean;
  /** Include stored vectors on each result. */
  vectors?: boolean;
  order_by?: string;
};

/** Import a JSON/CSV file from a customer-controlled URL into a List. */
export type ImportUploadRequest = {
  file_name: string;
  /** The source URL to fetch the file from. */
  link: string;
  create_fields: boolean;
  name_field?: string;
  explode_field?: string;
};

/** Import a file already staged in one of the Account's media stores into a List. */
export type ImportFromMediaStoreRequest = {
  store_name: string;
  file_path: string;
  create_fields?: boolean;
  name_field?: string;
  explode_field?: string;
  /** Save the binding and re-import automatically whenever the file changes. */
  keep_in_sync?: boolean;
};

// ─── Webhooks ───────────────────────────────────────────────────────────────────

export type CreateWebhookSubscriptionRequest = {
  account_name: string;
  /** HTTPS URL the webhook will POST to. */
  url: string;
  /** Event types this subscription should receive. */
  events: string[];
};

export type EditWebhookSubscriptionRequest = {
  url: string;
  events: string[];
};

// WebhookSubscriptionResponse (no secret) is already defined below (a member of AccountResponse) —
// reused here rather than redefined.

/** A webhook subscription including its signing secret (returned only at create/rotate). */
export type WebhookSubscriptionWithSecretResponse = WebhookSubscriptionResponse & {
  secret: string;
};

/** A single subscribable event type. */
export type WebhookEventOptionResponse = {
  value: string;
  label: string;
};

/** A display group of subscribable event types. */
export type WebhookEventGroupResponse = {
  label: string;
  options: WebhookEventOptionResponse[];
};

// ─── Feeds ──────────────────────────────────────────────────────────────────────

/** A feed as the data plane sees it — credential-free. */
export type FeedResponse = {
  account_name: string;
  feed_name: string;
  provider: string;
  store_name: string;
  file_path: string;
  sync_interval_minutes: number;
  /** When the producer last polled the source (epoch millis); null until the first poll. */
  last_checked_utc?: number;
  /** True once the producer has staged at least once. */
  has_synced: boolean;
  /**
   * True while a sync of this feed is queued or running. Calling sync-now on a feed already syncing is
   * refused, so check this before asking for one — and before reading `last_checked_utc` as settled,
   * since a run in flight is about to move it.
   */
  is_syncing?: boolean;
  created_utc: number;
};

/** A web feed's crawl scope (no secret). */
export type WebFeedConfigResponse = {
  url_pattern: string;
  url_excludes: string[];
  url_seeds: string[];
};

/** A Shopify feed's non-secret config: the shop domain only. */
export type ShopifyFeedConfigResponse = {
  shop_domain: string;
};

/** An API feed's non-secret config: the endpoint URL and, if authenticated, the header name only. */
export type ApiFeedConfigResponse = {
  url: string;
  auth_header: string;
};

/**
 * An email feed's editable settings. The ingest address is not here — it is a write credential, offered
 * once on the feed summary — and neither is the target list, which is fixed at connect time.
 */
export type EmailFeedConfigResponse = {
  allowed_sender_domains: string[];
  /**
   * False means the address still resolves and every message is refused: the flow stops without anything
   * being deleted, and turning it back on needs no new forwarding rule.
   */
  enabled: boolean;
  store_attachments: boolean;
  /**
   * Whether an unverified feed's incoming mail is also sent on to the account owner's mailbox, so a
   * provider's confirmation can be completed there. On unless the customer switched it off.
   */
  forward_confirmations: boolean;
  /**
   * True while the feed is collecting verification challenges and importing NOTHING. Providers will not
   * forward to a new address until someone proves they control the mailbox, so a feed sits here until that
   * is done. Read the confirmation code with `listVerificationChallenges()`, then call `verify()` once the
   * customer has completed their provider's step.
   *
   * Check this before concluding a feed is idle: "connected but importing nothing" and "connected and no
   * mail has arrived" look identical without it.
   */
  pending_verification: boolean;
  /** When verification happened, and who performed it. Absent while pending. */
  verified_utc?: string;
  verified_by?: string;
};

/**
 * A message that arrived at an ingest address before the feed was verified — normally the provider's
 * confirmation mail.
 *
 * TREAT EVERY FIELD AS UNTRUSTED. An unverified feed accepts mail from anyone, because the provider's
 * confirmation comes from the provider's domain and not the customer's, so sender pinning cannot apply yet.
 * Check `from_address` before acting on anything here, and never present a `urls` entry to a person as a
 * one-click confirmation — show the sender and the full link and let them decide.
 */
export type EmailVerificationChallengeResponse = {
  challenge_id: string;
  received_utc: string;
  /** Codes expire at the provider, so the age decides whether to use this one or ask for another. */
  expires_utc: string;
  from_address?: string;
  subject?: string;
  /** Ranked best-first. More than one is offered because the ranking can be wrong. */
  codes: string[];
  urls: string[];
  /** The message text, bounded — so a code the extractor missed is still recoverable by a human. */
  body_excerpt: string;
};

/** A feed with its current non-secret configuration. Exactly one config block matches the provider. */
export type FeedDetailResponse = {
  feed: FeedResponse;
  web_config?: WebFeedConfigResponse;
  shopify_config?: ShopifyFeedConfigResponse;
  api_config?: ApiFeedConfigResponse;
  email_config?: EmailFeedConfigResponse;
};

/**
 * Change an email feed's settings after it is connected. The first three fields are required — this is the
 * whole settings block sent back as a unit, so a caller that omits `enabled` cannot switch a feed off by
 * accident.
 */
export type EditEmailSettingsRequest = {
  /**
   * At least one, as at connect time: an address with no pins accepts nothing. To stop the flow, set
   * `enabled` false — that is what the switch is for, and it is reversible.
   */
  allowed_sender_domains: string[];
  enabled: boolean;
  store_attachments: boolean;
  /**
   * While the feed is unverified, send what arrives on to the account owner's mailbox so a provider's
   * confirmation can be completed there. Off changes exactly one thing — no mail is sent; the message is
   * still stored, still readable with `listVerificationChallenges()`, and the feed still imports nothing
   * until it is verified.
   *
   * The one optional field here: omitted means LEAVE UNCHANGED. It arrived after this request was already
   * published, so requiring it would reject callers written before it existed.
   */
  forward_confirmations?: boolean;
};

/** Retune a feed's sync cadence. */
export type EditFeedIntervalRequest = {
  sync_interval_minutes: number;
};

/**
 * Re-point an API feed at a different endpoint, without re-entering its auth value.
 *
 * `api_auth_value` is optional and blank means KEEP: send the URL alone and the stored value is preserved,
 * so moving an endpoint needs no credential. Send a value to rotate the key in place. Clearing
 * `api_auth_header` is how you say the endpoint is now public, and it drops the stored value with it.
 */
export type EditApiEndpointRequest = {
  api_url: string;
  api_auth_header?: string;
  api_auth_value?: string;
};

/** Re-scope a website feed. */
export type EditWebScopeRequest = {
  url_pattern: string;
  url_excludes?: string[];
  url_seeds?: string[];
};

/**
 * Move a feed's staged output into a different media store — the fix when the store it was connected to
 * is full or is the wrong one. Both ends move: the feed's staging target and any list bound to its
 * staged file.
 */
export type ChangeFeedMediaStoreRequest = {
  store_name: string;
};

/**
 * The result of moving a feed. `unrepointed_lists` is the field worth checking: a bound list that could
 * not be re-pointed imports nothing until the move is re-run.
 */
export type ChangeFeedMediaStoreResponse = {
  feed: FeedResponse;
  repointed_lists: string[];
  unrepointed_lists: string[];
};

/**
 * Connect a credential-light feed. `provider` must be "web" (a site crawl), "api" (an HTTPS endpoint),
 * "rss" (a public feed URL) or "email" (an ingest address mail is forwarded to). Secret-bearing
 * providers (Shopify, Notion) are console-plane and rejected here.
 */
export type ConnectFeedRequest = {
  feed_name: string;
  /** "web", "api", "rss" or "email". */
  provider: string;
  /** Media store to write into; omit for the platform "default" store. */
  store_name?: string;
  sync_interval_minutes?: number;
  // web:
  url_pattern?: string;
  url_excludes?: string[];
  url_seeds?: string[];
  // api:
  api_url?: string;
  api_auth_header?: string;
  api_auth_value?: string;
  // rss:
  rss_url?: string;
  // email: the sender domains the address accepts mail from. No credential — we never connect to a
  // mailbox — and the address token is issued server-side. At least one domain is required: an address
  // with none accepts nothing.
  //
  // No list: an email feed stages feeds/{feed}.ndjson like every other feed, and lists bind that file
  // afterwards, so one mail stream can feed several lists.
  allowed_sender_domains?: string[];
  // email: write attachments into the feed's media store so their CONTENT is searchable, not just their
  // file names. Off by default — attachments are most of a mailbox's bytes and they land in the
  // customer's own store. Change it afterwards with feed.editEmailSettings().
  store_attachments?: boolean;
  // email: while the feed is unverified, send whatever arrives at its address on to the account owner's
  // mailbox, so a provider's confirmation can be completed there. ON when omitted — the opposite default
  // from store_attachments, because a customer who never sees the confirmation cannot finish setup. Worth
  // turning off when the source sends no confirmation at all; not every provider does.
  forward_confirmations?: boolean;
};

/**
 * Import an email feed's history from an `.mbox` already in the account's own media store. Not an
 * upload: a mail export is measured in gigabytes, so the file goes into the store and is streamed.
 */
export type BackfillEmailFeedRequest = {
  /**
   * Which list the archive imports into. Named per call because the feed itself names no list — live
   * mail is staged to a file that any number of lists may bind — so the same archive can be imported
   * into more than one.
   */
  list_name: string;
  /** The .mbox file in the feed's media store. */
  media_name: string;
  /** Count the messages and report, importing nothing. Call this first to size the job. */
  count_only?: boolean;
};

export type BackfillEmailFeedResponse = {
  message_count: number;
  imported: number;
  /** Messages the parser could not read. One broken message in a long archive is never fatal. */
  skipped: number;
  count_only: boolean;
};

/** Preview the pages a proposed web feed scope would crawl. */
export type DiscoverWebPagesRequest = {
  url_pattern: string;
  url_excludes?: string[];
  url_seeds?: string[];
};

export type DiscoveredWebPageResponse = {
  url: string;
  title: string;
};

export type DiscoverWebPagesResponse = {
  pages: DiscoveredWebPageResponse[];
  /** True when the preview ceiling was hit (discovery continues after connect). */
  truncated: boolean;
};


// ─── Response envelope ──────────────────────────────────────────────────────────

/**
 * Discriminated result of an API call. Every service method resolves to a
 * `Response` rather than throwing, so callers branch on `isSuccess` (network and
 * JSON errors are surfaced as a `Problem` with status 500).
 */
export abstract class Response<S, F> {
  constructor(readonly isSuccess: boolean) {}
  abstract toSuccess(): S;
  abstract toProblem(): F;
}

/** Successful result carrying the deserialized payload. */
export class SuccessResponse<S> extends Response<S, Problem> {
  constructor(readonly data: S) { super(true); }
  toSuccess(): S { return this.data; }
  toProblem(): Problem { throw new Error('Response was a success'); }
}

/** Failed result carrying the parsed problem details. */
export class ProblemResponse<S> extends Response<S, Problem> {
  constructor(readonly problem: Problem) { super(false); }
  toSuccess(): S { throw new Error('Response was a problem'); }
  toProblem(): Problem { return this.problem; }
}


// ─── Search results ─────────────────────────────────────────────────────────────

/**
 * A single search result. The per-modality score fields are prefixed with `@`
 * exactly as the API emits them, and `fields` carries the result's custom data.
 */
export type SearchHit = {
  '@text_score'?: number | null;
  '@image_score'?: number | null;
  '@document_score'?: number | null;
  '@video_score'?: number | null;
  '@audio_score'?: number | null;
  name: string;
  list_name?: string | null;
  version?: number | null;
  distance?: number | null;
  location?: GeoPoint | null;
  /**
   * Freshness stamp (ISO-8601): when this record was last written/synced from its source.
   * Null/absent when the API did not report one. Search is best-effort fresh; confirm volatile
   * fields (price, stock) with verify_offer for a point-of-action guarantee.
   */
  as_of?: string | null;
  /**
   * Matched snippets, keyed by the field you asked to highlight, with matching terms wrapped in `<em>`.
   * Absent unless `highlight_fields` was set, and a field with no match is simply absent. Lexical only: a
   * vector-only or browse query matched by meaning, so there is nothing to point at and none are returned.
   */
  highlights?: Record<string, string[]> | null;
  fields: Record<string, unknown>;
};

/** One constraint the query rules lifted out of the raw query and applied to the search. */
export type ExtractedConstraint = {
  field: string;
  /** Exactly as the customer typed it — this, not `value`, is what a "Showing results in … ✕" chip shows. */
  raw_text: string;
  /** The canonical form the filter was built from: `nn13er` and `NN1 3ER` both arrive here as `NN1 3ER`. */
  value: string;
  rule: string;
  /** `Filter` (narrows the results), `ExactLookup` (pins one record above them) or `Boost`. */
  action: string;
  /** False when your own `filter` already covered this field, so the inferred constraint was dropped. */
  applied: boolean;
  superseded_by_caller_filter?: string | null;
};

/** What a rule in shadow WOULD have extracted. Never applied to the search you just got back. */
export type ShadowConstraint = {
  field: string;
  raw_text: string;
  value: string;
  rule: string;
  action: string;
  /** The rule matched the shape but the field does not hold the value — it would have returned nothing. */
  verification_failed: boolean;
};

/**
 * How the query was read before it was executed. Present only when a rule fired, so its presence is the
 * signal that the search you got is not literally the search you asked for — render it and give the customer
 * a way back. Pass `interpretation_mode: "off"` on a request to skip interpretation for that search.
 */
export type QueryInterpretation = {
  /** The query as sent. */
  query: string;
  /** What was left for text search once the constraints were lifted out. */
  text: string;
  constraints?: ExtractedConstraint[] | null;
  shadow?: ShadowConstraint[] | null;
};

export type SearchResponse = {
  results: SearchHit[];
  count: number;
  total_count: number;
  query_id?: string | null;
  interpretation?: QueryInterpretation | null;
};

/**
 * What to ask, and how much of it to ground the answer in. Everything that costs money is clamped
 * server-side, so this is the whole of what a caller controls.
 */
export type AskOptions = {
  /** The question, in plain language. 1 to 1000 characters. */
  question: string;
  /** How many records to retrieve and answer from. Defaults to 8, clamped to 20. */
  size?: number | null;
  /** Narrows the records searched, exactly as on search. */
  filter?: string | null;
  /** Only answer from records within radius - `latitude,longitude,distance in km`. */
  radius?: string | null;
  /**
   * The Judge whose model and provider credential answers - and pays. Optional when the account has exactly
   * one; when it has several the error names them rather than picking a bill to spend.
   */
  judge?: string | null;
  /**
   * Extra direction for the answer's shape or tone. Applied only where it does not conflict with the
   * grounding rules, which always win.
   */
  instructions?: string | null;
};

/**
 * A record the answer cited. Every value is copied from the retrieved record rather than from the answer,
 * so a citation can never point at something that was not retrieved.
 */
export type AskCitation = {
  /** The `[^n]` marker this resolves, matching the record's position in the retrieved set. */
  marker: number;
  /** Id of the cited Search Result - fetch it to see the whole record. */
  id: string;
  name: string;
  list_name: string;
  /** The record's own `url`/`link` field, when it has one. A record is not a web page, so this is often null. */
  url?: string | null;
};

/**
 * The result of an Ask. Returned with HTTP 200 whether or not the question was answered: a refusal that
 * still lists the records that matched is useful, and a refusal over an empty body reads as a fault.
 */
export type AskResponse = {
  /** True when the records answered the question and at least one citation resolved. */
  answered: boolean;
  /** The answer, with a `[^n]` marker after each claim. When `answered` is false, the refusal in the model's own words. */
  answer: string;
  /**
   * Why there is no answer: `no_results` (nothing matched, so no model was called), `no_grounding` (records
   * matched but nothing in them answers) or `blocked` (the provider refused). Null when `answered` is true.
   */
  reason?: "no_results" | "no_grounding" | "blocked" | null;
  citations: AskCitation[];
  /** The records retrieved and offered to the model. Always present, refusal included. */
  results: SearchHit[];
  count: number;
  total_count: number;
  /** The id of the search behind this answer. Pass it to the click endpoints exactly as on search. */
  query_id?: string | null;
  /** The model that answered, from the Judge whose credential paid for it. */
  model: string;
};

export type ExtractedDocument = {
  uri: string;
  page_count?: number | null;
  text?: string | null;
  error?: string | null;
};

export type ExtractDocumentTextResponse = {
  search_result_name: string;
  max_pages: number;
  documents: ExtractedDocument[];
};

/** A typeahead suggestion is an opaque record of the suggested fields. */
export type Suggestion = Record<string, unknown>;


// ─── Account ────────────────────────────────────────────────────────────────────

export type ListRefResponse = {
  list_name: string;
  account_name: string;
  created: number;
};

export type ModelResponse = {
  model_name: string;
  model_value: string;
  model_provider: string;
  supports_documents: boolean;
  max_text_characters: number;
  max_images: number;
  max_image_payload_bytes: number;
  max_document_pages: number;
  max_videos: number;
  max_video_payload_bytes: number;
  max_audios: number;
  max_audio_payload_bytes: number;
  created_utc: number;
};

export type RerankerDetailsResponse = {
  account_name: string;
  name: string;
  provider: string;
  provider_display_name: string;
  model: string;
  created_utc: number;
};

export type ApiKeyResponse = {
  account_name: string;
  api_key_name: string;
  created: number;
  permissions: string[];
  expires_utc?: number | null;
};

export type SubscriptionResponse = {
  subscription_name: string;
  subscription_display_name: string;
  status: string;
  expires_utc: number;
  created_utc: number;
  is_active: boolean;
  max_lists: number;
  max_results?: number | null;
  max_lists_per_group: number;
  cost_per_month: number;
  region: string;
  search_service_name: string;
  provider: string;
  provider_name: string;
  type: string;
  search_result_byte_size: number;
  search_result_count: number;
  max_size_gb?: number | null;
};

export type MediaStoreResponse = {
  account_name: string;
  store_name: string;
  provider: string;
  provider_display_name: string;
  created_utc: number;
  is_default: boolean;
};

export type CacheServiceDetailsResponse = {
  account_name: string;
  name: string;
  provider: string;
  provider_display_name: string;
  region?: string | null;
  created_utc: number;
};

export type WebhookSubscriptionResponse = {
  id: string;
  account_name: string;
  url: string;
  events: string[];
  is_active: boolean;
  is_suspended: boolean;
  created_on: number;
};

export type SearchServiceResponse = {
  search_service_name: string;
  region: string;
  provider: string;
  created: number;
  search_service_is_shared: boolean;
};

export type AccountResponse = {
  account_name: string;
  owner: string;
  image_path: string;
  created: number;
  lists: ListRefResponse[];
  models: ModelResponse[];
  rerankers: RerankerDetailsResponse[];
  country: string;
  api_keys: ApiKeyResponse[];
  subscriptions: SubscriptionResponse[];
  groups: GroupResponse[];
  github_connected: boolean;
  media_stores: MediaStoreResponse[];
  cache_services: CacheServiceDetailsResponse[];
  webhook_subscriptions: WebhookSubscriptionResponse[];
  search_services: SearchServiceResponse[];
};

export type AccountNameResponse = {
  account_name: string;
};

/**
 * Anything currently wrong with an account. Derived on every read and never stored, so an issue
 * disappears as soon as the problem does.
 */
export type AccountHealthResponse = {
  issues: AccountHealthIssue[];
  /**
   * How many checks had a source to read. Fewer than `checks_total` means something could not be
   * looked at — which is not the same answer as "nothing is wrong".
   */
  checks_run: number;
  checks_total: number;
  /**
   * How many real issues the account owner has snoozed in the console, and which are therefore missing
   * from `issues`. Read it like `checks_run`: an empty list with this above zero is not a healthy
   * account. A snooze lapses after seven days, or sooner if the issue gets worse.
   */
  dismissed?: number;
};

export type AccountHealthIssue = {
  check_id: string;
  /** "error" = the data is stale or broken now. "warning" = worth knowing, still flowing. */
  severity: "error" | "warning";
  title: string;
  detail: string;
  /** When the problem started; null for a state rather than an event. */
  since: string | null;
  target: AccountHealthTarget;
};

/** What the issue is about: a kind and a name, never a URL. */
export type AccountHealthTarget = {
  kind: "feed" | "list" | "account"
  | "media-store" | "search-service" | "cache-service" | "model" | "telemetry-sink";
  name: string;
};


// ─── Lists ────────────────────────────────────────────────────────────────────

export type FacetResponse = {
  facet_name: string;
  /** What KIND of value this field holds: "String" | "Number" | "Date" | "Boolean". */
  field_type: string;
  /**
   * How MANY values one record may hold here: "Single" | "Many". Independent of field_type, so a Number
   * field can hold several numbers. A "Many" field cannot be sorted on or range-filtered.
   */
  cardinality: string;
};

export type ResourceResponse = {
  resource_name: string;
  vectorize: boolean;
};

export type SearchableFieldResponse = {
  searchable_field_name: string;
  vectorize: boolean;
};

export type ContributorResponse = {
  contributor_name: string;
};

export type SuggestionTargetResponse = {
  target_list_name: string;
  minimum_result_count: number;
  is_active: boolean;
  minimum_characters: number;
  minimum_occurrences: number;
  lookback_days: number;
  require_click: boolean;
};

export type ListResponse = {
  account_name: string;
  list_name: string;
  created: number;
  default_search_size: number;
  default_suggest_size: number;
  search_result_count: number;
  search_result_byte_size: number;
  use_miles: boolean;
  typo_tolerance: boolean;
  default_ttl_seconds?: number | null;
  purge_inactive_after_days?: number | null;
  version: number;
  subscription_name: string;
  show_coordinates: boolean;
  suggestion_target?: SuggestionTargetResponse | null;
  model_name: string;
  media_store?: string | null;
  cache_service?: string | null;
  reranker_name?: string | null;
  facets: FacetResponse[];
  contributors: ContributorResponse[];
  searchable_fields: SearchableFieldResponse[];
  resources: ResourceResponse[];
  /** This List's synonym rules. Empty means none. Set through `lists.setSynonyms`. */
  synonym_rules: SynonymRuleResponse[];
  /** Stored rule lines that could not be shown as structured rules — 0 unless they predate the editor. */
  unreadable_synonym_lines: number;
};

/** One synonym rule as it reads back — the same shape it is written in. */
export type SynonymRuleResponse = {
  kind: "equivalent" | "rewrite";
  terms: string[];
  /** Empty for an equivalence rule, which has no sides. */
  replace_with: string[];
};

export type ListIdentityResponse = {
  list_name: string;
  version: number;
  created: number;
  account_name: string;
};

/** A restore that rolls a List forward to the content of a past version. */
export type ListRestoreResponse = {
  list: ListResponse;
  restored_from_version: number;
  new_version: number;
};

/** A clone: the source List's configuration under a new name, with none of its Search Results. */
export type ListCloneResponse = {
  list: ListResponse;
  cloned_from: string;
  query_rules_copied: number;
  /** Per-List gate bindings copied. Gate definitions are account-scoped and shared, so they are not duplicated. */
  gate_attachments_copied: number;
  /** Eval sets copied. Always 0 unless copy_eval_sets was requested. */
  eval_sets_copied: number;
};


// ─── Groups ────────────────────────────────────────────────────────────────────

export type GroupResponse = {
  account_name: string;
  group_name: string;
  subscription_name: string;
  model_name: string;
  reranker_name?: string | null;
  default_search_size: number;
  default_suggest_size: number;
  created: number;
  /** Current membership version. Search/suggest against a specific version. */
  current_version: number;
  /** True when a member list has a newer version than the one pinned here. */
  update_available: boolean;
  lists: ListIdentityResponse[];
  use_miles?: boolean | null;
};

/** A restore that rolls a Group's membership forward to a past version. */
export type GroupRestoreResponse = {
  group: GroupResponse;
  restored_from_version: number;
  /** Member lists that could not be restored (e.g. since deleted). */
  skipped_lists: ListIdentityResponse[];
};

export type GroupVersionsResponse = {
  current_version: number;
  versions: number[];
};

export type GroupVersionMembersResponse = {
  group_version: number;
  lists: ListIdentityResponse[];
};


// ─── Media ────────────────────────────────────────────────────────────────────

export type DeleteMediaResponse = {
  deleted: boolean;
};


// ─── Analytics ──────────────────────────────────────────────────────────────────

export type AnalyticsTermCountResponse = {
  term: string;
  count: number;
};

export type AnalyticsDailyPointResponse = {
  /** UTC date, `yyyy-MM-dd`. */
  date: string;
  searches: number;
  zero_result_searches: number;
  clicks: number;
};

export type AnalyticsReportResponse = {
  account: string;
  scope: string;
  target: string;
  /** UTC date, `yyyy-MM-dd`. */
  from: string;
  /** UTC date, `yyyy-MM-dd`. */
  to: string;
  total_searches: number;
  zero_result_searches: number;
  total_clicks: number;
  click_through_rate: number;
  top_searches: AnalyticsTermCountResponse[];
  top_zero_result_searches: AnalyticsTermCountResponse[];
  daily: AnalyticsDailyPointResponse[];
  reranked_searches: number;
  reranker_top_changed_rate: number;
  reranker_mean_displacement: number;
  reranker_click_lift: number;
  reranker_lift_sample_size: number;
};


// ─── Request bodies ─────────────────────────────────────────────────────────────

export type CreateSearchResultRequest = {
  account_name: string;
  list_name: string;
  search_result_name: string;
  active?: boolean;
  /**
   * Relative time-to-live in seconds; resolved to an absolute expiry. Ignored when expires_at is set.
   * 0 means this record never expires, overriding the list default rather than falling back to it — that is
   * how you exempt one record from a list-wide expiry. Omit to take the list default.
   */
  ttl_seconds?: number | null;
  /**
   * Absolute expiry (epoch ticks). Takes precedence over ttl_seconds and the list default, and is honoured
   * even if it has already passed.
   */
  expires_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  facets?: NameAndValue[];
  searchable_fields?: NameAndValue[];
  resources?: NameAndValue[];
};

export type UpdateSearchResultRequest = {
  search_result_name?: string | null;
  active?: boolean | null;
  /** Relative TTL in seconds, anchored to the record's creation time. 0 clears the expiry (never expires); null/omitted leaves it unchanged. */
  ttl_seconds?: number | null;
  /** Absolute expiry. Takes precedence over ttl_seconds. */
  expires_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  facets?: NameAndValue[];
  searchable_fields?: NameAndValue[];
  resources?: NameAndValue[];
};

/**
 * Body of the non-vectorizing volatile-field patch: sets frequently-changing values (price, stock,
 * availability) on a record WITHOUT re-embedding it. Only facets and non-vectorized searchable /
 * resource fields are accepted; fields that feed the embedding must use `edit`.
 */
export type PatchVolatileFieldsRequest = {
  facets?: NameAndValue[];
  searchable_fields?: NameAndValue[];
  resources?: NameAndValue[];
};

/**
 * A batch of volatile deltas: fast-changing overlay values (price, quantity) written WITHOUT
 * re-indexing or re-embedding, decorated onto search results at response time (freshness M3).
 */
export type ApplyVolatileDeltasRequest = {
  deltas: VolatileDeltaItem[];
};

export type VolatileDeltaItem = {
  /** The record's engine id (the `id` on a search hit), not its name. */
  id: string;
  /** When the values were observed at the source (ISO-8601). Optional; defaults to server time. Drives last-write-wins. */
  as_of?: string | null;
  /** Flat map of field name to new value, e.g. { price: 42.0, quantity: 7 }. */
  fields: Record<string, unknown>;
};

/** How many records' overlay state actually changed (a replay of already-current values is 0). */
export type ApplyVolatileDeltasResponse = {
  applied: number;
};

/**
 * verify_offer body: the engine ids (the `id` values from search hits) whose current volatile values
 * should be confirmed at the moment of action (freshness M6).
 */
export type VerifyOfferRequest = {
  ids: string[];
};

export type VerifyOfferResponse = {
  offers: VerifiedOffer[];
};

export type VerifiedOffer = {
  id: string;
  name?: string | null;
  /** Freshness of the returned values (ISO-8601). Null when the record was not found. */
  as_of?: string | null;
  /** `overlay` (seconds-fresh), `index` (last-indexed), or `not_found`. */
  source: string;
  /** The current volatile field values (name → value). */
  fields: Record<string, unknown>;
};

export type UpdateSearchResultVectorRequest = {
  text_vector?: number[];
  image_vector?: number[];
  document_vector?: number[];
};

/** Free-text / vector search options. All fields are optional. */
export type SearchOptions = {
  query?: string;
  size?: number;
  skip?: number;
  filter?: string;
  radius?: string;
  cache?: boolean;
  vector_search?: boolean;
  reranker?: boolean;
  ranking?: string;
  minimum_text_score?: number;
  minimum_image_score?: number;
  minimum_document_score?: number;
  minimum_video_score?: number;
  minimum_audio_score?: number;
  order_by?: string;
  typo_tolerance?: boolean;
  /**
   * How much of the query a record has to contain: `any`, `all` or `phrase`.
   *
   * `any` is the default and suits a search box — a record holding one of the terms matches, and ranking
   * sorts out the rest. `all` requires every term, in any order. `phrase` requires the terms together and
   * in order, and is exact (typo tolerance does not apply to it).
   *
   * Reach for `all` or `phrase` when you need the SET of records containing something rather than a ranked
   * page: only then does `total_count` count real matches, so you can report a total, page to the end, or
   * sort by something other than relevance without dragging near-misses along.
   */
  match?: string;
  /**
   * Fields to return matched snippets for, comma-separated: `name`, or a searchable field's name. Each hit
   * then carries `highlights`. Omit for none.
   */
  highlight_fields?: string;
  /**
   * `auto` (the default) reads the query through the List's query rules, so a postcode or an order number
   * becomes a constraint rather than words to match. `off` searches for exactly what was typed. Per-request,
   * so one literal search costs nobody else their rules.
   */
  interpretation_mode?: "auto" | "off";
};

/** Options for finding results related to a seed result. */
export type RelatedOptions = {
  filter?: string;
  size?: number;
  skip?: number;
  radius?: string;
  minimum_text_score?: number;
  minimum_image_score?: number;
  minimum_document_score?: number;
  minimum_video_score?: number;
  minimum_audio_score?: number;
  cache?: boolean;
  ranking?: string;
};

export type SearchByImageRequest = {
  image_path: string;
  filter?: string;
  radius?: string;
  size?: number;
  skip?: number;
  minimum_text_score?: number;
  minimum_image_score?: number;
  minimum_document_score?: number;
  minimum_video_score?: number;
  minimum_audio_score?: number;
  cache?: boolean;
  ranking?: string;
};

export type SearchByImageBase64Request = {
  image_base64: string;
  filter?: string;
  radius?: string;
  size?: number;
  skip?: number;
  minimum_text_score?: number;
  minimum_image_score?: number;
  minimum_document_score?: number;
  minimum_video_score?: number;
  minimum_audio_score?: number;
  cache?: boolean;
  ranking?: string;
};

export type RecordClickRequest = {
  query_id: string;
  result_id: string;
  /** Required when recording a click against a group; the list the result came from. */
  list_name?: string | null;
};

export type CloneListRequest = {
  new_list_name: string;
  /** Copy every eval set targeting the source List onto the clone as `{set}-{new list}`, cases included. Defaults to false. */
  copy_eval_sets?: boolean;
};

export type CreateListRequest = {
  account_name: string;
  list_name: string;
  subscription_name: string;
  model_name?: string | null;
  cache_service?: string | null;
  reranker_name?: string | null;
  /**
   * Default record time-to-live, in seconds. Omitted or 0 means records never expire by default.
   * Otherwise must be between 300 (5 minutes) and 10 years.
   */
  default_ttl_seconds?: number | null;
};

export type UpdateListRequest = {
  default_suggest_size?: number | null;
  default_search_size?: number | null;
  use_miles?: boolean | null;
  typo_tolerance?: boolean | null;
  /**
   * Default record time-to-live, in seconds, applied to records written from now on — existing records keep
   * the expiry they were stamped with. Send 0 to turn record expiry off; otherwise it must be between 300
   * (5 minutes) and 10 years. Omit to leave the current setting unchanged.
   */
  default_ttl_seconds?: number | null;
  /**
   * Permanently delete deactivated (inactive) records once they have been inactive this many days. Send 0 to
   * turn automatic purging off; otherwise it must be between 7 and 3650. Omit to leave it unchanged.
   *
   * The irreversible half of retention: a record expires (deactivates) first, and this decides how long it is
   * kept before the delete is final.
   */
  purge_inactive_after_days?: number | null;
};

/**
 * One synonym rule. Structured rather than a line of rule text — the rule syntax is not something a caller
 * should have to get right, and a malformed rule does not error at search time, it silently stops working.
 */
export type SynonymRuleRequest = {
  /**
   * `equivalent` — every word in `terms` means every other, both ways.
   * `rewrite` — searching any word in `terms` finds `replace_with` instead, one way only.
   */
  kind: "equivalent" | "rewrite";
  /**
   * The words or phrases. At least two for `equivalent`; for `rewrite`, what someone types. A phrase may
   * contain spaces (`t shirt`); no word may contain a comma, an arrow, a # or a backslash.
   */
  terms: string[];
  /** For `rewrite` only: what those words are searched as instead. */
  replace_with?: string[];
};

/** The complete set of synonym rules for a List — this replaces whatever is there. */
export type SetListSynonymsRequest = {
  /** Every rule to put in force. An empty array removes all synonyms. */
  rules: SynonymRuleRequest[];
};

export type CreateFacetRequest = {
  account_name: string;
  list_name: string;
  facet_name: string;
  /** What KIND of value the field holds: "String" (default) | "Number" | "Date" | "Boolean". */
  field_type?: string | null;
  /**
   * How MANY values one record may hold: "Single" (default) | "Many". Orthogonal to field_type — "Many" is
   * legal on every type, so a set of sizes is a Number field with "Many". A "Many" field is filterable and
   * facetable but never sortable or range-filterable; send its values as an array.
   */
  cardinality?: string | null;
};

export type RenameFacetRequest = {
  new_facet_name: string;
};

export type CreateResourceRequest = {
  account_name: string;
  list_name: string;
  resource_name: string;
  vectorize?: boolean;
};

export type RenameResourceRequest = {
  resource_name: string;
  new_resource_name: string;
  vectorize?: boolean;
};

export type CreateSearchableFieldRequest = {
  account_name: string;
  list_name: string;
  searchable_field_name: string;
  /** When false, the field is excluded from the semantic text embedding (stays keyword-searchable). Defaults to true. */
  vectorize?: boolean;
};

export type RenameSearchableFieldRequest = {
  new_searchable_field_name: string;
  /** When false, the field is excluded from the semantic text embedding (stays keyword-searchable). Defaults to true. */
  vectorize?: boolean;
};

export type AddContributorRequest = {
  account_name: string;
  list_name: string;
  contributor_name: string;
};

export type CreateGroupRequest = {
  account_name: string;
  subscription_name: string;
  group_name: string;
  model_name?: string | null;
  reranker_name?: string | null;
};

export type CloneGroupRequest = {
  new_group_name: string;
  /** Re-pin members to their latest version. Defaults to true. */
  pin_latest?: boolean;
};

export type EditGroupRequest = {
  default_search_size?: number | null;
  default_suggest_size?: number | null;
  use_miles?: boolean | null;
};

export type AddListToGroupRequest = {
  list_name: string;
  version: number;
  /** Adapt the added list's model to match the group's first list. Defaults to false. */
  adapt_to_first_list?: boolean;
};

export type EditGroupModelRequest = {
  model_name: string;
};

export type AddGroupRerankerRequest = {
  reranker: string;
};

export type TransferGroupRequest = {
  new_subscription_name: string;
};

/** Filter selecting the search results to delete. Omit to match all. */
export type DeleteByFilterRequest = {
  filter?: string | null;
};

/** Acknowledgement that a (soft-)delete-by-filter job has been accepted. */
export type DeleteByFilterResponse = {
  accepted: boolean;
};

export type SuggestOptions = {
  size?: number;
  skip?: number;
  filter?: string;
  radius?: string;
  cache?: boolean;
};


// ─── Evals ──────────────────────────────────────────────────────────────────────

/** A single query in an eval set, as returned by the API. */
export type EvalQueryResponse = {
  text: string;
  size: number;
  filter?: string | null;
  text_fields: string[];
  image_fields: string[];
};

export type EvalSetResponse = {
  account_name: string;
  name: string;
  list_name?: string | null;
  list_version?: number | null;
  group_name?: string | null;
  group_version?: number | null;
  target_created_utc: number;
  judge_name?: string | null;
  judge_created_utc?: number | null;
  context_text: string;
  context_image_uris: string[];
  /** Events that trigger an automatic run, e.g. "ingest", "schedule". */
  auto_run_on: string[];
  queries: EvalQueryResponse[];
  created_utc: number;
};

export type EvalQueryResultResponse = {
  query_index: number;
  query_text: string;
  ordered_candidate_ids: string[];
  judge_run_id?: string | null;
  hit_count: number;
  passed_count: number;
  errored_count: number;
};

export type EvalRunStatusResponse = {
  run_id: string;
  account_name: string;
  eval_set_name: string;
  /** e.g. "pending", "running", "completed", "failed". */
  status: string;
  trigger_source: string;
  total_queries: number;
  processed_queries: number;
  zero_result_queries: number;
  total_candidates: number;
  passed_count: number;
  errored_count: number;
  pass_rate?: number | null;
  zero_result_rate?: number | null;
  model_name?: string | null;
  reranker_name?: string | null;
  judge_name?: string | null;
  membership_drifted: boolean;
  created_utc: number;
  completed_utc?: number | null;
  /** Per-query detail; present once the run has produced results. */
  results?: EvalQueryResultResponse[] | null;
};

export type EvalRunHistoryResponse = {
  runs: EvalRunStatusResponse[];
  continuation_token?: string | null;
};

export type RunEvalResponse = {
  run_id: string;
  estimated_judge_calls: number;
};

/** A query supplied when creating an eval set. */
export type EvalQueryDto = {
  text: string;
  size?: number | null;
  filter?: string | null;
  text_fields?: string[];
  image_fields?: string[];
};

export type CreateEvalSetRequest = {
  name: string;
  list_name?: string | null;
  list_version?: number | null;
  group_name?: string | null;
  group_version?: number | null;
  judge_name?: string | null;
  context_text?: string | null;
  context_image_uris?: string[];
  auto_run_on?: string[];
  queries: EvalQueryDto[];
};

export type BootstrapEvalSetRequest = {
  name: string;
  /** Judge run ids whose judged candidates seed the new eval set. */
  source_run_ids: string[];
  context_text?: string | null;
  context_image_uris?: string[];
};

// ─── Eval cases ─────────────────────────────────────────────────────────────────
// One case in an eval set: a query to run against the set's pinned target, plus what a good result for
// THAT query looks like. Criteria are per case because the judge grades one result at a time and never
// sees the query that retrieved it, so a set spanning unrelated queries can't share one standard.

/** One case in an eval set: the unit a run scores and keeps history for. */
export type EvalCaseResponse = {
  account_name: string;
  eval_set_name: string;
  name: string;
  query: string;
  /** How many hits this case retrieves and judges. Each one is a billed judge call. */
  size: number;
  filter?: string | null;
  text_fields: string[];
  image_fields: string[];
  /** What a pass means for this case. Empty means it inherits the set's `context_text`. */
  criteria: string;
  created_utc: number;
};

export type CreateEvalCaseRequest = {
  /** Unique within the set, URL-safe. Names the case so it can be edited and followed across runs. */
  name: string;
  query: string;
  /** What makes a result good for this query. Omit to inherit the set's `context_text`. */
  criteria?: string | null;
  /** Hits to retrieve and judge (default 10, max 25). Each one is a billed judge call. */
  size?: number | null;
  filter?: string | null;
  /** Searchable field names joined into each candidate's judgeable text. Empty = every string field. */
  text_fields?: string[];
  /** Resource field names whose values become each candidate's image URIs. */
  image_fields?: string[];
};

/** Replace a case's query, retrieval settings and criteria. Its name is the route. */
export type EditEvalCaseRequest = {
  query: string;
  criteria?: string | null;
  size?: number | null;
  filter?: string | null;
  text_fields?: string[];
  image_fields?: string[];
};


// ─── Judges ─────────────────────────────────────────────────────────────────────

/** Health of a background-checked BYO service. */
export type ServiceHealthResponse = {
  /** One of: `unknown`, `healthy`, `degraded`, `failing`. */
  status: string;
  last_checked_utc?: number | null;
  last_success_utc?: number | null;
  message?: string | null;
};

/**
 * A judge: the reusable model + credential half. Holds no instructions — the instructions +
 * output schema + pass field live on its {@link JudgeInstructionResponse} children.
 */
export type JudgeDetailsResponse = {
  account_name: string;
  name: string;
  provider: string;
  provider_display_name: string;
  model: string;
  /** Custom endpoint override, when set (a proxy/gateway/compatible host); null = the provider default. */
  endpoint?: string | null;
  /** The shared credential this grader's key resolves from, or null for a legacy inline-key grader. */
  credential_name?: string | null;
  created_utc: number;
  health?: ServiceHealthResponse | null;
};

/** A judge instruction (JudgeInstruction): the runnable unit belonging to a judge — the prompt, output schema and pass field. */
export type JudgeInstructionResponse = {
  account_name: string;
  name: string;
  /**
   * The 1-based content version of this instruction. Content is immutable per version — an edit appends a
   * new version rather than overwriting, so a run that recorded version N stays reproducible.
   */
  version: number;
  /** The judge (model + credential) this instruction runs on. */
  judge_name: string;
  instructions: string;
  /** JSON Schema (as a string) the verdict's structured output must satisfy. */
  output_schema: string;
  /** Boolean field in the verdict output that decides pass/fail. */
  pass_field?: string | null;
  created_utc: number;
};

/**
 * Create a judge (model + credential). It holds no instructions — add them with
 * {@link CreateJudgeInstructionRequest}.
 */
export type CreateJudgeRequest = {
  /**
   * Optional free-form identity for this grader. Omit to default to the `{provider}-{model}`
   * composite (one grader per model); supply a name to hold several graders on the same model.
   */
  name?: string | null;
  provider: string;
  model: string;
  api_key: string;
  /** An existing saved credential to reuse instead of pasting `api_key`. */
  credential_name?: string | null;
  /** Custom endpoint for the provider, when self-hosted / proxied. */
  endpoint?: string | null;
};

/** Edit a judge (model + credential) in place. The prompt, output schema and pass field are edited on its instructions. */
export type EditJudgeRequest = {
  /** The vendor of the model to run on. Omit to keep the grader's current provider. */
  provider?: string | null;
  /** The model to run on. Omit to keep the grader's current model. */
  model?: string | null;
  /** Optional — omit to keep the stored key. */
  api_key?: string | null;
  /** Re-point the grader at an existing saved credential. Omit to keep its current one. */
  credential_name?: string | null;
  endpoint?: string | null;
};

/** Add an instruction (JudgeInstruction) to an existing judge: the runnable unit. */
export type CreateJudgeInstructionRequest = {
  /** The judge (model + credential) this instruction runs on. Must already exist. */
  judge_name: string;
  /** The instruction's free-form, account-scoped identity — the token evals/watches/imports reference. */
  name: string;
  instructions: string;
  output_schema: string;
  pass_field?: string | null;
};

/** Edit an instruction in place. The judge it runs on is preserved. */
export type EditJudgeInstructionRequest = {
  instructions: string;
  output_schema: string;
  pass_field?: string | null;
};

export type JudgeContextDto = {
  text: string;
  image_uris?: string[];
};

export type JudgeCandidateDto = {
  id: string;
  text: string;
  image_uris?: string[];
};

/** Instead of supplying candidates, have the judge run over live search hits. */
export type JudgeSearchDto = {
  list_name?: string | null;
  version?: number | null;
  group_name?: string | null;
  group_version?: number | null;
  query?: string | null;
  size?: number | null;
  filter?: string | null;
  text_fields?: string[];
  image_fields?: string[];
};

export type RunJudgeRequest = {
  context: JudgeContextDto;
  /** Explicit candidates to judge. Mutually exclusive with `search`. */
  candidates?: JudgeCandidateDto[] | null;
  /** Judge live search results instead of explicit candidates. */
  search?: JudgeSearchDto | null;
  batch: boolean;
};

export type RunJudgeResponse = {
  run_id: string;
};

export type TryJudgeRequest = {
  context: JudgeContextDto;
  candidate: JudgeCandidateDto;
};

/** The synchronous result of trying a judge against a single candidate. */
export type TryJudgeResponse = {
  /** The judge's raw structured (JSON) output. */
  json: string;
  passed: boolean;
  error?: string | null;
};

export type JudgeResultResponse = {
  candidate_id: string;
  json: string;
  passed: boolean;
  error?: string | null;
};

export type JudgeRunStatusResponse = {
  run_id: string;
  /** The instruction version this run pinned (a version never changes). */
  instruction_version: number;
  status: string;
  total_candidates: number;
  processed_count: number;
  passed_count: number;
  errored_count: number;
  created_utc: number;
  completed_utc?: number | null;
  results: JudgeResultResponse[];
};


// ─── Discovery / API info ─────────────────────────────────────────────────────────
// These endpoints are anonymous — no credentials are required.

export type ApiAuthInfo = {
  type: string;
  description: string;
};

export type ApiErrorCode = {
  code: string;
  status: number;
  description: string;
};

export type ApiMcpInfo = {
  supported: boolean;
  description: string;
  example_config_url: string;
};

export type ApiInfo = {
  name: string;
  description: string;
  version: string;
  openapi_url: string;
  documentation_url: string;
  examples_url: string;
  authentication: ApiAuthInfo;
  error_codes: ApiErrorCode[];
  mcp: ApiMcpInfo;
};

export type ApiExample = {
  id: string;
  title: string;
  description: string;
  method: string;
  path: string;
  request_body?: unknown;
  response_status: number;
  response_example: unknown;
};

export type ApiExamples = {
  examples: ApiExample[];
};

export type ApiCatalogLink = {
  anchor: string;
  rel: string;
  href: string;
  type: string;
  title: string;
};

/** IETF api-catalog document (RFC 9727) linking to the API's resources. */
export type ApiCatalog = {
  linkset: ApiCatalogLink[];
};

/**
 * A watch: a standing query re-run on a cadence, alerting only on records it has not already
 * alerted on. Like an eval set, a watch pins one version of one list, which keeps its filter
 * meaningful after the schema moves on; records are never versioned, so it still sees every new record.
 */
export type WatchResponse = {
  account_name: string;
  name: string;
  /** The watched list. */
  list_name: string;
  /** The pinned list version the sweep searches. */
  list_version: number;
  /** The standing query. Null matches everything in scope, bounded by filter + size. */
  query?: string | null;
  filter?: string | null;
  size: number;
  vector_search: boolean;
  /** The judge vetting each fresh candidate. Null = every fresh candidate is a match. */
  judge_name?: string | null;
  context_text: string;
  interval_minutes: number;
  enabled: boolean;
  /** Bumped on every edit and stamped on each match, so a match records which question found it. */
  revision: number;
  /** When the sweep last evaluated this watch, match or not. Null until the first sweep. */
  last_swept_utc?: number | null;
  created_utc: number;
};

/** Targets one list and pins a version of it. Omit `list_version` to pin the list's current version. */
export type CreateWatchRequest = {
  name: string;
  list_name: string;
  /** The list version to pin. Omit to pin the list's current version. */
  list_version?: number | null;
  /** Omit to alert on anything new in scope — what a mirrored feed wants. */
  query?: string | null;
  filter?: string | null;
  /** Candidates per sweep. Bounds both alert volume and judge spend. */
  size?: number | null;
  vector_search?: boolean;
  /** A judge already configured on the account, e.g. "anthropic-claude-haiku-4-5". */
  judge_name?: string | null;
  /** The criteria the judge applies to each candidate. Requires `judge_name`. */
  context_text?: string | null;
  interval_minutes?: number | null;
};

/**
 * A full replace, not a patch: every omitted field reverts to its default. The watched list is not
 * editable — that is a delete and a create — but `list_version` is: omit to keep the current pin, or
 * name a version to migrate the watch to it.
 */
export type EditWatchRequest = {
  /** Re-pin to this version of the watched list. Omit to keep the current pin. */
  list_version?: number | null;
  query?: string | null;
  filter?: string | null;
  size?: number | null;
  vector_search?: boolean;
  judge_name?: string | null;
  context_text?: string | null;
  interval_minutes?: number | null;
  /** Pause or resume sweeping. Omit to leave as-is. Does not bump the revision. */
  enabled?: boolean | null;
};

/**
 * One alert: a record a watch found, as it was at match time. The record's fields are deliberately
 * absent — they are live, and a stale copy would be a second source of truth; fetch the record by
 * `record_id` to see it now.
 */
export type WatchMatchResponse = {
  record_id: string;
  record_name: string;
  /** The list the record was found in. */
  list_name?: string | null;
  /** The list version searched at match time. */
  version: number;
  /** The watch's revision at match time — which question found this. */
  watch_revision: number;
  /** "matched", or "needs-review" when the watch's judge could not rule on it. */
  status: string;
  /** The judge's verbatim JSON verdict, or the error summary for needs-review. Null with no judge. */
  verdict?: string | null;
  matched_utc: number;
};

/** A watch's feedback tally: is it telling you useful things? */
export type WatchPrecisionResponse = {
  confirmed: number;
  dismissed: number;
  labelled: number;
  /** Of the alerts you ruled on, the fraction you wanted. Null until you have labelled one. */
  precision?: number | null;
};

/**
 * Tells the Watch whether one of its alerts was any good. Measured, never learned from: the point is to
 * make a mis-tuned Watch visible as a number, not to have the platform second-guess your query.
 */
export type WatchFeedbackRequest = {
  /** The alerted record's id, as it appears on the match. */
  record_id: string;
  /** "confirm" or "dismiss". Re-rating a record replaces its earlier rating. */
  kind: "confirm" | "dismiss";
};

// ─── Gates ───────────────────────────────────────────────────────────────────
//
// What a record has to get past to be admitted to a List. A gate DEFINITION is account-scoped (what it does)
// and an ATTACHMENT binds it to a list (where it runs, reading and writing which fields, paid for by which
// credential). One response type carries both halves, because the question actually asked is "what happens to
// records arriving at this list?" and the answer needs the definition and the binding together.

export type GateResponse = {
  name: string;
  /** "Builtin", "Rules" or "Judge". Order across kinds is fixed by the system, cheapest first. */
  kind: string;
  /** Kind-specific configuration, as a JSON string. */
  config: string;
  description?: string | null;
  /** Ours, seeded, not editable — but switchable per list like any other. */
  is_builtin: boolean;
  /**
   * The list this gate belongs to, or null for an account-wide gate. One that belongs to a list is left out of
   * the account listing, can only be attached to that list, and is deleted when the list is.
   */
  owner_list?: string | null;
  /** The credential this gate uses on this list, if it has its own. */
  credential_name?: string | null;
  model?: string | null;
  /** The key the gate will ACTUALLY use, which may be the list's rather than its own. */
  effective_credential_name?: string | null;
  credential_inherited: boolean;
  /** True when this gate's position is fixed by the system and cannot be changed. */
  order_fixed: boolean;
  /** The definition's version. Editing advances it; a list follows only when bumped. */
  version: number;
  /** The version THIS LIST is pinned at. Lower than `version` means it has not followed a later edit. */
  pinned_version?: number | null;
  created: number;
  updated: number;
  /** Whether the list this was listed for uses this gate. False on the account-level listing. */
  attached: boolean;
  enabled: boolean;
  /** Position WITHIN this gate's kind. */
  order: number;
  input_fields?: string[] | null;
  output_field?: string | null;
  run_on_insert: boolean;
  run_on_edit: boolean;
  /** The list's own settings for this gate, distinct from the definition's config. */
  list_config?: string | null;
  /** This gate runs unless somebody switches it off — it needs no attachment. */
  on_by_default: boolean;
  /** This gate is on every list's chain without being added, though it may be switched off (capture is).
   *  Turn it off or on to change it; detaching only restores the default. */
  attached_by_default: boolean;
};

/** One backfill: re-running a computing gate over records already in a list. */
export type GateBackfillResponse = {
  run_id: string;
  list_name: string;
  gate_name: string;
  /** "Queued", "Running", "Completed" or "Failed". */
  status: string;
  /** The gate version this run brings records up to — the list's pinned version. */
  target_version: number;
  filter?: string | null;
  scanned: number;
  recomputed: number;
  /** Records already stamped at the target version, so nothing was spent on them. */
  skipped: number;
  failed: number;
  /** Why the job itself could not run. Individual record failures are counted, not fatal. */
  error?: string | null;
  created: number;
  completed?: number | null;
};

export type BumpGateVersionResponse = {
  gate: GateResponse;
  previous_version: number;
  pinned_version: number;
  /** The backfill this bump started, when one was requested. */
  backfill?: GateBackfillResponse | null;
};

export type CreateGateRequest = {
  /** Account-unique name (letters, digits and hyphens), e.g. "no-profanity". */
  name: string;
  /** "Rules" for declarative checks, "Judge" for a model scoring against your criteria. */
  kind: string;
  /** Kind-specific configuration, as a JSON string. */
  config: string;
  description?: string;
  /**
   * Make this gate belong to one list instead of the whole Account. It is then left out of the account
   * listing, can only be attached to that list, and is deleted when the list is — right for a rule written for
   * one file, wrong for anything you mean to reuse. Omit for a normal account-wide gate.
   */
  list_name?: string;
};

export type UpdateGateRequest = {
  /** Replacement configuration. Advances the version; lists stay on the version they were pinned at. */
  config: string;
  description?: string;
};

export type AttachGateRequest = {
  /** Position within this gate's kind. Order across kinds is fixed by the system. */
  order?: number;
  /** Which fields the gate reads on this list. Empty means the gate's own default: for rules, every text
   *  field; for builtin-capture-media, every resource field. Name fields only to narrow it. */
  input_fields?: string[];
  /** Where a computing gate writes. Omit for gates that only reject or modify. */
  output_field?: string;
  /** The saved credential that pays for this gate ON THIS LIST. Judge gates only. */
  credential_name?: string;
  model?: string;
  run_on_insert?: boolean;
  run_on_edit?: boolean;
  /** Per-list settings as JSON, for the gates that have any. */
  config?: string;
};

export type BumpGateRequest = {
  /**
   * Also re-run the gate over records already in the list. Default false: bumping is instant and free,
   * backfilling spends your provider key on every matching record.
   */
  backfill?: boolean;
  /** Limits which existing records the backfill covers. Ignored unless `backfill` is true. */
  filter?: string;
};

export type GateBackfillRequest = {
  /** Limits which records are recomputed. Omit for the whole list. */
  filter?: string;
  /**
   * Recompute even records already stamped at the pinned version. Default false, which is what makes a re-run
   * after a partial failure cost nothing for the records that already succeeded.
   */
  force?: boolean;
};

export type CaptureBackfillRequest = {
  /** Limits which existing records are captured. Omit to run over the whole list. */
  filter?: string;
};

// ─── Query rules ─────────────────────────────────────────────────────────────
//
// A query rule decides how a raw query is READ before it is executed. It spots a format in what somebody typed
// — a postcode, a barcode, an order number — and lifts that part of the query out as a CONSTRAINT rather than
// leaving it to be matched as words: "flat 2 zz1 1zz" becomes the text "flat 2" plus a filter on the postcode
// field.
//
// Rules are LIST-scoped, unlike gates, because a rule binds a format to a field and a field only means what it
// means on one list. They are also ORDERED, and the order is load-bearing: the first rule to claim part of a
// query wins, and later rules see only what is left.

/** One query rule. */
export type QueryRuleResponse = {
  name: string;
  list_name: string;
  /** The field a match constrains. Always a facet — only a facet can be filtered on. */
  target_field: string;
  /** The shipped rule type's id ("uk-postcode"), or the rule's own name for a custom pattern. */
  recognizer: string;
  /** "BuiltIn" | "ValueSet" | "Pattern". */
  recognizer_kind: string;
  /** Plain language — "UK postcode". Falls back to the id for a custom pattern. */
  display_name: string;
  /** What the rule does, in the operator's language. Null for a custom pattern: we did not write it. */
  description?: string | null;
  /** Null unless the rule carries a customer-supplied regex. */
  pattern?: string | null;
  /** "WholeQuery" | "Token" | "TokenSpan". TokenSpan is why a two-word postcode is recognised at all. */
  match_mode: string;
  /** "Filter" (narrow the results) | "ExactLookup" (pin one record above them) | "Boost". */
  action: string;
  /**
   * "Passive" | "Balanced" | "Aggressive" — how much evidence the rule needs before it acts. Aggressive paired
   * with Filter is the only combination that can return zero results.
   */
  stance: string;
  /** "Enabled" | "Shadow" (records what it would do, changes nothing) | "Disabled". */
  state: string;
  /** Remove the matched text from what the search sees. */
  consume_match: boolean;
  /** Execution order. The first rule to consume a span wins; later rules see only the residual. */
  order: number;
  version: number;
  /** "Manual" | "Inferred" | "LlmSuggested" | "LogInferred". Drives what state the rule may start in. */
  origin: string;
  confidence: number;
  /** One sentence naming the evidence — "98% of 12,400 values matched". */
  evidence?: string | null;
  /** True when the rule uses a shipped recognizer: ours, and its shape is not editable. */
  is_builtin: boolean;
  created: number;
  updated: number;
};

/** A shipped rule type. Supplies everything a rule needs except the field. */
export type QueryRuleTemplateResponse = {
  recognizer: string;
  display_name: string;
  description: string;
  match_mode: string;
  /**
   * The default worth having. Cardinality decides Filter versus ExactLookup and is knowable in advance for
   * these formats, so nobody has to guess the one thing a generated rule most visibly gets wrong.
   */
  action: string;
  stance: string;
};

/** One constraint lifted out of a query. */
export type ExtractedConstraintResponse = {
  field: string;
  /** Exactly as it was typed — for a "Showing results in ZZ1 1ZZ" chip. */
  raw_text: string;
  value: string;
  rule: string;
  action: string;
  /** False when the caller's own filter on this field took precedence. */
  applied: boolean;
  superseded_by_caller_filter?: string | null;
};

/** What a rule in Shadow WOULD have extracted. Never applied. */
export type ShadowConstraintResponse = {
  field: string;
  raw_text: string;
  value: string;
  rule: string;
  action: string;
  /**
   * The rule matched the shape but the field does not hold the value — the most useful shadow signal there is,
   * because it says the rule would have fired and returned nothing.
   */
  verification_failed: boolean;
};

/** How a query is read: the text that survives, and the constraints lifted out of it. */
export type QueryInterpretationResponse = {
  query: string;
  /** What is left for text search. Equal to the query when no rule fired, empty when all of it became constraints. */
  text: string;
  constraints?: ExtractedConstraintResponse[] | null;
  /** What shadow rules would have done. */
  shadow?: ShadowConstraintResponse[] | null;
};

/** What a sample of one field's values looked like — the evidence behind an inferred rule. */
export type FieldProfileResponse = {
  field: string;
  /** Records read. A SAMPLE, not a census. */
  sampled_count: number;
  /** How many of those records actually carried a value here. */
  non_null_count: number;
  distinct_count: number;
  /**
   * Distinct divided by sampled. This, not the shape, is what decides whether a match narrows the results or
   * pins one record.
   */
  cardinality_ratio: number;
  /** The rule type that claimed most of the field ("uk-postcode"), or null if none did. */
  looks_like?: string | null;
  display_name?: string | null;
  /** The share of present values that matched, 0-1. */
  hit_rate: number;
  /** Three of the account's OWN values. */
  samples?: string[] | null;
  /** True when the values are personal data and the samples above are masked. */
  samples_masked: boolean;
  profiled: number;
};

/** A field that was profiled and produced no rule, and why. */
export type SkippedFieldResponse = {
  field: string;
  /**
   * The distinction that matters is between "we could not tell what this is" and "we could tell, and decided
   * not to act" — the first is a gap in the catalogue, the second a judgement you may want to override.
   */
  reason: string;
};

/** What an inference run did. */
export type InferQueryRulesResponse = {
  profiled_fields: number;
  created?: QueryRuleResponse[] | null;
  /**
   * Reported rather than silently omitted: a postcode column that got no rule needs to say which kind of
   * nothing happened to it.
   */
  skipped?: SkippedFieldResponse[] | null;
};

/**
 * What a query rule has actually been doing over a window of real traffic — the evidence a shadow rule is
 * promoted on.
 *
 * There is deliberately no "results would drop from 340 to 4". The second number is a counterfactual: the
 * search was never run with the constraint, and running it would double the cost of every search carrying a
 * shadow rule.
 */
export type QueryRuleMetricsResponse = {
  rule: string;
  /** "Enabled" | "Shadow" | "Disabled". Shadow means these numbers describe what WOULD have happened. */
  state: string;
  /** Inclusive UTC window, yyyy-MM-dd. */
  from: string;
  to: string;
  /** Searches of the list in the window, whether or not this rule fired. The denominator. */
  searches: number;
  fired: number;
  /** 0-1. "Would have fired on 6.2% of searches." */
  fire_rate: number;
  /**
   * Firings where the field does not hold the matched value — the rate at which switching this rule on would
   * turn a working search into an empty one. The number that decides it.
   */
  verification_failed: number;
  verification_failure_rate: number;
  /** Median results returned by the searches it fired on, as they ran. */
  median_results: number;
  zero_result_rate: number;
  /**
   * False when there have been too few firings for any of this to be evidence. Read this before the rates: a
   * percentage from four searches looks exactly as convincing as one from four thousand.
   */
  conclusive: boolean;
  minimum_firings: number;
};

/** A format people searched for that produced no rule, and why. */
export type SkippedShapeResponse = {
  /** The character-class skeleton the searches were clustered by — "AAAA-0000-A". Diagnostic. */
  shape: string;
  /** One value that was really typed, so the shape means something to a human. */
  example?: string | null;
  searches: number;
  reason: string;
};

/**
 * What a run over the query log did. Everything it creates lands in SHADOW: what people type is a noisier
 * signal than what a list holds, so a log-inferred rule changes nothing until its measured evidence persuades
 * somebody to switch it on.
 */
export type InferQueryRulesFromSearchesResponse = {
  /** Searches in the window. The denominator behind everything below. */
  searches_read: number;
  from?: string | null;
  to?: string | null;
  created?: QueryRuleResponse[] | null;
  /**
   * Formats seen and not acted on. "Searched eleven times, too few to go on yet" tells you to come back next
   * month; an empty answer tells you the feature does not work.
   */
  skipped?: SkippedShapeResponse[] | null;
};

/**
 * Everything except the name and the field is optional. Pick a shipped rule type and it supplies the match
 * mode, the action and the stance.
 */
export type CreateQueryRuleRequest = {
  /** List-unique name. Letters, digits and hyphens. */
  name: string;
  /** The field a match constrains. Must be a facet on the list. */
  target_field: string;
  /**
   * One of the shipped rule types — "uk-postcode", "isbn13", "iban". List them with `templates()`. Supply
   * exactly one of this, `pattern` or `value_set`.
   */
  recognizer?: string;
  /**
   * A regex for a format the catalogue does not know — your own part numbers, internal codes. Validated when
   * this request is handled, so a bad pattern fails here with a message rather than in the query path.
   *
   * This is the developer and agent path. The console equivalent is to describe the format and have a model
   * draft the pattern, which the operator reviews against their own values before it is created.
   */
  pattern?: string;
  /**
   * Use the field's own distinct values as the recognizer. No shape at all, so the rule is always
   * evidence-only: it acts on a token when that token really is one of the field's values, never otherwise.
   */
  value_set?: boolean;
  /** "WholeQuery" | "Token" | "TokenSpan". Defaults from the rule type. */
  match_mode?: string;
  /** "Filter" | "ExactLookup" | "Boost". Defaults from the rule type — which is where the useful answer is. */
  action?: string;
  /** "Passive" | "Balanced" | "Aggressive". Defaults from the rule type. */
  stance?: string;
  /**
   * "Enabled" | "Shadow" | "Disabled". Defaults to Enabled for a hand-written rule. Send Shadow to try a rule
   * against real traffic without changing any search.
   */
  state?: string;
  /** Remove the matched text from what the search sees. Defaults to true. */
  consume_match?: boolean;
  order?: number;
};

/**
 * An edit to what the rule RECOGNISES, which advances its version. Deliberately carries no stance and no
 * state: those have their own calls, because a combined edit would quietly discard the shadow evidence you are
 * deciding on.
 */
export type EditQueryRuleRequest = {
  target_field: string;
  recognizer?: string;
  pattern?: string;
  value_set?: boolean;
  match_mode?: string;
  action?: string;
  consume_match?: boolean;
};

export type SetQueryRuleStateRequest = {
  /** "Enabled" | "Shadow" | "Disabled". */
  state: string;
};

export type SetQueryRuleStanceRequest = {
  /** "Passive" | "Balanced" | "Aggressive". Turning it up can only add constraints. */
  stance: string;
};

/**
 * The whole ordering, not a move. Two callers reordering at once can then only overwrite each other wholesale,
 * rather than interleaving into an order neither of them chose.
 */
export type ReorderQueryRulesRequest = {
  /** Every rule on the list, exactly once, in the order they should run. */
  names: string[];
};

export type TestQueryInterpretationRequest = {
  /** The query to interpret. Nothing is searched and nothing is stored. */
  query: string;
};

// --- Subscriptions --------------------------------------------------------------------------------
// Starting a subscription only. Cancelling, auto-upgrade configuration and the billing portal stay
// console-plane and are deliberately absent from this client.

export type SubscriptionProviderResponse = {
  name: string;
  value: string;
  is_default: boolean;
  supports_vector_search: boolean;
  supports_geo_distance: boolean;
  supports_suggest: boolean;
  supports_facets: boolean;
  supports_typo_tolerance: boolean;
  /**
   * Whether this provider honours `SearchOptions.match` — whether it can be asked for all-terms or phrase
   * matching rather than the recall-first any-term default. A provider that cannot rejects a non-default
   * `match` rather than quietly running the any-term search instead.
   */
  supports_match_mode?: boolean;
};

export type SubscriptionProvidersResponse = {
  providers: SubscriptionProviderResponse[];
};

export type SubscriptionPlanResponse = {
  value: string;
  display_name: string;
  description: string;
  cost_per_month: number;
  cost_per_year: number;
  version: number;
  provider: string;
  requires_per_account_index: boolean;
  max_lists: number;
  max_search_results: number | null;
  max_contributors_per_list: number;
  max_api_keys: number;
  max_groups: number;
  max_lists_per_group: number;
  max_searches_per_hour: number;
  max_size_gb: number | null;
  max_judges: number | null;
  max_eval_sets: number | null;
  max_rerankers: number | null;
  max_models: number | null;
  max_media_stores: number | null;
  max_feeds: number | null;
  max_watches: number | null;
  max_webhook_subscriptions: number | null;
  version_retention_depth: number | null;
  auto_sync_pause_after_idle_days: number | null;
};

/**
 * A search service a subscription can bind to. `region` is the point of this type: the shared entries
 * are the region catalog, and `search_service_name` is what you pass when starting a subscription to
 * place it in that region.
 */
export type SubscriptionSearchServiceResponse = {
  search_service_name: string;
  region: string;
  region_name: string;
  provider: string;
  is_shared: boolean;
};

/** The Stripe checkout URL. Nothing has been charged: a person has to open it and pay. */
export type SubscriptionCheckoutResponse = {
  url: string;
};

/**
 * No auto-upgrade opt-in, deliberately: auto-upgrade commits future spend by itself, and the endpoint
 * forces it off server-side regardless of what is sent. Turning it on is console-plane.
 */
export type SubscriptionCheckoutRequest = {
  plan_name: string;
  subscription_name: string;
  /** Where the customer lands after paying. Must be https, with no embedded credentials. */
  return_url: string;
  search_service_name: string;
  /** "monthly" (default) or "yearly". Yearly costs one month less. */
  billing_interval?: string;
};

export type StartFreeByoSubscriptionRequest = {
  plan_name: string;
  subscription_name: string;
  /** One of the account's OWN search services; a shared one is refused. */
  search_service_name: string;
};


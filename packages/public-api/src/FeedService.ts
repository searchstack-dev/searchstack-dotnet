import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import {
  Response,
  Problem,
  FeedResponse,
  FeedDetailResponse,
  EditFeedIntervalRequest,
  EditApiEndpointRequest,
  EditWebScopeRequest,
  ChangeFeedMediaStoreRequest,
  ChangeFeedMediaStoreResponse,
  ConnectFeedRequest,
  DiscoverWebPagesRequest,
  DiscoverWebPagesResponse,
  BackfillEmailFeedRequest,
  BackfillEmailFeedResponse,
  EditEmailSettingsRequest,
  EmailVerificationChallengeResponse,
} from "./Types.js";

const enc = encodeURIComponent;

// Feed operations on the data plane: list connected feeds, read one, pull a sync forward, retune cadence
// / web crawl scope, connect a credential-light feed, and run an email feed's two operations (backfill
// and address rotation). All credential-free — connecting a feed that carries a PROVIDER SECRET (Shopify,
// Notion) and deleting one stay console-plane.
export default class FeedService {
  private readonly path = `feed`;
  constructor(private readonly fetch: Fetch) {}

  /** Lists the feeds connected to an Account. */
  async list(account_name: string): Promise<Response<FeedResponse[], Problem>> {
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}`);
    return handleResponse(response, async () => (await response.json()) as FeedResponse[]);
  }

  /** Gets one feed with its current non-secret configuration. */
  async get(account_name: string, feed_name: string): Promise<Response<FeedDetailResponse, Problem>> {
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}/${enc(feed_name)}`);
    return handleResponse(response, async () => (await response.json()) as FeedDetailResponse);
  }

  /** Queues an immediate sync of the feed from its source. An unchanged source stages nothing. */
  async syncNow(account_name: string, feed_name: string): Promise<Response<void, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/${enc(feed_name)}/sync`, {});
    return handleResponse(response, () => undefined);
  }

  /** Retunes how often the feed polls its source, in minutes. */
  async editInterval(account_name: string, feed_name: string, request: EditFeedIntervalRequest): Promise<Response<FeedResponse, Problem>> {
    const response = await this.fetch.put(`${this.path}/${enc(account_name)}/${enc(feed_name)}/interval`, request);
    return handleResponse(response, async () => (await response.json()) as FeedResponse);
  }

  /**
   * Re-points an API feed at a different URL — the fix for a moved or versioned endpoint, which otherwise
   * means deleting the feed and reconnecting it. API feeds only.
   *
   * A blank `api_auth_value` KEEPS the stored one, so moving an endpoint carries no credential. Send a
   * value to rotate the key in place; clear `api_auth_header` to make the endpoint public. The new
   * endpoint is probed before anything is saved, so a bad URL never overwrites a working feed.
   */
  async editApiEndpoint(account_name: string, feed_name: string, request: EditApiEndpointRequest): Promise<Response<FeedResponse, Problem>> {
    const response = await this.fetch.put(`${this.path}/${enc(account_name)}/${enc(feed_name)}/api-endpoint`, request);
    return handleResponse(response, async () => (await response.json()) as FeedResponse);
  }

  /** Re-scopes a website feed (URL pattern, excludes, seeds). Web feeds only. */
  async editWebScope(account_name: string, feed_name: string, request: EditWebScopeRequest): Promise<Response<FeedResponse, Problem>> {
    const response = await this.fetch.put(`${this.path}/${enc(account_name)}/${enc(feed_name)}/web-scope`, request);
    return handleResponse(response, async () => (await response.json()) as FeedResponse);
  }

  /**
   * Moves a feed's staged output into a different media store, re-pointing any list bound to its staged
   * file so imports keep working. The feed then re-syncs and the bound lists re-import (an idempotent
   * upsert), and the old staged file is removed. Refused for "media-store" feeds (their store is the
   * source they index) and "email" feeds (their attachments would be left behind), and while the feed is
   * syncing. Moving to the store it is already on is a safe no-op.
   *
   * Check `unrepointed_lists` on the result: anything named there imports nothing until the move is re-run.
   */
  async changeMediaStore(account_name: string, feed_name: string, request: ChangeFeedMediaStoreRequest): Promise<Response<ChangeFeedMediaStoreResponse, Problem>> {
    const response = await this.fetch.put(`${this.path}/${enc(account_name)}/${enc(feed_name)}/media-store`, request);
    return handleResponse(response, async () => (await response.json()) as ChangeFeedMediaStoreResponse);
  }

  /**
   * Connects a credential-light feed (provider "web" or "api") and returns it. Secret-bearing providers
   * (Shopify, Notion) are rejected — connect those from the console. Requires the feed:connect permission.
   */
  async connect(account_name: string, request: ConnectFeedRequest): Promise<Response<FeedResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/connect`, request);
    return handleResponse(response, async () => (await response.json()) as FeedResponse);
  }

  /** Previews the pages a proposed web feed scope would crawl, before connecting anything. */
  async discoverWebPages(account_name: string, request: DiscoverWebPagesRequest): Promise<Response<DiscoverWebPagesResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/web/discover`, request);
    return handleResponse(response, async () => (await response.json()) as DiscoverWebPagesResponse);
  }

  /**
   * Imports an email feed's history from an `.mbox` already in the account's own media store into the
   * list named on the request, through the same parser live mail uses. Send `count_only` first to learn
   * the archive's size before importing anything.
   */
  async backfillEmail(account_name: string, feed_name: string, request: BackfillEmailFeedRequest): Promise<Response<BackfillEmailFeedResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/${enc(feed_name)}/backfill-email`, request);
    return handleResponse(response, async () => (await response.json()) as BackfillEmailFeedResponse);
  }

  /**
   * Issues a new ingest address for an email feed and returns the feed with it. The old address stops
   * resolving immediately — mail in flight to it will bounce — so anyone forwarding to it must be given
   * the new address. The pinned sender domains and existing records are untouched, and so is the staged
   * file the feed has already produced.
   */
  async rotateIngestAddress(account_name: string, feed_name: string): Promise<Response<FeedResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/${enc(feed_name)}/rotate-ingest-address`, {});
    return handleResponse(response, async () => (await response.json()) as FeedResponse);
  }

  /**
   * Changes an email feed's settings: the sender domains it accepts mail from, whether it is enabled, and
   * whether attachments are stored. The fix for a pinning rule set up wrongly — what the `email.rejected`
   * webhook reports. The ingest address is PRESERVED, so existing forwarding rules keep working; re-issuing
   * it is `rotateIngestAddress`. Send the whole settings block: every field is required, and at least one
   * sender domain must be given (an address with none accepts nothing) — to stop the flow, send
   * `enabled: false`. Read the current values from `get()`'s `email_config`.
   */
  async editEmailSettings(account_name: string, feed_name: string, request: EditEmailSettingsRequest): Promise<Response<FeedResponse, Problem>> {
    const response = await this.fetch.put(`${this.path}/${enc(account_name)}/${enc(feed_name)}/email-settings`, request);
    return handleResponse(response, async () => (await response.json()) as FeedResponse);
  }

  /**
   * Reads the messages that arrived at an email feed's ingest address BEFORE it was verified — normally the
   * provider's confirmation email, with any numeric code and confirmation links already extracted.
   *
   * Use this when `get()`'s `email_config.pending_verification` is true: the feed is importing nothing
   * until it is verified, and this is where the code the customer must enter at their provider comes from.
   *
   * SAFETY: an unverified feed accepts mail from anyone, so everything returned here is untrusted input.
   * Check the sender before acting on a link, and never present one as a one-click confirmation.
   */
  async listVerificationChallenges(account_name: string, feed_name: string): Promise<Response<EmailVerificationChallengeResponse[], Problem>> {
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}/${enc(feed_name)}/verification-challenges`);
    return handleResponse(response, async () => (await response.json()) as EmailVerificationChallengeResponse[]);
  }

  /**
   * Confirms that the customer controls the mailbox being connected: the feed stops collecting verification
   * challenges and starts importing mail, sender pinning begins to apply, and the challenges collected so
   * far are purged.
   *
   * Call this only once the customer has actually completed their provider's confirmation step. It records
   * a consent event — who and when — and is never inferred from traffic, because nothing tells us a
   * provider accepted a code; it simply starts forwarding.
   */
  async verify(account_name: string, feed_name: string): Promise<Response<FeedResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/${enc(feed_name)}/verify`, {});
    return handleResponse(response, async () => (await response.json()) as FeedResponse);
  }
}

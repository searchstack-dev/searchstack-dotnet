using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>
/// Feed operations on the data plane: list the connected feeds, read one, pull a sync forward, retune
/// cadence / web crawl scope, connect a credential-light feed, and run an email feed's two operations
/// (backfill and address rotation). All credential-free — connecting a feed that carries a PROVIDER
/// SECRET (Shopify, Notion) and deleting one stay console-plane.
/// </summary>
public sealed class FeedService
{
    private const string Path = "feed";
    private readonly Transport _transport;

    internal FeedService(Transport transport) => _transport = transport;

    /// <summary>Lists the feeds connected to an Account.</summary>
    public Task<Response<List<FeedResponse>>> ListAsync(string accountName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<List<FeedResponse>>($"{Path}/{Enc(accountName)}", cancellationToken);

    /// <summary>Gets one feed with its current non-secret configuration.</summary>
    public Task<Response<FeedDetailResponse>> GetAsync(string accountName, string feedName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<FeedDetailResponse>($"{Path}/{Enc(accountName)}/{Enc(feedName)}", cancellationToken);

    /// <summary>Queues an immediate sync of the feed from its source. An unchanged source stages nothing.</summary>
    public Task<Response> SyncNowAsync(string accountName, string feedName, CancellationToken cancellationToken = default) =>
        _transport.PostAsync($"{Path}/{Enc(accountName)}/{Enc(feedName)}/sync", null, cancellationToken);

    /// <summary>Retunes how often the feed polls its source, in minutes.</summary>
    public Task<Response<FeedResponse>> EditIntervalAsync(string accountName, string feedName, EditFeedIntervalRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<FeedResponse>($"{Path}/{Enc(accountName)}/{Enc(feedName)}/interval", request, cancellationToken);

    /// <summary>
    /// Re-points an API feed at a different URL — the fix for a moved or versioned endpoint, which
    /// otherwise means deleting the feed and reconnecting it. API feeds only.
    /// <para>
    /// A blank <c>ApiAuthValue</c> KEEPS the stored one, so moving an endpoint carries no credential.
    /// Send a value to rotate the key in place; clear <c>ApiAuthHeader</c> to make the endpoint public.
    /// The new endpoint is probed before anything is saved, so a bad URL never overwrites a working feed.
    /// </para>
    /// </summary>
    public Task<Response<FeedResponse>> EditApiEndpointAsync(string accountName, string feedName, EditApiEndpointRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<FeedResponse>($"{Path}/{Enc(accountName)}/{Enc(feedName)}/api-endpoint", request, cancellationToken);

    /// <summary>Re-scopes a website feed (URL pattern, excludes, seeds). Web feeds only.</summary>
    public Task<Response<FeedResponse>> EditWebScopeAsync(string accountName, string feedName, EditWebScopeRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<FeedResponse>($"{Path}/{Enc(accountName)}/{Enc(feedName)}/web-scope", request, cancellationToken);

    /// <summary>
    /// Moves a feed's staged output into a different media store, re-pointing any list bound to its
    /// staged file so imports keep working. The feed then re-syncs and the bound lists re-import (an
    /// idempotent upsert), and the old staged file is removed. Refused for "media-store" feeds (their
    /// store is the source they index) and "email" feeds (their attachments would be left behind), and
    /// while the feed is syncing. Moving to the store it is already on is a safe no-op.
    /// </summary>
    public Task<Response<ChangeFeedMediaStoreResponse>> ChangeMediaStoreAsync(string accountName, string feedName, ChangeFeedMediaStoreRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<ChangeFeedMediaStoreResponse>($"{Path}/{Enc(accountName)}/{Enc(feedName)}/media-store", request, cancellationToken);

    /// <summary>
    /// Connects a credential-light feed (provider "web" or "api") and returns it. Secret-bearing
    /// providers (Shopify, Notion) are rejected — connect those from the console. Requires the
    /// <c>feed:connect</c> permission.
    /// </summary>
    public Task<Response<FeedResponse>> ConnectAsync(string accountName, ConnectFeedRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<FeedResponse>($"{Path}/{Enc(accountName)}/connect", request, cancellationToken);

    /// <summary>Previews the pages a proposed web feed scope would crawl, before connecting anything.</summary>
    public Task<Response<DiscoverWebPagesResponse>> DiscoverWebPagesAsync(string accountName, DiscoverWebPagesRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<DiscoverWebPagesResponse>($"{Path}/{Enc(accountName)}/web/discover", request, cancellationToken);

    /// <summary>
    /// Imports an email feed's history from an <c>.mbox</c> already in the account's own media store into
    /// the list named on the request, through the same parser live mail uses. Send <c>CountOnly</c> first
    /// to learn the archive's size before importing anything.
    /// </summary>
    public Task<Response<BackfillEmailFeedResponse>> BackfillEmailAsync(string accountName, string feedName, BackfillEmailFeedRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<BackfillEmailFeedResponse>($"{Path}/{Enc(accountName)}/{Enc(feedName)}/backfill-email", request, cancellationToken);

    /// <summary>
    /// Issues a new ingest address for an email feed and returns the feed with it. The old address stops
    /// resolving immediately — mail in flight to it will bounce — so anyone forwarding to it must be given
    /// the new address. The pinned sender domains and existing
    /// records are untouched, and so is the staged file the feed has already produced.
    /// </summary>
    public Task<Response<FeedResponse>> RotateIngestAddressAsync(string accountName, string feedName, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<FeedResponse>($"{Path}/{Enc(accountName)}/{Enc(feedName)}/rotate-ingest-address", null, cancellationToken);

    /// <summary>
    /// Changes an email feed's settings: the sender domains it accepts mail from, whether it is enabled,
    /// and whether attachments are stored. The fix for a pinning rule set up wrongly — what the
    /// <c>email.rejected</c> webhook reports. The ingest address is PRESERVED, so existing forwarding rules
    /// keep working; re-issuing it is <see cref="RotateIngestAddressAsync"/>. Send the whole settings block:
    /// every field is required, and at least one sender domain must be given (an address with none accepts
    /// nothing) — to stop the flow, send <c>Enabled = false</c>. Read the current values from
    /// <see cref="GetAsync"/>'s <c>EmailConfig</c>.
    /// </summary>
    public Task<Response<FeedResponse>> EditEmailSettingsAsync(string accountName, string feedName, EditEmailSettingsRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<FeedResponse>($"{Path}/{Enc(accountName)}/{Enc(feedName)}/email-settings", request, cancellationToken);

    /// <summary>
    /// Reads the messages that arrived at an email feed's ingest address BEFORE it was verified — normally
    /// the provider's confirmation email, with any numeric code and confirmation links already extracted.
    /// <para>
    /// Use this when <see cref="GetAsync"/>'s <c>EmailConfig.PendingVerification</c> is true: the feed is
    /// importing nothing until it is verified, and this is where the code the customer must enter at their
    /// provider comes from.
    /// </para>
    /// <para>
    /// SAFETY: an unverified feed accepts mail from anyone, so everything returned here is untrusted input.
    /// Check the sender before acting on a link, and never present one as a one-click confirmation.
    /// </para>
    /// </summary>
    public Task<Response<List<EmailVerificationChallengeResponse>>> ListVerificationChallengesAsync(string accountName, string feedName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<List<EmailVerificationChallengeResponse>>($"{Path}/{Enc(accountName)}/{Enc(feedName)}/verification-challenges", cancellationToken);

    /// <summary>
    /// Confirms that the customer controls the mailbox being connected: the feed stops collecting
    /// verification challenges and starts importing mail, sender pinning begins to apply, and the
    /// challenges collected so far are purged.
    /// <para>
    /// Call this only once the customer has actually completed their provider's confirmation step. It
    /// records a consent event — who and when — and is never inferred from traffic, because nothing tells
    /// us a provider accepted a code; it simply starts forwarding.
    /// </para>
    /// </summary>
    public Task<Response<FeedResponse>> VerifyAsync(string accountName, string feedName, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<FeedResponse>($"{Path}/{Enc(accountName)}/{Enc(feedName)}/verify", new VerifyEmailFeedRequest(), cancellationToken);
}

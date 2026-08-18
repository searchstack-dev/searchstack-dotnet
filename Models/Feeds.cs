using System;
using System.Collections.Generic;

namespace SearchStack.PublicApi;

// Feed models. Property names map to the wire via the snake_case policy (see Json.cs). A feed mirrors
// an external source (a website's pages, a Shopify catalog, an HTTPS endpoint) into a synced file in a
// media store; import that file into a list to make it searchable. Credentials never leave the server.

/// <summary>A feed as the data plane sees it — credential-free.</summary>
public sealed class FeedResponse
{
    public string AccountName { get; set; } = "";
    public string FeedName { get; set; } = "";
    public string Provider { get; set; } = "";
    public string StoreName { get; set; } = "";
    public string FilePath { get; set; } = "";
    public int SyncIntervalMinutes { get; set; }
    /// <summary>When the producer last polled the source (epoch millis); null until the first poll.</summary>
    public long? LastCheckedUtc { get; set; }
    /// <summary>True once the producer has staged at least once.</summary>
    public bool HasSynced { get; set; }
    /// <summary>
    /// True while a sync of this feed is queued or running. Calling sync-now on a feed already syncing is
    /// refused, so check this before asking for one — and before reading "last checked" as settled, since
    /// a run in flight is about to move it.
    /// </summary>
    public bool IsSyncing { get; set; }
    /// <summary>
    /// Why the last sync failed, in words you can act on ("The endpoint did not respond in time"), and
    /// when it failed (epoch millis). Both null once a sync succeeds. Check this rather than inferring
    /// health from <see cref="LastCheckedUtc"/>: a failed run stamps that too, because it means "when we
    /// last tried". A feed can fail indefinitely without any other signal — the platform treats an
    /// unreachable source as yours to fix, not an outage to alert on.
    /// </summary>
    public string? LastError { get; set; }
    /// <inheritdoc cref="LastError"/>
    public long? LastErrorUtc { get; set; }
    public long CreatedUtc { get; set; }
}

/// <summary>A web feed's crawl scope (no secret).</summary>
public sealed class WebFeedConfigResponse
{
    public string UrlPattern { get; set; } = "";
    public List<string> UrlExcludes { get; set; } = new();
    public List<string> UrlSeeds { get; set; } = new();
}

/// <summary>A Shopify feed's non-secret config: the shop domain only.</summary>
public sealed class ShopifyFeedConfigResponse
{
    public string ShopDomain { get; set; } = "";
}

/// <summary>An API feed's non-secret config: the endpoint URL and, if authenticated, the header name only.</summary>
public sealed class ApiFeedConfigResponse
{
    public string Url { get; set; } = "";
    public string AuthHeader { get; set; } = "";
}

/// <summary>
/// An email feed's editable settings. The ingest address is not here — it is a write credential, offered
/// once on the feed summary — and neither is the target list, which is fixed at connect time.
/// </summary>
public sealed class EmailFeedConfigResponse
{
    public List<string> AllowedSenderDomains { get; set; } = new();

    /// <summary>
    /// False means the address still resolves and every message is refused: the flow stops without anything
    /// being deleted, and turning it back on needs no new forwarding rule.
    /// </summary>
    public bool Enabled { get; set; }

    public bool StoreAttachments { get; set; }

    /// <summary>
    /// Whether an unverified feed's incoming mail is also sent on to the account owner's mailbox, so a
    /// provider's confirmation can be completed there. On unless the customer switched it off.
    /// </summary>
    public bool ForwardConfirmations { get; set; }

    /// <summary>
    /// True while the feed is collecting verification challenges and importing NOTHING. Providers will not
    /// forward to a new address until someone proves they control the mailbox, so a feed sits here until
    /// that is done. Read the confirmation code with
    /// <c>ListVerificationChallengesAsync</c>, then call <c>VerifyAsync</c> once the customer has completed
    /// their provider's step.
    /// <para>
    /// Check this before concluding a feed is idle: "connected but importing nothing" and "connected and no
    /// mail has arrived" look identical without it.
    /// </para>
    /// </summary>
    public bool PendingVerification { get; set; }

    /// <summary>When verification happened, and who performed it. Null while pending.</summary>
    public DateTimeOffset? VerifiedUtc { get; set; }

    public string? VerifiedBy { get; set; }
}

/// <summary>
/// A message that arrived at an ingest address before the feed was verified — normally the provider's
/// confirmation mail.
/// <para>
/// TREAT EVERY FIELD AS UNTRUSTED. An unverified feed accepts mail from anyone, because the provider's
/// confirmation comes from the provider's domain and not the customer's, so sender pinning cannot apply
/// yet. Check <see cref="FromAddress"/> before acting on anything here, and never present a
/// <see cref="Urls"/> entry to a person as a one-click confirmation.
/// </para>
/// </summary>
public sealed class EmailVerificationChallengeResponse
{
    public string ChallengeId { get; set; } = string.Empty;

    public DateTimeOffset ReceivedUtc { get; set; }

    /// <summary>Codes expire at the provider, so the age decides whether to use this one or ask for another.</summary>
    public DateTimeOffset ExpiresUtc { get; set; }

    public string? FromAddress { get; set; }

    public string? Subject { get; set; }

    /// <summary>Ranked best-first. More than one is offered because ranking can be wrong.</summary>
    public List<string> Codes { get; set; } = new();

    public List<string> Urls { get; set; } = new();

    /// <summary>The message text, bounded — so a code the extractor missed is still recoverable.</summary>
    public string BodyExcerpt { get; set; } = string.Empty;
}

/// <summary>
/// Confirm that the customer controls the mailbox being connected. The actor recorded is the calling API
/// key, so this body carries nothing that changes the outcome.
/// </summary>
public sealed class VerifyEmailFeedRequest
{
    /// <summary>Ignored by the server in favour of the calling principal.</summary>
    public string? VerifiedBy { get; set; }
}

/// <summary>A feed with its current non-secret configuration. Exactly one config block matches the provider.</summary>
public sealed class FeedDetailResponse
{
    public FeedResponse Feed { get; set; } = new();
    public WebFeedConfigResponse? WebConfig { get; set; }
    public ShopifyFeedConfigResponse? ShopifyConfig { get; set; }
    public ApiFeedConfigResponse? ApiConfig { get; set; }
    public EmailFeedConfigResponse? EmailConfig { get; set; }
}

/// <summary>
/// Change an email feed's settings after it is connected. The first three fields are required — this is the
/// whole settings block sent back as a unit, so a caller that omits <see cref="Enabled"/> cannot switch a
/// feed off by accident.
/// </summary>
public sealed class EditEmailSettingsRequest
{
    /// <summary>
    /// At least one, as at connect time: an address with no pins accepts nothing. To stop the flow, set
    /// <see cref="Enabled"/> false — that is what the switch is for, and it is reversible.
    /// </summary>
    public List<string> AllowedSenderDomains { get; set; } = new();

    public bool Enabled { get; set; }

    public bool StoreAttachments { get; set; }

    /// <summary>
    /// While the feed is unverified, send what arrives on to the account owner's mailbox so a provider's
    /// confirmation can be completed there. Off changes exactly one thing — no mail is sent; the message is
    /// still stored, still readable with <c>ListVerificationChallengesAsync</c>, and the feed still imports
    /// nothing until it is verified.
    /// <para>
    /// The one optional field here: null means LEAVE UNCHANGED. It arrived after this request was already
    /// published, so requiring it would reject callers written before it existed.
    /// </para>
    /// </summary>
    public bool? ForwardConfirmations { get; set; }
}

/// <summary>Retune a feed's sync cadence.</summary>
public sealed class EditFeedIntervalRequest
{
    public int SyncIntervalMinutes { get; set; }
}

/// <summary>
/// Move a feed's staged output into a different media store — the fix when the store it was connected
/// to is full or is the wrong one. Both ends move: the feed's staging target and any list bound to its
/// staged file.
/// </summary>
public sealed class ChangeFeedMediaStoreRequest
{
    /// <summary>The media store the feed should write into.</summary>
    public string StoreName { get; set; } = "";
}

/// <summary>
/// The result of moving a feed. <see cref="UnrepointedLists"/> is the field worth checking: a bound list
/// that could not be re-pointed imports nothing until the move is re-run.
/// </summary>
public sealed class ChangeFeedMediaStoreResponse
{
    public FeedResponse? Feed { get; set; }

    /// <summary>Lists whose import binding followed the feed to the new store.</summary>
    public List<string> RepointedLists { get; set; } = [];

    /// <summary>Lists still pointing at the old store. These import nothing until the move is re-run.</summary>
    public List<string> UnrepointedLists { get; set; } = [];
}

/// <summary>
/// Re-point an API feed at a different endpoint, without re-entering its auth value.
/// <para>
/// <see cref="ApiAuthValue"/> is optional and blank means KEEP: send the URL alone and the stored value is
/// preserved, so moving an endpoint needs no credential. Send a value to rotate the key in place. Clearing
/// <see cref="ApiAuthHeader"/> is how you say the endpoint is now public, and it drops the stored value with it.
/// </para>
/// </summary>
public sealed class EditApiEndpointRequest
{
    /// <summary>The new HTTPS endpoint. Probed against the live source before anything is saved.</summary>
    public string ApiUrl { get; set; } = "";

    /// <summary>The header to authenticate with, or empty/null for a public endpoint.</summary>
    public string? ApiAuthHeader { get; set; }

    /// <summary>Blank or omitted keeps the stored value. Send a value only to replace it.</summary>
    public string? ApiAuthValue { get; set; }
}

/// <summary>Re-scope a website feed.</summary>
public sealed class EditWebScopeRequest
{
    public string UrlPattern { get; set; } = "";
    public List<string>? UrlExcludes { get; set; }
    public List<string>? UrlSeeds { get; set; }
}

/// <summary>
/// Connect a credential-light feed. <see cref="Provider"/> must be "web" (a site crawl), "api" (an HTTPS
/// endpoint), "rss" (a public feed URL) or "email" (an ingest address mail is forwarded to).
/// Secret-bearing providers (Shopify, Notion) are console-plane and rejected here.
/// </summary>
public sealed class ConnectFeedRequest
{
    public string FeedName { get; set; } = "";
    /// <summary>"web", "api", "rss" or "email".</summary>
    public string Provider { get; set; } = "";
    /// <summary>Media store to write into; omit for the platform "default" store.</summary>
    public string? StoreName { get; set; }
    public int? SyncIntervalMinutes { get; set; }

    // web: the trailing-* crawl pattern plus optional review-list refinements.
    public string? UrlPattern { get; set; }
    public List<string>? UrlExcludes { get; set; }
    public List<string>? UrlSeeds { get; set; }

    // api: an HTTPS endpoint returning JSON/NDJSON, plus an optional single auth header (name + value).
    public string? ApiUrl { get; set; }
    public string? ApiAuthHeader { get; set; }
    public string? ApiAuthValue { get; set; }

    // rss: a single public feed URL.
    public string? RssUrl { get; set; }

    // email: the sender domains the address accepts mail from. No credential — we never connect to a
    // mailbox — and the address token is issued server-side, never accepted from here. At least one domain
    // is required: an address with none accepts nothing.
    //
    // No list: an email feed stages feeds/{feed}.ndjson like every other feed, and lists bind that file
    // afterwards, so one mail stream can feed several lists.
    public List<string>? AllowedSenderDomains { get; set; }

    /// <summary>
    /// Email: write attachments into the feed's media store so their CONTENT is searchable, not just their
    /// file names. Off by default — attachments are most of a mailbox's bytes and they land in the
    /// customer's own store. Change it afterwards with <c>EditEmailSettingsAsync</c>.
    /// </summary>
    public bool? StoreAttachments { get; set; }

    /// <summary>
    /// Email: while the feed is unverified, send whatever arrives at its address on to the account owner's
    /// mailbox, so a provider's confirmation can be completed there. ON when omitted — the opposite default
    /// from <see cref="StoreAttachments"/>, because a customer who never sees the confirmation cannot finish
    /// setup. Worth turning off when the source sends no confirmation at all; not every provider does.
    /// </summary>
    public bool? ForwardConfirmations { get; set; }
}

/// <summary>
/// Import an email feed's history from an <c>.mbox</c> already in the account's own media store. Not an
/// upload: a mail export is measured in gigabytes, so the file goes into the store and is streamed from
/// there.
/// </summary>
public sealed class BackfillEmailFeedRequest
{
    /// <summary>
    /// Which list the archive imports into. Named per call because the feed itself names no list — live
    /// mail is staged to a file that any number of lists may bind — so the same archive can be imported
    /// into more than one.
    /// </summary>
    public string ListName { get; set; } = "";

    /// <summary>The .mbox file in the feed's media store.</summary>
    public string MediaName { get; set; } = "";

    /// <summary>Count the messages and report, importing nothing. Call this first to size the job.</summary>
    public bool CountOnly { get; set; }
}

public sealed class BackfillEmailFeedResponse
{
    public long MessageCount { get; set; }
    public int Imported { get; set; }

    /// <summary>Messages the parser could not read. One broken message in a long archive is never fatal.</summary>
    public int Skipped { get; set; }

    public bool CountOnly { get; set; }
}

/// <summary>Preview the pages a proposed web feed scope would crawl.</summary>
public sealed class DiscoverWebPagesRequest
{
    public string UrlPattern { get; set; } = "";
    public List<string>? UrlExcludes { get; set; }
    public List<string>? UrlSeeds { get; set; }
}

public sealed class DiscoveredWebPageResponse
{
    public string Url { get; set; } = "";
    public string Title { get; set; } = "";
}

public sealed class DiscoverWebPagesResponse
{
    public List<DiscoveredWebPageResponse> Pages { get; set; } = new();
    /// <summary>True when the preview ceiling was hit (discovery continues after connect).</summary>
    public bool Truncated { get; set; }
}

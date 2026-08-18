using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>
/// Webhook subscription management: list the event catalog, create / edit / remove a subscription, and
/// fire a test delivery. The Webhook permissions are carryable on an API key. Secret view/rotate,
/// delivery-log reads and resume stay console-plane.
/// </summary>
public sealed class WebhookService
{
    private const string Path = "webhook";
    private readonly Transport _transport;

    internal WebhookService(Transport transport) => _transport = transport;

    /// <summary>Lists the catalog of subscribable event types, grouped for display.</summary>
    public Task<Response<List<WebhookEventGroupResponse>>> ListEventsAsync(CancellationToken cancellationToken = default) =>
        _transport.GetAsync<List<WebhookEventGroupResponse>>($"{Path}/events", cancellationToken);

    /// <summary>
    /// Creates a webhook subscription. The response includes the signing secret exactly once — store it
    /// now; it cannot be retrieved again from the data plane.
    /// </summary>
    public Task<Response<WebhookSubscriptionWithSecretResponse>> CreateAsync(CreateWebhookSubscriptionRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<WebhookSubscriptionWithSecretResponse>(Path, request, cancellationToken);

    /// <summary>Updates the target URL and/or subscribed event types of a subscription.</summary>
    public Task<Response<WebhookSubscriptionResponse>> EditAsync(string accountName, string id, EditWebhookSubscriptionRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<WebhookSubscriptionResponse>($"{Path}/{Enc(accountName)}/{Enc(id)}", request, cancellationToken);

    /// <summary>Permanently removes a subscription.</summary>
    public Task<Response> RemoveAsync(string accountName, string id, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync($"{Path}/{Enc(accountName)}/{Enc(id)}", cancellationToken);

    /// <summary>Fires a synthetic test delivery. Resolves once accepted (HTTP 202).</summary>
    public Task<Response> TestAsync(string accountName, string id, CancellationToken cancellationToken = default) =>
        _transport.PostAsync($"{Path}/{Enc(accountName)}/{Enc(id)}/test", null, cancellationToken);
}

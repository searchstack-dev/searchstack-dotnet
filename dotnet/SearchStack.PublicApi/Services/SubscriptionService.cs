using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace SearchStack.PublicApi;

/// <summary>
/// Starting a subscription: the catalog (providers, plans, search services — which is also the REGION
/// catalog) and the three ways a subscription can begin.
/// <para>
/// None of these charges anything on the call, and none is a way to avoid paying.
/// <see cref="CheckoutAsync"/> refuses every $0 plan and returns a Stripe URL a person still has to open
/// and pay at — the subscription appears afterwards, and the <c>subscription.created</c> webhook (origin
/// <c>checkout</c>) is the signal that it did. Free BYO is $0 because it runs on YOUR OWN backend: managed
/// plans and shared search services are refused on that path.
/// </para>
/// <para>
/// The free unlimited internal plan, cancelling, auto-upgrade configuration and the billing portal are
/// deliberately absent: those stay console-plane and their permissions are not carryable on an API key.
/// </para>
/// </summary>
public sealed class SubscriptionService
{
    private const string Path = "subscription";
    private readonly Transport _transport;

    internal SubscriptionService(Transport transport) => _transport = transport;

    /// <summary>Lists the providers a subscription can run on. Plans are per-provider, so start here.</summary>
    public Task<Response<SubscriptionProvidersResponse>> GetProvidersAsync(CancellationToken cancellationToken = default) =>
        _transport.GetAsync<SubscriptionProvidersResponse>($"{Path}/providers", cancellationToken);

    /// <summary>Lists the purchasable plans on a provider, with prices and every limit they carry.</summary>
    public Task<Response<List<SubscriptionPlanResponse>>> GetPlansAsync(string provider, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<List<SubscriptionPlanResponse>>($"{Path}/plans/{Url.Enc(provider)}", cancellationToken);

    /// <summary>Lists the $0 plans that run on your own search backend. Started directly, never bought.</summary>
    public Task<Response<List<SubscriptionPlanResponse>>> GetFreePlansAsync(string provider, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<List<SubscriptionPlanResponse>>($"{Path}/free-plans/{Url.Enc(provider)}", cancellationToken);

    /// <summary>
    /// Lists the search services a subscription can bind to: the shared managed pool plus your own. Each
    /// entry carries its region, so this is how you discover which regions a subscription can be placed in.
    /// </summary>
    public Task<Response<List<SubscriptionSearchServiceResponse>>> GetSearchServicesAsync(string accountName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<List<SubscriptionSearchServiceResponse>>($"{Path}/search-services/{Url.Enc(accountName)}", cancellationToken);

    /// <summary>
    /// Creates a Stripe checkout session for a paid plan and returns its URL. NOTHING IS CHARGED and no
    /// subscription exists yet — a person has to open the URL and pay. Requires <c>subscription:create</c>.
    /// </summary>
    public Task<Response<SubscriptionCheckoutResponse>> CheckoutAsync(string accountName, SubscriptionCheckoutRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<SubscriptionCheckoutResponse>($"{Path}/checkout/{Url.Enc(accountName)}", request, cancellationToken);

    /// <summary>
    /// Activates a $0 bring-your-own plan on one of your own search services, immediately. One free BYO
    /// subscription per search service. Requires <c>subscription:create</c>.
    /// </summary>
    public Task<Response<SubscriptionResponse>> StartFreeByoAsync(string accountName, StartFreeByoSubscriptionRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<SubscriptionResponse>($"{Path}/start-free-byo/{Url.Enc(accountName)}", request, cancellationToken);

}

import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import {
  Response,
  Problem,
  SubscriptionResponse,
  SubscriptionPlanResponse,
  SubscriptionProvidersResponse,
  SubscriptionSearchServiceResponse,
  SubscriptionCheckoutRequest,
  SubscriptionCheckoutResponse,
  StartFreeByoSubscriptionRequest,
} from "./Types.js";

const enc = encodeURIComponent;

// Starting a subscription: the catalog (providers, plans, search services — which is also the REGION
// catalog) and the start paths. None of these charges anything on the call, and none is a way to avoid
// paying: checkout refuses every $0 plan and returns a Stripe URL a person still has to pay at, and free
// BYO is $0 because it runs on YOUR OWN backend (managed plans and shared search services are refused).
//
// The free unlimited internal plan, cancelling, auto-upgrade configuration and the billing portal are
// deliberately absent: those stay console-plane and their permissions are not carryable on an API key.
export default class SubscriptionService {
  private readonly path = `subscription`;
  constructor(private readonly fetch: Fetch) {}

  /** Lists the providers a subscription can run on. Plans are per-provider, so start here. */
  async getProviders(): Promise<Response<SubscriptionProvidersResponse, Problem>> {
    const response = await this.fetch.get(`${this.path}/providers`);
    return handleResponse(response, async () => (await response.json()) as SubscriptionProvidersResponse);
  }

  /** Lists the purchasable plans on a provider, with prices and every limit they carry. */
  async getPlans(provider: string): Promise<Response<SubscriptionPlanResponse[], Problem>> {
    const response = await this.fetch.get(`${this.path}/plans/${enc(provider)}`);
    return handleResponse(response, async () => (await response.json()) as SubscriptionPlanResponse[]);
  }

  /** Lists the $0 plans that run on your own search backend. Started directly, never bought. */
  async getFreePlans(provider: string): Promise<Response<SubscriptionPlanResponse[], Problem>> {
    const response = await this.fetch.get(`${this.path}/free-plans/${enc(provider)}`);
    return handleResponse(response, async () => (await response.json()) as SubscriptionPlanResponse[]);
  }

  /**
   * Lists the search services a subscription can bind to: the shared managed pool plus your own. Each
   * entry carries its region, so this is how you discover which regions a subscription can be placed in.
   */
  async getSearchServices(account_name: string): Promise<Response<SubscriptionSearchServiceResponse[], Problem>> {
    const response = await this.fetch.get(`${this.path}/search-services/${enc(account_name)}`);
    return handleResponse(response, async () => (await response.json()) as SubscriptionSearchServiceResponse[]);
  }

  /**
   * Creates a Stripe checkout session for a paid plan and returns its URL. NOTHING IS CHARGED and no
   * subscription exists yet — a person has to open the URL and pay. Requires `subscription:create`.
   */
  async checkout(account_name: string, request: SubscriptionCheckoutRequest): Promise<Response<SubscriptionCheckoutResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/checkout/${enc(account_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as SubscriptionCheckoutResponse);
  }

  /**
   * Activates a $0 bring-your-own plan on one of your own search services, immediately. One free BYO
   * subscription per search service. Requires `subscription:create`.
   */
  async startFreeByo(account_name: string, request: StartFreeByoSubscriptionRequest): Promise<Response<SubscriptionResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/start-free-byo/${enc(account_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as SubscriptionResponse);
  }

}

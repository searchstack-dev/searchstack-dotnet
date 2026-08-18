import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import {
  Response,
  Problem,
  CreateWebhookSubscriptionRequest,
  EditWebhookSubscriptionRequest,
  WebhookSubscriptionResponse,
  WebhookSubscriptionWithSecretResponse,
  WebhookEventGroupResponse,
} from "./Types.js";

const enc = encodeURIComponent;

// Webhook subscription management: list the event catalog, create/edit/remove a subscription, and fire
// a test delivery. Secret view/rotate, delivery-log reads and resume stay console-plane.
export default class WebhookService {
  private readonly path = `webhook`;
  constructor(private readonly fetch: Fetch) {}

  /** Lists the catalog of subscribable event types, grouped for display. */
  async listEvents(): Promise<Response<WebhookEventGroupResponse[], Problem>> {
    const response = await this.fetch.get(`${this.path}/events`);
    return handleResponse(response, async () => (await response.json()) as WebhookEventGroupResponse[]);
  }

  /**
   * Creates a webhook subscription. The response includes the signing secret exactly once — store it
   * now; it cannot be retrieved again from the data plane.
   */
  async create(request: CreateWebhookSubscriptionRequest): Promise<Response<WebhookSubscriptionWithSecretResponse, Problem>> {
    const response = await this.fetch.post(this.path, request);
    return handleResponse(response, async () => (await response.json()) as WebhookSubscriptionWithSecretResponse);
  }

  /** Updates the target URL and/or subscribed event types of a subscription. */
  async edit(account_name: string, id: string, request: EditWebhookSubscriptionRequest): Promise<Response<WebhookSubscriptionResponse, Problem>> {
    const response = await this.fetch.put(`${this.path}/${enc(account_name)}/${enc(id)}`, request);
    return handleResponse(response, async () => (await response.json()) as WebhookSubscriptionResponse);
  }

  /** Permanently removes a subscription. */
  async remove(account_name: string, id: string): Promise<Response<void, Problem>> {
    const response = await this.fetch.delete(`${this.path}/${enc(account_name)}/${enc(id)}`);
    return handleResponse(response, () => undefined);
  }

  /** Fires a synthetic test delivery. Resolves once accepted (HTTP 202). */
  async test(account_name: string, id: string): Promise<Response<void, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/${enc(id)}/test`, {});
    return handleResponse(response, () => undefined);
  }
}

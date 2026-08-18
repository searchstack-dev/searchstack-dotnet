import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import {
  Response,
  Problem,
  WatchResponse,
  WatchMatchResponse,
  WatchPrecisionResponse,
  CreateWatchRequest,
  EditWatchRequest,
  WatchFeedbackRequest,
} from "./Types.js";

const enc = encodeURIComponent;

// Watches: standing queries. A query registered once, re-run on a cadence, alerting only on
// records it has not already alerted on — optionally vetted by a Judge before it counts as a match.
export default class WatchService {
  private readonly path = `watch`;
  constructor(private readonly fetch: Fetch) {}

  /** Lists the Watches in an Account, optionally filtered to one list. */
  async list(account_name: string, options?: { list_name?: string }): Promise<Response<WatchResponse[], Problem>> {
    const suffix = options?.list_name ? `?list_name=${enc(options.list_name)}` : "";
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}${suffix}`);
    return handleResponse(response, async () => (await response.json()) as WatchResponse[]);
  }

  /** Retrieves a single Watch. */
  async get(account_name: string, watch_name: string): Promise<Response<WatchResponse, Problem>> {
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}/${enc(watch_name)}`);
    return handleResponse(response, async () => (await response.json()) as WatchResponse);
  }

  /** A Watch's alert history, newest first. */
  async matches(account_name: string, watch_name: string, take?: number): Promise<Response<WatchMatchResponse[], Problem>> {
    const suffix = take === undefined ? "" : `?take=${take}`;
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}/${enc(watch_name)}/matches${suffix}`);
    return handleResponse(response, async () => (await response.json()) as WatchMatchResponse[]);
  }

  /** Creates a Watch against one pinned version of a list. */
  async create(account_name: string, request: CreateWatchRequest): Promise<Response<WatchResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as WatchResponse);
  }

  /** Rates one of a Watch's alerts (confirm/dismiss) and returns its precision so far. */
  async feedback(account_name: string, watch_name: string, request: WatchFeedbackRequest): Promise<Response<WatchPrecisionResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/${enc(watch_name)}/feedback`, request);
    return handleResponse(response, async () => (await response.json()) as WatchPrecisionResponse);
  }

  /** Re-tunes or pauses a Watch. A full replace: omitted fields revert to their defaults. */
  async edit(account_name: string, watch_name: string, request: EditWatchRequest): Promise<Response<WatchResponse, Problem>> {
    const response = await this.fetch.put(`${this.path}/${enc(account_name)}/${enc(watch_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as WatchResponse);
  }

  /**
   * Queues an immediate check of the Watch, ahead of its cadence. The same check the sweep runs, not a
   * preview: it searches, judges, records matches and delivers. Refused for a paused Watch.
   */
  async checkNow(account_name: string, watch_name: string): Promise<Response<void, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/${enc(watch_name)}/check`, {});
    return handleResponse(response, () => undefined);
  }

  /** Deletes a Watch and everything scoped to it. */
  async delete(account_name: string, watch_name: string): Promise<Response<void, Problem>> {
    const response = await this.fetch.delete(`${this.path}/${enc(account_name)}/${enc(watch_name)}`);
    return handleResponse(response, () => undefined);
  }
}

import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import { Response, Problem, AnalyticsReportResponse } from "./Types.js";

export default class AnalyticsService {
  private readonly path = `analytics`;
  constructor(private readonly fetch: Fetch) {}

  /** Top searches, zero-result queries, volume and click-through for a List. */
  async getList(account_name: string, list_name: string, from?: string, to?: string): Promise<Response<AnalyticsReportResponse, Problem>> {
    const path = `${this.path}/list/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}${buildRangeQuery(from, to)}`;
    const response = await this.fetch.get(path);
    return handleResponse(response, async () => (await response.json()) as AnalyticsReportResponse);
  }

  /** Top searches, zero-result queries, volume and click-through for a Group. */
  async getGroup(account_name: string, group_name: string, from?: string, to?: string): Promise<Response<AnalyticsReportResponse, Problem>> {
    const path = `${this.path}/group/${encodeURIComponent(account_name)}/${encodeURIComponent(group_name)}${buildRangeQuery(from, to)}`;
    const response = await this.fetch.get(path);
    return handleResponse(response, async () => (await response.json()) as AnalyticsReportResponse);
  }
}

// Both endpoints take optional `from`/`to` UTC dates (yyyy-MM-dd); omit them to
// let the API default to the last 30 days.
function buildRangeQuery(from?: string, to?: string): string {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  return query ? `?${query}` : "";
}

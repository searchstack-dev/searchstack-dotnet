import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import { Response, Problem, AskOptions, AskResponse } from "./Types.js";

/**
 * Ask: one call that retrieves from your own records and answers from them, citing what it used.
 *
 * Needs the `ask:run` permission on the API key — deliberately separate from `search-result:read`, because
 * an Ask spends money at your OWN model provider through the Judge whose model and credential it runs on.
 *
 * A refusal is a normal success: `answered` is false, `reason` says why, and `results` still carries the
 * records that matched.
 */
export default class AskService {
  private readonly path = `ask`;
  constructor(private readonly fetch: Fetch) {}

  /** Answers a question from the records in a List version, citing the records it used. */
  async list(account_name: string, list_name: string, version: number, options: AskOptions): Promise<Response<AskResponse, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${version}`;
    const response = await this.fetch.post(path, options);
    return handleResponse(response, async () => (await response.json()) as AskResponse);
  }

  /**
   * Answers a question from the records across a Group of Lists at a given membership version. Pass
   * `"latest"` to always ask the Group's current version, the Group's current_version to pin it, or an
   * older version to ask a frozen set of records.
   */
  async group(account_name: string, group_name: string, version: number | "latest", options: AskOptions): Promise<Response<AskResponse, Problem>> {
    const path = `${this.path}/group/${encodeURIComponent(account_name)}/${encodeURIComponent(group_name)}/${version}`;
    const response = await this.fetch.post(path, options);
    return handleResponse(response, async () => (await response.json()) as AskResponse);
  }
}

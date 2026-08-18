import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import { Response, Problem, Suggestion, SuggestOptions } from "./Types.js";

// Typeahead suggestions. Uses the POST variants so options are passed as a typed
// body. The query text is part of the route, so it is encoded into the path.
export default class SuggestService {
  private readonly path = `suggest`;
  constructor(private readonly fetch: Fetch) {}

  /** Typeahead suggestions within a List version. */
  async list(account_name: string, list_name: string, version: number, query: string, options: SuggestOptions = {}): Promise<Response<Suggestion[], Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${version}/${encodeURIComponent(query)}`;
    const response = await this.fetch.post(path, options);
    return handleResponse(response, async () => (await response.json()) as Suggestion[]);
  }

  /**
   * Typeahead suggestions within a Group of Lists at a given membership version. Pass `"latest"` to always
   * suggest against the Group's current version, the Group's current_version to pin it, or an older version
   * to suggest over a frozen set of records.
   */
  async group(account_name: string, group_name: string, version: number | "latest", query: string, options: SuggestOptions = {}): Promise<Response<Suggestion[], Problem>> {
    // The suggest route takes an integer version segment; the server already treats 0 as "current",
    // so "latest" maps to 0 here (the group-search endpoints additionally accept the literal "latest").
    const versionSegment = version === "latest" ? 0 : version;
    const path = `${this.path}/group/${encodeURIComponent(account_name)}/${encodeURIComponent(group_name)}/${versionSegment}/${encodeURIComponent(query)}`;
    const response = await this.fetch.post(path, options);
    return handleResponse(response, async () => (await response.json()) as Suggestion[]);
  }
}

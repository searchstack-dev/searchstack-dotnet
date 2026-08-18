import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import {
  Response, Problem, SearchResponse, ExtractDocumentTextResponse,
  SearchOptions, RelatedOptions, SearchByImageRequest, SearchByImageBase64Request, RecordClickRequest,
} from "./Types.js";

// Read / query operations against the search endpoints. Every method uses
// the POST variant so options are passed as a typed body rather than a query
// string. Searching requires the SearchResult.Read permission on the API key.
export default class SearchService {
  private readonly path = `search`;
  constructor(private readonly fetch: Fetch) {}

  /** Free-text and/or vector search of a List version. */
  async searchList(account_name: string, list_name: string, version: number, options: SearchOptions = {}): Promise<Response<SearchResponse, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${version}`;
    const response = await this.fetch.post(path, options);
    return handleResponse(response, async () => (await response.json()) as SearchResponse);
  }

  /** Free-text and/or vector search across a Group of Lists at a given membership version. Pass `"latest"` to always search the Group's current version (resolved server-side), the Group's current_version to pin it, or an older version to search a frozen set of records. */
  async searchGroup(account_name: string, group_name: string, version: number | "latest", options: SearchOptions = {}): Promise<Response<SearchResponse, Problem>> {
    const path = `${this.path}/group/${encodeURIComponent(account_name)}/${encodeURIComponent(group_name)}/${version}`;
    const response = await this.fetch.post(path, options);
    return handleResponse(response, async () => (await response.json()) as SearchResponse);
  }

  /** Finds Search Results within a List that are vector-similar to a seed result. */
  async related(account_name: string, list_name: string, search_result_name: string, options: RelatedOptions = {}): Promise<Response<SearchResponse, Problem>> {
    const path = `${this.path}/related/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${encodeURIComponent(search_result_name)}`;
    const response = await this.fetch.post(path, options);
    return handleResponse(response, async () => (await response.json()) as SearchResponse);
  }

  /** Image-similarity search of a List using an absolute image URL. */
  async searchListByImage(account_name: string, list_name: string, version: number, request: SearchByImageRequest): Promise<Response<SearchResponse, Problem>> {
    const path = `${this.path}/images/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${version}`;
    const response = await this.fetch.post(path, request);
    return handleResponse(response, async () => (await response.json()) as SearchResponse);
  }

  /** Image-similarity search of a Group at a given membership version using an absolute image URL. Pass `"latest"` to always search the Group's current version (resolved server-side). */
  async searchGroupByImage(account_name: string, group_name: string, version: number | "latest", request: SearchByImageRequest): Promise<Response<SearchResponse, Problem>> {
    const path = `${this.path}/images/group/${encodeURIComponent(account_name)}/${encodeURIComponent(group_name)}/${version}`;
    const response = await this.fetch.post(path, request);
    return handleResponse(response, async () => (await response.json()) as SearchResponse);
  }

  /** Image-similarity search of a List using a base64-encoded image. */
  async searchListByImageBase64(account_name: string, list_name: string, version: number, request: SearchByImageBase64Request): Promise<Response<SearchResponse, Problem>> {
    const path = `${this.path}/images/base64/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${version}`;
    const response = await this.fetch.post(path, request);
    return handleResponse(response, async () => (await response.json()) as SearchResponse);
  }

  /** Image-similarity search of a Group at a given membership version using a base64-encoded image. Pass `"latest"` to always search the Group's current version (resolved server-side). */
  async searchGroupByImageBase64(account_name: string, group_name: string, version: number | "latest", request: SearchByImageBase64Request): Promise<Response<SearchResponse, Problem>> {
    const path = `${this.path}/images/base64/group/${encodeURIComponent(account_name)}/${encodeURIComponent(group_name)}/${version}`;
    const response = await this.fetch.post(path, request);
    return handleResponse(response, async () => (await response.json()) as SearchResponse);
  }

  /**
   * Extracts text from PDF documents on a Search Result. Only available when the
   * List's model declares a positive MaxDocumentPages limit.
   */
  async extractDocumentText(account_name: string, list_name: string, search_result_name: string): Promise<Response<ExtractDocumentTextResponse, Problem>> {
    const path = `search-result/document-text/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${encodeURIComponent(search_result_name)}`;
    const response = await this.fetch.get(path);
    return handleResponse(response, async () => (await response.json()) as ExtractDocumentTextResponse);
  }

  /** Records a click-through on a List search result, correlated by query_id. */
  async recordListClick(account_name: string, list_name: string, request: RecordClickRequest): Promise<Response<void, Problem>> {
    const path = `${this.path}/analytics/click/list/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}`;
    const response = await this.fetch.post(path, request);
    return handleResponse(response, () => undefined);
  }

  /** Records a click-through on a Group search result, correlated by query_id. */
  async recordGroupClick(account_name: string, group_name: string, request: RecordClickRequest): Promise<Response<void, Problem>> {
    const path = `${this.path}/analytics/click/group/${encodeURIComponent(account_name)}/${encodeURIComponent(group_name)}`;
    const response = await this.fetch.post(path, request);
    return handleResponse(response, () => undefined);
  }
}

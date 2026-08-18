import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import {
  Response, Problem, ListResponse, ListIdentityResponse, ListRestoreResponse, ListCloneResponse,
  CreateListRequest, UpdateListRequest, CloneListRequest, SetListSynonymsRequest,
} from "./Types.js";

export default class ListService {
  private readonly path = `list`;
  constructor(private readonly fetch: Fetch) {}

  /** Creates a List - a collection of related Search Results. */
  async create(request: CreateListRequest): Promise<Response<ListIdentityResponse, Problem>> {
    const response = await this.fetch.post(this.path, request);
    return handleResponse(response, async () => (await response.json()) as ListIdentityResponse);
  }

  /** Clones a List: same configuration (schema, settings, model, reranker, query rules, gate attachments), none of the Search Results. */
  async clone(account_name: string, list_name: string, request: CloneListRequest): Promise<Response<ListCloneResponse, Problem>> {
    const path = `${this.path}/clone/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}`;
    const response = await this.fetch.post(path, request);
    return handleResponse(response, async () => (await response.json()) as ListCloneResponse);
  }

  /** Retrieves the details of a List. */
  async get(account_name: string, list_name: string): Promise<Response<ListResponse, Problem>> {
    const response = await this.fetch.get(`${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}`);
    return handleResponse(response, async () => (await response.json()) as ListResponse);
  }

  /** Edits List defaults and settings. */
  async edit(account_name: string, list_name: string, request: UpdateListRequest): Promise<Response<ListResponse, Problem>> {
    const response = await this.fetch.put(`${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as ListResponse);
  }

  /**
   * Replaces every synonym rule on a List. Rules are structured, not rule text: each is either
   * "equivalent" (every word means every other) or "rewrite" (searching one word finds another, one way
   * only). Pass an empty `rules` array to remove all synonyms. Takes effect on the next search — nothing
   * is reindexed.
   */
  async setSynonyms(account_name: string, list_name: string, request: SetListSynonymsRequest): Promise<Response<ListResponse, Problem>> {
    const path = `${this.path}/synonyms/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}`;
    const response = await this.fetch.put(path, request);
    return handleResponse(response, async () => (await response.json()) as ListResponse);
  }

  /** Rolls a List forward to the content of a past version, producing a new version. */
  async restore(account_name: string, list_name: string, version: number): Promise<Response<ListRestoreResponse, Problem>> {
    const path = `${this.path}/restore/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${version}`;
    const response = await this.fetch.post(path, undefined);
    return handleResponse(response, async () => (await response.json()) as ListRestoreResponse);
  }

  /** Permanently deletes a List. */
  async delete(account_name: string, list_name: string): Promise<Response<void, Problem>> {
    const response = await this.fetch.delete(`${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}`);
    return handleResponse(response, () => undefined);
  }
}

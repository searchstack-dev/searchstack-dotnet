import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import { Response, Problem, SearchableFieldResponse, CreateSearchableFieldRequest, RenameSearchableFieldRequest } from "./Types.js";

export default class SearchableFieldService {
  private readonly path = `searchable`;
  constructor(private readonly fetch: Fetch) {}

  /** Creates a Searchable field. */
  async create(request: CreateSearchableFieldRequest): Promise<Response<SearchableFieldResponse, Problem>> {
    const response = await this.fetch.post(this.path, request);
    return handleResponse(response, async () => (await response.json()) as SearchableFieldResponse);
  }

  /** Renames a Searchable. Breaking change - automatically updates the List version. */
  async rename(account_name: string, list_name: string, searchable_name: string, request: RenameSearchableFieldRequest): Promise<Response<SearchableFieldResponse, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${encodeURIComponent(searchable_name)}`;
    const response = await this.fetch.put(path, request);
    return handleResponse(response, async () => (await response.json()) as SearchableFieldResponse);
  }

  /** Removes a Searchable. Breaking change - automatically updates the List version. */
  async remove(account_name: string, list_name: string, searchable_name: string): Promise<Response<void, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${encodeURIComponent(searchable_name)}`;
    const response = await this.fetch.delete(path);
    return handleResponse(response, () => undefined);
  }
}

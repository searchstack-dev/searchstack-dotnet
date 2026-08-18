import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import { Response, Problem, FacetResponse, CreateFacetRequest, RenameFacetRequest } from "./Types.js";

export default class FacetService {
  private readonly path = `facet`;
  constructor(private readonly fetch: Fetch) {}

  /** Creates a Facet - a filterable field such as brand, color, price or category. */
  async create(request: CreateFacetRequest): Promise<Response<FacetResponse, Problem>> {
    const response = await this.fetch.post(this.path, request);
    return handleResponse(response, async () => (await response.json()) as FacetResponse);
  }

  /** Renames a Facet. Breaking change - automatically updates the List version. */
  async rename(account_name: string, list_name: string, facet_name: string, request: RenameFacetRequest): Promise<Response<FacetResponse, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${encodeURIComponent(facet_name)}`;
    const response = await this.fetch.put(path, request);
    return handleResponse(response, async () => (await response.json()) as FacetResponse);
  }

  /** Removes a Facet. Breaking change - automatically updates the List version. */
  async remove(account_name: string, list_name: string, facet_name: string): Promise<Response<void, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${encodeURIComponent(facet_name)}`;
    const response = await this.fetch.delete(path);
    return handleResponse(response, () => undefined);
  }

  /** Lists the distinct values of a Facet on a List version - useful for building filter UIs. Requires the search-result:read permission. */
  async values(account_name: string, list_name: string, version: number, facet_name: string, cache?: boolean): Promise<Response<unknown[], Problem>> {
    const query = cache === undefined ? "" : `?cache=${cache}`;
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${version}/${encodeURIComponent(facet_name)}${query}`;
    const response = await this.fetch.get(path);
    return handleResponse(response, async () => (await response.json()) as unknown[]);
  }
}

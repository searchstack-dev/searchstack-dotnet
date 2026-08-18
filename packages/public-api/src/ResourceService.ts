import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import { Response, Problem, ResourceResponse, CreateResourceRequest, RenameResourceRequest } from "./Types.js";

export default class ResourceService {
  private readonly path = `resource`;
  constructor(private readonly fetch: Fetch) {}

  /** Creates a Resource - a non-searchable, non-filterable field (commonly a URL). */
  async create(request: CreateResourceRequest): Promise<Response<ResourceResponse, Problem>> {
    const response = await this.fetch.post(this.path, request);
    return handleResponse(response, async () => (await response.json()) as ResourceResponse);
  }

  /** Renames a Resource. Breaking change - automatically updates the List version. */
  async rename(account_name: string, list_name: string, resource_name: string, request: RenameResourceRequest): Promise<Response<ResourceResponse, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${encodeURIComponent(resource_name)}`;
    const response = await this.fetch.put(path, request);
    return handleResponse(response, async () => (await response.json()) as ResourceResponse);
  }

  /** Removes a Resource. Breaking change - automatically updates the List version. */
  async remove(account_name: string, list_name: string, resource_name: string): Promise<Response<void, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${encodeURIComponent(resource_name)}`;
    const response = await this.fetch.delete(path);
    return handleResponse(response, () => undefined);
  }
}

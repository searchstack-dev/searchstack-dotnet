import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import { Response, Problem, ListResponse } from "./Types.js";

export default class CoordinatesService {
  private readonly path = `coordinates`;
  constructor(private readonly fetch: Fetch) {}

  /** Adds a Coordinates field, enabling geographical queries. */
  async add(account_name: string, list_name: string): Promise<Response<ListResponse, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}`;
    const response = await this.fetch.post(path, {});
    return handleResponse(response, async () => (await response.json()) as ListResponse);
  }

  /** Removes the Coordinates field. Breaking change - automatically updates the List version. */
  async remove(account_name: string, list_name: string): Promise<Response<ListResponse, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}`;
    const response = await this.fetch.delete(path);
    return handleResponse(response, async () => (await response.json()) as ListResponse);
  }
}

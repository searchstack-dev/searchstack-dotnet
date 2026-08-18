import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import { Response, Problem, ContributorResponse, AddContributorRequest } from "./Types.js";

export default class ContributorService {
  private readonly path = `contributor`;
  constructor(private readonly fetch: Fetch) {}

  /** Adds a Contributor - can add fields and search results but not make breaking changes. */
  async add(request: AddContributorRequest): Promise<Response<ContributorResponse, Problem>> {
    const response = await this.fetch.post(this.path, request);
    return handleResponse(response, async () => (await response.json()) as ContributorResponse);
  }

  /** Removes a Contributor's access to the List. */
  async remove(account_name: string, list_name: string, contributor_name: string): Promise<Response<void, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${encodeURIComponent(contributor_name)}`;
    const response = await this.fetch.delete(path);
    return handleResponse(response, () => undefined);
  }
}

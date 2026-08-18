import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import { Response, Problem, AccountResponse, AccountNameResponse, AccountHealthResponse } from "./Types.js";

export default class AccountService {
  private readonly path = `account`;
  constructor(private readonly fetch: Fetch) {}

  /** Retrieves the details of an Account. */
  async get(account_name: string): Promise<Response<AccountResponse, Problem>> {
    const response = await this.fetch.get(`${this.path}/${encodeURIComponent(account_name)}`);
    return handleResponse(response, async () => (await response.json()) as AccountResponse);
  }

  /** Retrieves the account name of the currently authenticated caller. */
  async getName(): Promise<Response<AccountNameResponse, Problem>> {
    const response = await this.fetch.get(this.path);
    return handleResponse(response, async () => (await response.json()) as AccountNameResponse);
  }

  /**
   * Retrieves anything currently wrong with an Account: a feed that has stopped updating, an import or
   * gate backfill that failed, a bring-your-own service that is not responding, or automatic syncing
   * being paused. Worth asking before debugging a search that is returning stale data.
   */
  async getHealth(account_name: string): Promise<Response<AccountHealthResponse, Problem>> {
    const response = await this.fetch.get(`${this.path}/issues/${encodeURIComponent(account_name)}`);
    return handleResponse(response, async () => (await response.json()) as AccountHealthResponse);
  }
}

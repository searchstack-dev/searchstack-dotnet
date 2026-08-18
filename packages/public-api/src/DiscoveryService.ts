import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import { Response, Problem, ApiInfo, ApiExamples, ApiCatalog } from "./Types.js";

// Anonymous discovery endpoints describing the API itself. No credentials needed
// (any configured on the client are simply ignored by these routes).
export default class DiscoveryService {
  constructor(private readonly fetch: Fetch) {}

  /** Machine-readable manifest: version, docs/OpenAPI URLs, auth, error codes, MCP. */
  async info(): Promise<Response<ApiInfo, Problem>> {
    const response = await this.fetch.get(`api/info`);
    return handleResponse(response, async () => (await response.json()) as ApiInfo);
  }

  /** Worked request/response examples for common operations. */
  async examples(): Promise<Response<ApiExamples, Problem>> {
    const response = await this.fetch.get(`api/examples`);
    return handleResponse(response, async () => (await response.json()) as ApiExamples);
  }

  /** IETF api-catalog document (RFC 9727) linking to the API's resources. */
  async catalog(): Promise<Response<ApiCatalog, Problem>> {
    const response = await this.fetch.get(`.well-known/api-catalog`);
    return handleResponse(response, async () => (await response.json()) as ApiCatalog);
  }
}

import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import {
  Response,
  Problem,
  CreateReadOnlyApiKeyRequest,
  ApiKeyValueResponse,
} from "./Types.js";

// The one API-key management operation on the data plane: mint a strictly read-only key of any scope.
// Requires an authenticating key that carries the api-key:create-read-only permission. Full key
// management (create with any permission, view, edit, delete) stays console-plane.
export default class ApiKeyService {
  private readonly path = `api-key`;
  constructor(private readonly fetch: Fetch) {}

  /**
   * Mints a strictly read-only API key and returns its usable value. Only the read/view permissions in
   * `request.permissions` are kept; any write permissions are dropped, and the minted key can never
   * itself mint another key.
   */
  async createReadOnly(request: CreateReadOnlyApiKeyRequest): Promise<Response<ApiKeyValueResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/read-only`, request);
    return handleResponse(response, async () => (await response.json()) as ApiKeyValueResponse);
  }
}

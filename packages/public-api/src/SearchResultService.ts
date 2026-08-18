import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import {
  Response, Problem, SearchHit, ListResponse,
  CreateSearchResultRequest, UpdateSearchResultRequest, UpdateSearchResultVectorRequest, PatchVolatileFieldsRequest,
  ApplyVolatileDeltasRequest, ApplyVolatileDeltasResponse, VerifyOfferRequest, VerifyOfferResponse,
  DeleteByFilterRequest, DeleteByFilterResponse, SearchResultsListOptions,
  ImportUploadRequest, ImportFromMediaStoreRequest,
} from "./Types.js";

// Read + write operations for Search Results (get, list/browse, create, bulk-insert, edit, delete).
// Ranked/vector query operations live on SearchService.
export default class SearchResultService {
  private readonly path = `search-result`;
  constructor(private readonly fetch: Fetch) {}

  /** Fetches a single Search Result by id. */
  async get(account_name: string, list_name: string, id: string): Promise<Response<SearchHit, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${encodeURIComponent(id)}`;
    const response = await this.fetch.get(path);
    return handleResponse(response, async () => (await response.json()) as SearchHit);
  }

  /**
   * Browses (lists) the Search Results in a List with optional paging, filter, free-text query, geo
   * radius, active flag and ordering. For a ranked/vector search use SearchService.
   */
  async list(account_name: string, list_name: string, options: SearchResultsListOptions = {}): Promise<Response<SearchHit[], Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/list`;
    const response = await this.fetch.post(path, options);
    return handleResponse(response, async () => (await response.json()) as SearchHit[]);
  }

  /** Creates a single Search Result. */
  async create(request: CreateSearchResultRequest): Promise<Response<SearchHit, Problem>> {
    const response = await this.fetch.post(this.path, request);
    return handleResponse(response, async () => (await response.json()) as SearchHit);
  }

  /** Imports a JSON/CSV file from a customer-controlled URL into a List. */
  async import(account_name: string, list_name: string, request: ImportUploadRequest): Promise<Response<ListResponse, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/import`;
    const response = await this.fetch.post(path, request);
    return handleResponse(response, async () => (await response.json()) as ListResponse);
  }

  /**
   * Imports a file already staged in one of the Account's media stores into a List. Set keep_in_sync to
   * re-import automatically whenever the file changes (the basis of the feed→list bind).
   */
  async importFromMedia(account_name: string, list_name: string, request: ImportFromMediaStoreRequest): Promise<Response<ListResponse, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/import-from-media`;
    const response = await this.fetch.post(path, request);
    return handleResponse(response, async () => (await response.json()) as ListResponse);
  }

  /** Bulk inserts multiple Search Results into an existing List. */
  async bulkInsert(account_name: string, list_name: string, search_results: Record<string, unknown>[]): Promise<Response<ListResponse, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}`;
    const response = await this.fetch.post(path, search_results);
    return handleResponse(response, async () => (await response.json()) as ListResponse);
  }

  /** Creates fields as needed and bulk inserts multiple Search Results. */
  async bulkInsertWithFields(account_name: string, list_name: string, search_results: Record<string, unknown>[]): Promise<Response<ListResponse, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/with-fields`;
    const response = await this.fetch.post(path, search_results);
    return handleResponse(response, async () => (await response.json()) as ListResponse);
  }

  /** Edits the properties of an existing Search Result. */
  async edit(account_name: string, list_name: string, id: string, request: UpdateSearchResultRequest): Promise<Response<SearchHit, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${encodeURIComponent(id)}`;
    const response = await this.fetch.put(path, request);
    return handleResponse(response, async () => (await response.json()) as SearchHit);
  }

  /**
   * Patches frequently-changing fields (price, stock, availability) on a Search Result WITHOUT
   * re-embedding it — a cheap, second-fresh write for commerce data. Only facets and non-vectorized
   * searchable/resource fields are accepted; fields that feed the embedding must use `edit`.
   */
  async patchVolatile(account_name: string, list_name: string, id: string, request: PatchVolatileFieldsRequest): Promise<Response<SearchHit, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${encodeURIComponent(id)}/volatile`;
    const response = await this.fetch.put(path, request);
    return handleResponse(response, async () => (await response.json()) as SearchHit);
  }

  /**
   * Batch-writes fast-changing "volatile" values (price, quantity) to the overlay store, which
   * decorates them onto search results at response time WITHOUT re-indexing or re-embedding — the
   * seconds-fresh path for commerce data. Each delta names a record by its engine id and carries a
   * source timestamp (last-write-wins per field).
   */
  async applyVolatileDeltas(account_name: string, list_name: string, request: ApplyVolatileDeltasRequest): Promise<Response<ApplyVolatileDeltasResponse, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/deltas`;
    const response = await this.fetch.post(path, request);
    return handleResponse(response, async () => (await response.json()) as ApplyVolatileDeltasResponse);
  }

  /**
   * Confirms the current volatile values (price, availability) of specific records at the moment of
   * action — the guaranteed-fresh step to run before transacting. Per id it returns the values, an
   * `as_of` timestamp, and the source (`overlay` = seconds-fresh, `index` = last-indexed, `not_found`).
   */
  async verifyOffer(account_name: string, list_name: string, request: VerifyOfferRequest): Promise<Response<VerifyOfferResponse, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/verify-offer`;
    const response = await this.fetch.post(path, request);
    return handleResponse(response, async () => (await response.json()) as VerifyOfferResponse);
  }

  /**
   * Directly updates the text/image/document vectors of a Search Result. Vector
   * dimensions are validated and the List must not be attached to a model.
   */
  async editVector(account_name: string, list_name: string, search_result_name: string, request: UpdateSearchResultVectorRequest): Promise<Response<SearchHit, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${encodeURIComponent(search_result_name)}/vector`;
    const response = await this.fetch.put(path, request);
    return handleResponse(response, async () => (await response.json()) as SearchHit);
  }

  /** Permanently deletes a Search Result. */
  async remove(account_name: string, list_name: string, id: string): Promise<Response<void, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${encodeURIComponent(id)}`;
    const response = await this.fetch.delete(path);
    return handleResponse(response, () => undefined);
  }

  /**
   * Permanently deletes every Search Result matching a filter. Runs asynchronously;
   * resolves once the job is accepted (HTTP 202).
   */
  async deleteByFilter(account_name: string, list_name: string, request: DeleteByFilterRequest): Promise<Response<DeleteByFilterResponse, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/delete-by-filter`;
    const response = await this.fetch.post(path, request);
    return handleResponse(response, async () => (await response.json()) as DeleteByFilterResponse);
  }

  /**
   * Soft-deletes (deactivates) every Search Result matching a filter. Runs
   * asynchronously; resolves once the job is accepted (HTTP 202).
   */
  async softDeleteByFilter(account_name: string, list_name: string, request: DeleteByFilterRequest): Promise<Response<DeleteByFilterResponse, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/soft-delete-by-filter`;
    const response = await this.fetch.post(path, request);
    return handleResponse(response, async () => (await response.json()) as DeleteByFilterResponse);
  }
}

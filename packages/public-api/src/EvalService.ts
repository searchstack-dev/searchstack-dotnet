import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import {
  Response,
  Problem,
  EvalSetResponse,
  EvalRunHistoryResponse,
  EvalRunStatusResponse,
  RunEvalResponse,
  CreateEvalSetRequest,
  BootstrapEvalSetRequest,
  EvalCaseResponse,
  CreateEvalCaseRequest,
  EditEvalCaseRequest,
} from "./Types.js";

const enc = encodeURIComponent;

// Eval sets: fixed query/expected-result suites scored by a Judge to track
// search quality over time.
export default class EvalService {
  private readonly path = `eval`;
  private readonly casePath = `eval-case`;
  constructor(private readonly fetch: Fetch) {}

  /** Lists the eval sets in an Account. */
  async list(account_name: string): Promise<Response<EvalSetResponse[], Problem>> {
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}`);
    return handleResponse(response, async () => (await response.json()) as EvalSetResponse[]);
  }

  /** Retrieves a single eval set. */
  async get(account_name: string, eval_set_name: string): Promise<Response<EvalSetResponse, Problem>> {
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}/${enc(eval_set_name)}`);
    return handleResponse(response, async () => (await response.json()) as EvalSetResponse);
  }

  /** Retrieves the run history of an eval set. Pass a continuation token to page. */
  async runs(account_name: string, eval_set_name: string, continuation_token?: string): Promise<Response<EvalRunHistoryResponse, Problem>> {
    let path = `${this.path}/${enc(account_name)}/${enc(eval_set_name)}/runs`;
    if (continuation_token) path += `?continuation-token=${enc(continuation_token)}`;
    const response = await this.fetch.get(path);
    return handleResponse(response, async () => (await response.json()) as EvalRunHistoryResponse);
  }

  /** Retrieves the status (and results, once available) of a single eval run. */
  async runStatus(account_name: string, eval_set_name: string, run_id: string): Promise<Response<EvalRunStatusResponse, Problem>> {
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}/${enc(eval_set_name)}/run/${enc(run_id)}`);
    return handleResponse(response, async () => (await response.json()) as EvalRunStatusResponse);
  }

  /** Creates an eval set. */
  async create(account_name: string, request: CreateEvalSetRequest): Promise<Response<EvalSetResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as EvalSetResponse);
  }

  /** Creates an eval set from the judged candidates of past Judge runs. */
  async bootstrap(account_name: string, request: BootstrapEvalSetRequest): Promise<Response<EvalSetResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/bootstrap`, request);
    return handleResponse(response, async () => (await response.json()) as EvalSetResponse);
  }

  /** Starts an eval run. Runs asynchronously; resolves with the new run's id (HTTP 202). */
  async run(account_name: string, eval_set_name: string): Promise<Response<RunEvalResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/${enc(eval_set_name)}/run`, undefined);
    return handleResponse(response, async () => (await response.json()) as RunEvalResponse);
  }

  /** Deletes an eval set. */
  async delete(account_name: string, eval_set_name: string): Promise<Response<void, Problem>> {
    const response = await this.fetch.delete(`${this.path}/${enc(account_name)}/${enc(eval_set_name)}`);
    return handleResponse(response, () => undefined);
  }

  // ─── Cases ───────────────────────────────────────────────────────────────
  // The runnable unit inside a set: one query plus what a pass means for THAT query.

  /** Lists an eval set's cases. */
  async listCases(account_name: string, eval_set_name: string): Promise<Response<EvalCaseResponse[], Problem>> {
    const response = await this.fetch.get(`${this.casePath}/${enc(account_name)}/${enc(eval_set_name)}`);
    return handleResponse(response, async () => (await response.json()) as EvalCaseResponse[]);
  }

  /** Retrieves one case: its query, retrieval settings and criteria. */
  async getCase(account_name: string, eval_set_name: string, case_name: string): Promise<Response<EvalCaseResponse, Problem>> {
    const response = await this.fetch.get(`${this.casePath}/${enc(account_name)}/${enc(eval_set_name)}/${enc(case_name)}`);
    return handleResponse(response, async () => (await response.json()) as EvalCaseResponse);
  }

  /** Adds a case to an eval set. */
  async createCase(account_name: string, eval_set_name: string, request: CreateEvalCaseRequest): Promise<Response<EvalCaseResponse, Problem>> {
    const response = await this.fetch.post(`${this.casePath}/${enc(account_name)}/${enc(eval_set_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as EvalCaseResponse);
  }

  /** Replaces a case's query, retrieval settings and criteria, keeping its name and creation stamp. */
  async editCase(account_name: string, eval_set_name: string, case_name: string, request: EditEvalCaseRequest): Promise<Response<EvalCaseResponse, Problem>> {
    const response = await this.fetch.put(`${this.casePath}/${enc(account_name)}/${enc(eval_set_name)}/${enc(case_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as EvalCaseResponse);
  }

  /** Removes one case from an eval set. Idempotent. */
  async deleteCase(account_name: string, eval_set_name: string, case_name: string): Promise<Response<void, Problem>> {
    const response = await this.fetch.delete(`${this.casePath}/${enc(account_name)}/${enc(eval_set_name)}/${enc(case_name)}`);
    return handleResponse(response, () => undefined);
  }
}

import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import {
  Response,
  Problem,
  GateResponse,
  GateBackfillResponse,
  BumpGateVersionResponse,
  CreateGateRequest,
  UpdateGateRequest,
  AttachGateRequest,
  BumpGateRequest,
  GateBackfillRequest,
  CaptureBackfillRequest,
} from "./Types.js";

const enc = encodeURIComponent;

// Gates: what a record has to get past to be admitted to a List.
//
// Gates run in an ordered chain at the single choke point every ingest path funnels through — import, upload,
// feed sync, single create, edit — before a record is provisioned, mapped or indexed. A gate can admit a
// record, rewrite its fields, compute a new one, hold it back, or refuse it outright with a reason.
//
// Two things are worth knowing before calling anything here. Order ACROSS kinds is fixed by the system,
// cheapest first, so a model-backed gate never scores a record an earlier gate would have removed — you order
// only within a kind. And editing a gate does not change any list: each list stays pinned to the version it
// was attached at until `bump` moves it, which is what stops one edit silently changing what a dozen lists
// have been doing.
export default class GateService {
  private readonly path = `gate`;
  constructor(private readonly fetch: Fetch) {}

  /**
   * Lists the gates on an Account: the built-in cleaning steps plus any you have authored. Gates that belong to
   * a single list are left out — pass scope "all" to include them.
   */
  async list(account_name: string, scope?: string): Promise<Response<GateResponse[], Problem>> {
    const query = scope ? `?scope=${enc(scope)}` : ``;
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}${query}`);
    return handleResponse(response, async () => (await response.json()) as GateResponse[]);
  }

  /** Retrieves one gate's definition: its kind, configuration and current version. */
  async get(account_name: string, gate_name: string): Promise<Response<GateResponse, Problem>> {
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}/${enc(gate_name)}`);
    return handleResponse(response, async () => (await response.json()) as GateResponse);
  }

  /**
   * What happens to records arriving at one list: every gate on the Account, each marked with whether this
   * list uses it and where. Attached gates come first, in the order they will actually run.
   */
  async listForList(account_name: string, list_name: string): Promise<Response<GateResponse[], Problem>> {
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}/list/${enc(list_name)}`);
    return handleResponse(response, async () => (await response.json()) as GateResponse[]);
  }

  /** Creates a gate on the Account. Creating does not run it anywhere — attach it to a list next. */
  async create(account_name: string, request: CreateGateRequest): Promise<Response<GateResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as GateResponse);
  }

  /** Replaces a gate's configuration and advances its version. No list changes behaviour until bumped. */
  async edit(account_name: string, gate_name: string, request: UpdateGateRequest): Promise<Response<GateResponse, Problem>> {
    const response = await this.fetch.put(`${this.path}/${enc(account_name)}/${enc(gate_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as GateResponse);
  }

  /** Deletes a gate and detaches it from every list using it. Built-ins cannot be deleted. */
  async delete(account_name: string, gate_name: string): Promise<Response<void, Problem>> {
    const response = await this.fetch.delete(`${this.path}/${enc(account_name)}/${enc(gate_name)}`);
    return handleResponse(response, () => undefined);
  }

  /**
   * Binds a gate to a list, and is also the edit path for an existing binding — the on/off toggle, the order
   * and the credential picker all come through here. It does NOT move the pinned version.
   */
  async attach(account_name: string, list_name: string, gate_name: string, request: AttachGateRequest): Promise<Response<GateResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/list/${enc(list_name)}/${enc(gate_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as GateResponse);
  }

  /** Stops a gate running on this list. The definition and every other list are untouched. */
  async detach(account_name: string, list_name: string, gate_name: string): Promise<Response<void, Problem>> {
    const response = await this.fetch.delete(`${this.path}/${enc(account_name)}/list/${enc(list_name)}/${enc(gate_name)}`);
    return handleResponse(response, () => undefined);
  }

  /**
   * Moves this list onto the gate's current version. From here on, arriving records are judged by the new
   * version; records already in the list keep the old value until backfilled. Set `backfill` to do both in
   * one call — which spends your provider credential once per matching record. Bumping an already-current
   * list is a no-op, not an error.
   */
  async bump(account_name: string, list_name: string, gate_name: string, request: BumpGateRequest = {}): Promise<Response<BumpGateVersionResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/list/${enc(list_name)}/${enc(gate_name)}/bump`, request);
    return handleResponse(response, async () => (await response.json()) as BumpGateVersionResponse);
  }

  /**
   * Re-runs ONE gate over records already in the list. Only gates that compute a value can be backfilled.
   * Answers immediately with a run id — poll it with `backfillStatus`. **Spends your provider credential once
   * per recomputed record**, over as much of the list as the filter matches.
   */
  async backfill(account_name: string, list_name: string, gate_name: string, request: GateBackfillRequest = {}): Promise<Response<GateBackfillResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/list/${enc(list_name)}/${enc(gate_name)}/backfill`, request);
    return handleResponse(response, async () => (await response.json()) as GateBackfillResponse);
  }

  /** How a backfill is going, by the run id the backfill call returned. */
  async backfillStatus(account_name: string, run_id: string): Promise<Response<GateBackfillResponse, Problem>> {
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}/backfill/${enc(run_id)}`);
    return handleResponse(response, async () => (await response.json()) as GateBackfillResponse);
  }

  /**
   * Pulls remote media into the list's own store for records already in it. Distinct from `backfill`: capture
   * changes stored files rather than recomputing a value. Re-running is safe — a file already in the store is
   * not fetched twice.
   */
  async captureBackfill(account_name: string, list_name: string, request: CaptureBackfillRequest = {}): Promise<Response<void, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/list/${enc(list_name)}/capture/backfill`, request);
    return handleResponse(response, () => undefined);
  }
}

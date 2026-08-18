import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import {
  Response,
  Problem,
  QueryRuleResponse,
  QueryRuleTemplateResponse,
  QueryInterpretationResponse,
  FieldProfileResponse,
  InferQueryRulesResponse,
  InferQueryRulesFromSearchesResponse,
  QueryRuleMetricsResponse,
  CreateQueryRuleRequest,
  EditQueryRuleRequest,
  SetQueryRuleStateRequest,
  SetQueryRuleStanceRequest,
  ReorderQueryRulesRequest,
  TestQueryInterpretationRequest,
} from "./Types.js";

const enc = encodeURIComponent;

// Query rules: how a raw query is READ before it is executed.
//
// A rule spots a format in what somebody typed and lifts that part of the query out as a constraint rather than
// leaving it to be matched as words — so "flat 2 zz1 1zz" is searched as "flat 2" narrowed to a postcode, not as
// four words competing with every record containing "flat".
//
// Rules are LIST-scoped, unlike gates, because a rule binds a format to a field and a field only means what it
// means on one list. They are also ORDERED, and the order is load-bearing: the first rule to claim part of a
// query wins and later rules see only what is left.
//
// Three things are worth knowing before calling anything here. You rarely need to create a rule at all — infer
// runs on every import already and adds the rules your records support. A rule can only target a FACET, so a
// format sitting in a searchable field cannot be ruled on until the field is a facet. And test costs nothing
// and stores nothing, which makes it the right first call: it answers "how will this query be read?" without
// running a search.
export default class QueryRuleService {
  private readonly path = `query-rule`;
  constructor(private readonly fetch: Fetch) {}

  /**
   * The shipped rule types you can build a rule from — postcodes, ISBNs, IBANs, VINs and the rest — each with a
   * plain-language description and defaults for match mode, action and stance. Account-independent. You only
   * need a custom `pattern` for a format not in here.
   */
  async templates(): Promise<Response<QueryRuleTemplateResponse[], Problem>> {
    const response = await this.fetch.get(`${this.path}/templates`);
    return handleResponse(response, async () => (await response.json()) as QueryRuleTemplateResponse[]);
  }

  /**
   * The rules on a list, in the order they actually run. Never sorted by anything else — the order IS the answer
   * to two rules wanting the same words.
   */
  async list(account_name: string, list_name: string): Promise<Response<QueryRuleResponse[], Problem>> {
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}/${enc(list_name)}`);
    return handleResponse(response, async () => (await response.json()) as QueryRuleResponse[]);
  }

  /** One rule: what it recognises, which field it constrains, what a match does, how much evidence it needs. */
  async get(account_name: string, list_name: string, rule_name: string): Promise<Response<QueryRuleResponse, Problem>> {
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}/${enc(list_name)}/${enc(rule_name)}`);
    return handleResponse(response, async () => (await response.json()) as QueryRuleResponse);
  }

  /**
   * Adds a rule to a list. Supply a name, the field it constrains, and exactly one of a shipped rule type
   * (`recognizer`), a regex (`pattern`) or the field's own values (`value_set`). Takes effect on the next search.
   */
  async create(account_name: string, list_name: string, request: CreateQueryRuleRequest): Promise<Response<QueryRuleResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/${enc(list_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as QueryRuleResponse);
  }

  /**
   * What a query WOULD be turned into — the text that survives and the constraints lifted out of it — without
   * running a search or storing anything. Includes what shadow rules would have done, so a rule can be checked
   * on a real query before it is switched on.
   *
   * The fastest answer to "why did my search return that?", and free.
   */
  async test(account_name: string, list_name: string, request: TestQueryInterpretationRequest): Promise<Response<QueryInterpretationResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/${enc(list_name)}/test`, request);
    return handleResponse(response, async () => (await response.json()) as QueryInterpretationResponse);
  }

  /**
   * Sets the order rules run in. Send every rule on the list exactly once — a partial ordering would leave the
   * omitted rules interleaved at positions nobody chose.
   */
  async reorder(account_name: string, list_name: string, request: ReorderQueryRulesRequest): Promise<Response<QueryRuleResponse[], Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/${enc(list_name)}/reorder`, request);
    return handleResponse(response, async () => (await response.json()) as QueryRuleResponse[]);
  }

  /**
   * Changes what a rule RECOGNISES and advances its version. It does NOT change whether the rule is on, or how
   * boldly it acts — see `setState` and `setStance`, kept separate so tuning them never discards the evidence a
   * shadow run has gathered.
   */
  async edit(account_name: string, list_name: string, rule_name: string, request: EditQueryRuleRequest): Promise<Response<QueryRuleResponse, Problem>> {
    const response = await this.fetch.put(`${this.path}/${enc(account_name)}/${enc(list_name)}/${enc(rule_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as QueryRuleResponse);
  }

  /**
   * Turns a rule on, off, or into shadow. Shadow records what the rule WOULD have done and changes nothing,
   * which is the honest way to try a rule on real traffic. A rule a model suggested cannot go straight to
   * Enabled — run it in Shadow and promote it on `metrics`.
   */
  async setState(account_name: string, list_name: string, rule_name: string, request: SetQueryRuleStateRequest): Promise<Response<QueryRuleResponse, Problem>> {
    const response = await this.fetch.put(`${this.path}/${enc(account_name)}/${enc(list_name)}/${enc(rule_name)}/state`, request);
    return handleResponse(response, async () => (await response.json()) as QueryRuleResponse);
  }

  /**
   * Sets how much evidence a rule needs. Passive acts only on a value confirmed to be in the field; Balanced
   * (the default) acts unless the data contradicts it; Aggressive acts on the shape alone — the only setting
   * that can return zero results, and only when the action is Filter. Turning the dial up can only add
   * constraints, never change which ones.
   */
  async setStance(account_name: string, list_name: string, rule_name: string, request: SetQueryRuleStanceRequest): Promise<Response<QueryRuleResponse, Problem>> {
    const response = await this.fetch.put(`${this.path}/${enc(account_name)}/${enc(list_name)}/${enc(rule_name)}/stance`, request);
    return handleResponse(response, async () => (await response.json()) as QueryRuleResponse);
  }

  /**
   * Reads a sample of the list, works out what each facet actually holds, and creates the rules the evidence
   * supports — ready to run where it is overwhelming, in shadow where it is not.
   *
   * This already runs on its own after an import, so calling it is asking for it NOW. It never touches a field
   * that already has a rule, so it is safe to repeat. Answers with what it created and, for every field it did
   * not, why.
   */
  async infer(account_name: string, list_name: string): Promise<Response<InferQueryRulesResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/${enc(list_name)}/infer`, {});
    return handleResponse(response, async () => (await response.json()) as InferQueryRulesResponse);
  }

  /**
   * What a rule has actually been doing, measured over real traffic rather than predicted: how often it fires,
   * how often it matches a value the data does not hold, and what those searches return today.
   *
   * This is what turns "should I switch this on?" into a decision. Check `conclusive` before reading the rates.
   */
  async metrics(account_name: string, list_name: string, rule_name: string): Promise<Response<QueryRuleMetricsResponse, Problem>> {
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}/${enc(list_name)}/${enc(rule_name)}/metrics`);
    return handleResponse(response, async () => (await response.json()) as QueryRuleMetricsResponse);
  }

  /**
   * What a sample of each field's values looked like: how many matched a known format, how much they repeat, and
   * three of your own values. Read this to find out WHY a rule was suggested — or why one was not.
   */
  async fieldProfiles(account_name: string, list_name: string): Promise<Response<FieldProfileResponse[], Problem>> {
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}/${enc(list_name)}/profiles`);
    return handleResponse(response, async () => (await response.json()) as FieldProfileResponse[]);
  }

  /**
   * The same job argued from the other side. `infer` knows what the list HOLDS; this reads the last 30 days of
   * searches and finds the formats that keep returning nothing — the only signal that can find a format nobody
   * thought to model.
   *
   * Everything it creates lands in SHADOW, because what customers type is noisier than what your records hold.
   * Read `metrics` after a week and switch on what earns it.
   */
  async inferFromSearches(account_name: string, list_name: string): Promise<Response<InferQueryRulesFromSearchesResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}/${enc(list_name)}/infer-from-searches`, {});
    return handleResponse(response, async () => (await response.json()) as InferQueryRulesFromSearchesResponse);
  }

  /** Removes a rule from the list. Takes effect on the next search. Nothing else is touched. */
  async delete(account_name: string, list_name: string, rule_name: string): Promise<Response<void, Problem>> {
    const response = await this.fetch.delete(`${this.path}/${enc(account_name)}/${enc(list_name)}/${enc(rule_name)}`);
    return handleResponse(response, () => undefined);
  }
}

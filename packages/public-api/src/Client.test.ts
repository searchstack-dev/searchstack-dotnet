import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SearchStackClient } from "./index.js";

type Capture = { url: string; init: RequestInit };

function mockFetch(status: number, body: unknown): { fetch: typeof globalThis.fetch; calls: Capture[] } {
  const calls: Capture[] = [];
  const fn = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return {
      status,
      json: async () => body,
    } as unknown as globalThis.Response;
  });
  return { fetch: fn as unknown as typeof globalThis.fetch, calls };
}

describe("SearchStackClient", () => {
  const original = globalThis.fetch;
  afterEach(() => { globalThis.fetch = original; });

  it("sends the API key as X-API-Key", async () => {
    const { fetch, calls } = mockFetch(200, { account_name: "acme" });
    globalThis.fetch = fetch;

    const client = new SearchStackClient({ apiKey: "sk_test", baseUrl: "https://api.example.com" });
    const result = await client.Accounts.getName();

    expect(result.isSuccess).toBe(true);
    expect(result.toSuccess().account_name).toBe("acme");
    expect(calls[0]!.url).toBe("https://api.example.com/account");
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers["X-API-Key"]).toBe("sk_test");
    expect(headers["Authorization"]).toBeUndefined();
  });

  it("prefers the access token over the API key", async () => {
    const { fetch, calls } = mockFetch(200, { account_name: "acme" });
    globalThis.fetch = fetch;

    const client = new SearchStackClient({ apiKey: "sk_test", accessToken: "jwt_token", baseUrl: "https://api.example.com" });
    await client.Accounts.get("acme");

    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer jwt_token");
    expect(headers["X-API-Key"]).toBeUndefined();
    expect(calls[0]!.url).toBe("https://api.example.com/account/acme");
  });

  it("posts search options to the list search route", async () => {
    const { fetch, calls } = mockFetch(200, { results: [], count: 0, total_count: 0 });
    globalThis.fetch = fetch;

    const client = new SearchStackClient({ apiKey: "sk_test", baseUrl: "https://api.example.com" });
    const result = await client.Search.searchList("acme", "products", 2, { query: "boots", size: 10 });

    expect(result.isSuccess).toBe(true);
    expect(calls[0]!.url).toBe("https://api.example.com/search/acme/products/2");
    expect(calls[0]!.init.method).toBe("POST");
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({ query: "boots", size: 10 });
  });

  it("puts the group search version into the path, including the 'latest' alias", async () => {
    const { fetch, calls } = mockFetch(200, { results: [], count: 0, total_count: 0 });
    globalThis.fetch = fetch;
    const c = new SearchStackClient({ apiKey: "sk_test", baseUrl: "https://api.example.com" });

    await c.Search.searchGroup("acme", "catalog", 3, { query: "boots" });
    await c.Search.searchGroup("acme", "catalog", "latest", { query: "boots" });

    // A concrete version pins that path segment...
    expect(calls[0]!.url).toBe("https://api.example.com/search/group/acme/catalog/3");
    // ...and the literal alias is passed through verbatim for the server to resolve.
    expect(calls[1]!.url).toBe("https://api.example.com/search/group/acme/catalog/latest");
  });

  it("maps the suggest-group 'latest' alias onto the current-version (0) segment", async () => {
    const { fetch, calls } = mockFetch(200, []);
    globalThis.fetch = fetch;
    const c = new SearchStackClient({ apiKey: "sk_test", baseUrl: "https://api.example.com" });

    await c.Suggest.group("acme", "catalog", "latest", "bo");

    // The suggest route takes an integer segment; the server treats 0 as "current".
    expect(calls[0]!.url).toBe("https://api.example.com/suggest/group/acme/catalog/0/bo");
  });

  it("gets facet values from the versioned facet route", async () => {
    const { fetch, calls } = mockFetch(200, ["red", "green", "blue"]);
    globalThis.fetch = fetch;

    const client = new SearchStackClient({ apiKey: "sk_test", baseUrl: "https://api.example.com" });
    const result = await client.Facets.values("acme", "products", 2, "color");

    expect(result.isSuccess).toBe(true);
    expect(result.toSuccess()).toEqual(["red", "green", "blue"]);
    expect(calls[0]!.url).toBe("https://api.example.com/facet/acme/products/2/color");
    expect(calls[0]!.init.method ?? "GET").toBe("GET");
  });

  it("wraps non-success responses as a Problem", async () => {
    const problem = { type: "", title: "Not Found", status: 404, instance: "", detail: "List not found" };
    const { fetch } = mockFetch(404, problem);
    globalThis.fetch = fetch;

    const client = new SearchStackClient({ apiKey: "sk_test", baseUrl: "https://api.example.com" });
    const result = await client.Lists.get("acme", "missing");

    expect(result.isSuccess).toBe(false);
    expect(result.toProblem().status).toBe(404);
    expect(result.toProblem().detail).toBe("List not found");
  });

  it("carries the API's error code through, so a caller can branch on it", async () => {
    // Every refusal the API makes is a 400 with prose in it. Without the code, telling "nothing in this file
    // names a record" from any other bad request meant matching on message text — and that wording is not a
    // contract. Code 35 in particular means the same request fails identically forever, so a client should
    // stop rather than retry.
    const problem = {
      type: "", title: "search_results", status: 400, instance: "",
      detail: "None of the 1000 row(s) have a name, so nothing could be imported.",
      code: 35,
    };
    const { fetch } = mockFetch(400, problem);
    globalThis.fetch = fetch;

    const client = new SearchStackClient({ apiKey: "sk_test", baseUrl: "https://api.example.com" });
    const result = await client.Lists.get("acme", "addresses");

    expect(result.isSuccess).toBe(false);
    expect(result.toProblem().code).toBe(35);
  });

  it("leaves the code undefined when the API sends none", async () => {
    // Absent, not zero: a caller must be able to tell "no code" from "code 0".
    const problem = { type: "", title: "Not Found", status: 404, instance: "", detail: "List not found" };
    const { fetch } = mockFetch(404, problem);
    globalThis.fetch = fetch;

    const client = new SearchStackClient({ apiKey: "sk_test", baseUrl: "https://api.example.com" });
    const result = await client.Lists.get("acme", "missing");

    expect(result.toProblem().code).toBeUndefined();
  });

  it("treats a NoContent delete as a void success", async () => {
    const { fetch, calls } = mockFetch(204, null);
    globalThis.fetch = fetch;

    const client = new SearchStackClient({ apiKey: "sk_test", baseUrl: "https://api.example.com" });
    const result = await client.Lists.delete("acme", "products");

    expect(result.isSuccess).toBe(true);
    expect(calls[0]!.init.method).toBe("DELETE");
  });

  it("can swap the access token at runtime", async () => {
    const { fetch, calls } = mockFetch(200, { account_name: "acme" });
    globalThis.fetch = fetch;

    const client = new SearchStackClient({ apiKey: "sk_test", baseUrl: "https://api.example.com" });
    client.setAccessToken("new_jwt");
    await client.Accounts.getName();

    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer new_jwt");
  });

  const client = () => new SearchStackClient({ apiKey: "sk_test", baseUrl: "https://api.example.com" });

  it("gets a group", async () => {
    const { fetch, calls } = mockFetch(200, { group_name: "catalog", current_version: 3 });
    globalThis.fetch = fetch;

    const result = await client().Groups.get("acme", "catalog");

    expect(result.isSuccess).toBe(true);
    expect(result.toSuccess().current_version).toBe(3);
    expect(calls[0]!.url).toBe("https://api.example.com/group/acme/catalog");
    expect(calls[0]!.init.method).toBe("GET");
  });

  it("adds a list to a group via PUT with a body", async () => {
    const { fetch, calls } = mockFetch(200, { group_name: "catalog" });
    globalThis.fetch = fetch;

    await client().Groups.addList("acme", "catalog", { list_name: "products", version: 2 });

    expect(calls[0]!.url).toBe("https://api.example.com/group/list/acme/catalog");
    expect(calls[0]!.init.method).toBe("PUT");
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({ list_name: "products", version: 2 });
  });

  it("removes a list from a group and parses the returned group", async () => {
    const { fetch, calls } = mockFetch(200, { group_name: "catalog", lists: [] });
    globalThis.fetch = fetch;

    const result = await client().Groups.removeList("acme", "catalog", "products");

    expect(result.isSuccess).toBe(true);
    expect(result.toSuccess().lists).toEqual([]);
    expect(calls[0]!.url).toBe("https://api.example.com/group/list/acme/catalog/products");
    expect(calls[0]!.init.method).toBe("DELETE");
  });

  it("bumps a group version with no request body", async () => {
    const { fetch, calls } = mockFetch(200, { group_name: "catalog", current_version: 4 });
    globalThis.fetch = fetch;

    await client().Groups.bumpVersion("acme", "catalog");

    expect(calls[0]!.url).toBe("https://api.example.com/group/version/acme/catalog");
    expect(calls[0]!.init.method).toBe("POST");
    expect(calls[0]!.init.body).toBeNull();
  });

  it("restores a group to a past version", async () => {
    const { fetch, calls } = mockFetch(200, { group: { group_name: "catalog" }, restored_from_version: 1, skipped_lists: [] });
    globalThis.fetch = fetch;

    const result = await client().Groups.restore("acme", "catalog", 1);

    expect(result.isSuccess).toBe(true);
    expect(result.toSuccess().restored_from_version).toBe(1);
    expect(calls[0]!.url).toBe("https://api.example.com/group/restore/acme/catalog/1");
    expect(calls[0]!.init.method).toBe("POST");
  });

  it("restores a list to a past version", async () => {
    const { fetch, calls } = mockFetch(200, { list: { list_name: "products" }, restored_from_version: 2, new_version: 5 });
    globalThis.fetch = fetch;

    const result = await client().Lists.restore("acme", "products", 2);

    expect(result.isSuccess).toBe(true);
    expect(result.toSuccess().new_version).toBe(5);
    expect(calls[0]!.url).toBe("https://api.example.com/list/restore/acme/products/2");
    expect(calls[0]!.init.method).toBe("POST");
  });

  it("deletes search results by filter (accepted, 202)", async () => {
    const { fetch, calls } = mockFetch(202, { accepted: true });
    globalThis.fetch = fetch;

    const result = await client().SearchResults.deleteByFilter("acme", "products", { filter: "price lt 10" });

    expect(result.isSuccess).toBe(true);
    expect(result.toSuccess().accepted).toBe(true);
    expect(calls[0]!.url).toBe("https://api.example.com/search-result/acme/products/delete-by-filter");
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({ filter: "price lt 10" });
  });

  it("lists eval sets", async () => {
    const { fetch, calls } = mockFetch(200, [{ name: "relevance", account_name: "acme" }]);
    globalThis.fetch = fetch;

    const result = await client().Evals.list("acme");

    expect(result.isSuccess).toBe(true);
    expect(result.toSuccess()).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://api.example.com/eval/acme");
  });

  it("passes a continuation token as a query param on eval runs", async () => {
    const { fetch, calls } = mockFetch(200, { runs: [], continuation_token: null });
    globalThis.fetch = fetch;

    await client().Evals.runs("acme", "relevance", "tok en/1");

    expect(calls[0]!.url).toBe("https://api.example.com/eval/acme/relevance/runs?continuation-token=tok%20en%2F1");
    expect(calls[0]!.init.method).toBe("GET");
  });

  it("starts an eval run (202) and returns the run id", async () => {
    const { fetch, calls } = mockFetch(202, { run_id: "run_1", estimated_judge_calls: 40 });
    globalThis.fetch = fetch;

    const result = await client().Evals.run("acme", "relevance");

    expect(result.isSuccess).toBe(true);
    expect(result.toSuccess().run_id).toBe("run_1");
    expect(calls[0]!.url).toBe("https://api.example.com/eval/acme/relevance/run");
    expect(calls[0]!.init.method).toBe("POST");
  });

  it("routes eval cases under the eval-case prefix, scoped to their set", async () => {
    const { fetch, calls } = mockFetch(200, [{ name: "waterproof", eval_set_name: "relevance" }]);
    globalThis.fetch = fetch;
    const c = client();

    const listed = await c.Evals.listCases("acme", "relevance");
    await c.Evals.getCase("acme", "relevance", "water proof");

    expect(listed.isSuccess).toBe(true);
    // Cases hang off their own route group, not off /eval — the set name is a path segment.
    expect(calls[0]!.url).toBe("https://api.example.com/eval-case/acme/relevance");
    expect(calls[1]!.url).toBe("https://api.example.com/eval-case/acme/relevance/water%20proof");
  });

  it("creates, edits and deletes an eval case", async () => {
    const { fetch, calls } = mockFetch(200, { name: "waterproof", query: "waterproof boots", size: 10 });
    globalThis.fetch = fetch;
    const c = client();

    const created = await c.Evals.createCase("acme", "relevance", {
      name: "waterproof",
      query: "waterproof boots",
      criteria: "The result must be waterproof.",
      size: 10,
    });
    await c.Evals.editCase("acme", "relevance", "waterproof", { query: "waterproof hiking boots" });
    const removed = await c.Evals.deleteCase("acme", "relevance", "waterproof");

    expect(created.isSuccess).toBe(true);
    expect(calls[0]!.url).toBe("https://api.example.com/eval-case/acme/relevance");
    expect(calls[0]!.init.method).toBe("POST");
    expect(JSON.parse(calls[0]!.init.body as string).criteria).toBe("The result must be waterproof.");
    expect(calls[1]!.url).toBe("https://api.example.com/eval-case/acme/relevance/waterproof");
    expect(calls[1]!.init.method).toBe("PUT");
    expect(calls[2]!.init.method).toBe("DELETE");
    expect(removed.isSuccess).toBe(true);
  });

  it("creates a judge with a POST body", async () => {
    const { fetch, calls } = mockFetch(200, { name: "relevance-judge", account_name: "acme" });
    globalThis.fetch = fetch;

    await client().Judges.create("acme", {
      provider: "anthropic",
      model: "claude-haiku-4-5-20251001",
      api_key: "sk-ant-...",
    });

    expect(calls[0]!.url).toBe("https://api.example.com/judge/acme");
    expect(calls[0]!.init.method).toBe("POST");
    expect(JSON.parse(calls[0]!.init.body as string).provider).toBe("anthropic");
  });

  it("edits a judge grader with a PUT to the named grader", async () => {
    const { fetch, calls } = mockFetch(200, { name: "relevance-judge", account_name: "acme" });
    globalThis.fetch = fetch;

    const result = await client().Judges.edit("acme", "relevance judge", { model: "claude-opus-5" });

    expect(result.isSuccess).toBe(true);
    expect(calls[0]!.url).toBe("https://api.example.com/judge/acme/relevance%20judge");
    expect(calls[0]!.init.method).toBe("PUT");
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({ model: "claude-opus-5" });
  });

  // The run/try surfaces name an INSTRUCTION (rubric), not a grader — they live under /instruction.
  it("tries a judge instruction against a single candidate", async () => {
    const { fetch, calls } = mockFetch(200, { json: "{\"pass\":true}", passed: true, error: null });
    globalThis.fetch = fetch;

    const result = await client().Judges.try("acme", "relevance-rubric", {
      context: { text: "running shoes" },
      candidate: { id: "sku-1", text: "Trail Runner" },
    });

    expect(result.isSuccess).toBe(true);
    expect(result.toSuccess().passed).toBe(true);
    expect(calls[0]!.url).toBe("https://api.example.com/instruction/acme/relevance-rubric/try");
  });

  it("runs a judge instruction under the instruction prefix", async () => {
    const { fetch, calls } = mockFetch(202, { run_id: "jr_1" });
    globalThis.fetch = fetch;

    const result = await client().Judges.run("acme", "relevance-rubric", {
      context: { text: "running shoes" },
      candidates: [{ id: "sku-1", text: "Trail Runner" }],
      batch: false,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.toSuccess().run_id).toBe("jr_1");
    expect(calls[0]!.url).toBe("https://api.example.com/instruction/acme/relevance-rubric/run");
    expect(calls[0]!.init.method).toBe("POST");
  });

  it("scopes an instruction list to one grader with the judgeName query param", async () => {
    const { fetch, calls } = mockFetch(200, [{ name: "relevance-rubric", judge_name: "relevance-judge" }]);
    globalThis.fetch = fetch;
    const c = client();

    const result = await c.Judges.listInstructions("acme", "relevance judge");
    await c.Judges.listInstructions("acme");

    expect(result.isSuccess).toBe(true);
    expect(calls[0]!.url).toBe("https://api.example.com/instruction/acme?judgeName=relevance%20judge");
    // Omitted, the list spans every grader on the Account.
    expect(calls[1]!.url).toBe("https://api.example.com/instruction/acme");
  });

  it("creates, reads, edits and deletes a judge instruction", async () => {
    const { fetch, calls } = mockFetch(200, { name: "relevance-rubric", version: 1, judge_name: "relevance-judge" });
    globalThis.fetch = fetch;
    const c = client();

    await c.Judges.createInstruction("acme", {
      judge_name: "relevance-judge",
      name: "relevance-rubric",
      instructions: "Judge relevance.",
      output_schema: "{}",
    });
    await c.Judges.getInstruction("acme", "relevance-rubric");
    await c.Judges.editInstruction("acme", "relevance-rubric", { instructions: "Judge harder.", output_schema: "{}" });
    const removed = await c.Judges.deleteInstruction("acme", "relevance-rubric");

    expect(calls[0]!.url).toBe("https://api.example.com/instruction/acme");
    expect(calls[0]!.init.method).toBe("POST");
    expect(JSON.parse(calls[0]!.init.body as string).judge_name).toBe("relevance-judge");
    expect(calls[1]!.url).toBe("https://api.example.com/instruction/acme/relevance-rubric");
    expect(calls[2]!.init.method).toBe("PUT");
    expect(JSON.parse(calls[2]!.init.body as string).instructions).toBe("Judge harder.");
    expect(calls[3]!.init.method).toBe("DELETE");
    expect(removed.isSuccess).toBe(true);
  });

  it("lists, reads and restores judge instruction versions", async () => {
    const { fetch, calls } = mockFetch(200, { name: "relevance-rubric", version: 3 });
    globalThis.fetch = fetch;
    const c = client();

    await c.Judges.listInstructionVersions("acme", "relevance-rubric");
    await c.Judges.getInstructionVersion("acme", "relevance-rubric", 2);
    const restored = await c.Judges.restoreInstructionVersion("acme", "relevance-rubric", 2);

    expect(calls[0]!.url).toBe("https://api.example.com/instruction/acme/relevance-rubric/versions");
    expect(calls[1]!.url).toBe("https://api.example.com/instruction/acme/relevance-rubric/versions/2");
    // A restore rolls the old content FORWARD as a new current version — it never rewinds.
    expect(calls[2]!.url).toBe("https://api.example.com/instruction/acme/relevance-rubric/restore/2");
    expect(calls[2]!.init.method).toBe("POST");
    expect(restored.toSuccess().version).toBe(3);
  });

  it("gets a judge run status at the /run/ route", async () => {
    const { fetch, calls } = mockFetch(200, { run_id: "jr_1", status: "completed", results: [] });
    globalThis.fetch = fetch;

    const result = await client().Judges.runStatus("acme", "jr_1");

    expect(result.isSuccess).toBe(true);
    expect(result.toSuccess().status).toBe("completed");
    expect(calls[0]!.url).toBe("https://api.example.com/judge/acme/run/jr_1");
  });

  it("routes related/image/click under the search prefix", async () => {
    const { fetch, calls } = mockFetch(200, { results: [], count: 0, total_count: 0 });
    globalThis.fetch = fetch;
    const c = client();

    await c.Search.related("acme", "products", "sku-1", { size: 5 });
    await c.Search.searchListByImage("acme", "products", 1, { image_path: "https://x/y.jpg" });
    await c.Search.recordListClick("acme", "products", { query_id: "q1", result_id: "sku-1" });

    expect(calls[0]!.url).toBe("https://api.example.com/search/related/acme/products/sku-1");
    expect(calls[1]!.url).toBe("https://api.example.com/search/images/acme/products/1");
    expect(calls[2]!.url).toBe("https://api.example.com/search/analytics/click/list/acme/products");
  });

  it("fetches the anonymous api info manifest", async () => {
    const { fetch, calls } = mockFetch(200, { name: "Search Stack", version: "1.0" });
    globalThis.fetch = fetch;

    const result = await client().Discovery.info();

    expect(result.isSuccess).toBe(true);
    expect(result.toSuccess().name).toBe("Search Stack");
    expect(calls[0]!.url).toBe("https://api.example.com/api/info");
    expect(calls[0]!.init.method).toBe("GET");
  });

  it("creates a watch against a list", async () => {
    const { fetch, calls } = mockFetch(200, { account_name: "acme", name: "new-arrivals", size: 25 });
    globalThis.fetch = fetch;

    const result = await client().Watches.create("acme", { name: "new-arrivals", list_name: "products", query: "boots" });

    expect(result.isSuccess).toBe(true);
    expect(result.toSuccess().name).toBe("new-arrivals");
    expect(calls[0]!.url).toBe("https://api.example.com/watch/acme");
    expect(calls[0]!.init.method).toBe("POST");
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({ name: "new-arrivals", list_name: "products", query: "boots" });
  });

  it("filters the watch listing by list, and omits the query string when unfiltered", async () => {
    const { fetch, calls } = mockFetch(200, []);
    globalThis.fetch = fetch;

    const c = client();
    await c.Watches.list("acme", { list_name: "products" });
    await c.Watches.list("acme");

    expect(calls[0]!.url).toBe("https://api.example.com/watch/acme?list_name=products");
    expect(calls[1]!.url).toBe("https://api.example.com/watch/acme");
  });

  it("reads a watch's match history", async () => {
    const { fetch, calls } = mockFetch(200, [{ record_id: "sku-1", status: "matched" }]);
    globalThis.fetch = fetch;

    const c = client();
    const result = await c.Watches.matches("acme", "new-arrivals", 10);
    await c.Watches.matches("acme", "new-arrivals");

    expect(result.isSuccess).toBe(true);
    expect(result.toSuccess()[0]!.record_id).toBe("sku-1");
    expect(calls[0]!.url).toBe("https://api.example.com/watch/acme/new-arrivals/matches?take=10");
    expect(calls[1]!.url).toBe("https://api.example.com/watch/acme/new-arrivals/matches");
  });

  it("checks a watch now with a POST to its check route", async () => {
    const { fetch, calls } = mockFetch(200, {});
    globalThis.fetch = fetch;

    const result = await client().Watches.checkNow("acme", "new-arrivals");

    expect(result.isSuccess).toBe(true);
    expect(calls[0]!.url).toBe("https://api.example.com/watch/acme/new-arrivals/check");
    expect(calls[0]!.init.method).toBe("POST");
  });

  it("edits a watch with PUT and deletes it", async () => {
    const { fetch, calls } = mockFetch(200, { account_name: "acme", name: "new-arrivals" });
    globalThis.fetch = fetch;

    const c = client();
    await c.Watches.edit("acme", "new-arrivals", { query: "trail shoes", enabled: false });
    await c.Watches.delete("acme", "new-arrivals");

    expect(calls[0]!.url).toBe("https://api.example.com/watch/acme/new-arrivals");
    expect(calls[0]!.init.method).toBe("PUT");
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({ query: "trail shoes", enabled: false });
    expect(calls[1]!.init.method).toBe("DELETE");
  });

  // Query rules. The routes are the whole risk here: the service has four paths that differ only in a suffix
  // ({rule}, {rule}/state, {rule}/stance, {rule}/metrics) plus two on the list rather than the rule, and a
  // wrong one 404s rather than failing loudly at build time.
  it("reads query rules and the shipped templates", async () => {
    const { fetch, calls } = mockFetch(200, []);
    globalThis.fetch = fetch;

    const c = client();
    await c.QueryRules.templates();
    await c.QueryRules.list("acme", "addresses");
    await c.QueryRules.get("acme", "addresses", "postcode");
    await c.QueryRules.fieldProfiles("acme", "addresses");

    expect(calls[0]!.url).toBe("https://api.example.com/query-rule/templates");
    expect(calls[1]!.url).toBe("https://api.example.com/query-rule/acme/addresses");
    expect(calls[2]!.url).toBe("https://api.example.com/query-rule/acme/addresses/postcode");
    expect(calls[3]!.url).toBe("https://api.example.com/query-rule/acme/addresses/profiles");
    expect(calls.every((x) => x.init.method === "GET")).toBe(true);
  });

  it("creates a query rule and posts the body through", async () => {
    const { fetch, calls } = mockFetch(200, { name: "postcode", target_field: "postcode" });
    globalThis.fetch = fetch;

    const result = await client().QueryRules.create("acme", "addresses", {
      name: "postcode",
      target_field: "postcode",
      recognizer: "uk-postcode",
      state: "Shadow",
    });

    expect(result.isSuccess).toBe(true);
    expect(calls[0]!.url).toBe("https://api.example.com/query-rule/acme/addresses");
    expect(calls[0]!.init.method).toBe("POST");
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({
      name: "postcode",
      target_field: "postcode",
      recognizer: "uk-postcode",
      state: "Shadow",
    });
  });

  // Nothing is searched and nothing is stored, so this is the call to reach for first.
  it("tests how a query will be read", async () => {
    const { fetch, calls } = mockFetch(200, { query: "flat 2 zz1 1zz", text: "flat 2", constraints: [] });
    globalThis.fetch = fetch;

    const result = await client().QueryRules.test("acme", "addresses", { query: "flat 2 zz1 1zz" });

    expect(result.isSuccess).toBe(true);
    expect(result.toSuccess().text).toBe("flat 2");
    expect(calls[0]!.url).toBe("https://api.example.com/query-rule/acme/addresses/test");
    expect(calls[0]!.init.method).toBe("POST");
  });

  // state and stance are separate routes on purpose — a combined edit would discard the shadow evidence being
  // decided on — so each must land on its own suffix.
  it("keeps edit, state and stance on separate routes", async () => {
    const { fetch, calls } = mockFetch(200, { name: "postcode" });
    globalThis.fetch = fetch;

    const c = client();
    await c.QueryRules.edit("acme", "addresses", "postcode", { target_field: "postcode", recognizer: "uk-postcode" });
    await c.QueryRules.setState("acme", "addresses", "postcode", { state: "Enabled" });
    await c.QueryRules.setStance("acme", "addresses", "postcode", { stance: "Passive" });

    expect(calls[0]!.url).toBe("https://api.example.com/query-rule/acme/addresses/postcode");
    expect(calls[1]!.url).toBe("https://api.example.com/query-rule/acme/addresses/postcode/state");
    expect(calls[2]!.url).toBe("https://api.example.com/query-rule/acme/addresses/postcode/stance");
    expect(calls.every((x) => x.init.method === "PUT")).toBe(true);
    expect(JSON.parse(calls[1]!.init.body as string)).toEqual({ state: "Enabled" });
    expect(JSON.parse(calls[2]!.init.body as string)).toEqual({ stance: "Passive" });
  });

  it("reorders, infers both ways, reads metrics and deletes", async () => {
    const { fetch, calls } = mockFetch(200, {});
    globalThis.fetch = fetch;

    const c = client();
    await c.QueryRules.reorder("acme", "addresses", { names: ["postcode", "phone"] });
    await c.QueryRules.infer("acme", "addresses");
    await c.QueryRules.inferFromSearches("acme", "addresses");
    await c.QueryRules.metrics("acme", "addresses", "postcode");
    await c.QueryRules.delete("acme", "addresses", "postcode");

    expect(calls[0]!.url).toBe("https://api.example.com/query-rule/acme/addresses/reorder");
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({ names: ["postcode", "phone"] });
    expect(calls[1]!.url).toBe("https://api.example.com/query-rule/acme/addresses/infer");
    expect(calls[2]!.url).toBe("https://api.example.com/query-rule/acme/addresses/infer-from-searches");
    expect(calls[3]!.url).toBe("https://api.example.com/query-rule/acme/addresses/postcode/metrics");
    expect(calls[3]!.init.method).toBe("GET");
    expect(calls[4]!.init.method).toBe("DELETE");
  });

  // A rule name can carry characters that must not be read as path segments.
  it("encodes account, list and rule names", async () => {
    const { fetch, calls } = mockFetch(200, {});
    globalThis.fetch = fetch;

    await client().QueryRules.get("ac me", "add/resses", "post code");

    expect(calls[0]!.url).toBe("https://api.example.com/query-rule/ac%20me/add%2Fresses/post%20code");
  });

  // purge_inactive_after_days was readable on a list but not writable through this package — the update
  // request simply did not carry it, so retention could only be half-configured from a client.
  it("sends both retention settings on a list update", async () => {
    const { fetch, calls } = mockFetch(200, { list_name: "products" });
    globalThis.fetch = fetch;

    await client().Lists.edit("acme", "products", { default_ttl_seconds: 2592000, purge_inactive_after_days: 30 });

    expect(calls[0]!.url).toBe("https://api.example.com/list/acme/products");
    expect(calls[0]!.init.method).toBe("PUT");
    expect(JSON.parse(calls[0]!.init.body as string))
      .toEqual({ default_ttl_seconds: 2592000, purge_inactive_after_days: 30 });
  });

  // 0 is the spelling of "off" for both, and it has to survive the round trip as a real value — a client
  // that dropped it as falsy would silently leave retention on.
  it("sends a zero rather than dropping it when retention is turned off", async () => {
    const { fetch, calls } = mockFetch(200, { list_name: "products" });
    globalThis.fetch = fetch;

    await client().Lists.edit("acme", "products", { default_ttl_seconds: 0, purge_inactive_after_days: 0 });

    expect(JSON.parse(calls[0]!.init.body as string))
      .toEqual({ default_ttl_seconds: 0, purge_inactive_after_days: 0 });
  });
});

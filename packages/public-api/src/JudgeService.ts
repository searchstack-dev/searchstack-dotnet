import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import {
  Response,
  Problem,
  JudgeDetailsResponse,
  JudgeInstructionResponse,
  JudgeRunStatusResponse,
  RunJudgeResponse,
  TryJudgeResponse,
  CreateJudgeRequest,
  EditJudgeRequest,
  CreateJudgeInstructionRequest,
  EditJudgeInstructionRequest,
  RunJudgeRequest,
  TryJudgeRequest,
} from "./Types.js";

const enc = encodeURIComponent;

// Judges: BYO LLM graders that score candidates/search hits against instructions
// and a structured output schema. Used standalone and to score Eval runs.
export default class JudgeService {
  private readonly path = `judge`;
  private readonly instructionPath = `instruction`;
  constructor(private readonly fetch: Fetch) {}

  // ─── Graders (model + credential) ────────────────────────────────────────

  /** Lists the Judge graders in an Account. */
  async list(account_name: string): Promise<Response<JudgeDetailsResponse[], Problem>> {
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}`);
    return handleResponse(response, async () => (await response.json()) as JudgeDetailsResponse[]);
  }

  /** Retrieves a single Judge grader. */
  async get(account_name: string, judge_name: string): Promise<Response<JudgeDetailsResponse, Problem>> {
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}/${enc(judge_name)}`);
    return handleResponse(response, async () => (await response.json()) as JudgeDetailsResponse);
  }

  /** Retrieves the status (and per-candidate results) of a Judge run. */
  async runStatus(account_name: string, run_id: string): Promise<Response<JudgeRunStatusResponse, Problem>> {
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}/run/${enc(run_id)}`);
    return handleResponse(response, async () => (await response.json()) as JudgeRunStatusResponse);
  }

  /** Creates a Judge grader (model + credential). */
  async create(account_name: string, request: CreateJudgeRequest): Promise<Response<JudgeDetailsResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/${enc(account_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as JudgeDetailsResponse);
  }

  /** Edits a Judge grader (model + credential) in place. */
  async edit(account_name: string, judge_name: string, request: EditJudgeRequest): Promise<Response<JudgeDetailsResponse, Problem>> {
    const response = await this.fetch.put(`${this.path}/${enc(account_name)}/${enc(judge_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as JudgeDetailsResponse);
  }

  /** Deletes a Judge grader (and cascade-deletes its instructions). */
  async delete(account_name: string, judge_name: string): Promise<Response<void, Problem>> {
    const response = await this.fetch.delete(`${this.path}/${enc(account_name)}/${enc(judge_name)}`);
    return handleResponse(response, () => undefined);
  }

  // ─── Instructions ────────────────────────────────────────────────────────

  /** Lists the judge instructions on an Account, optionally scoped to one judge. */
  async listInstructions(account_name: string, judge_name?: string): Promise<Response<JudgeInstructionResponse[], Problem>> {
    const suffix = judge_name ? `?judgeName=${enc(judge_name)}` : "";
    const response = await this.fetch.get(`${this.instructionPath}/${enc(account_name)}${suffix}`);
    return handleResponse(response, async () => (await response.json()) as JudgeInstructionResponse[]);
  }

  /** Retrieves a single judge instruction. */
  async getInstruction(account_name: string, name: string): Promise<Response<JudgeInstructionResponse, Problem>> {
    const response = await this.fetch.get(`${this.instructionPath}/${enc(account_name)}/${enc(name)}`);
    return handleResponse(response, async () => (await response.json()) as JudgeInstructionResponse);
  }

  /** Adds an instruction to an existing judge. */
  async createInstruction(account_name: string, request: CreateJudgeInstructionRequest): Promise<Response<JudgeInstructionResponse, Problem>> {
    const response = await this.fetch.post(`${this.instructionPath}/${enc(account_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as JudgeInstructionResponse);
  }

  /** Edits an instruction in place. */
  async editInstruction(account_name: string, name: string, request: EditJudgeInstructionRequest): Promise<Response<JudgeInstructionResponse, Problem>> {
    const response = await this.fetch.put(`${this.instructionPath}/${enc(account_name)}/${enc(name)}`, request);
    return handleResponse(response, async () => (await response.json()) as JudgeInstructionResponse);
  }

  /** Deletes an instruction. The judge it ran on is left intact. */
  async deleteInstruction(account_name: string, name: string): Promise<Response<void, Problem>> {
    const response = await this.fetch.delete(`${this.instructionPath}/${enc(account_name)}/${enc(name)}`);
    return handleResponse(response, () => undefined);
  }

  // ─── Instruction versions ─────────────────────────────────────────────────
  // Content is immutable per version — an edit appends a version; these list/view/restore the history.

  /** Lists every version of a judge instruction, newest first. */
  async listInstructionVersions(account_name: string, name: string): Promise<Response<JudgeInstructionResponse[], Problem>> {
    const response = await this.fetch.get(`${this.instructionPath}/${enc(account_name)}/${enc(name)}/versions`);
    return handleResponse(response, async () => (await response.json()) as JudgeInstructionResponse[]);
  }

  /** Retrieves one version of a judge instruction by its version number. */
  async getInstructionVersion(account_name: string, name: string, version: number): Promise<Response<JudgeInstructionResponse, Problem>> {
    const response = await this.fetch.get(`${this.instructionPath}/${enc(account_name)}/${enc(name)}/versions/${version}`);
    return handleResponse(response, async () => (await response.json()) as JudgeInstructionResponse);
  }

  /** Restores an older instruction version by adding it again as the new current version. Returns the new current version. */
  async restoreInstructionVersion(account_name: string, name: string, version: number): Promise<Response<JudgeInstructionResponse, Problem>> {
    const response = await this.fetch.post(`${this.instructionPath}/${enc(account_name)}/${enc(name)}/restore/${version}`, {});
    return handleResponse(response, async () => (await response.json()) as JudgeInstructionResponse);
  }

  /** Runs a judge instruction over explicit candidates or live search hits. Asynchronous (HTTP 202). */
  async run(account_name: string, instruction_name: string, request: RunJudgeRequest): Promise<Response<RunJudgeResponse, Problem>> {
    const response = await this.fetch.post(`${this.instructionPath}/${enc(account_name)}/${enc(instruction_name)}/run`, request);
    return handleResponse(response, async () => (await response.json()) as RunJudgeResponse);
  }

  /** Synchronously tries a judge instruction against a single candidate and returns its verdict. */
  async try(account_name: string, instruction_name: string, request: TryJudgeRequest): Promise<Response<TryJudgeResponse, Problem>> {
    const response = await this.fetch.post(`${this.instructionPath}/${enc(account_name)}/${enc(instruction_name)}/try`, request);
    return handleResponse(response, async () => (await response.json()) as TryJudgeResponse);
  }
}

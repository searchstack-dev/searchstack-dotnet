import { Problem, Response, SuccessResponse, ProblemResponse } from "./Types.js";

export const isOk = (response: globalThis.Response): boolean =>
  response.status >= 200 && response.status < 300;

// Standard try/status-check/error-wrap envelope used by every service method.
// `ok` produces the success value (it may read the body or not, mirroring
// per-method behaviour). Non-success statuses are parsed as a Problem;
// network/JSON failures are caught and surfaced as a status-500 Problem.
export async function handleResponse<T>(
  response: globalThis.Response,
  ok: () => Promise<T> | T
): Promise<Response<T, Problem>> {
  try {
    if (isOk(response)) {
      return new SuccessResponse<T>(await ok());
    }
    const json: Problem = await response.json();
    return new ProblemResponse<T>(json);
  } catch (ex: unknown) {
    if (ex instanceof Error) {
      return new ProblemResponse<T>({ detail: ex.message, title: ex.name, status: 500, instance: '', type: '' });
    }
    throw ex;
  }
}

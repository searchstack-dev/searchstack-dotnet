import Fetch from "./Fetch.js";
import { Response, Problem, SuccessResponse, ProblemResponse } from "./Types.js";
import { isOk } from "./handleResponse.js";

/** A file read from a list's media store: the bytes and what they are. */
export type MediaFile = {
  /** The file's contents. */
  bytes: Blob;
  /** The MIME type the store reports, e.g. `image/jpeg`. */
  contentType: string;
};

/**
 * Reading the media a record points at.
 *
 * A record that has been captured (or imported from a media store) holds a PATH rather than a URL —
 * deliberately, because a path never expires while somebody else's link rots. This is how that path
 * becomes a picture again. It needs only `search-result:read`: the same permission that returned the
 * record naming the path, which is why a browser-safe read key is enough.
 */
export default class MediaService {
  private readonly path = `media`;
  constructor(private readonly fetch: Fetch) {}

  /**
   * The absolute URL of a file, for putting straight in an `<img src>` or `<video src>`.
   *
   * Prefer this to `get()` whenever the bytes are only going to the browser anyway: the browser
   * fetches once and caches it (captured keys are immutable, so the response says so) and your code
   * never holds the file. Note the URL alone is not authenticated — the read key still has to travel
   * on the request.
   */
  getUrl(account_name: string, list_name: string, media_path: string): string {
    return `${this.fetch.baseUri}${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${this.encodePath(media_path)}`;
  }

  /** Downloads a file's bytes and content type. */
  async get(account_name: string, list_name: string, media_path: string): Promise<Response<MediaFile, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(list_name)}/${this.encodePath(media_path)}`;
    const response = await this.fetch.get(path);

    // Not handleResponse: that parses JSON, which is exactly what a file read must not do. A failure
    // still carries the API's ProblemDetails, so the error shape callers expect is unchanged.
    if (!isOk(response)) {
      try {
        return new ProblemResponse<MediaFile>((await response.json()) as Problem);
      } catch (ex) {
        const error = ex as Error;
        return new ProblemResponse<MediaFile>({
          detail: error.message, title: error.name, status: response.status, instance: '', type: '',
        });
      }
    }

    return new SuccessResponse<MediaFile>({
      bytes: await response.blob(),
      contentType: response.headers.get("content-type") ?? "application/octet-stream",
    });
  }

  // Each segment is escaped, the separators are not: a store key like "captured/aero.jpg" is a path,
  // and escaping its slash would address a file literally called "captured%2Faero.jpg".
  private encodePath(media_path: string): string {
    return media_path.split("/").map(encodeURIComponent).join("/");
  }
}

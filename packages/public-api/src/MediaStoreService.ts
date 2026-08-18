import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import { Response, Problem, DeleteMediaResponse } from "./Types.js";

// Encodes a media key for use as a PATH, segment by segment, so its folder separators survive as real
// separators. encodeURIComponent over the whole key would emit "posters%2F9f8a.jpg", and an encoded
// slash inside a path is a bad bet — some hosts and proxies reject %2F outright rather than decode it.
function encodeMediaPath(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

export default class MediaStoreService {
  private readonly path = `media-store`;
  constructor(private readonly fetch: Fetch) {}

  /**
   * Permanently deletes a media item from a media store. `media_name` is the item's FULL path within
   * the store, folders included — for example `posters/9f8a.jpg`.
   */
  async deleteMedia(account_name: string, store_name: string, media_name: string): Promise<Response<DeleteMediaResponse, Problem>> {
    const path = `${this.path}/${encodeURIComponent(account_name)}/${encodeURIComponent(store_name)}/media/${encodeMediaPath(media_name)}`;
    const response = await this.fetch.delete(path);
    return handleResponse(response, async () => (await response.json()) as DeleteMediaResponse);
  }
}

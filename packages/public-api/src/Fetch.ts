// Thin transport over the global `fetch`. Holds the client-level credentials and
// attaches the appropriate auth header to every request. The public API accepts
// either an API key (`X-API-Key` header) or a JWT access token
// (`Authorization: Bearer`); when both are configured the access token wins.

/** Credentials for the client. Supply at least one of the two. */
export type Credentials = {
  /** API key, sent as the `X-API-Key` header. */
  apiKey?: string;
  /** JWT access token, sent as `Authorization: Bearer <token>`. */
  accessToken?: string;
};

export default class Fetch {
  readonly baseUri: string;
  private credentials: Credentials;

  constructor(baseUri: string, credentials: Credentials) {
    this.baseUri = baseUri.endsWith('/') ? baseUri : baseUri + '/';
    this.credentials = { ...credentials };
  }

  /** Replace the access token (e.g. after a refresh). Pass undefined to clear it. */
  setAccessToken(accessToken: string | undefined): void {
    this.credentials.accessToken = accessToken;
  }

  /** Replace the API key. Pass undefined to clear it. */
  setApiKey(apiKey: string | undefined): void {
    this.credentials.apiKey = apiKey;
  }

  private getUrl = (path: string): string => {
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    return `${this.baseUri}${path}`;
  };

  private authHeaders(): Record<string, string> {
    if (this.credentials.accessToken) {
      return { 'Authorization': `Bearer ${this.credentials.accessToken}` };
    }
    if (this.credentials.apiKey) {
      return { 'X-API-Key': this.credentials.apiKey };
    }
    return {};
  }

  async get(path: string): Promise<globalThis.Response> {
    return await fetch(this.getUrl(path), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeaders(),
      },
    });
  }

  async post(path: string, body: unknown): Promise<globalThis.Response> {
    return await fetch(this.getUrl(path), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeaders(),
      },
      body: body !== undefined && body !== null ? JSON.stringify(body) : null,
    });
  }

  async put(path: string, body: unknown): Promise<globalThis.Response> {
    return await fetch(this.getUrl(path), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeaders(),
      },
      body: body !== undefined && body !== null ? JSON.stringify(body) : null,
    });
  }

  async delete(path: string): Promise<globalThis.Response> {
    return await fetch(this.getUrl(path), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeaders(),
      },
    });
  }
}

using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace SearchStack.PublicApi;

// Thin transport over HttpClient. Holds the client-level credentials and attaches
// the appropriate auth header to every request. The public API accepts either an
// API key (X-API-Key header) or a JWT access token (Authorization: Bearer); when
// both are configured the access token wins.
//
// No method throws on an HTTP, network or JSON error: each resolves to a Response
// that is either a success carrying the typed payload or a Problem. Network/JSON
// errors become a Problem with status 500. OperationCanceledException propagates.
internal sealed class Transport
{
    private readonly HttpClient _http;
    private readonly Uri _baseUri;
    private readonly Credentials _credentials;

    internal Transport(HttpClient http, string baseUrl, Credentials credentials)
    {
        _http = http ?? throw new ArgumentNullException(nameof(http));
        if (string.IsNullOrWhiteSpace(baseUrl)) throw new ArgumentNullException(nameof(baseUrl));
        _baseUri = new Uri(baseUrl.EndsWith("/", StringComparison.Ordinal) ? baseUrl : baseUrl + "/", UriKind.Absolute);
        // Copy so runtime credential swaps on the client are observed here.
        _credentials = credentials ?? new Credentials();
    }

    internal void SetAccessToken(string? accessToken) => _credentials.AccessToken = accessToken;
    internal void SetApiKey(string? apiKey) => _credentials.ApiKey = apiKey;

    // ─── Typed verbs ──────────────────────────────────────────────────────────

    internal Task<Response<T>> GetAsync<T>(string path, CancellationToken ct) =>
        SendJsonAsync<T>(HttpMethod.Get, path, body: null, ct);

    internal Task<Response<T>> PostAsync<T>(string path, object? body, CancellationToken ct) =>
        SendJsonAsync<T>(HttpMethod.Post, path, body, ct);

    internal Task<Response<T>> PutAsync<T>(string path, object? body, CancellationToken ct) =>
        SendJsonAsync<T>(HttpMethod.Put, path, body, ct);

    internal Task<Response<T>> DeleteAsync<T>(string path, CancellationToken ct) =>
        SendJsonAsync<T>(HttpMethod.Delete, path, body: null, ct);

    // ─── Binary ───────────────────────────────────────────────────────────────

    // The base the API is reached at, so a caller can build an absolute media URL to put in an <img src>
    // rather than fetching bytes it only intends to hand to the browser anyway.
    internal Uri BaseUri => _baseUri;

    // A GET whose body is a FILE. Separate from the typed verbs because those deserialise, which is exactly
    // what an image read must not do.
    internal async Task<Response<MediaFile>> GetFileAsync(string path, CancellationToken ct)
    {
        try
        {
            using var response = await SendCoreAsync(HttpMethod.Get, path, body: null, ct).ConfigureAwait(false);

            if (!IsOk(response))
            {
                var json = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                return Response<MediaFile>.Failed(ToProblem(response, json));
            }

            var bytes = await response.Content.ReadAsByteArrayAsync().ConfigureAwait(false);
            var contentType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";

            return Response<MediaFile>.Success(new MediaFile(bytes, contentType));
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException)
        {
            return Response<MediaFile>.Failed(LocalProblem(ex));
        }
    }

    // ─── Void verbs ───────────────────────────────────────────────────────────

    internal Task<Response> PostAsync(string path, object? body, CancellationToken ct) =>
        SendNoContentAsync(HttpMethod.Post, path, body, ct);

    internal Task<Response> DeleteAsync(string path, CancellationToken ct) =>
        SendNoContentAsync(HttpMethod.Delete, path, body: null, ct);

    // ─── Core ─────────────────────────────────────────────────────────────────

    private async Task<Response<T>> SendJsonAsync<T>(HttpMethod method, string path, object? body, CancellationToken ct)
    {
        try
        {
            using var response = await SendCoreAsync(method, path, body, ct).ConfigureAwait(false);
            var json = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

            if (!IsOk(response))
            {
                return Response<T>.Failed(ToProblem(response, json));
            }

            var data = string.IsNullOrWhiteSpace(json)
                ? default!
                : JsonSerializer.Deserialize<T>(json, Json.Options)!;
            return Response<T>.Success(data);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException)
        {
            return Response<T>.Failed(LocalProblem(ex));
        }
    }

    private async Task<Response> SendNoContentAsync(HttpMethod method, string path, object? body, CancellationToken ct)
    {
        try
        {
            using var response = await SendCoreAsync(method, path, body, ct).ConfigureAwait(false);

            if (IsOk(response))
            {
                return Response.Success();
            }

            var json = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
            return Response.Failed(ToProblem(response, json));
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException)
        {
            return Response.Failed(LocalProblem(ex));
        }
    }

    private async Task<HttpResponseMessage> SendCoreAsync(HttpMethod method, string path, object? body, CancellationToken ct)
    {
        var trimmed = path.StartsWith("/", StringComparison.Ordinal) ? path.Substring(1) : path;
        var uri = new Uri(_baseUri, trimmed);

        using var request = new HttpRequestMessage(method, uri);

        if (body is not null)
        {
            var content = JsonSerializer.Serialize(body, body.GetType(), Json.Options);
            request.Content = new StringContent(content, Encoding.UTF8, "application/json");
        }

        ApplyAuth(request);

        return await _http.SendAsync(request, ct).ConfigureAwait(false);
    }

    private void ApplyAuth(HttpRequestMessage request)
    {
        if (!string.IsNullOrEmpty(_credentials.AccessToken))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _credentials.AccessToken);
        }
        else if (!string.IsNullOrEmpty(_credentials.ApiKey))
        {
            request.Headers.TryAddWithoutValidation("X-API-Key", _credentials.ApiKey);
        }
    }

    private static bool IsOk(HttpResponseMessage response) =>
        (int)response.StatusCode >= 200 && (int)response.StatusCode < 300;

    private static Problem ToProblem(HttpResponseMessage response, string json)
    {
        var status = (int)response.StatusCode;
        if (!string.IsNullOrWhiteSpace(json))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<Problem>(json, Json.Options);
                if (parsed is not null)
                {
                    if (parsed.Status == 0) parsed.Status = status;
                    return parsed;
                }
            }
            catch (JsonException)
            {
                // Fall through to a synthesized problem.
            }
        }

        return new Problem { Status = status, Title = response.ReasonPhrase ?? "", Detail = response.ReasonPhrase ?? "" };
    }

    private static Problem LocalProblem(Exception ex) =>
        new Problem { Status = 500, Title = ex.GetType().Name, Detail = ex.Message };
}

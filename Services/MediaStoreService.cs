using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>Media store operations.</summary>
public sealed class MediaStoreService
{
    private const string Path = "media-store";
    private readonly Transport _transport;

    internal MediaStoreService(Transport transport) => _transport = transport;

    /// <summary>
    /// Permanently deletes a media item from a media store. <paramref name="mediaName"/> is the item's
    /// FULL path within the store, folders included — for example <c>posters/9f8a.jpg</c>.
    /// </summary>
    public Task<Response<DeleteMediaResponse>> DeleteMediaAsync(string accountName, string storeName, string mediaName, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync<DeleteMediaResponse>($"{Path}/{Enc(accountName)}/{Enc(storeName)}/media/{EncMediaPath(mediaName)}", cancellationToken);

    // Escapes a media key for use as a PATH, segment by segment, so its folder separators survive as real
    // separators. Escaping the whole key would emit "posters%2F9f8a.jpg", and an encoded slash inside a
    // path is a bad bet — some hosts and proxies reject %2F outright rather than decode it.
    // string.Join's char-separator overload is .NET Core only; this package also targets netstandard2.0.
    private static string EncMediaPath(string mediaName) =>
        string.Join("/", mediaName.Split('/').Select(Enc));
}

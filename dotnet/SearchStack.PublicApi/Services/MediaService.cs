using System;
using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>A file read from a list's media store: the bytes and what they are.</summary>
public sealed class MediaFile
{
    internal MediaFile(byte[] bytes, string contentType)
    {
        Bytes = bytes;
        ContentType = contentType;
    }

    /// <summary>The file's contents.</summary>
    public byte[] Bytes { get; }

    /// <summary>The MIME type the store reports, e.g. <c>image/jpeg</c>.</summary>
    public string ContentType { get; }
}

/// <summary>
/// Reading the media a record points at.
/// <para>A record that has been captured (or imported from a media store) holds a PATH rather than a URL —
/// deliberately, because a path never expires while somebody else's link rots. This is how that path becomes
/// a picture again. It needs only <c>search-result:read</c>: the same permission that returned the record
/// naming the path, which is why a browser-safe read key is enough.</para>
/// </summary>
public sealed class MediaService
{
    private const string Path = "media";
    private readonly Transport _transport;

    internal MediaService(Transport transport) => _transport = transport;

    /// <summary>
    /// The absolute URL of a file, for putting straight in an <c>&lt;img src&gt;</c> or <c>&lt;video src&gt;</c>.
    /// <para>Prefer this to <see cref="GetAsync"/> whenever the bytes are only going to the browser anyway:
    /// the browser fetches once, caches it (captured keys are immutable, so the response says so), and your
    /// server carries nothing. Note the URL alone is not authenticated — it needs the key on the request, so
    /// use it where your read key already travels.</para>
    /// </summary>
    public Uri GetUrl(string accountName, string listName, string mediaPath) =>
        new Uri(_transport.BaseUri, $"{Path}/{Enc(accountName)}/{Enc(listName)}/{EncPath(mediaPath)}");

    /// <summary>Downloads a file's bytes and content type.</summary>
    public Task<Response<MediaFile>> GetAsync(string accountName, string listName, string mediaPath, CancellationToken cancellationToken = default) =>
        _transport.GetFileAsync($"{Path}/{Enc(accountName)}/{Enc(listName)}/{EncPath(mediaPath)}", cancellationToken);

    // Each segment is escaped, the separators are not: a store key like "captured/aero.jpg" is a path, and
    // escaping its slash would address a file literally called "captured%2Faero.jpg".
    private static string EncPath(string mediaPath) =>
        string.Join("/", Array.ConvertAll(mediaPath.Split('/'), Enc));
}

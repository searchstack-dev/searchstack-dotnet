using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>Contributor add / remove operations.</summary>
public sealed class ContributorService
{
    private const string Path = "contributor";
    private readonly Transport _transport;

    internal ContributorService(Transport transport) => _transport = transport;

    /// <summary>Adds a Contributor - can add fields and search results but not make breaking changes.</summary>
    public Task<Response<ContributorResponse>> AddAsync(AddContributorRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<ContributorResponse>(Path, request, cancellationToken);

    /// <summary>Removes a Contributor's access to the List.</summary>
    public Task<Response> RemoveAsync(string accountName, string listName, string contributorName, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Enc(contributorName)}", cancellationToken);
}

using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>Account read operations.</summary>
public sealed class AccountService
{
    private const string Path = "account";
    private readonly Transport _transport;

    internal AccountService(Transport transport) => _transport = transport;

    /// <summary>Retrieves the details of an Account.</summary>
    public Task<Response<AccountResponse>> GetAsync(string accountName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<AccountResponse>($"{Path}/{Enc(accountName)}", cancellationToken);

    /// <summary>Retrieves the account name of the currently authenticated caller.</summary>
    public Task<Response<AccountNameResponse>> GetNameAsync(CancellationToken cancellationToken = default) =>
        _transport.GetAsync<AccountNameResponse>(Path, cancellationToken);

    /// <summary>
    /// Retrieves anything currently wrong with an Account: a feed that has stopped updating, an import or
    /// gate backfill that failed, a bring-your-own service that is not responding, or automatic syncing
    /// being paused. Worth asking before debugging a search that is returning stale data.
    /// </summary>
    public Task<Response<AccountHealthResponse>> GetHealthAsync(string accountName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<AccountHealthResponse>($"{Path}/issues/{Enc(accountName)}", cancellationToken);
}

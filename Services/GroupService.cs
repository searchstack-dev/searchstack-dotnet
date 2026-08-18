using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>Group create / delete operations.</summary>
public sealed class GroupService
{
    private const string Path = "group";
    private readonly Transport _transport;

    internal GroupService(Transport transport) => _transport = transport;

    /// <summary>Creates a Group - search multiple Lists by combining them into a Group.</summary>
    public Task<Response<GroupResponse>> CreateAsync(CreateGroupRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<GroupResponse>(Path, request, cancellationToken);

    /// <summary>Clones a Group into a new Group, copying its configuration and member Lists. By default members are re-pinned to their latest version.</summary>
    public Task<Response<GroupResponse>> CloneAsync(string accountName, string groupName, CloneGroupRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<GroupResponse>($"{Path}/clone/{Enc(accountName)}/{Enc(groupName)}", request, cancellationToken);

    /// <summary>Bumps a Group's version: re-pins every member List to its latest version and advances current_version. A no-op when every member is already current.</summary>
    public Task<Response<GroupResponse>> BumpVersionAsync(string accountName, string groupName, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<GroupResponse>($"{Path}/version/{Enc(accountName)}/{Enc(groupName)}", new { }, cancellationToken);

    /// <summary>Restores a historical membership version as the Group's new current_version (roll-forward, not rewind). Member Lists deleted since that version are skipped and returned in skipped_lists.</summary>
    public Task<Response<GroupRestoreResponse>> RestoreVersionAsync(string accountName, string groupName, int version, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<GroupRestoreResponse>($"{Path}/restore/{Enc(accountName)}/{Enc(groupName)}/{version}", new { }, cancellationToken);

    /// <summary>Lists every searchable membership version of a Group (pass one as group_version to search a frozen set of records).</summary>
    public Task<Response<GroupVersionsResponse>> GetVersionsAsync(string accountName, string groupName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<GroupVersionsResponse>($"{Path}/versions/{Enc(accountName)}/{Enc(groupName)}", cancellationToken);

    /// <summary>Returns the member Lists (and pinned versions) that a specific group_version searches.</summary>
    public Task<Response<GroupVersionMembersResponse>> GetVersionMembersAsync(string accountName, string groupName, int version, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<GroupVersionMembersResponse>($"{Path}/versions/{Enc(accountName)}/{Enc(groupName)}/{version}", cancellationToken);

    /// <summary>Gets a Group's configuration, member Lists and IP whitelist.</summary>
    public Task<Response<GroupResponse>> GetAsync(string accountName, string groupName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<GroupResponse>($"{Path}/{Enc(accountName)}/{Enc(groupName)}", cancellationToken);

    /// <summary>Updates a Group's default search/suggest size and distance unit.</summary>
    public Task<Response<GroupResponse>> UpdateAsync(string accountName, string groupName, UpdateGroupRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<GroupResponse>($"{Path}/{Enc(accountName)}/{Enc(groupName)}", request, cancellationToken);

    /// <summary>Adds a List (at a version) to a Group.</summary>
    public Task<Response<GroupResponse>> AddListAsync(string accountName, string groupName, AddListToGroupRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<GroupResponse>($"{Path}/list/{Enc(accountName)}/{Enc(groupName)}", request, cancellationToken);

    /// <summary>Removes a List from a Group.</summary>
    public Task<Response<GroupResponse>> RemoveListAsync(string accountName, string groupName, string listName, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync<GroupResponse>($"{Path}/list/{Enc(accountName)}/{Enc(groupName)}/{Enc(listName)}", cancellationToken);

    /// <summary>Sets the embedding model for a Group; member Lists are re-embedded asynchronously.</summary>
    public Task<Response<GroupResponse>> SetModelAsync(string accountName, string groupName, SetGroupModelRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<GroupResponse>($"{Path}/model/{Enc(accountName)}/{Enc(groupName)}", request, cancellationToken);

    /// <summary>Clears the embedding model for a Group, reverting it to keyword search.</summary>
    public Task<Response<GroupResponse>> RemoveModelAsync(string accountName, string groupName, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync<GroupResponse>($"{Path}/model/{Enc(accountName)}/{Enc(groupName)}", cancellationToken);

    /// <summary>Attaches a bring-your-own reranker to a Group.</summary>
    public Task<Response<GroupResponse>> SetRerankerAsync(string accountName, string groupName, SetGroupRerankerRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<GroupResponse>($"{Path}/reranker/{Enc(accountName)}/{Enc(groupName)}", request, cancellationToken);

    /// <summary>Detaches the reranker from a Group, reverting to score-based ordering.</summary>
    public Task<Response<GroupResponse>> RemoveRerankerAsync(string accountName, string groupName, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync<GroupResponse>($"{Path}/reranker/{Enc(accountName)}/{Enc(groupName)}", cancellationToken);

    /// <summary>Moves a Group and its member Lists to a different subscription.</summary>
    public Task<Response<GroupResponse>> TransferAsync(string accountName, string groupName, TransferGroupRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<GroupResponse>($"{Path}/transfer/{Enc(accountName)}/{Enc(groupName)}", request, cancellationToken);

    /// <summary>Removes an existing Group.</summary>
    public Task<Response> DeleteAsync(string accountName, string groupName, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync($"{Path}/{Enc(accountName)}/{Enc(groupName)}", cancellationToken);
}

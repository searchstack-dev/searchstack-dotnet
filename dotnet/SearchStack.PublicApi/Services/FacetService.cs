using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>Facet create / rename / remove / values operations.</summary>
public sealed class FacetService
{
    private const string Path = "facet";
    private readonly Transport _transport;

    internal FacetService(Transport transport) => _transport = transport;

    /// <summary>Creates a Facet - a filterable field such as brand, color, price or category.</summary>
    public Task<Response<FacetResponse>> CreateAsync(CreateFacetRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<FacetResponse>(Path, request, cancellationToken);

    /// <summary>Renames a Facet. Breaking change - automatically updates the List version.</summary>
    public Task<Response<FacetResponse>> RenameAsync(string accountName, string listName, string facetName, RenameFacetRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<FacetResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Enc(facetName)}", request, cancellationToken);

    /// <summary>Removes a Facet. Breaking change - automatically updates the List version.</summary>
    public Task<Response> RemoveAsync(string accountName, string listName, string facetName, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Enc(facetName)}", cancellationToken);

    /// <summary>Lists the distinct values of a Facet on a List version - useful for building filter UIs. Requires the search-result:read permission.</summary>
    public Task<Response<IEnumerable<object>>> ValuesAsync(string accountName, string listName, int version, string facetName, bool? cache = null, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<IEnumerable<object>>($"{Path}/{Enc(accountName)}/{Enc(listName)}/{version}/{Enc(facetName)}{(cache is null ? "" : $"?cache={(cache.Value ? "true" : "false")}")}", cancellationToken);
}

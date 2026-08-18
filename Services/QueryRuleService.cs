using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using static SearchStack.PublicApi.Url;

namespace SearchStack.PublicApi;

/// <summary>
/// Query rule operations: how a raw query is READ before it is executed.
/// <para>
/// A rule spots a format in what somebody typed and lifts that part of the query out as a constraint rather
/// than leaving it to be matched as words — so "flat 2 zz1 1zz" is searched as "flat 2" narrowed to a postcode,
/// not as four words competing with every record containing "flat".
/// </para>
/// <para>
/// Rules are LIST-scoped, unlike gates, because a rule binds a format to a field and a field only means what it
/// means on one list. They are also ORDERED, and the order is load-bearing: the first rule to claim part of a
/// query wins and later rules see only what is left.
/// </para>
/// <para>
/// Three things are worth knowing before calling anything here. You rarely need to create a rule at all —
/// <see cref="InferAsync"/> runs on every import already and adds the rules your records support. A rule can
/// only target a FACET, so a format sitting in a searchable field cannot be ruled on until the field is a facet.
/// And <see cref="TestAsync"/> costs nothing and stores nothing, which makes it the right first call: it answers
/// "how will this query be read?" without running a search.
/// </para>
/// </summary>
public sealed class QueryRuleService
{
    private const string Path = "query-rule";
    private readonly Transport _transport;

    internal QueryRuleService(Transport transport) => _transport = transport;

    /// <summary>
    /// The shipped rule types you can build a rule from — postcodes, ISBNs, IBANs, VINs and the rest — each
    /// with a plain-language description and defaults for match mode, action and stance. Account-independent.
    /// You only need a custom <see cref="CreateQueryRuleRequest.Pattern"/> for a format not in here.
    /// </summary>
    public Task<Response<List<QueryRuleTemplateResponse>>> TemplatesAsync(CancellationToken cancellationToken = default) =>
        _transport.GetAsync<List<QueryRuleTemplateResponse>>($"{Path}/templates", cancellationToken);

    /// <summary>
    /// The rules on a list, in the order they actually run. Never sorted by anything else — the order IS the
    /// answer to two rules wanting the same words.
    /// </summary>
    public Task<Response<List<QueryRuleResponse>>> ListAsync(string accountName, string listName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<List<QueryRuleResponse>>($"{Path}/{Enc(accountName)}/{Enc(listName)}", cancellationToken);

    /// <summary>One rule: what it recognises, which field it constrains, what a match does, how much evidence it needs.</summary>
    public Task<Response<QueryRuleResponse>> GetAsync(string accountName, string listName, string ruleName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<QueryRuleResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Enc(ruleName)}", cancellationToken);

    /// <summary>
    /// Adds a rule to a list. Supply a name, the field it constrains, and exactly one of a shipped rule type
    /// (<see cref="CreateQueryRuleRequest.Recognizer"/>), a regex
    /// (<see cref="CreateQueryRuleRequest.Pattern"/>) or the field's own values
    /// (<see cref="CreateQueryRuleRequest.ValueSet"/>). Takes effect on the next search.
    /// </summary>
    public Task<Response<QueryRuleResponse>> CreateAsync(string accountName, string listName, CreateQueryRuleRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<QueryRuleResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}", request, cancellationToken);

    /// <summary>
    /// What a query WOULD be turned into — the text that survives and the constraints lifted out of it —
    /// without running a search or storing anything. Includes what shadow rules would have done, so a rule can
    /// be checked on a real query before it is switched on.
    /// <para>
    /// The fastest answer to "why did my search return that?", and free.
    /// </para>
    /// </summary>
    public Task<Response<QueryInterpretationResponse>> TestAsync(string accountName, string listName, TestQueryInterpretationRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<QueryInterpretationResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/test", request, cancellationToken);

    /// <summary>
    /// Sets the order rules run in. Send every rule on the list exactly once — a partial ordering would leave
    /// the omitted rules interleaved at positions nobody chose.
    /// </summary>
    public Task<Response<List<QueryRuleResponse>>> ReorderAsync(string accountName, string listName, ReorderQueryRulesRequest request, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<List<QueryRuleResponse>>($"{Path}/{Enc(accountName)}/{Enc(listName)}/reorder", request, cancellationToken);

    /// <summary>
    /// Changes what a rule RECOGNISES and advances its version. It does NOT change whether the rule is on, or
    /// how boldly it acts — see <see cref="SetStateAsync"/> and <see cref="SetStanceAsync"/>, kept separate so
    /// tuning them never discards the evidence a shadow run has gathered.
    /// </summary>
    public Task<Response<QueryRuleResponse>> EditAsync(string accountName, string listName, string ruleName, EditQueryRuleRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<QueryRuleResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Enc(ruleName)}", request, cancellationToken);

    /// <summary>
    /// Turns a rule on, off, or into shadow. Shadow records what the rule WOULD have done and changes nothing,
    /// which is the honest way to try a rule on real traffic. A rule a model suggested cannot go straight to
    /// Enabled — run it in Shadow and promote it on <see cref="GetMetricsAsync"/>.
    /// </summary>
    public Task<Response<QueryRuleResponse>> SetStateAsync(string accountName, string listName, string ruleName, SetQueryRuleStateRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<QueryRuleResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Enc(ruleName)}/state", request, cancellationToken);

    /// <summary>
    /// Sets how much evidence a rule needs. Passive acts only on a value confirmed to be in the field; Balanced
    /// (the default) acts unless the data contradicts it; Aggressive acts on the shape alone — the only setting
    /// that can return zero results, and only when the action is Filter. Turning the dial up can only add
    /// constraints, never change which ones.
    /// </summary>
    public Task<Response<QueryRuleResponse>> SetStanceAsync(string accountName, string listName, string ruleName, SetQueryRuleStanceRequest request, CancellationToken cancellationToken = default) =>
        _transport.PutAsync<QueryRuleResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Enc(ruleName)}/stance", request, cancellationToken);

    /// <summary>
    /// Reads a sample of the list, works out what each facet actually holds, and creates the rules the evidence
    /// supports — ready to run where it is overwhelming, in shadow where it is not.
    /// <para>
    /// This already runs on its own after an import, so calling it is asking for it NOW. It never touches a
    /// field that already has a rule, so it is safe to repeat. Answers with what it created and, for every
    /// field it did not, why.
    /// </para>
    /// </summary>
    public Task<Response<InferQueryRulesResponse>> InferAsync(string accountName, string listName, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<InferQueryRulesResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/infer", null, cancellationToken);

    /// <summary>
    /// What a rule has actually been doing, measured over real traffic rather than predicted: how often it
    /// fires, how often it matches a value the data does not hold, and what those searches return today.
    /// <para>
    /// This is what turns "should I switch this on?" into a decision. Check
    /// <see cref="QueryRuleMetricsResponse.Conclusive"/> before reading the rates.
    /// </para>
    /// </summary>
    public Task<Response<QueryRuleMetricsResponse>> GetMetricsAsync(string accountName, string listName, string ruleName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<QueryRuleMetricsResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Enc(ruleName)}/metrics", cancellationToken);

    /// <summary>
    /// What a sample of each field's values looked like: how many matched a known format, how much they repeat,
    /// and three of your own values. Read this to find out WHY a rule was suggested — or why one was not.
    /// </summary>
    public Task<Response<List<FieldProfileResponse>>> GetFieldProfilesAsync(string accountName, string listName, CancellationToken cancellationToken = default) =>
        _transport.GetAsync<List<FieldProfileResponse>>($"{Path}/{Enc(accountName)}/{Enc(listName)}/profiles", cancellationToken);

    /// <summary>
    /// The same job argued from the other side. <see cref="InferAsync"/> knows what the list HOLDS; this reads
    /// the last 30 days of searches and finds the formats that keep returning nothing — the only signal that can
    /// find a format nobody thought to model.
    /// <para>
    /// Everything it creates lands in SHADOW, because what customers type is noisier than what your records
    /// hold. Read <see cref="GetMetricsAsync"/> after a week and switch on what earns it.
    /// </para>
    /// </summary>
    public Task<Response<InferQueryRulesFromSearchesResponse>> InferFromSearchesAsync(string accountName, string listName, CancellationToken cancellationToken = default) =>
        _transport.PostAsync<InferQueryRulesFromSearchesResponse>($"{Path}/{Enc(accountName)}/{Enc(listName)}/infer-from-searches", null, cancellationToken);

    /// <summary>Removes a rule from the list. Takes effect on the next search. Nothing else is touched.</summary>
    public Task<Response> DeleteAsync(string accountName, string listName, string ruleName, CancellationToken cancellationToken = default) =>
        _transport.DeleteAsync($"{Path}/{Enc(accountName)}/{Enc(listName)}/{Enc(ruleName)}", cancellationToken);
}

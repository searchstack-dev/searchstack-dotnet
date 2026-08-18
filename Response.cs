using System;

namespace SearchStack.PublicApi;

/// <summary>
/// Result of an API call that returns no body. Every service method resolves to a
/// <see cref="Response"/> rather than throwing, so callers branch on
/// <see cref="IsSuccess"/>. Network and JSON errors are surfaced as a
/// <see cref="Problem"/> with status 500.
/// </summary>
public class Response
{
    private protected Response(bool isSuccess, Problem? problem)
    {
        IsSuccess = isSuccess;
        Problem = problem;
    }

    /// <summary>True when the call succeeded (HTTP 2xx).</summary>
    public bool IsSuccess { get; }

    /// <summary>True when the call failed; <see cref="Problem"/> is then populated.</summary>
    public bool IsFailure => !IsSuccess;

    /// <summary>The parsed problem details when the call failed; otherwise null.</summary>
    public Problem? Problem { get; }

    /// <summary>Returns the problem details, or throws if the call succeeded.</summary>
    public Problem ToProblem() =>
        Problem ?? throw new InvalidOperationException("Response was a success.");

    internal static Response Success() => new Response(true, null);
    internal static Response Failed(Problem problem) => new Response(false, problem);
}

/// <summary>
/// Result of an API call carrying a deserialized payload of type
/// <typeparamref name="T"/> on success.
/// </summary>
public sealed class Response<T> : Response
{
    private readonly T? _data;

    private Response(T data) : base(true, null) => _data = data;
    private Response(Problem problem) : base(false, problem) => _data = default;

    /// <summary>The deserialized payload when the call succeeded; otherwise default.</summary>
    public T? Data => _data;

    /// <summary>Returns the payload, or throws if the call failed.</summary>
    public T ToSuccess() =>
        IsSuccess ? _data! : throw new InvalidOperationException("Response was a problem.");

    internal static Response<T> Success(T data) => new Response<T>(data);
    internal static new Response<T> Failed(Problem problem) => new Response<T>(problem);
}

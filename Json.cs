using System.Text.Json;
using System.Text.Json.Serialization;

namespace SearchStack.PublicApi;

// Shared serializer options. The API serializes with a snake_case naming policy,
// so a single SnakeCaseLower policy maps every C# PascalCase member to its wire
// name without per-property attributes. The handful of fields that don't follow
// the convention (the "@*_score" scores) carry an explicit [JsonPropertyName].
internal static class Json
{
    internal static readonly JsonSerializerOptions Options = new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true,
        // Mirror the TS client: optional (null) fields are omitted from request bodies
        // rather than sent as explicit nulls.
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };
}

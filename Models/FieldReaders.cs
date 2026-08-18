using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json;

namespace SearchStack.PublicApi;

/// <summary>
/// Reads a result's custom fields without your code having to know how many values one holds.
/// </summary>
/// <remarks>
/// <see cref="SearchHit.Fields"/> is <c>Dictionary&lt;string, object?&gt;</c> because a field can hold text,
/// a number, a date or several of any of those. That honesty has a cost: what you actually get back is a
/// <see cref="JsonElement"/>, and the obvious next move — <c>hit.Fields["genre"].ToString()</c> — hands you
/// the raw JSON <c>["Comedy","Drama"]</c> rather than the genres.
/// <para>
/// A facet is <b>always an array</b> in a response, whether the field holds one value or ten: the shape
/// follows the schema, not the row, so the same field cannot come back scalar on one result and array on
/// the next. These readers are the other half of that promise. Ask for
/// <see cref="Text(SearchHit, string)"/> when you want something to display and
/// <see cref="Values(SearchHit, string)"/> when you want to iterate, and the shape stops mattering: one
/// value reads as itself, several read as all of them.
/// </para>
/// <para>
/// Everything here is forgiving by design. A field that is absent, null or empty reads as null or an empty
/// list rather than throwing, because a missing field is ordinary — a record simply may not carry one — and
/// a search UI should render the rest of the result rather than fall over. Names are matched
/// case-insensitively for the same reason.
/// </para>
/// </remarks>
public static class FieldReaders
{
    /// <summary>The separator <see cref="Text(IReadOnlyDictionary{string, object?}, string)"/> joins several values with.</summary>
    public const string Separator = ", ";

    /// <summary>One field as text: a single value as itself, several joined by <see cref="Separator"/>.</summary>
    /// <returns>Null when the field is absent, null, or holds nothing.</returns>
    public static string? Text(this SearchHit hit, string field) =>
        hit is null ? null : Text(hit.Fields, field);

    /// <summary>One field as text: a single value as itself, several joined by <see cref="Separator"/>.</summary>
    /// <returns>Null when the field is absent, null, or holds nothing.</returns>
    public static string? Text(this VerifiedOffer offer, string field) =>
        offer is null ? null : Text(offer.Fields, field);

    /// <summary>Every value the field holds, in order. Empty when the field is absent or holds nothing.</summary>
    public static IReadOnlyList<string> Values(this SearchHit hit, string field) =>
        hit is null ? Array.Empty<string>() : Values(hit.Fields, field);

    /// <summary>Every value the field holds, in order. Empty when the field is absent or holds nothing.</summary>
    public static IReadOnlyList<string> Values(this VerifiedOffer offer, string field) =>
        offer is null ? Array.Empty<string>() : Values(offer.Fields, field);

    /// <summary>One field as a number — the FIRST value when the field holds several.</summary>
    /// <remarks>
    /// First rather than joined, because a number is a quantity and there is no sensible number to make out
    /// of two. A price or a stock level is single-valued by its nature; if the field really does hold
    /// several, <see cref="Values(SearchHit, string)"/> is the honest reader.
    /// </remarks>
    /// <returns>Null when the field is absent or its first value is not a number.</returns>
    public static double? Number(this SearchHit hit, string field) =>
        hit is null ? null : Number(hit.Fields, field);

    /// <summary>One field as a number — the FIRST value when the field holds several.</summary>
    /// <returns>Null when the field is absent or its first value is not a number.</returns>
    public static double? Number(this VerifiedOffer offer, string field) =>
        offer is null ? null : Number(offer.Fields, field);

    /// <summary>One field as text, read straight from a field dictionary.</summary>
    public static string? Text(this IReadOnlyDictionary<string, object?> fields, string field)
    {
        var values = Values(fields, field);

        return values.Count == 0 ? null : string.Join(Separator, values);
    }

    /// <summary>Every value the field holds, read straight from a field dictionary.</summary>
    public static IReadOnlyList<string> Values(this IReadOnlyDictionary<string, object?> fields, string field)
    {
        if (!TryGet(fields, field, out var value))
        {
            return Array.Empty<string>();
        }

        var values = new List<string>();
        Collect(value, values);

        return values;
    }

    /// <summary>One field as a number, read straight from a field dictionary.</summary>
    public static double? Number(this IReadOnlyDictionary<string, object?> fields, string field)
    {
        var values = Values(fields, field);

        if (values.Count == 0)
        {
            return null;
        }

        return double.TryParse(values[0], NumberStyles.Float, CultureInfo.InvariantCulture, out var number)
            ? number
            : (double?)null;
    }

    // Exact match first, then case-insensitively. A caller writing "Genre" for a field configured as "genre"
    // has made no real mistake, and an empty result would send them looking for a bug in their query.
    private static bool TryGet(IReadOnlyDictionary<string, object?> fields, string field, out object? value)
    {
        value = null;

        if (fields is null || field is null)
        {
            return false;
        }

        if (fields.TryGetValue(field, out value))
        {
            return true;
        }

        foreach (var candidate in fields)
        {
            if (string.Equals(candidate.Key, field, StringComparison.OrdinalIgnoreCase))
            {
                value = candidate.Value;
                return true;
            }
        }

        return false;
    }

    // Flattens whatever the field holds into plain strings: the JsonElement a deserialized response carries,
    // and the raw CLR values a hand-built hit carries in tests. Blanks are dropped, so a trailing empty value
    // does not become a nameless entry in a filter list.
    private static void Collect(object? value, List<string> into)
    {
        switch (value)
        {
            case null:
                return;

            case string text:
                Add(text, into);
                return;

            case JsonElement element:
                switch (element.ValueKind)
                {
                    case JsonValueKind.Array:
                        foreach (var item in element.EnumerateArray())
                        {
                            Collect(item, into);
                        }

                        return;

                    case JsonValueKind.String:
                        Add(element.GetString(), into);
                        return;

                    case JsonValueKind.Null:
                    case JsonValueKind.Undefined:
                        return;

                    default:
                        Add(element.ToString(), into);
                        return;
                }

            case IEnumerable sequence:
                foreach (var item in sequence)
                {
                    Collect(item, into);
                }

                return;

            case IFormattable formattable:
                // Invariant, so a price does not change shape with the machine's locale.
                Add(formattable.ToString(null, CultureInfo.InvariantCulture), into);
                return;

            default:
                Add(value.ToString(), into);
                return;
        }
    }

    private static void Add(string? text, List<string> into)
    {
        if (!string.IsNullOrWhiteSpace(text))
        {
            into.Add(text!);
        }
    }
}

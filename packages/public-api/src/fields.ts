/**
 * Reading a result's custom fields without your code having to know how many values one holds.
 *
 * A **facet is always an array** in a response — `["red"]`, `[2006]`, `[]` when the record carries no
 * value — whatever its cardinality and however many values it holds, so the shape follows the schema and
 * not the row. Searchable fields and resources stay scalar. These readers cover both, so nothing you write
 * has to know which kind of field it is asking about.
 *
 * They also cover both shapes a record arrives in: a **search hit**, whose custom fields are nested in a
 * `fields` bag, and a **suggestion**, which is flat. That matters most inside an autocomplete `template`,
 * which is handed the flat shape.
 *
 * JavaScript is forgiving enough that `String(["red"])` is already `"red"`, which is why this is a
 * convenience rather than a rescue — but `String(["Comedy","Drama"])` is `"Comedy,Drama"` with no space,
 * and `fieldNumber` on a two-value field is a quiet `NaN`. These say what they do instead.
 *
 * The C# counterpart is `SearchStack.PublicApi`'s `hit.Text()` / `hit.Values()` / `hit.Number()`, and the
 * two behave identically on the same response.
 */

/**
 * Anything carrying a record's fields. Two shapes reach a caller and both are read here:
 *
 * - **A search hit**, which nests its custom fields in a `fields` bag alongside `name` and the scores.
 * - **A suggestion**, which is flat — `/suggest` returns the converter's dictionary as it stands, so a
 *   facet sits at the top level next to `name` and `list_name`.
 *
 * An autocomplete `template` is handed the flat shape, so requiring the bag would have made these
 * readers unusable in the one place a many-valued facet is most likely to be rendered.
 */
export type HasFields = { fields?: Record<string, unknown> | null } & Record<string, unknown>;

/** The separator {@link fieldText} joins several values with. */
export const FIELD_SEPARATOR = ", ";

/** Every value a field holds, in order. Empty when the field is absent, null, or holds nothing. */
export function fieldValues(record: HasFields | null | undefined, field: string): string[] {
  const raw = read(record, field);
  const out: string[] = [];
  collect(raw, out);
  return out;
}

/**
 * One field as text: a single value as itself, several joined by {@link FIELD_SEPARATOR}.
 * Null when the field is absent, null, or holds nothing.
 */
export function fieldText(record: HasFields | null | undefined, field: string): string | null {
  const values = fieldValues(record, field);
  return values.length === 0 ? null : values.join(FIELD_SEPARATOR);
}

/**
 * One field as a number — the FIRST value when the field holds several, because a number is a quantity and
 * there is no sensible number to make out of two. Null when the field is absent or is not a number.
 */
export function fieldNumber(record: HasFields | null | undefined, field: string): number | null {
  const values = fieldValues(record, field);
  if (values.length === 0) return null;
  const n = Number(values[0]);
  return Number.isFinite(n) ? n : null;
}

/* Exact match first, then case-insensitively: a caller writing "Genre" for a field configured as "genre"
   has made no real mistake, and an empty result would send them hunting for a bug in their query.

   Falling back to the record itself is what lets one reader serve a search hit and a suggestion alike.
   It cannot pick the wrong bag: "fields" is a RESERVED field name server-side, so a record can never
   carry a customer field by that name for this to shadow. */
function read(record: HasFields | null | undefined, field: string): unknown {
  const fields = (record?.fields ?? record) as Record<string, unknown> | null | undefined;
  if (!fields || !field) return undefined;
  if (field in fields) return fields[field];
  const key = Object.keys(fields).find((k) => k.toLowerCase() === field.toLowerCase());
  return key === undefined ? undefined : fields[key];
}

/* Blanks are dropped, so a trailing empty value never becomes a nameless entry in a filter list. */
function collect(value: unknown, into: string[]): void {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    for (const item of value) collect(item, into);
    return;
  }
  const text = typeof value === "string" ? value : String(value);
  if (text.trim() !== "") into.push(text);
}

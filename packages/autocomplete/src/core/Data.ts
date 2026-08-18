/**
 * A suggestion record returned by the API. The public API returns suggestions
 * as opaque records of the List's suggest fields; these are the well-known
 * fields the plugin uses when present.
 */
type Data = {
    id?: string;
    name?: string;
    list_name?: string;
    version?: number;
    [key: string]: unknown;
};

export default Data;

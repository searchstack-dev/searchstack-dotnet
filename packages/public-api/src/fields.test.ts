import { describe, it, expect } from "vitest";
import { fieldText, fieldValues, fieldNumber } from "./index.js";

/*
 * Read from a parsed response body rather than a hand-built object, because the shape that matters is the
 * one the API actually sends: a facet as an array whatever its cardinality, a searchable field as a scalar.
 */
const hit = JSON.parse(`{
  "name": "The Devil Wears Prada",
  "fields": {
    "genre": ["Comedy", "Drama"],
    "slug": ["devil-wears-prada"],
    "score": [8.4],
    "plot": "A young graduate lands a job at a fashion magazine.",
    "tagline": [],
    "director": null
  }
}`);

describe("field readers", () => {
  it("reads a field holding one value as that value", () => {
    // An array on the wire even though it holds one thing.
    expect(fieldText(hit, "slug")).toBe("devil-wears-prada");
  });

  it("reads a field holding several values as all of them", () => {
    expect(fieldText(hit, "genre")).toBe("Comedy, Drama");
    expect(fieldValues(hit, "genre")).toEqual(["Comedy", "Drama"]);
  });

  it("reads a scalar field too", () => {
    // One reader has to cover both, or the caller is back to asking which kind of field this was.
    expect(fieldText(hit, "plot")).toContain("young graduate");
    expect(fieldValues(hit, "plot")).toHaveLength(1);
  });

  it("reads a number", () => {
    expect(fieldNumber(hit, "score")).toBe(8.4);
    expect(fieldNumber(hit, "plot")).toBeNull();
  });

  it("treats absent, empty and null fields as nothing rather than throwing", () => {
    // A record simply may not carry a field, and a search UI should render the rest of the result.
    expect(fieldText(hit, "nonexistent")).toBeNull();
    expect(fieldText(hit, "tagline")).toBeNull();
    expect(fieldText(hit, "director")).toBeNull();
    expect(fieldValues(hit, "nonexistent")).toEqual([]);
    expect(fieldNumber(hit, "nonexistent")).toBeNull();
    expect(fieldText(null, "genre")).toBeNull();
  });

  it("finds a field named in the wrong case", () => {
    expect(fieldText(hit, "Genre")).toBe("Comedy, Drama");
  });

  it("puts a space after the separator, which String() does not", () => {
    // The small thing that makes this worth having in a language where String(["a","b"]) already works.
    expect(String(hit.fields.genre)).toBe("Comedy,Drama");
    expect(fieldText(hit, "genre")).toBe("Comedy, Drama");
  });
});

/*
 * /suggest does not nest anything: it returns the converter's dictionary as it stands, so a facet sits at
 * the top level beside `name`. This is the shape an autocomplete `template` receives, and it is where a
 * many-valued facet is most likely to be rendered — so the readers have to reach it too.
 */
const suggestion = JSON.parse(`{
  "id": "tt1234567",
  "name": "The Devil Wears Prada",
  "list_name": "movies",
  "version": 1,
  "genre": ["Comedy", "Drama"],
  "year": [2006],
  "tagline": [],
  "plot": "A young graduate lands a job at a fashion magazine."
}`);

describe("field readers on a flat suggestion", () => {
  it("reads a many-valued facet from the top level", () => {
    expect(fieldText(suggestion, "genre")).toBe("Comedy, Drama");
    expect(fieldValues(suggestion, "genre")).toEqual(["Comedy", "Drama"]);
  });

  it("reads a single-valued facet, which is still an array on the wire", () => {
    expect(fieldText(suggestion, "year")).toBe("2006");
    expect(fieldNumber(suggestion, "year")).toBe(2006);
  });

  it("reads a scalar searchable field, and treats absent or empty as nothing", () => {
    expect(fieldText(suggestion, "plot")).toContain("young graduate");
    expect(fieldText(suggestion, "tagline")).toBeNull();
    expect(fieldText(suggestion, "nonexistent")).toBeNull();
  });

  it("reads the engine's own keys, which sit beside the fields here", () => {
    // Nothing to disambiguate: a suggestion has one namespace, so `name` reads as `name`.
    expect(fieldText(suggestion, "name")).toBe("The Devil Wears Prada");
    expect(fieldText(suggestion, "list_name")).toBe("movies");
  });

  it("still prefers the bag when a hit has one", () => {
    // The fallback must not let a top-level key shadow the bag on the shape that HAS a bag.
    const both = { fields: { genre: ["Drama"] }, genre: ["Wrong"] };
    expect(fieldText(both, "genre")).toBe("Drama");
  });
});

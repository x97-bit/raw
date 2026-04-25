import { describe, expect, it } from "vitest";
import {
  normalizeAutocompleteOptions,
  normalizeStringOptions,
} from "./optionLists";

describe("normalizeStringOptions", () => {
  it("removes blanks and duplicates while preserving order", () => {
    expect(
      normalizeStringOptions(["", " نعم ", "لا", "نعم", null, "لا", "  "])
    ).toEqual(["نعم", "لا"]);
  });
});

describe("normalizeAutocompleteOptions", () => {
  it("removes empty rows and duplicate id-label pairs", () => {
    const options = normalizeAutocompleteOptions(
      [
        { id: "", name: "" },
        { id: 1, name: "أحمد" },
        { id: 1, name: "أحمد" },
        { id: 2, name: "محمد" },
        { id: null, name: "محمد" },
      ],
      { valueKey: "id", labelKey: "name" }
    );

    expect(options.map(entry => entry.label)).toEqual(["أحمد", "محمد", "محمد"]);
    expect(options.map(entry => entry.reactKey)).toEqual([
      "1::أحمد",
      "2::محمد",
      "::محمد",
    ]);
  });
});

import { describe, expect, it } from "vitest";
import {
  appendFormulaPart,
  buildFieldConfigPayload,
  buildFormulaPreview,
  collectNumericFormulaFields,
  createFormulaParts,
  createInitialCustomFieldForm,
  hasRequiredFormulaFields,
  parseCustomFieldOptions,
  removeFormulaPart,
  reorderFieldConfigs,
  updateFormulaPart,
} from "./fieldManagementHelpers";

describe("fieldManagementHelpers", () => {
  it("creates the initial custom field form", () => {
    expect(createInitialCustomFieldForm("invoice")).toEqual({
      label: "",
      fieldType: "text",
      options: "",
      defaultValue: "",
      placement: "transaction",
      targets: ["invoice"],
      sections: [],
      formulaParts: createFormulaParts(),
    });
  });

  it("adds, updates, and removes formula parts safely", () => {
    const appended = appendFormulaPart(createFormulaParts());
    expect(appended).toEqual([
      { type: "field", value: "" },
      { type: "operator", value: "+" },
      { type: "field", value: "" },
    ]);

    const updated = updateFormulaPart(appended, 2, "amount_usd");
    expect(updated[2]).toEqual({ type: "field", value: "amount_usd" });

    expect(removeFormulaPart(updated, 2)).toEqual(createFormulaParts());
  });

  it("validates complete formulas", () => {
    expect(hasRequiredFormulaFields(createFormulaParts())).toBe(false);
    expect(
      hasRequiredFormulaFields([
        { type: "field", value: "amount_usd" },
        { type: "operator", value: "+" },
        { type: "field", value: "cost_usd" },
      ])
    ).toBe(true);
  });

  it("parses select options cleanly", () => {
    expect(parseCustomFieldOptions(" one, two ,, three ")).toEqual([
      "one",
      "two",
      "three",
    ]);
  });

  it("collects numeric formula fields and excludes the active custom field", () => {
    const fields = collectNumericFormulaFields({
      sectionKeys: ["port-1"],
      targetKeys: ["invoice"],
      getSectionFieldsForTarget: () => [
        { key: "amount_usd", label: "Amount", type: "money" },
        { key: "notes", label: "Notes", type: "text" },
      ],
      getCustomFieldsForSections: () => [
        { id: 1, fieldKey: "profit_usd", label: "Profit", fieldType: "money" },
        {
          id: 2,
          fieldKey: "amount_usd",
          label: "Duplicate Amount",
          fieldType: "money",
        },
        { id: 3, fieldKey: "driver_name", label: "Driver", fieldType: "text" },
      ],
      excludeCustomFieldId: 1,
    });

    expect(fields).toEqual([
      { key: "amount_usd", label: "Amount", type: "money" },
    ]);
  });

  it("builds formula previews with operator labels and empty placeholders", () => {
    expect(
      buildFormulaPreview(
        [
          { type: "field", value: "amount_usd" },
          { type: "operator", value: "+" },
          { type: "field", value: "" },
        ],
        [{ key: "amount_usd", label: "Amount USD" }],
        [{ value: "+", label: "+" }]
      )
    ).toBe("Amount USD + (اختر حقل)");
  });

  it("reorders field configs and rebuilds payloads", () => {
    const reordered = reorderFieldConfigs(
      [
        { key: "a", visible: true, displayLabel: "", sortOrder: 1 },
        { key: "b", visible: false, displayLabel: "Bee", sortOrder: 2 },
        { key: "c", visible: true, displayLabel: "", sortOrder: 3 },
      ],
      0,
      2
    );

    expect(reordered.map(field => [field.key, field.sortOrder])).toEqual([
      ["b", 1],
      ["c", 2],
      ["a", 3],
    ]);

    expect(buildFieldConfigPayload(reordered)).toEqual([
      { fieldKey: "b", visible: false, sortOrder: 1, displayLabel: "Bee" },
      { fieldKey: "c", visible: true, sortOrder: 2, displayLabel: "" },
      { fieldKey: "a", visible: true, sortOrder: 3, displayLabel: "" },
    ]);
  });
});

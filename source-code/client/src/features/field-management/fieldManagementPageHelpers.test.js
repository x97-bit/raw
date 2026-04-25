import { describe, expect, it } from "vitest";
import {
  ensureSelectionOrFallback,
  filterCompatibleSelection,
  mergeFieldManagementFieldConfigs,
  toggleAllSections,
  toggleMultiSelection,
  toggleNonEmptyTargetSelection,
} from "./fieldManagementPageHelpers";

describe("fieldManagementPageHelpers", () => {
  it("filters and restores selections safely", () => {
    const compatible = [{ key: "port-1" }, { key: "port-2" }];

    expect(
      filterCompatibleSelection(["port-1", "reports"], compatible)
    ).toEqual(["port-1"]);
    expect(ensureSelectionOrFallback([], "list")).toEqual(["list"]);
    expect(ensureSelectionOrFallback(["statement"], "list")).toEqual([
      "statement",
    ]);
  });

  it("toggles multi selections and non-empty target selections", () => {
    expect(toggleMultiSelection(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleMultiSelection(["a", "b"], "a")).toEqual(["b"]);
    expect(
      toggleNonEmptyTargetSelection(["invoice"], "invoice", "payment")
    ).toEqual(["invoice"]);
    expect(
      toggleNonEmptyTargetSelection(["invoice"], "payment", "invoice")
    ).toEqual(["invoice", "payment"]);
  });

  it("selects all sections or clears them", () => {
    const sections = [{ key: "a" }, { key: "b" }];
    expect(toggleAllSections([], sections)).toEqual(["a", "b"]);
    expect(toggleAllSections(["a", "b"], sections)).toEqual([]);
  });

  it("merges base fields with scoped custom fields and configs", () => {
    const merged = mergeFieldManagementFieldConfigs({
      configs: [
        {
          fieldKey: "amount",
          visible: 1,
          sortOrder: 2,
          displayLabel: "المبلغ النهائي",
        },
      ],
      customFieldsList: [
        {
          id: 1,
          fieldKey: "custom_total",
          label: "المجموع المخصص",
          fieldType: "number",
          sectionKeys: ["port-1::list"],
        },
      ],
      sectionFields: [
        { key: "name", label: "الاسم", type: "text" },
        { key: "amount", label: "المبلغ", type: "number" },
      ],
      selectedSection: "port-1",
      selectedTarget: "list",
    });

    expect(merged.map(field => field.key)).toEqual([
      "name",
      "amount",
      "custom_total",
    ]);
    expect(merged.find(field => field.key === "amount")?.displayLabel).toBe(
      "المبلغ النهائي"
    );
    expect(merged.find(field => field.key === "custom_total")?.visible).toBe(
      false
    );
  });
});

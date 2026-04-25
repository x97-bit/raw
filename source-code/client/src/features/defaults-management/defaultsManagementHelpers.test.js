import { describe, expect, it } from "vitest";
import {
  asInputValue,
  buildAccountDefaultsPayload,
  buildRouteDefaultsPayload,
  createAccountFormFromRow,
  createRouteFormFromRow,
  filterDefaultsRows,
} from "./defaultsManagementHelpers";

describe("defaultsManagementHelpers", () => {
  it("normalizes empty values for inputs", () => {
    expect(asInputValue(null)).toBe("");
    expect(asInputValue(undefined)).toBe("");
    expect(asInputValue(12)).toBe("12");
  });

  it("filters rows by any configured search key", () => {
    const rows = [
      { accountName: "Ali", defaultGovName: "Baghdad" },
      { accountName: "Hassan", defaultGovName: "Basra" },
    ];

    expect(
      filterDefaultsRows(rows, "bag", ["accountName", "defaultGovName"])
    ).toEqual([{ accountName: "Ali", defaultGovName: "Baghdad" }]);
    expect(filterDefaultsRows(rows, "", ["accountName"])).toEqual(rows);
  });

  it("builds account defaults payloads with numeric coercion", () => {
    expect(
      buildAccountDefaultsPayload(
        {
          accountId: 1,
          defaultCurrency: "USD",
          defaultDriverId: 2,
          defaultVehicleId: null,
          defaultGoodTypeId: 3,
          defaultGovId: 4,
          defaultCompanyId: null,
          defaultCarrierId: 5,
          defaultFeeUsd: "10.5",
          defaultSyrCus: "",
          defaultCarQty: "2",
          notes: "",
        },
        "port-1"
      )
    ).toEqual({
      replace: true,
      accountId: 1,
      sectionKey: "port-1",
      defaultCurrency: "USD",
      defaultDriverId: 2,
      defaultVehicleId: null,
      defaultGoodTypeId: 3,
      defaultGovId: 4,
      defaultCompanyId: null,
      defaultCarrierId: 5,
      defaultFeeUsd: 10.5,
      defaultSyrCus: null,
      defaultCarQty: 2,
      notes: null,
    });
  });

  it("builds route defaults payloads with numeric coercion", () => {
    expect(
      buildRouteDefaultsPayload(
        {
          govId: 4,
          currency: "IQD",
          defaultTransPrice: "15",
          defaultFeeUsd: "",
          defaultCostUsd: "20",
          defaultAmountUsd: "30",
          defaultCostIqd: "",
          defaultAmountIqd: "40000",
          notes: "note",
        },
        "port-2"
      )
    ).toEqual({
      replace: true,
      sectionKey: "port-2",
      govId: 4,
      currency: "IQD",
      defaultTransPrice: 15,
      defaultFeeUsd: null,
      defaultCostUsd: 20,
      defaultAmountUsd: 30,
      defaultCostIqd: null,
      defaultAmountIqd: 40000,
      notes: "note",
    });
  });

  it("hydrates account and route forms from rows", () => {
    expect(
      createAccountFormFromRow({
        id: 1,
        accountName: "Ali",
        defaultFeeUsd: 12,
        defaultSyrCus: null,
        defaultCarQty: 4,
      })
    ).toMatchObject({
      id: 1,
      accountName: "Ali",
      defaultFeeUsd: "12",
      defaultSyrCus: "",
      defaultCarQty: "4",
    });

    expect(
      createRouteFormFromRow({
        id: 2,
        govName: "Baghdad",
        defaultTransPrice: 5,
        defaultAmountIqd: 1000,
      })
    ).toMatchObject({
      id: 2,
      govName: "Baghdad",
      defaultTransPrice: "5",
      defaultAmountIqd: "1000",
    });
  });
});

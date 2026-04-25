import { describe, expect, it } from "vitest";
import {
  buildListExportTemplates,
  buildStatementExportTemplates,
} from "./portExportTemplates";

describe("portExportTemplates", () => {
  it("builds list templates with port-aware titles and filenames", () => {
    const templates = buildListExportTemplates(
      "port-1",
      [{ key: "AmountUSD", label: "x" }],
      "منفذ السعودية"
    );

    expect(templates[0].id).toBe("current-list");
    expect(templates[0].label).toBe("النموذج الحالي");
    expect(templates[1].title).toBe("منفذ السعودية - تشغيلي");
    expect(templates[1].filename).toBe("منفذ السعودية_تشغيلي");
  });

  it("builds statement templates with account-aware titles and filenames", () => {
    const templates = buildStatementExportTemplates(
      "port-3",
      [{ key: "AmountUSD", label: "x" }],
      "أبو حسن بعقوبة"
    );

    expect(templates[0].id).toBe("current-statement");
    expect(templates[0].label).toBe("النموذج الحالي");
    expect(templates[1].title).toContain("كشف حساب - أبو حسن بعقوبة");
    expect(templates[1].filename).toContain("كشف_حساب_أبو حسن بعقوبة");
  });

  it("falls back to template-only names when account is missing", () => {
    const templates = buildStatementExportTemplates(
      "port-1",
      [{ key: "AmountUSD", label: "x" }],
      ""
    );

    expect(templates[1].title).toBe("كشف حساب - نموذج دولار");
    expect(templates[1].filename).toBe("كشف_حساب_usd");
  });
});

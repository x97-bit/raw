import { describe, expect, it } from "vitest";
import { buildMySqlConnectionOptions } from "./mysqlConfig";

describe("buildMySqlConnectionOptions", () => {
  it("parses the database URL and forces DATE columns to remain strings", () => {
    const config = buildMySqlConnectionOptions(
      "mysql://root:pass@localhost:3307/alrawi_db"
    );

    expect(config.host).toBe("localhost");
    expect(config.port).toBe(3307);
    expect(config.user).toBe("root");
    expect(config.password).toBe("pass");
    expect(config.database).toBe("alrawi_db");
    expect(config.charset).toBe("utf8mb4");
    expect(config.dateStrings).toEqual(["DATE"]);
  });

  it("throws when the URL has no database name", () => {
    expect(() => buildMySqlConnectionOptions("mysql://root@localhost")).toThrow(
      "DATABASE_URL is missing the database name."
    );
  });
});

import {
  ensureColumn,
  type RuntimeSchemaConnection,
} from "./dbRuntimeSchemaHelpers";

export async function ensureSpecialAccountCompatibility(
  connection: RuntimeSchemaConnection
) {
  await ensureColumn(
    connection,
    "special_accounts",
    "traderName",
    "`traderName` VARCHAR(255) NULL AFTER `name`"
  );
  await ensureColumn(
    connection,
    "special_accounts",
    "driverName",
    "`driverName` VARCHAR(255) NULL AFTER `traderName`"
  );
  await ensureColumn(
    connection,
    "special_accounts",
    "vehiclePlate",
    "`vehiclePlate` VARCHAR(100) NULL AFTER `driverName`"
  );
  await ensureColumn(
    connection,
    "special_accounts",
    "goodType",
    "`goodType` VARCHAR(255) NULL AFTER `vehiclePlate`"
  );
  await ensureColumn(
    connection,
    "special_accounts",
    "govName",
    "`govName` VARCHAR(255) NULL AFTER `goodType`"
  );
  await ensureColumn(
    connection,
    "special_accounts",
    "portName",
    "`portName` VARCHAR(255) NULL AFTER `govName`"
  );
  await ensureColumn(
    connection,
    "special_accounts",
    "companyName",
    "`companyName` VARCHAR(255) NULL AFTER `portName`"
  );
  await ensureColumn(
    connection,
    "special_accounts",
    "batchName",
    "`batchName` VARCHAR(255) NULL AFTER `companyName`"
  );
  await ensureColumn(
    connection,
    "special_accounts",
    "destination",
    "`destination` VARCHAR(255) NULL AFTER `batchName`"
  );
  await ensureColumn(
    connection,
    "special_accounts",
    "costUSD",
    "`costUSD` DECIMAL(15,2) NULL DEFAULT 0 AFTER `amountIQD`"
  );
  await ensureColumn(
    connection,
    "special_accounts",
    "costIQD",
    "`costIQD` DECIMAL(15,0) NULL DEFAULT 0 AFTER `costUSD`"
  );
  await ensureColumn(
    connection,
    "special_accounts",
    "amountUSDPartner",
    "`amountUSDPartner` DECIMAL(15,2) NULL DEFAULT 0 AFTER `costIQD`"
  );
  await ensureColumn(
    connection,
    "special_accounts",
    "differenceIQD",
    "`differenceIQD` DECIMAL(15,0) NULL DEFAULT 0 AFTER `amountUSDPartner`"
  );
  await ensureColumn(
    connection,
    "special_accounts",
    "clr",
    "`clr` DECIMAL(15,2) NULL DEFAULT 0 AFTER `differenceIQD`"
  );
  await ensureColumn(
    connection,
    "special_accounts",
    "tx",
    "`tx` DECIMAL(15,2) NULL DEFAULT 0 AFTER `clr`"
  );
  await ensureColumn(
    connection,
    "special_accounts",
    "taxiWater",
    "`taxiWater` DECIMAL(15,2) NULL DEFAULT 0 AFTER `tx`"
  );
  await ensureColumn(
    connection,
    "special_accounts",
    "weight",
    "`weight` DECIMAL(15,2) NULL AFTER `taxiWater`"
  );
  await ensureColumn(
    connection,
    "special_accounts",
    "meters",
    "`meters` DECIMAL(15,2) NULL AFTER `weight`"
  );
  await ensureColumn(
    connection,
    "special_accounts",
    "qty",
    "`qty` INT NULL AFTER `meters`"
  );
  await ensureColumn(
    connection,
    "special_accounts",
    "notes",
    "`notes` TEXT NULL AFTER `description`"
  );
}

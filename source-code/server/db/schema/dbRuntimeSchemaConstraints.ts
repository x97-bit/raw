import {
  ensureDateColumn,
  ensureForeignKey,
  ensureIndex,
  ensureUniqueConstraint,
  type RuntimeSchemaConnection,
} from "./dbRuntimeSchemaHelpers";

export async function ensureRuntimeSchemaConstraints(
  connection: RuntimeSchemaConnection
) {
  await ensureDateColumn(connection, "transactions", "trans_date", {
    nullable: false,
  });
  await ensureDateColumn(connection, "debts", "date", { nullable: true });
  await ensureDateColumn(connection, "expenses", "expense_date", {
    nullable: false,
  });
  await ensureDateColumn(connection, "special_accounts", "date", {
    nullable: true,
  });

  await ensureIndex(
    connection,
    "transactions",
    "idx_trans_date",
    "INDEX `idx_trans_date` (`trans_date`)"
  );
  await ensureIndex(
    connection,
    "transactions",
    "idx_account_id",
    "INDEX `idx_account_id` (`account_id`)"
  );
  await ensureIndex(
    connection,
    "transactions",
    "idx_driver_id",
    "INDEX `idx_driver_id` (`driver_id`)"
  );
  await ensureIndex(
    connection,
    "transactions",
    "idx_vehicle_id",
    "INDEX `idx_vehicle_id` (`vehicle_id`)"
  );
  await ensureIndex(
    connection,
    "transactions",
    "idx_good_type_id",
    "INDEX `idx_good_type_id` (`good_type_id`)"
  );
  await ensureIndex(
    connection,
    "transactions",
    "idx_gov_id",
    "INDEX `idx_gov_id` (`gov_id`)"
  );
  await ensureIndex(
    connection,
    "transactions",
    "idx_company_id",
    "INDEX `idx_company_id` (`company_id`)"
  );
  await ensureIndex(
    connection,
    "transactions",
    "idx_carrier_id",
    "INDEX `idx_carrier_id` (`carrier_id`)"
  );
  await ensureIndex(
    connection,
    "transactions",
    "idx_created_by",
    "INDEX `idx_created_by` (`created_by`)"
  );
  await ensureIndex(
    connection,
    "payment_matching",
    "idx_invoiceId",
    "INDEX `idx_invoiceId` (`invoiceId`)"
  );
  await ensureIndex(
    connection,
    "payment_matching",
    "idx_paymentId",
    "INDEX `idx_paymentId` (`paymentId`)"
  );
  await ensureIndex(
    connection,
    "custom_field_values",
    "idx_custom_field_id",
    "INDEX `idx_custom_field_id` (`custom_field_id`)"
  );
  await ensureIndex(
    connection,
    "expenses",
    "idx_created_by",
    "INDEX `idx_created_by` (`created_by`)"
  );
  await ensureIndex(
    connection,
    "expenses",
    "idx_account_id",
    "INDEX `idx_account_id` (`account_id`)"
  );
  await ensureIndex(
    connection,
    "audit_logs",
    "idx_user_id",
    "INDEX `idx_user_id` (`user_id`)"
  );
  await ensureIndex(
    connection,
    "account_defaults",
    "idx_account_id",
    "INDEX `idx_account_id` (`account_id`)"
  );
  await ensureIndex(
    connection,
    "account_defaults",
    "idx_default_driver_id",
    "INDEX `idx_default_driver_id` (`default_driver_id`)"
  );
  await ensureIndex(
    connection,
    "account_defaults",
    "idx_default_vehicle_id",
    "INDEX `idx_default_vehicle_id` (`default_vehicle_id`)"
  );
  await ensureIndex(
    connection,
    "account_defaults",
    "idx_default_good_type_id",
    "INDEX `idx_default_good_type_id` (`default_good_type_id`)"
  );
  await ensureIndex(
    connection,
    "account_defaults",
    "idx_default_gov_id",
    "INDEX `idx_default_gov_id` (`default_gov_id`)"
  );
  await ensureIndex(
    connection,
    "account_defaults",
    "idx_default_company_id",
    "INDEX `idx_default_company_id` (`default_company_id`)"
  );
  await ensureIndex(
    connection,
    "account_defaults",
    "idx_default_carrier_id",
    "INDEX `idx_default_carrier_id` (`default_carrier_id`)"
  );
  await ensureIndex(
    connection,
    "route_defaults",
    "idx_gov_id",
    "INDEX `idx_gov_id` (`gov_id`)"
  );

  await ensureUniqueConstraint(
    connection,
    "transactions",
    "uk_transactions_ref_no",
    "UNIQUE (`ref_no`)"
  );
  await ensureUniqueConstraint(
    connection,
    "payment_matching",
    "uk_payment_matching_invoice_payment",
    "UNIQUE (`invoiceId`, `paymentId`)"
  );
  await ensureUniqueConstraint(
    connection,
    "account_defaults",
    "uk_account_defaults",
    "UNIQUE (`account_id`, `section_key`)"
  );
  await ensureUniqueConstraint(
    connection,
    "route_defaults",
    "uk_route_defaults",
    "UNIQUE (`section_key`, `gov_id`, `currency`)"
  );

  await ensureForeignKey(
    connection,
    "transactions",
    "fk_transactions_account_id",
    "FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "transactions",
    "fk_transactions_driver_id",
    "FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "transactions",
    "fk_transactions_vehicle_id",
    "FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "transactions",
    "fk_transactions_good_type_id",
    "FOREIGN KEY (`good_type_id`) REFERENCES `goods_types` (`id`) ON DELETE SET NULL ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "transactions",
    "fk_transactions_gov_id",
    "FOREIGN KEY (`gov_id`) REFERENCES `governorates` (`id`) ON DELETE SET NULL ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "transactions",
    "fk_transactions_company_id",
    "FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "transactions",
    "fk_transactions_carrier_id",
    "FOREIGN KEY (`carrier_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "transactions",
    "fk_transactions_created_by",
    "FOREIGN KEY (`created_by`) REFERENCES `app_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "payment_matching",
    "fk_payment_matching_invoice",
    "FOREIGN KEY (`invoiceId`) REFERENCES `transactions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "payment_matching",
    "fk_payment_matching_payment",
    "FOREIGN KEY (`paymentId`) REFERENCES `transactions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "custom_field_values",
    "fk_custom_field_values_custom_field_id",
    "FOREIGN KEY (`custom_field_id`) REFERENCES `custom_fields` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "expenses",
    "fk_expenses_created_by",
    "FOREIGN KEY (`created_by`) REFERENCES `app_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "expenses",
    "fk_expenses_account_id",
    "FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "audit_logs",
    "fk_audit_logs_user_id",
    "FOREIGN KEY (`user_id`) REFERENCES `app_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "account_defaults",
    "fk_account_defaults_account_id",
    "FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "account_defaults",
    "fk_account_defaults_default_driver_id",
    "FOREIGN KEY (`default_driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "account_defaults",
    "fk_account_defaults_default_vehicle_id",
    "FOREIGN KEY (`default_vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "account_defaults",
    "fk_account_defaults_default_good_type_id",
    "FOREIGN KEY (`default_good_type_id`) REFERENCES `goods_types` (`id`) ON DELETE SET NULL ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "account_defaults",
    "fk_account_defaults_default_gov_id",
    "FOREIGN KEY (`default_gov_id`) REFERENCES `governorates` (`id`) ON DELETE SET NULL ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "account_defaults",
    "fk_account_defaults_default_company_id",
    "FOREIGN KEY (`default_company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "account_defaults",
    "fk_account_defaults_default_carrier_id",
    "FOREIGN KEY (`default_carrier_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE"
  );
  await ensureForeignKey(
    connection,
    "route_defaults",
    "fk_route_defaults_gov_id",
    "FOREIGN KEY (`gov_id`) REFERENCES `governorates` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE"
  );
}

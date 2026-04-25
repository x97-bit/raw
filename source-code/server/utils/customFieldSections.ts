import { and, eq, sql } from "drizzle-orm";
import { customFields, fieldConfig } from "../../drizzle/schema";

export async function getCustomFieldsWithSections(
  db: any,
  sectionKey?: string
) {
  const [fields, configs] = await Promise.all([
    db.select().from(customFields),
    db
      .select({
        fieldKey: fieldConfig.fieldKey,
        sectionKey: fieldConfig.sectionKey,
        visible: fieldConfig.visible,
        sortOrder: fieldConfig.sortOrder,
        displayLabel: fieldConfig.displayLabel,
      })
      .from(fieldConfig),
  ]);

  const configMap = new Map<
    string,
    Array<{
      sectionKey: string;
      visible: number;
      sortOrder: number;
      displayLabel: string | null;
    }>
  >();
  for (const config of configs as any[]) {
    const entries = configMap.get(config.fieldKey) || [];
    entries.push({
      sectionKey: config.sectionKey,
      visible: config.visible,
      sortOrder: config.sortOrder,
      displayLabel: config.displayLabel ?? null,
    });
    configMap.set(config.fieldKey, entries);
  }

  let mapped = (fields as any[]).map(field => {
    const sectionConfig = configMap.get(field.fieldKey) || [];
    return {
      ...field,
      sectionKeys: sectionConfig.map(entry => entry.sectionKey),
      sectionConfig,
    };
  });

  if (sectionKey) {
    mapped = mapped
      .filter(field => field.sectionKeys.includes(sectionKey))
      .map(field => {
        const scopedConfig = field.sectionConfig.find(
          (entry: any) => entry.sectionKey === sectionKey
        );
        return {
          ...field,
          visible: scopedConfig?.visible ?? 1,
          sortOrder: scopedConfig?.sortOrder ?? 999,
          displayLabel: scopedConfig?.displayLabel ?? null,
        };
      })
      .sort(
        (left, right) => (left.sortOrder ?? 999) - (right.sortOrder ?? 999)
      );
  }

  return mapped;
}

export async function syncCustomFieldSections(
  db: any,
  fieldKey: string,
  sections: string[]
) {
  const targetSections = Array.from(
    new Set((sections || []).filter(Boolean).map(section => String(section)))
  );
  const existingConfigs = await db
    .select()
    .from(fieldConfig)
    .where(eq(fieldConfig.fieldKey, fieldKey));
  const existingSectionKeys = new Set(
    (existingConfigs as any[]).map(config => config.sectionKey)
  );

  for (const existingConfig of existingConfigs as any[]) {
    if (!targetSections.includes(existingConfig.sectionKey)) {
      await db
        .delete(fieldConfig)
        .where(
          and(
            eq(fieldConfig.fieldKey, fieldKey),
            eq(fieldConfig.sectionKey, existingConfig.sectionKey)
          )
        );
    }
  }

  for (const sectionKey of targetSections) {
    if (existingSectionKeys.has(sectionKey)) continue;

    const maxOrder = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(sort_order), 0)` })
      .from(fieldConfig)
      .where(eq(fieldConfig.sectionKey, sectionKey));
    const nextOrder = (maxOrder[0]?.maxOrder || 0) + 1;

    await db.insert(fieldConfig).values({
      sectionKey,
      fieldKey,
      visible: 1,
      sortOrder: nextOrder,
      displayLabel: null,
    });
  }
}

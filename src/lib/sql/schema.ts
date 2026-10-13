import { getDemoTables } from "./demo-data";

export interface SchemaInfo {
  tables: {
    name: string;
    dataset: string;
    description: string;
    rowCount: number;
    columns: { name: string; type: string; pk?: boolean; fk?: { table: string; column: string } }[];
  }[];
  schemaText: string;
}

export function getSchemaInfo(): SchemaInfo {
  const tables = getDemoTables();
  const list = Object.values(tables).map((t) => ({
    name: t.name,
    dataset: t.dataset,
    description: t.description,
    rowCount: t.rows.length,
    columns: t.columns,
  }));
  const schemaText = list
    .map((t) => `${t.name}(${t.columns.map((c) => c.name).join(", ")})`)
    .join(", ");
  return { tables: list, schemaText };
}

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, "..", "server");
const dbDir = path.join(srcDir, "db");
const schemaDir = path.join(dbDir, "schema");

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
if (!fs.existsSync(schemaDir)) fs.mkdirSync(schemaDir);

const filesToMove = [
  { name: "db.ts", target: path.join(dbDir, "db.ts"), newImportPath: "db/db" },
  {
    name: "dbAuthUsers.ts",
    target: path.join(schemaDir, "dbAuthUsers.ts"),
    newImportPath: "db/schema/dbAuthUsers",
  },
  {
    name: "dbRuntimeSchema.ts",
    target: path.join(schemaDir, "dbRuntimeSchema.ts"),
    newImportPath: "db/schema/dbRuntimeSchema",
  },
  {
    name: "dbRuntimeSchemaBackfill.ts",
    target: path.join(schemaDir, "dbRuntimeSchemaBackfill.ts"),
    newImportPath: "db/schema/dbRuntimeSchemaBackfill",
  },
  {
    name: "dbRuntimeSchemaConstraints.ts",
    target: path.join(schemaDir, "dbRuntimeSchemaConstraints.ts"),
    newImportPath: "db/schema/dbRuntimeSchemaConstraints",
  },
  {
    name: "dbRuntimeSchemaHelpers.ts",
    target: path.join(schemaDir, "dbRuntimeSchemaHelpers.ts"),
    newImportPath: "db/schema/dbRuntimeSchemaHelpers",
  },
  {
    name: "dbRuntimeSchemaSpecialAccounts.ts",
    target: path.join(schemaDir, "dbRuntimeSchemaSpecialAccounts.ts"),
    newImportPath: "db/schema/dbRuntimeSchemaSpecialAccounts",
  },
  {
    name: "dbRuntimeSchemaTables.ts",
    target: path.join(schemaDir, "dbRuntimeSchemaTables.ts"),
    newImportPath: "db/schema/dbRuntimeSchemaTables",
  },
  {
    name: "dbTypes.ts",
    target: path.join(schemaDir, "dbTypes.ts"),
    newImportPath: "db/schema/dbTypes",
  },
];

filesToMove.forEach(f => {
  const oldPath = path.join(srcDir, f.name);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, f.target);
    console.log("Moved", f.name);
  }
});

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (
      file === "node_modules" ||
      file === "dist" ||
      file === "build" ||
      file === ".git"
    )
      continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (
      filePath.endsWith(".ts") ||
      filePath.endsWith(".tsx") ||
      filePath.endsWith(".js") ||
      filePath.endsWith(".jsx")
    ) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = [
  ...getAllFiles(path.join(__dirname, "..", "server")),
  ...getAllFiles(path.join(__dirname, "..", "client", "src")),
  ...getAllFiles(path.join(__dirname, "..", "shared")),
];

let updatedCount = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, "utf8");
  let originalContent = content;

  const fileDir = path.dirname(file);

  for (const f of filesToMove) {
    const baseName = f.name.replace(".ts", "");

    // We look for imports like `from "./db"`, `from "../db"`, `from "../../db"`
    const importRegex = new RegExp(
      `from ['\\"](\\.\\/|\\.\\.\\/|\\.\\.\\/\\.\\.\\/)${baseName}['\\"]`,
      "g"
    );

    content = content.replace(importRegex, (match, prefix) => {
      const oldImportAbs = path.resolve(fileDir, prefix + baseName);
      const expectedOldImportAbs = path.join(srcDir, baseName);

      if (oldImportAbs === expectedOldImportAbs) {
        let newRelPath = path.relative(fileDir, f.target).replace(/\\/g, "/");
        if (!newRelPath.startsWith(".")) {
          newRelPath = "./" + newRelPath;
        }
        newRelPath = newRelPath.replace(/\.ts$/, "");
        return `from "${newRelPath}"`;
      }
      return match;
    });
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, "utf8");
    console.log("Updated imports in:", file);
    updatedCount++;
  }
}

console.log("Total files updated:", updatedCount);

import { access, rm, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");

const GENERATED_PATHS = [
  "dist",
  ".manus-logs",
  ".codex-run",
  "coverage",
  ".vite",
  "test-results.txt",
];

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function assertInsideProjectRoot(targetPath) {
  const resolvedPath = path.resolve(targetPath);
  const normalizedRoot = `${projectRoot}${path.sep}`;
  if (resolvedPath !== projectRoot && !resolvedPath.startsWith(normalizedRoot)) {
    throw new Error(`Refusing to remove path outside project root: ${resolvedPath}`);
  }
  return resolvedPath;
}

async function removeGeneratedPath(relativePath) {
  const absolutePath = assertInsideProjectRoot(path.join(projectRoot, relativePath));
  if (!(await pathExists(absolutePath))) {
    return null;
  }

  if (path.extname(absolutePath)) {
    await unlink(absolutePath);
  } else {
    await rm(absolutePath, { recursive: true, force: true });
  }

  return absolutePath;
}

async function main() {
  const removedPaths = [];

  for (const relativePath of GENERATED_PATHS) {
    const removedPath = await removeGeneratedPath(relativePath);
    if (removedPath) {
      removedPaths.push(removedPath);
    }
  }

  if (!removedPaths.length) {
    console.log("No generated files or directories needed cleanup.");
    return;
  }

  console.log("Removed generated paths:");
  removedPaths.forEach((removedPath) => {
    console.log(`- ${path.relative(projectRoot, removedPath) || removedPath}`);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

import fs from 'fs'; // Import fs again
import path from 'path';

import { API, FileInfo, Options, StringLiteral } from 'jscodeshift';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore migrationMap is generated and might not exist initially
// const migrationMapJson = require('../../../docs/refactoring/file_migration_map.json');

interface MigrationItem {
  from: string;
  to: string;
}

// Determine project root dynamically using process.cwd()
const PROJECT_ROOT = process.cwd(); // Use current working directory

// Load migration map using fs.readFileSync
const migrationMapPath = path.resolve(PROJECT_ROOT, 'docs/refactoring/file_migration_map.json');
let MIGRATION_MAP: MigrationItem[];
try {
  const mapData = fs.readFileSync(migrationMapPath, 'utf8');
  MIGRATION_MAP = JSON.parse(mapData);
} catch (error) {
  let errorMessage = 'Unknown error occurred while loading migration map.';
  if (error instanceof Error) {
    errorMessage = error.message;
  }
  console.error(
    `[FATAL] Could not load migration map from ${migrationMapPath}. Error: ${errorMessage}`
  );
  process.exit(1);
}

// --- Helper Functions ---

// Normalize path separators to '/' and remove trailing slash
const NORMALIZE_PATH = (p: string): string => {
  // UPPER_CASE
  const normalized = p.replace(/\\\\\\\\/g, '/');
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
};

// Remove common extensions
const STRIP_EXTENSION = (p: string): string => {
  // UPPER_CASE
  return p.replace(/\\.(ts|tsx|js|jsx|json)$/, '');
};

// Precompute absolute path maps for faster lookup
const ABSOLUTE_FROM_TO_MAP: Record<string, string> = {}; // UPPER_CASE
const ABSOLUTE_TO_FROM_MAP: Record<string, string> = {}; // UPPER_CASE

MIGRATION_MAP.forEach(({ from, to }) => {
  // Use UPPER_CASE
  // Handle potential directory entries (ending with /*)
  if (from.endsWith('/*')) {
    // For directories, we map the directory path itself.
    // Individual file mappings within the directory might be needed for complex cases.
    const fromDir = NORMALIZE_PATH(path.resolve(PROJECT_ROOT, from.replace('/*', ''))); // Use UPPER_CASE func
    const toDir = NORMALIZE_PATH(path.resolve(PROJECT_ROOT, to.replace('/*', ''))); // Use UPPER_CASE func
    ABSOLUTE_FROM_TO_MAP[fromDir] = toDir; // Use UPPER_CASE
    ABSOLUTE_TO_FROM_MAP[toDir] = fromDir; // Use UPPER_CASE
  } else {
    const fromAbs = NORMALIZE_PATH(path.resolve(PROJECT_ROOT, from)); // Use UPPER_CASE func
    const toAbs = NORMALIZE_PATH(path.resolve(PROJECT_ROOT, to)); // Use UPPER_CASE func
    ABSOLUTE_FROM_TO_MAP[fromAbs] = toAbs; // Use UPPER_CASE
    ABSOLUTE_TO_FROM_MAP[toAbs] = fromAbs; // Use UPPER_CASE

    // Add entry without extension as well, for import resolution
    const fromAbsNoExt = STRIP_EXTENSION(fromAbs); // Use UPPER_CASE func
    if (fromAbsNoExt !== fromAbs && !ABSOLUTE_FROM_TO_MAP[fromAbsNoExt]) {
      // Use UPPER_CASE
      ABSOLUTE_FROM_TO_MAP[fromAbsNoExt] = STRIP_EXTENSION(toAbs); // Use UPPER_CASE, Use UPPER_CASE func
    }
    const toAbsNoExt = STRIP_EXTENSION(toAbs); // Use UPPER_CASE func
    if (toAbsNoExt !== toAbs && !ABSOLUTE_TO_FROM_MAP[toAbsNoExt]) {
      // Use UPPER_CASE
      ABSOLUTE_TO_FROM_MAP[toAbsNoExt] = STRIP_EXTENSION(fromAbs); // Use UPPER_CASE, Use UPPER_CASE func
    }
  }
});

// Define new package aliases based on the target structure
// eslint-disable-next-line @typescript-eslint/naming-convention
const PACKAGE_ALIAS_CONFIG: Record<string, string> = {
  // UPPER_CASE & Disable rule for keys
  'apps/saas-app': '@', // App specific alias
  'packages/shared': '@core/shared',
  'packages/user': '@core/user',
  'packages/ui': '@core/ui',
  'packages/ai': '@core/ai',
  'packages/infrastructure': '@core/infrastructure', // Assuming common infra components go here
  // Add other packages as needed
};

// Find the package root and alias for a given *new* absolute path
const FIND_PACKAGE_FOR_NEW_PATH = (
  newAbsolutePath: string
): { pkgRoot: string; alias: string; pathInPkg: string } | null => {
  // UPPER_CASE
  const normalizedNewPath = NORMALIZE_PATH(newAbsolutePath); // Use UPPER_CASE func
  for (const [pkgDir, alias] of Object.entries(PACKAGE_ALIAS_CONFIG)) {
    // Use UPPER_CASE
    const fullPkgPath = NORMALIZE_PATH(path.resolve(PROJECT_ROOT, pkgDir)); // Use UPPER_CASE func, Use UPPER_CASE
    if (normalizedNewPath.startsWith(fullPkgPath + '/')) {
      const pathInPkg = normalizedNewPath.substring(fullPkgPath.length + 1);
      return { pkgRoot: fullPkgPath, alias, pathInPkg };
    }
    // Handle case where the path *is* the package root (e.g., importing index.ts)
    if (normalizedNewPath === fullPkgPath) {
      // This case might need special handling depending on how index files are treated
      // For now, let's assume it resolves to the alias itself or maybe alias + '/index' stripped
      const assumedIndexPath = path.join(fullPkgPath, 'index'); // Check if index exists later
      if (normalizedNewPath === assumedIndexPath) {
        return { pkgRoot: fullPkgPath, alias, pathInPkg: 'index' };
      }
      // Fallback or specific logic might be needed here
    }
  }
  return null;
};

// --- jscodeshift Transformer ---

export default function transformer(file: FileInfo, api: API, _options: Options) {
  // Rename options to _options
  const j = api.jscodeshift;
  const root = j(file.source);
  const currentNewAbsolutePath = NORMALIZE_PATH(file.path); // Use UPPER_CASE func, Path after move
  const currentNewDir = path.dirname(currentNewAbsolutePath);

  let changed = false;

  // Define internal helper function (can remain camelCase if allowed by local scope rules)
  const updateImportSource = (importLiteral: StringLiteral): void => {
    const originalSource = importLiteral.value;
    if (typeof originalSource !== 'string') return;

    let newSource = originalSource;

    try {
      // 1. Handle old '@/...' aliases
      if (originalSource.startsWith('@/')) {
        const relativePath = originalSource.substring(2);
        const oldAbsoluteImportPathBase = NORMALIZE_PATH(path.resolve(PROJECT_ROOT, relativePath)); // Use UPPER_CASE func, Use UPPER_CASE

        // Try resolving with different extensions/index files
        let newAbsoluteImportPath: string | undefined;
        const possibleSuffixes = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];
        for (const suffix of possibleSuffixes) {
          const potentialOldPath = oldAbsoluteImportPathBase + suffix;
          if (ABSOLUTE_FROM_TO_MAP[potentialOldPath]) {
            newAbsoluteImportPath = ABSOLUTE_FROM_TO_MAP[potentialOldPath];
            // console.log(`Alias Matched: ${potentialOldPath} -> ${newAbsoluteImportPath}`);
            break; // Found a match
          }
          // Also check without extension in the map (less likely for aliases but good to check)
          const potentialOldPathNoExt = STRIP_EXTENSION(potentialOldPath);
          if (
            potentialOldPathNoExt !== potentialOldPath &&
            ABSOLUTE_FROM_TO_MAP[potentialOldPathNoExt]
          ) {
            newAbsoluteImportPath = ABSOLUTE_FROM_TO_MAP[potentialOldPathNoExt];
            // console.log(`Alias Matched (NoExt Key): ${potentialOldPathNoExt} -> ${newAbsoluteImportPath}`);
            break;
          }
        }

        // Find the corresponding new path using the precomputed map
        // const newAbsoluteImportPath = ABSOLUTE_FROM_TO_MAP[oldAbsoluteImportPath] ?? ABSOLUTE_FROM_TO_MAP[oldAbsoluteImportPathNoExt]; // Use UPPER_CASE // OLD LOGIC REMOVED

        if (newAbsoluteImportPath) {
          const packageInfo = FIND_PACKAGE_FOR_NEW_PATH(newAbsoluteImportPath); // Use UPPER_CASE func
          if (packageInfo) {
            // Construct new alias path (stripping extension)
            // Ensure the resulting path doesn't end with /index if it points to an index file
            let finalPathInPkg = STRIP_EXTENSION(packageInfo.pathInPkg);
            if (finalPathInPkg.endsWith('/index')) {
              finalPathInPkg = finalPathInPkg.substring(0, finalPathInPkg.length - '/index'.length);
              // Handle root index case (e.g., @core/shared/index -> @core/shared)
              if (!finalPathInPkg) {
                newSource = packageInfo.alias;
              } else {
                newSource = packageInfo.alias + '/' + finalPathInPkg;
              }
            } else {
              newSource = packageInfo.alias + '/' + finalPathInPkg;
            }
            // console.log(`Alias Update: ${originalSource} -> ${newSource} in ${currentNewAbsolutePath}`);
          } else {
            console.warn(
              `[WARN] Could not determine package for new path: ${newAbsoluteImportPath} (from old alias: ${originalSource}) in ${currentNewAbsolutePath}`
            );
          }
        } else {
          console.warn(
            `[WARN] Could not find new path for old alias import: ${originalSource} (tried base: ${oldAbsoluteImportPathBase} with suffixes) in ${currentNewAbsolutePath}`
          );
        }
      }
      // 2. Handle relative imports './...' or '../...'
      else if (originalSource.startsWith('.')) {
        // Find the *old* path of the current file
        const oldCurrentAbsolutePath =
          ABSOLUTE_TO_FROM_MAP[currentNewAbsolutePath] ??
          ABSOLUTE_TO_FROM_MAP[STRIP_EXTENSION(currentNewAbsolutePath)]; // Use UPPER_CASE, Use UPPER_CASE func

        if (!oldCurrentAbsolutePath) {
          console.warn(
            `[WARN] Could not find old path for current file: ${currentNewAbsolutePath}`
          );
          return; // Cannot resolve relative path without old context
        }
        const oldCurrentDir = path.dirname(oldCurrentAbsolutePath);

        // Resolve the *old* absolute path of the imported module
        const oldAbsoluteImportPath = NORMALIZE_PATH(path.resolve(oldCurrentDir, originalSource)); // Use UPPER_CASE func
        const oldAbsoluteImportPathNoExt = STRIP_EXTENSION(oldAbsoluteImportPath); // Use UPPER_CASE func

        // Find the *new* absolute path of the imported module
        const newAbsoluteImportPath =
          ABSOLUTE_FROM_TO_MAP[oldAbsoluteImportPath] ??
          ABSOLUTE_FROM_TO_MAP[oldAbsoluteImportPathNoExt]; // Use UPPER_CASE

        if (newAbsoluteImportPath) {
          // Calculate the new relative path from the *new* current directory
          let relativePath = path.relative(currentNewDir, newAbsoluteImportPath);
          // Ensure it starts with ./ or ../
          if (!relativePath.startsWith('.')) {
            relativePath = './' + relativePath;
          }
          // Normalize separators just in case
          newSource = NORMALIZE_PATH(STRIP_EXTENSION(relativePath)); // Use UPPER_CASE func, Use UPPER_CASE func
          // console.log(`Relative Update: ${originalSource} -> ${newSource} in ${currentNewAbsolutePath}`);
        } else {
          console.warn(
            `[WARN] Could not find new path for relative import: ${originalSource} (resolved old: ${oldAbsoluteImportPath}) in ${currentNewAbsolutePath} (old context: ${oldCurrentAbsolutePath})`
          );
        }
      }
      // 3. Ignore node_modules, new aliases (@core/), and others
      else if (originalSource.startsWith('@core/')) {
        // Already new alias, do nothing
        return;
      } else {
        // Assume it's a node_module or something else we don't transform
        return;
      }

      // If the source changed, update the AST
      if (newSource !== originalSource) {
        // Always strip extension from the final path
        importLiteral.value = STRIP_EXTENSION(newSource);
        changed = true;
      }
    } catch (error) {
      // Type guard for error
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      console.error(
        `[ERROR] Failed to process import \\"${originalSource}\\" in ${currentNewAbsolutePath}: ${errorMessage}`
      );
    }
  };

  // Find and process all ImportDeclarations
  root
    .find(j.ImportDeclaration)
    .filter((importPath) => importPath.value.source.type === 'StringLiteral') // Ensure source is a string literal
    .forEach((importPath) => {
      updateImportSource(importPath.value.source as StringLiteral);
    });

  // Find and process all require() calls
  root
    .find(j.CallExpression, {
      callee: { name: 'require' },
      arguments: [{ type: 'StringLiteral' }], // Ensure the argument is a string literal
    })
    .forEach((requirePath) => {
      updateImportSource(requirePath.value.arguments[0] as StringLiteral);
    });

  // Find and process all dynamic imports import(...)
  root
    .find(j.ImportExpression)
    .filter((exp) => exp.value.source.type === 'StringLiteral')
    .forEach((exp) => {
      updateImportSource(exp.value.source as StringLiteral);
    });

  // Find and process export { ... } from '...'
  root
    .find(j.ExportNamedDeclaration)
    .filter((exp) => exp.value.source?.type === 'StringLiteral')
    .forEach((exp) => {
      if (exp.value.source) {
        // Type guard
        updateImportSource(exp.value.source as StringLiteral);
      }
    });

  // Find and process export * from '...'
  root
    .find(j.ExportAllDeclaration)
    .filter((exp) => exp.value.source?.type === 'StringLiteral')
    .forEach((exp) => {
      if (exp.value.source) {
        // Type guard
        updateImportSource(exp.value.source as StringLiteral);
      }
    });

  // Only return source if changes were made
  return changed ? root.toSource({ quote: 'single' }) : null;
}

// To run this:
// 1. Ensure files are moved first according to the migration map.
// 2. Run jscodeshift:
//    npx jscodeshift -t scripts/codemods/apply-migration-map.ts <target_directory> --parser=tsx --extensions=ts,tsx
//    Example: npx jscodeshift -t scripts/codemods/apply-migration-map.ts apps/saas-app packages/shared packages/user --parser=tsx --extensions=ts,tsx

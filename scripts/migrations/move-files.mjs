import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modulesでは__dirnameがないため、このように取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '../../'); // スクリプトの場所に基づいて調整
const migrationMapPath = path.resolve(projectRoot, 'docs/refactoring/file_migration_map.json');

console.log(`Project Root: ${projectRoot}`);
console.log(`Migration Map Path: ${migrationMapPath}`);

function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  fs.mkdirSync(dirname, { recursive: true });
}

function moveItem(fromPath, toPath) {
  try {
    ensureDirectoryExists(toPath);
    fs.renameSync(fromPath, toPath);
    console.log(
      `Moved: ${path.relative(projectRoot, fromPath)} -> ${path.relative(projectRoot, toPath)}`
    );
  } catch (error) {
    console.error(`Error moving ${fromPath} to ${toPath}:`, error.message);
    // 特定のエラーコードに基づいて処理を分けることも可能
    // 例: if (error.code === 'ENOENT') { console.error('Source file not found.'); }
  }
}

console.log('--- Starting File Migration ---');

// 1. Read migration map
let migrationMap;
try {
  const mapData = fs.readFileSync(migrationMapPath, 'utf8');
  migrationMap = JSON.parse(mapData);
  console.log(`Loaded ${migrationMap.length} entries from migration map.`);
} catch (error) {
  console.error(`Failed to load migration map from ${migrationMapPath}:`, error);
  process.exit(1); // マップが読めないと続行不可
}

// 2. Process migration map entries
for (const item of migrationMap) {
  const { from, to } = item;
  const isDirMapping = from.endsWith('/*');

  const fromRelative = isDirMapping ? from.replace('/*', '') : from;
  const toRelative = isDirMapping ? to.replace('/*', '') : to;

  const fromPath = path.resolve(projectRoot, fromRelative);
  const toPath = path.resolve(projectRoot, toRelative);

  if (!fs.existsSync(fromPath)) {
    console.warn(`[SKIP] Source not found: ${fromRelative}`);
    continue;
  }

  moveItem(fromPath, toPath);
}

// 3. Move Next.js config files
console.log('\n--- Moving Next.js config files ---');
const nextConfigs = [
  'next.config.mjs',
  'tailwind.config.js',
  'postcss.config.js',
  'components.json',
]; // 他にもあれば追加
const nextConfigTargetDir = path.resolve(projectRoot, 'apps/saas-app');
ensureDirectoryExists(path.join(nextConfigTargetDir, 'dummy')); // ディレクトリを確実に作成

for (const configFile of nextConfigs) {
  const fromPath = path.resolve(projectRoot, configFile);
  const toPath = path.resolve(nextConfigTargetDir, configFile);
  if (fs.existsSync(fromPath)) {
    moveItem(fromPath, toPath);
  } else {
    console.warn(`[SKIP] Config file not found: ${configFile}`);
  }
}

// 4. Move .env files
console.log('\n--- Moving .env files ---');
const envFiles = ['.env.local', '.env.example']; // 他にもあれば追加 (.env など)
const envTargetDir = path.resolve(projectRoot, 'apps/saas-app');
ensureDirectoryExists(path.join(envTargetDir, 'dummy')); // ディレクトリを確実に作成

for (const envFile of envFiles) {
  const fromPath = path.resolve(projectRoot, envFile);
  const toPath = path.resolve(envTargetDir, envFile);
  if (fs.existsSync(fromPath)) {
    moveItem(fromPath, toPath);
  } else {
    console.warn(`[SKIP] Env file not found: ${envFile}`);
  }
}

// 5. Move other root files/dirs potentially belonging to the app
// Example: middleware.ts, public/, etc. Check migration map or add manually if needed.
console.log('\n--- Moving other app-related root files ---');
const otherRootItems = {
  'middleware.ts': 'apps/saas-app/middleware.ts',
  // 'public': 'apps/saas-app/public' // Add if public exists and needs moving
};
for (const [fromName, toRelative] of Object.entries(otherRootItems)) {
  const fromPath = path.resolve(projectRoot, fromName);
  const toPath = path.resolve(projectRoot, toRelative);
  if (fs.existsSync(fromPath)) {
    moveItem(fromPath, toPath);
  } else {
    console.warn(`[SKIP] Root item not found: ${fromName}`);
  }
}

console.log('\n--- File Migration Finished ---');

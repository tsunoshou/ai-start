import path from 'path';

// --- 設定 --- 
// 新しいエイリアスと対応するパッケージルートのマッピング
const newAliasMap = {
  '@core/shared': 'packages/shared',
  '@core/user': 'packages/user',
  '@core/ai': 'packages/ai',
  '@core/web': 'packages/web' // presentation が移行する先の alias
};

// 古いエイリアスプレフィックス (変換対象)
const oldAliasPrefixes = [
  '@/application/',
  '@/config/',
  '@/domain/',
  '@/i18n/',
  '@/infrastructure/',
  '@/presentation/',
  '@/shared/'
];
// -----------

/**
 * 古いエイリアスパスを新しい @core/... 形式のパスに変換する関数
 * migration-map.json の内容に基づき、できるだけ正確なマッピングを行う。
 * @param {string} oldPath - 例: '@/shared/utils/string'
 * @returns {string | null} - 例: '@core/shared/utils/string' または変換不能なら null
 */
function mapOldAliasToNew(oldPath) {
  // @/application/* -> @core/user/application/*
  if (oldPath.startsWith('@/application/')) {
    return oldPath.replace('@/application/', '@core/user/application/');
  }

  // @/domain/* -> User, Shared, AI に分岐
  if (oldPath.startsWith('@/domain/')) {
    if (oldPath.includes('/models/base/') || oldPath.includes('/repositories/base')) {
      // domain/models/base -> packages/shared/domain/models/base
      // domain/repositories/base -> packages/shared/domain/repositories/base
      return oldPath.replace('@/domain/', '@core/shared/domain/');
    }
    if (oldPath.includes('/services/ai/')) {
      // domain/services/ai -> packages/ai/domain/services
      return oldPath.replace('@/domain/', '@core/ai/domain/');
    }
    // 上記以外 (user関連) -> packages/user/domain
    return oldPath.replace('@/domain/', '@core/user/domain/');
  }

  // @/i18n/* -> @core/shared/i18n/*
  if (oldPath.startsWith('@/i18n/')) {
    return oldPath.replace('@/i18n/', '@core/shared/i18n/');
  }

  // @/infrastructure/* -> Shared, User, Shared/base に分岐
  if (oldPath.startsWith('@/infrastructure/')) {
    // Userドメイン固有インフラ
    if (oldPath.includes('/repositories/user') || oldPath.includes('/schema/users') || oldPath.includes('/mappers/user')) {
      return oldPath.replace('@/infrastructure/', '@core/user/infrastructure/');
    }
    // Shared/Baseインフラ
    if (oldPath.includes('/repositories/base') || oldPath.includes('/mappers/base') || oldPath.includes('/mappers/utils')) {
       return oldPath.replace('@/infrastructure/', '@core/shared/base/infrastructure/');
    }
    // AI関連インフラ -> Sharedへ
    if (oldPath.includes('/ai/')) {
      return oldPath.replace('@/infrastructure/', '@core/shared/infrastructure/');
    }
    // DB関連インフラ (User固有以外) -> Sharedへ
    if (oldPath.includes('/database/')) {
      return oldPath.replace('@/infrastructure/', '@core/shared/infrastructure/');
    }
    // 上記以外で判断できないものは警告を出しつつ Shared を試みる (例: 未知のインフラ要素)
    console.warn(`[WARN] Unhandled infrastructure path mapping for ${oldPath}. Assuming @core/shared/infrastructure/. Manual review recommended.`);
    return oldPath.replace('@/infrastructure/', '@core/shared/infrastructure/');
  }

  // @/presentation/* -> @core/web/*
  if (oldPath.startsWith('@/presentation/')) {
    return oldPath.replace('@/presentation/', '@core/web/');
  }

  // @/shared/* -> Shared, Shared/base に分岐
  if (oldPath.startsWith('@/shared/')) {
    // Base関連
    if (oldPath.includes('/value-objects/base') || oldPath.includes('/types/entity-base')) {
      // shared/value-objects/base* -> packages/shared/base/domain/value-objects/*
      // shared/types/entity-base* -> packages/shared/base/domain/interfaces/*
      // ちょっと複雑なので、一旦 base/domain に寄せる
      return oldPath.replace('@/shared/', '@core/shared/base/domain/');
    }
    // その他 Shared
    return oldPath.replace('@/shared/', '@core/shared/');
  }

  // @/config/* -> 変換せず警告
  if (oldPath.startsWith('@/config/')) {
    console.warn(`[WARN] Import from @/config/ found: ${oldPath}. This path likely needs manual correction as config is app-specific.`);
    return null; // 変換しない
  }

  return null; // どのプレフィックスにも一致しない
}


export default function transformer(fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  let changed = false;

  const currentFileDir = path.dirname(fileInfo.path);

  // ImportDeclarations (import ... from '...')
  root
    .find(j.ImportDeclaration)
    .forEach(nodePath => {
      const source = nodePath.value.source;
      if (source && typeof source.value === 'string') {
        const oldImportPath = source.value;
        let newImportPath = null;

        // 1. 古いエイリアスから新しいエイリアスへの変換
        if (oldAliasPrefixes.some(prefix => oldImportPath.startsWith(prefix))) {
           newImportPath = mapOldAliasToNew(oldImportPath);
        }
        // 2. 相対パスの処理 (改善の余地あり)
        else if (oldImportPath.startsWith('.')) {
            try {
                const potentialPackagePath = path.resolve(currentFileDir, oldImportPath);
                // console.log(`Checking relative path: ${oldImportPath} from ${fileInfo.path} -> resolves to ${potentialPackagePath}`);

                for (const [alias, packagePath] of Object.entries(newAliasMap)) {
                    const absolutePackagePath = path.resolve(packagePath);
                    // ターゲットパッケージの src ディレクトリを基準にする (より一般的)
                    const absolutePackageSrcPath = path.join(absolutePackagePath, 'src');
                    // ターゲットが src を持たない or ルートファイルを参照する場合 (tsconfigのpathsなど) も考慮
                    const targetPaths = [absolutePackagePath, absolutePackageSrcPath]; 

                    for (const targetBasePath of targetPaths) {
                        if (potentialPackagePath.startsWith(targetBasePath)) {
                            // パッケージのルート または src からの相対部分を取得
                            const relativePart = potentialPackagePath.substring(targetBasePath.length).replace(/^\\/g, ''); // 先頭の \ を削除
                            newImportPath = path.join(alias, relativePart).replace(/\\/g, '/'); // Windowsパス区切りを置換
                            // console.log(`Mapped relative path ${oldImportPath} to ${newImportPath}`);
                            break; // 内側のループを抜ける
                        }
                    }
                    if (newImportPath) break; // 外側のループも抜ける
                }
                if (!newImportPath) {
                    // console.log(`Could not map relative path: ${oldImportPath}`);
                }
            } catch (e) {
                 console.error(`Error resolving relative path: ${oldImportPath} in ${fileInfo.path}`, e);
            }
        }

        if (newImportPath && newImportPath !== oldImportPath) {
          // console.log(`Transforming import in ${fileInfo.path}: ${oldImportPath} -> ${newImportPath}`);
          source.value = newImportPath;
          source.raw = JSON.stringify(newImportPath); // クォートを正しく扱う
          changed = true;
        }
      }
    });

  // ExportDeclarations (export ... from '...')
   root
    .find(j.ExportNamedDeclaration, { source: { type: 'Literal' } })
    .forEach(nodePath => {
        const source = nodePath.value.source;
        if (source && typeof source.value === 'string') {
           const oldImportPath = source.value;
           let newImportPath = null;

           if (oldAliasPrefixes.some(prefix => oldImportPath.startsWith(prefix))) {
               newImportPath = mapOldAliasToNew(oldImportPath);
           }
           // 相対パス処理 (上記と同様の改善された処理)
           else if (oldImportPath.startsWith('.')) {
               try {
                  const potentialPackagePath = path.resolve(currentFileDir, oldImportPath);
                  for (const [alias, packagePath] of Object.entries(newAliasMap)) {
                      const absolutePackagePath = path.resolve(packagePath);
                      const absolutePackageSrcPath = path.join(absolutePackagePath, 'src');
                      const targetPaths = [absolutePackagePath, absolutePackageSrcPath];

                      for (const targetBasePath of targetPaths) {
                          if (potentialPackagePath.startsWith(targetBasePath)) {
                              const relativePart = potentialPackagePath.substring(targetBasePath.length).replace(/^\\/g, '');
                              newImportPath = path.join(alias, relativePart).replace(/\\/g, '/');
                              break;
                          }
                      }
                      if (newImportPath) break;
                  }
               } catch (e) {
                    console.error(`Error resolving relative path for export: ${oldImportPath} in ${fileInfo.path}`, e);
               }
           }

           if (newImportPath && newImportPath !== oldImportPath) {
               // console.log(`Transforming export in ${fileInfo.path}: ${oldImportPath} -> ${newImportPath}`);
               source.value = newImportPath;
               source.raw = JSON.stringify(newImportPath);
               changed = true;
           }
        }
    });

   // require('...') Calls
   root
    .find(j.CallExpression, {
        callee: { name: 'require' },
        arguments: [{ type: 'Literal' }],
    })
    .forEach(nodePath => {
        const source = nodePath.value.arguments[0];
        if (source && typeof source.value === 'string') {
            const oldImportPath = source.value;
            let newImportPath = null;

            if (oldAliasPrefixes.some(prefix => oldImportPath.startsWith(prefix))) {
                newImportPath = mapOldAliasToNew(oldImportPath);
            }
            // 相対パス処理 (上記と同様の改善された処理)
            else if (oldImportPath.startsWith('.')) {
               try {
                  const potentialPackagePath = path.resolve(currentFileDir, oldImportPath);
                  for (const [alias, packagePath] of Object.entries(newAliasMap)) {
                      const absolutePackagePath = path.resolve(packagePath);
                      const absolutePackageSrcPath = path.join(absolutePackagePath, 'src');
                      const targetPaths = [absolutePackagePath, absolutePackageSrcPath];

                      for (const targetBasePath of targetPaths) {
                          if (potentialPackagePath.startsWith(targetBasePath)) {
                              const relativePart = potentialPackagePath.substring(targetBasePath.length).replace(/^\\/g, '');
                              newImportPath = path.join(alias, relativePart).replace(/\\/g, '/');
                              break;
                          }
                      }
                      if (newImportPath) break;
                  }
               } catch(e) {
                    console.error(`Error resolving relative path for require: ${oldImportPath} in ${fileInfo.path}`, e);
               }
            }

            if (newImportPath && newImportPath !== oldImportPath) {
                // console.log(`Transforming require in ${fileInfo.path}: ${oldImportPath} -> ${newImportPath}`);
                source.value = newImportPath;
                source.raw = JSON.stringify(newImportPath);
                changed = true;
            }
        }
    });


  // 変更があった場合のみソースを返す
  return changed ? root.toSource({ quote: 'single' }) : null;
}
 
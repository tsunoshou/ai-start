/**
 * @file ユーザーの役割を定義する Enum
 * @description システム内でのユーザー権限レベルを示します。
 *
 * @author tsunoshou
 * @date 2024-03-29
 * @version 1.0.0
 */

/**
 * ユーザーの役割を表す列挙型です。
 *
 * @enum {string}
 * @property {string} ADMIN - 管理者権限を持つ役割。システム全体の設定変更やユーザー管理が可能。
 * @property {string} EDITOR - 編集者権限を持つ役割。特定のコンテンツやプログラムの編集・管理が可能。
 * @property {string} USER - 一般ユーザー権限を持つ役割。自身のプロジェクト管理やサービス利用が可能。
 *
 * @example
 * ```typescript
 * import { UserRole } from '@/domain/models/user/user-role.enum';
 *
 * const adminRole: UserRole = UserRole.ADMIN;
 * const userRole: UserRole = UserRole.USER;
 *
 * function checkPermission(role: UserRole) {
 *   if (role === UserRole.ADMIN) {
 *     console.log('管理者アクセスが許可されました');
 *   } else {
 *     console.log('一般ユーザーアクセスです');
 *   }
 * }
 * ```
 */
export enum UserRole {
  Admin = 'ADMIN',
  Editor = 'EDITOR',
  User = 'USER',
}

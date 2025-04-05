/**
 * @file サブスクリプションのステータスを表す列挙型
 * @description ユーザーのサブスクリプション契約の状態を示します。
 * Stripeなどの外部決済サービスのステータスと連携することを想定しています。
 * 詳細は docs/01_requirements_definition.md の「サブスクリプション管理」を参照。
 *
 * @author tsunoshou
 * @date 2024-07-26
 * @version 1.0.0
 */

/**
 * サブスクリプションのステータスを表す列挙型。
 *
 * @enum {string}
 * @property {string} Trialing - 無料トライアル期間中。
 * @property {string} Active - 有効な支払い済みサブスクリプション。
 * @property {string} Canceled - ユーザーによってキャンセルされたサブスクリプション（期間終了までは有効な場合がある）。
 * @property {string} Incomplete - 最初の支払い処理が未完了の状態。
 * @property {string} PaymentFailed - 支払い処理に失敗した状態。
 * @property {string} PastDue - 支払いが延滞している状態（Stripeなどではしばしば自動でCanceledやUnpaidに移行）。
 */
export enum SubscriptionStatus {
  Trialing = 'TRIALING',
  Active = 'ACTIVE',
  Canceled = 'CANCELED',
  Incomplete = 'INCOMPLETE',
  PaymentFailed = 'PAYMENT_FAILED',
  PastDue = 'PAST_DUE',
}

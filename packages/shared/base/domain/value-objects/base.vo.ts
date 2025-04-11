/**
 * @file 値オブジェクトの基底クラス定義
 * @description すべての値オブジェクトの共通機能を提供します。
 * zod スキーマを用いたバリデーションと、基本的な等価性比較を提供します。
 * 詳細は docs/05_type_definitions.md を参照。
 *
 * @author tsunoshou
 * @date 2024-04-09
 * @version 1.0.0
 */

/**
 * 値オブジェクトの基底抽象クラス
 *
 * @template TValue - 値オブジェクトが保持する値の型
 */
export abstract class BaseValueObject<TValue> {
  /**
   * 値オブジェクトが保持する値。
   * public readonly で不変性を保証します。
   */
  public readonly value: TValue;

  /**
   * 継承クラスからのみ呼び出し可能なコンストラクタ。
   * バリデーション済みの値を設定します。
   *
   * @param value - バリデーション済みの値
   * @protected
   */
  protected constructor(value: TValue) {
    this.value = value;
  }

  /**
   * この値オブジェクトが別の値オブジェクトと等しいか比較します。
   * 値がプリミティブ型または単純なオブジェクトであることを想定しています。
   * 複雑なオブジェクトの場合は、継承クラスでこのメソッドをオーバーライドする必要があります。
   *
   * @param other - 比較対象の他の値オブジェクト
   * @returns {boolean} 値が等しい場合は true、それ以外は false
   */
  public equals(other?: BaseValueObject<TValue> | null): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    // 同じクラスのインスタンスか、念のためチェック
    if (Object.getPrototypeOf(this) !== Object.getPrototypeOf(other)) {
      return false;
    }
    return this.value === other.value;
  }
}

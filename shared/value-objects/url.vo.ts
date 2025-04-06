/**
 * @file URLを表す値オブジェクト
 * @description URL文字列の形式検証と不変性を保証します。
 * 詳細は docs/05_type_definitions.md の「値オブジェクト vs プリミティブ型」を参照。
 *
 * @author tsunoshou
 * @date 2025-04-05
 * @version 1.0.0
 */

import { Result, ok, err } from 'neverthrow';

/**
 * URLを表す値オブジェクトクラス。
 *
 * 不変性を持ち、常に有効なURL形式（http/https）であることを保証します。
 * `create` 静的メソッドを使用してインスタンスを生成してください。
 *
 * @example
 * const urlResult = Url.create('https://example.com/path?query=value');
 * if (urlResult.isOk()) {
 *   const url = urlResult.value;
 *   console.log(url.value); // 'https://example.com/path?query=value'
 *   console.log(url.hostname); // 'example.com'
 * } else {
 *   console.error(urlResult.error.message);
 * }
 *
 * const invalidResult = Url.create('invalid-url');
 * console.log(invalidResult.isErr()); // true
 */
export class Url {
  private readonly _value: string;
  private readonly _urlObject: URL; // 内部的にURLオブジェクトも保持

  /**
   * Urlクラスのインスタンスをプライベートに生成します。
   * バリデーションは `create` メソッドで行います。
   * @param {string} value - 有効なURL文字列。
   * @param {URL} urlObject - 対応するURLオブジェクト。
   */
  private constructor(value: string, urlObject: URL) {
    this._value = value;
    this._urlObject = urlObject;
  }

  /**
   * 文字列が有効なURL形式 (http/https) かを検証します。
   * @param {string} value - 検証する文字列。
   * @returns {Result<URL, Error>} 有効な形式であればURLオブジェクトを含むResult.Ok、そうでなければResult.Err。
   */
  private static validate(value: string): Result<URL, Error> {
    if (!value) {
      return err(new Error('URL cannot be empty.'));
    }
    try {
      const url = new URL(value);
      // console.log(`[Url.validate] Input: ${value}, Parsed hostname: '${url.hostname}', Parsed pathname: '${url.pathname}'`); // Detailed Debug log

      // http または https プロトコルのみを許可
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return err(
          new Error(`Invalid URL protocol: ${url.protocol}. Only http: or https: are allowed.`)
        );
      }
      // ホスト名が空でないことを確認
      if (!url.hostname) {
        return err(new Error(`Invalid URL format: Missing hostname for ${value}`));
      }

      // 追加チェック: // が hostname の前に存在するか（より簡易的な形式チェック）
      const protocolSeparatorIndex = value.indexOf('://');
      const hostnameIndex = value.indexOf(url.hostname);
      if (
        protocolSeparatorIndex === -1 ||
        hostnameIndex === -1 ||
        protocolSeparatorIndex + 3 > hostnameIndex
      ) {
        return err(new Error(`Invalid URL structure for ${value}`));
      }

      return ok(url);
    } catch (e) {
      // URL コンストラクタがエラーを投げた場合 (形式が無効)
      if (e instanceof TypeError) {
        return err(new Error(`Invalid URL format: ${value}`));
      }
      // 予期せぬエラー
      return err(e instanceof Error ? e : new Error('Unknown error during URL validation'));
    }
  }

  /**
   * Urlインスタンスを生成するための静的ファクトリメソッド。
   * 入力文字列のバリデーションを行い、成功すれば Result.Ok を、失敗すれば Result.Err を返します。
   *
   * @param {unknown} value - URL文字列の可能性がある入力値。
   * @returns {Result<Url, Error>} 生成結果。
   */
  public static create(value: unknown): Result<Url, Error> {
    // 型ガード: 文字列以外はエラー
    if (typeof value !== 'string') {
      return err(new Error('Input must be a string.'));
    }

    const trimmedValue = value.trim();
    const validationResult = Url.validate(trimmedValue);

    if (validationResult.isErr()) {
      return err(validationResult.error);
    }

    return ok(new Url(trimmedValue, validationResult.value));
  }

  /**
   * URLの文字列表現を取得します。
   * @returns {string} URL文字列。
   */
  get value(): string {
    return this._value;
  }

  // URLオブジェクトのプロパティへのアクセサを提供 (例)
  get protocol(): string {
    return this._urlObject.protocol;
  }

  get hostname(): string {
    return this._urlObject.hostname;
  }

  get pathname(): string {
    return this._urlObject.pathname;
  }

  get search(): string {
    return this._urlObject.search;
  }

  /**
   * 他のUrlインスタンスと値が等しいかを比較します。
   * @param {Url} other - 比較対象のUrlインスタンス。
   * @returns {boolean} 値が等しければ true、そうでなければ false。
   */
  public equals(other: Url): boolean {
    // 文字列比較で十分だが、より厳密にはURLオブジェクトの各部を比較することも可能
    return this._value === other.value;
  }
}

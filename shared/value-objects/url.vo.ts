/**
 * @file URLを表す値オブジェクト
 * @description URL文字列の形式検証と不変性を保証します。
 * 詳細は docs/05_type_definitions.md の「値オブジェクト vs プリミティブ型」を参照。
 *
 * @author tsunoshou
 * @date 2025-04-05
 * @version 1.1.0
 */

import { Result, ok, err } from 'neverthrow';

import { ValidationError } from '../errors/validation.error';

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
   * @returns {Result<URL, ValidationError>} 有効な形式であればURLオブジェクトを含むResult.Ok、そうでなければValidationErrorを含むResult.Err。
   */
  private static validate(value: string): Result<URL, ValidationError> {
    if (!value) {
      return err(
        new ValidationError('URL cannot be empty.', {
          value: value,
          validationTarget: 'ValueObject',
          metadata: { valueObjectName: 'Url' },
        })
      );
    }
    try {
      const url = new URL(value);
      // console.log(`[Url.validate] Input: ${value}, Parsed hostname: '${url.hostname}', Parsed pathname: '${url.pathname}'`); // Detailed Debug log

      // http または https プロトコルのみを許可
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return err(
          new ValidationError(
            `Invalid URL protocol: ${url.protocol}. Only http: or https: are allowed.`,
            {
              value: value,
              validationTarget: 'ValueObject',
              metadata: { valueObjectName: 'Url' },
            }
          )
        );
      }
      // ホスト名が空でないことを確認
      if (!url.hostname) {
        return err(
          new ValidationError(`Invalid URL format: Missing hostname for ${value}`, {
            value: value,
            validationTarget: 'ValueObject',
            metadata: { valueObjectName: 'Url' },
          })
        );
      }

      // 追加チェック: // が hostname の前に存在するか（より簡易的な形式チェック）
      const protocolSeparatorIndex = value.indexOf('://');
      const hostnameIndex = value.indexOf(url.hostname);
      if (
        protocolSeparatorIndex === -1 ||
        hostnameIndex === -1 ||
        protocolSeparatorIndex + 3 > hostnameIndex
      ) {
        return err(
          new ValidationError(`Invalid URL structure for ${value}`, {
            value: value,
            validationTarget: 'ValueObject',
            metadata: { valueObjectName: 'Url' },
          })
        );
      }

      return ok(url);
    } catch (e) {
      // URL コンストラクタがエラーを投げた場合 (形式が無効)
      if (e instanceof TypeError) {
        return err(
          new ValidationError(`Invalid URL format: ${value}`, {
            cause: e,
            value: value,
            validationTarget: 'ValueObject',
            metadata: { valueObjectName: 'Url' },
          })
        );
      }
      // 予期せぬエラー
      // NOTE: ここは予期せぬエラーなので ValidationError ではなく、より上位で InfrastructureError などに変換されるべきかもしれないが、
      //       ひとまず VO の責務範囲外のエラーとして ValidationError でラップする（より具体的なエラーを返す方が望ましい場合もある）。
      const unknownError =
        e instanceof Error ? e : new Error('Unknown error during URL validation');
      return err(
        new ValidationError(unknownError.message, {
          cause: unknownError,
          value: value,
          validationTarget: 'ValueObject',
          metadata: { valueObjectName: 'Url', originalErrorName: unknownError.name },
        })
      );
    }
  }

  /**
   * Urlインスタンスを生成するための静的ファクトリメソッド。
   * 入力文字列のバリデーションを行い、成功すれば Result.Ok を、失敗すれば Result.Err を返します。
   *
   * @param {unknown} value - URL文字列の可能性がある入力値。
   * @returns {Result<Url, ValidationError>} 生成結果。
   */
  public static create(value: unknown): Result<Url, ValidationError> {
    // 型ガード: 文字列以外はエラー
    if (typeof value !== 'string') {
      return err(
        new ValidationError('Input must be a string.', {
          value: value,
          validationTarget: 'ValueObject',
          metadata: { valueObjectName: 'Url' },
        })
      );
    }

    const trimmedValue = value.trim();
    const validationResult = Url.validate(trimmedValue);

    if (validationResult.isErr()) {
      // validationResult.error は既に ValidationError なのでそのまま返す
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

// External libraries
import { eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { ok, err } from 'neverthrow';
import { inject } from 'tsyringe';

// Internal modules & types (alphabetical by path)
import { AppError } from '@/shared/errors/app.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';
import type { LoggerInterface } from '@/shared/logger/logger.interface';
import { LoggerToken } from '@/shared/logger/logger.token';
import type { AppResult, Identifier } from '@/shared/types/common.types';
import type { EntityBase } from '@/shared/types/entity-base.interface';
import { DateTimeString } from '@/shared/value-objects/date-time-string.vo';

/**
 * @description Base abstract class for repositories providing common structure.
 * Subclasses must implement CRUD operations and mapping methods.
 * @template TID The identifier type for the entity, must extend Identifier<string>.
 * @template TDomain The domain entity type, must extend EntityBase.
 * @template TDbSelect The type representing a selected database record.
 * @template TDbInsert The type representing data for insertion/update.
 * @template TSchema The Drizzle schema type, must extend PgTable.
 */
export abstract class BaseRepository<
  TID extends Identifier<string>,
  TDomain extends EntityBase<TID>,
  TDbSelect extends Record<string, unknown>,
  TDbInsert extends { updatedAt?: string | Date | DateTimeString; [key: string]: unknown },
  TSchema extends PgTable,
> {
  constructor(
    @inject('Database') protected readonly db: NodePgDatabase,
    @inject(LoggerToken) protected readonly logger: LoggerInterface
  ) {}

  /** Drizzle schema definition for the table. Must be implemented by subclasses. */
  protected abstract readonly schema: TSchema;

  /** The primary key column (usually 'id'). Must be implemented by subclasses. */
  protected abstract readonly idColumn: PgColumn;

  /** Maps a database record to a domain entity. Must be implemented by subclasses. */
  protected abstract _toDomain(record: TDbSelect): TDomain;

  /** Maps a domain entity to a database record format for insertion/update. Must be implemented by subclasses. */
  protected abstract _toPersistence(entity: TDomain): TDbInsert;

  /**
   * Finds an entity by its ID.
   * @param id The ID of the entity to find.
   * @returns An AppResult containing the entity or null if not found, or an AppError.
   */
  async findById(id: TID): Promise<AppResult<TDomain | null>> {
    try {
      // drizzle-ormの型システム問題を回避するために型アサーションを使用
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      const findResult = await this.db
        .select()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(this.schema as any)
        .where(eq(this.idColumn, id.value))
        .limit(1);

      if (!findResult.length) {
        return ok(null); // Not found is not an error in this context
      }

      // Map record to domain entity
      try {
        const entity = this._toDomain(findResult[0] as unknown as TDbSelect);
        return ok(entity);
      } catch (mappingError) {
        // Handle mapping errors (which might throw InfrastructureError directly)
        this.logger.error(
          {
            message: `Mapping failed for entity with ID ${id.value}`,
            entityId: id.value,
            operation: 'findById',
          },
          mappingError
        );

        if (mappingError instanceof AppError) {
          return err(mappingError);
        }
        return err(
          new AppError(ErrorCode.DatabaseError, `Mapping failed for entity with ID ${id.value}`, {
            cause: mappingError,
          })
        );
      }
    } catch (error) {
      this.logger.error(
        {
          message: `Failed to find entity by id ${id.value}`,
          entityId: id.value,
          operation: 'findById',
        },
        error
      );

      return err(
        new AppError(ErrorCode.DatabaseError, `Failed to find entity by id ${id.value}`, {
          cause: error,
        })
      );
    }
  }

  /**
   * Saves (inserts or updates) an entity to the database.
   * Automatically sets the `updatedAt` field before persisting.
   * @param entity The domain entity to save.
   * @returns An AppResult containing void or an AppError.
   */
  async save(entity: TDomain): Promise<AppResult<void>> {
    let persistenceData: TDbInsert;
    const now = DateTimeString.now();

    try {
      persistenceData = this._toPersistence(entity);
      persistenceData.updatedAt = now.value;
    } catch (mappingError) {
      this.logger.error(
        {
          message: `Mapping to persistence failed for ${entity.id.value}`,
          entityId: entity.id.value,
          operation: 'save',
        },
        mappingError
      );

      return err(
        new AppError(
          ErrorCode.DatabaseError,
          `Mapping to persistence failed for ${entity.id.value}`,
          { cause: mappingError }
        )
      );
    }

    try {
      // drizzle-ormの型システム問題を回避するために型アサーションを使用
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      await this.db
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(this.schema as any)
        .values(persistenceData)
        .onConflictDoUpdate({
          target: this.idColumn,
          set: persistenceData,
        });

      return ok(undefined); // Success
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this.logger.error(
        {
          message: `Failed to save entity data: ${entity.id.value}`,
          entityId: entity.id.value,
          operation: 'save',
          errorCode: error?.code,
        },
        error
      );

      // PostgreSQLのユニーク制約違反エラーコード: 23505
      if (error?.code === '23505') {
        // 制約違反のフィールド名を抽出する試み
        // PostgreSQLのエラーメッセージからフィールド名を解析
        // 例: 'Key (email)=(test@example.com) already exists.'
        let conflictField = 'unknown';
        try {
          const detailMatch = error.detail?.match(/Key \(([^)]+)\)=/i);
          if (detailMatch && detailMatch[1]) {
            conflictField = detailMatch[1];
          }
        } catch (parseErr) {
          // 解析エラーは無視し、デフォルト値を使用
        }

        // AppErrorを使用してより明確なエラーを返す
        return err(
          new AppError(
            ErrorCode.ConflictError,
            `Unique constraint violation during save of entity: duplicate ${conflictField} value.`
          )
            .withEntityContext(
              // エンティティの種類を示す情報 (例: 'user', 'product' など)
              // subclass で具体的なエンティティ名がわかる場合は上書きすることを想定
              'entity',
              entity.id.value,
              'save'
            )
            .withMetadata({
              conflictField,
              constraint: error.constraint,
              detail: error.detail,
            })
        );
      }

      return err(
        new AppError(ErrorCode.DatabaseError, `Failed to save entity data: ${entity.id.value}`, {
          cause: error,
        })
      );
    }
  }

  /**
   * Deletes an entity by its ID.
   * @param id The ID of the entity to delete.
   * @returns An AppResult containing void or an AppError.
   * @remarks エンティティが存在しない場合も成功として扱います（冪等性のため）。
   */
  async delete(id: TID): Promise<AppResult<void>> {
    try {
      // drizzle-ormの型システム問題を回避するために型アサーションを使用
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      const deleteResult = await this.db
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .delete(this.schema as any)
        .where(eq(this.idColumn, id.value));

      if (deleteResult.rowCount === 0) {
        this.logger.info({
          message: `Entity with id ${id.value} not found for deletion, but treated as success.`,
          entityId: id.value,
          operation: 'delete',
        });

        // エンティティが見つからなくても成功として扱う（冪等性を保証）
        return ok(undefined);
      }

      this.logger.info({
        message: `Successfully deleted entity ${id.value}`,
        entityId: id.value,
        operation: 'delete',
      });

      return ok(undefined); // Success
    } catch (error) {
      this.logger.error(
        {
          message: `Failed to delete entity ${id.value}`,
          entityId: id.value,
          operation: 'delete',
        },
        error
      );

      return err(
        new AppError(ErrorCode.DatabaseError, `Failed to delete entity ${id.value}`, {
          cause: error,
        })
      );
    }
  }

  /**
   * エンティティが存在するかチェックします。
   * @param id エンティティのID。
   * @returns 存在する場合はtrue、存在しない場合はfalseを含むAppResult。エラー時はAppErrorを含むAppResult。
   */
  async exists(id: TID): Promise<AppResult<boolean>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      const result = await this.db
        .select({ count: sql<string>`count(*)` })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(this.schema as any)
        .where(eq(this.idColumn, id.value));

      const exists = parseInt(result[0].count as string, 10) > 0;
      return ok(exists);
    } catch (error) {
      this.logger.error(
        {
          message: `Failed to check existence of entity ${id.value}`,
          entityId: id.value,
          operation: 'exists',
        },
        error
      );

      return err(
        new AppError(ErrorCode.DatabaseError, `Failed to check if entity ${id.value} exists`, {
          cause: error,
        })
      );
    }
  }

  // --- Other common methods can be added here ---
}

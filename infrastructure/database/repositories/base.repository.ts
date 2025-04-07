import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { Result, ok, err } from 'neverthrow';
import { inject } from 'tsyringe';

import { ErrorCode } from '@/shared/errors/error-code.enum';
import { InfrastructureError } from '@/shared/errors/infrastructure.error';
import { Identifier } from '@/shared/types/common.types';
import { EntityBase } from '@/shared/types/entity-base.interface';

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
  TDbInsert extends Record<string, unknown>,
  TSchema extends PgTable,
> {
  protected readonly db: NodePgDatabase;

  constructor(@inject('Database') db: NodePgDatabase) {
    this.db = db;
  }

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
   * @returns A Result containing the entity or null if not found, or an InfrastructureError.
   */
  async findById(id: TID): Promise<Result<TDomain | null, InfrastructureError>> {
    try {
      // drizzle-ormの型システム問題を回避するために型アサーションを使用
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
        if (mappingError instanceof InfrastructureError) {
          return err(mappingError);
        }
        return err(
          new InfrastructureError(`Mapping failed for entity with ID ${id.value}`, {
            cause: mappingError instanceof Error ? mappingError : undefined,
          })
        );
      }
    } catch (error) {
      return err(
        new InfrastructureError(`Failed to find entity by id ${id.value}`, {
          cause: error instanceof Error ? error : undefined,
        })
      );
    }
  }

  /**
   * Saves (inserts or updates) an entity to the database.
   * @param entity The domain entity to save.
   * @returns A Result containing void or an InfrastructureError.
   */
  async save(entity: TDomain): Promise<Result<void, InfrastructureError>> {
    try {
      const persistenceData = this._toPersistence(entity);

      // drizzle-ormの型システム問題を回避するために型アサーションを使用
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.db
        .insert(this.schema as any)
        .values(persistenceData)
        .onConflictDoUpdate({
          target: this.idColumn,
          set: persistenceData,
        });

      return ok(undefined); // Success
    } catch (error) {
      // Catch potential errors from _toPersistence
      return err(
        new InfrastructureError(`Failed to save entity data: ${entity.id.value}`, {
          cause: error instanceof Error ? error : undefined,
        })
      );
    }
  }

  /**
   * Deletes an entity by its ID.
   * @param id The ID of the entity to delete.
   * @returns A Result containing void or an InfrastructureError.
   */
  async delete(id: TID): Promise<Result<void, InfrastructureError>> {
    try {
      // drizzle-ormの型システム問題を回避するために型アサーションを使用
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const deleteResult = await this.db
        .delete(this.schema as any)
        .where(eq(this.idColumn, id.value));

      if (deleteResult.rowCount === 0) {
        // Entity not found, return specific InfrastructureError
        return err(
          new InfrastructureError(`Entity with id ${id.value} not found for deletion.`, {
            metadata: { code: ErrorCode.NotFound },
          })
        );
      }

      return ok(undefined); // Success
    } catch (error) {
      return err(
        new InfrastructureError(`Failed to delete entity ${id.value}`, {
          cause: error instanceof Error ? error : undefined,
        })
      );
    }
  }

  // --- Other common methods can be added here ---
}

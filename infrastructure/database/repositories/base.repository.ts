import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgTableWithColumns, TableConfig, PgTable } from 'drizzle-orm/pg-core';
import { Result, ok, err } from 'neverthrow';
import { inject } from 'tsyringe';

import { InfrastructureError } from '@/shared/errors/infrastructure.error';
import { Identifier } from '@/shared/types/common.types';
import { EntityBase } from '@/shared/types/entity-base.interface';

/**
 * @description Base abstract class for repositories providing common CRUD operations.
 * @template TDomain The domain entity type, must extend EntityBase.
 * @template TID The identifier type for the entity, must extend Identifier.
 * @template TDbSelect The type representing a selected database record.
 * @template TDbInsert The type representing data for insertion/update.
 * @template TSchema The Drizzle schema type, must extend PgTableWithColumns.
 */
export abstract class BaseRepository<
  TID extends Identifier & {
    readonly value: string;
    equals(other: TID): boolean;
  },
  TDomain extends EntityBase<TID>,
  TDbSelect extends Record<string, unknown>,
  TDbInsert extends Record<string, unknown>,
  TSchema extends PgTableWithColumns<TableConfig>,
> {
  /**
   * Drizzle ORM database instance.
   * Injected via constructor.
   */
  protected readonly db: NodePgDatabase;

  /**
   * Constructor injecting the database instance.
   * @param db Drizzle database instance from DI container.
   */
  constructor(@inject('Database') db: NodePgDatabase) {
    this.db = db;
  }

  /** Drizzle schema definition for the table. Must be implemented by subclasses. */
  protected abstract readonly schema: TSchema;

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
      const [result] = await this.db
        .select()
        .from(this.schema as PgTable)
        .where(eq(this.schema.id, id.value))
        .limit(1);

      if (!result) {
        return ok(null);
      }
      return ok(this._toDomain(result as TDbSelect));
    } catch (error) {
      return err(
        new InfrastructureError(`Failed to find entity by id ${id.value}`, {
          cause: error,
        })
      );
    }
  }

  /**
   * Saves (inserts or updates) an entity to the database.
   * Uses INSERT ... ON CONFLICT DO UPDATE (UPSERT).
   * @param entity The domain entity to save.
   * @returns A Result containing void or an InfrastructureError.
   */
  async save(entity: TDomain): Promise<Result<void, InfrastructureError>> {
    const persistenceData = this._toPersistence(entity);
    try {
      await this.db.insert(this.schema).values(persistenceData).onConflictDoUpdate({
        target: this.schema.id,
        set: persistenceData,
      });

      return ok(undefined);
    } catch (error) {
      return err(
        new InfrastructureError(
          `Failed to save entity ${entity.id.value} in ${this.schema._.name}`,
          { cause: error }
        )
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
      await this.db.delete(this.schema).where(eq(this.schema.id, id.value));

      return ok(undefined);
    } catch (error) {
      return err(
        new InfrastructureError(`Failed to delete entity ${id.value}`, {
          cause: error,
        })
      );
    }
  }

  // --- 必要に応じて他の共通メソッドを追加 ---
  // 例: findAll, findByCriteria など
}

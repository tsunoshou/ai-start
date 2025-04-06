import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import { Result } from 'neverthrow';
import { inject } from 'tsyringe';

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
   * Finds an entity by its ID. Must be implemented by subclasses.
   * @param id The ID of the entity to find.
   * @returns A Result containing the entity or null if not found, or an InfrastructureError.
   */
  abstract findById(id: TID): Promise<Result<TDomain | null, InfrastructureError>>;

  /**
   * Saves (inserts or updates) an entity to the database. Must be implemented by subclasses.
   * @param entity The domain entity to save.
   * @returns A Result containing void or an InfrastructureError.
   */
  abstract save(entity: TDomain): Promise<Result<void, InfrastructureError>>;

  /**
   * Deletes an entity by its ID. Must be implemented by subclasses.
   * @param id The ID of the entity to delete.
   * @returns A Result containing void or an InfrastructureError.
   */
  abstract delete(id: TID): Promise<Result<void, InfrastructureError>>;

  // --- Other common methods can be added here ---
}

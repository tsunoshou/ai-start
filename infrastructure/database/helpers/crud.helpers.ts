import { eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgTable, PgColumn } from 'drizzle-orm/pg-core';
import { Result, ok, err } from 'neverthrow';

import type { LoggerInterface } from '@/shared/logger/logger.interface';

/**
 * Finds a single database record by its ID column.
 *
 * @template TSelect The expected type of the selected record.
 * @param db The Drizzle database instance.
 * @param schema The Drizzle table schema.
 * @param idColumn The ID column schema definition.
 * @param idValue The value of the ID to search for.
 * @param logger The logger instance to use for logging database operations.
 * @returns A Result containing the found record (TSelect) or null if not found, or an Error if the query fails.
 */
export async function findRecordById<TSelect extends Record<string, unknown>>(
  db: NodePgDatabase,
  schema: PgTable,
  idColumn: PgColumn,
  idValue: string | number, // Allow number IDs as well
  logger: LoggerInterface
): Promise<Result<TSelect | null, Error>> {
  try {
    // Drizzle's select() without arguments defaults to select *,
    // which might not always match TSelect exactly. Explicit select might be safer if needed.
    const [record] = await db.select().from(schema).where(eq(idColumn, idValue)).limit(1);
    return ok(record ? (record as TSelect) : null);
  } catch (error) {
    logger.error(
      {
        message: `Error in findRecordById for schema ${schema._.name}`,
        schema: schema._.name,
        idColumn: idColumn.name,
        idValue,
        operation: 'findRecordById',
      },
      error
    );

    return err(error instanceof Error ? error : new Error('Unknown database error'));
  }
}

/**
 * Saves (inserts or updates using UPSERT) a database record.
 *
 * @template TInsert The type of the data to be inserted/updated.
 * @param db The Drizzle database instance.
 * @param schema The Drizzle table schema.
 * @param idColumn The ID column schema definition (used for conflict target).
 * @param data The data record to save.
 * @param logger The logger instance to use for logging database operations.
 * @returns A Result containing void or an Error if the operation fails.
 */
export async function saveRecord<TInsert extends Record<string, unknown>>(
  db: NodePgDatabase,
  schema: PgTable,
  idColumn: PgColumn,
  data: TInsert,
  logger: LoggerInterface
): Promise<Result<void, Error>> {
  try {
    // Create a copy of the data excluding the ID field for the SET clause
    const setData = { ...data };
    Reflect.deleteProperty(setData, idColumn.name); // Delete using Reflect API

    // Automatically set updatedAt to the current timestamp on update
    const setDataWithTimestamp = {
      ...setData,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    };

    await db.insert(schema).values(data).onConflictDoUpdate({
      target: idColumn,
      set: setDataWithTimestamp, // Use the object with updatedAt set to now
    });
    return ok(undefined);
  } catch (error) {
    logger.error(
      {
        message: `Error in saveRecord for schema ${schema._.name}`,
        schema: schema._.name,
        idColumn: idColumn.name,
        recordId: data[idColumn.name],
        operation: 'saveRecord',
      },
      error
    );

    return err(error instanceof Error ? error : new Error('Unknown database error'));
  }
}

/**
 * Deletes a database record by its ID column.
 *
 * @param db The Drizzle database instance.
 * @param schema The Drizzle table schema.
 * @param idColumn The ID column schema definition.
 * @param idValue The value of the ID to delete.
 * @param logger The logger instance to use for logging database operations.
 * @returns A Result containing the number of affected rows (0 or 1 typically) or an Error if the query fails.
 */
export async function deleteRecordById(
  db: NodePgDatabase,
  schema: PgTable,
  idColumn: PgColumn,
  idValue: string | number, // Allow number IDs as well
  logger: LoggerInterface
): Promise<Result<number, Error>> {
  // Returns number of deleted rows
  try {
    const result = await db.delete(schema).where(eq(idColumn, idValue)).returning({ id: idColumn });
    return ok(result.length); // Return the count of deleted rows (0 or 1)
  } catch (error) {
    logger.error(
      {
        message: `Error in deleteRecordById for schema ${schema._.name}`,
        schema: schema._.name,
        idColumn: idColumn.name,
        idValue,
        operation: 'deleteRecordById',
      },
      error
    );

    return err(error instanceof Error ? error : new Error('Unknown database error'));
  }
}

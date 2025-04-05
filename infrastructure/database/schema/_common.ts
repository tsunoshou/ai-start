import { sql } from 'drizzle-orm';
import { timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Common UUID primary key column definition.
 * Uses PostgreSQL's uuid_generate_v4() function for default value.
 */
export const idColumn = {
  id: uuid('id')
    .primaryKey()
    .default(sql`uuid_generate_v4()`) // Assumes uuid-ossp extension is enabled
    .notNull(),
};

/**
 * Common timestamp columns (createdAt, updatedAt).
 * createdAt defaults to the current timestamp.
 * updatedAt defaults to the current timestamp and updates on row modification.
 */
export const timestampColumns = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  // The $onUpdate trigger needs to be handled separately, typically via a trigger in the database
  // or potentially manually updated in the repository layer if triggers are not used.
  // Drizzle ORM itself doesn't directly create the ON UPDATE trigger.
};

/**
 * Helper function to create a pgEnum type from a TypeScript enum.
 * @param name The name for the enum type in PostgreSQL.
 * @param enumObj The TypeScript enum object.
 * @returns A Drizzle pgEnum instance.
 */
// This function might be useful if used frequently, otherwise defining pgEnum directly is fine.
// import { pgEnum } from 'drizzle-orm/pg-core';
// export function createPgEnum<T extends Record<string, string>>(
//   name: string,
//   enumObj: T,
// ): ReturnType<typeof pgEnum<[string, ...string[]]>> {
//   const values = Object.values(enumObj) as [string, ...string[]];
//   if (values.length === 0) {
//     throw new Error('Enum object cannot be empty.');
//   }
//   return pgEnum(name, values);
// }

import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * A very simple test table for integration testing purposes.
 */
export const SIMPLE_TEST_TABLE = pgTable('simple_test_table', {
  id: serial('id').primaryKey(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

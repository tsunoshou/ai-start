import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgColumn } from 'drizzle-orm/pg-core';
import { Result, ok, err } from 'neverthrow';
import { injectable, inject } from 'tsyringe';

import { UserId } from '@/domain/models/user/user-id.vo'; // ID Value Object
import { UserName } from '@/domain/models/user/user-name.vo'; // UserName Value Object
import { User } from '@/domain/models/user/user.entity'; // ドメインエンティティ
import { UserRepositoryInterface } from '@/domain/repositories/user.repository.interface'; // リポジトリインターフェース
import { InfrastructureError } from '@/shared/errors/infrastructure.error'; // エラー型
import * as DateTimeStringModule from '@/shared/value-objects/date-time-string.vo'; // DateTimeString Value Object
import { Email } from '@/shared/value-objects/email.vo'; // Email Value Object
import { PasswordHash } from '@/shared/value-objects/password-hash.vo'; // PasswordHash Value Object

import { users } from '../schema/users.schema'; // DBスキーマ

import { BaseRepository } from './base.repository'; // 継承元クラス

// Drizzle schema selection/insertion types (adjust if schema file exports these)
type UserDbSelect = typeof users.$inferSelect;
type UserDbInsert = typeof users.$inferInsert;

/**
 * @class UserRepository
 * @implements UserRepositoryInterface
 * @extends BaseRepository<UserId, User, UserDbSelect, UserDbInsert, typeof users>
 * @description Implementation of the UserRepositoryInterface using Drizzle ORM.
 * Handles persistence operations for the User entity.
 */
@injectable()
export class UserRepository
  extends BaseRepository<UserId, User, UserDbSelect, UserDbInsert, typeof users>
  implements UserRepositoryInterface
{
  /** Drizzle schema definition for the users table. */
  protected readonly schema = users;
  protected readonly idColumn: PgColumn = users.id;

  /**
   * Constructor injecting the database instance.
   * @param db Drizzle database instance from DI container.
   */
  constructor(@inject('Database') db: NodePgDatabase) {
    super(db); // Pass db instance to the base class constructor
  }

  /**
   * Maps a database record (UserDbSelect) to a User domain entity.
   * Creates Value Objects from primitives and uses User.reconstruct.
   * @param record The database record.
   * @returns The User domain entity.
   * @throws InfrastructureError if Value Object creation or reconstruction fails.
   */
  protected _toDomain(record: UserDbSelect): User {
    // Create Value Objects from database record primitives
    const userIdResult = UserId.create(record.id);
    const emailResult = Email.create(record.email);
    const nameResult = UserName.create(record.name);
    const passwordHashResult = PasswordHash.create(record.passwordHash);
    const createdAtResult = DateTimeStringModule.DateTimeString.create(
      record.createdAt.toISOString()
    );
    const updatedAtResult = DateTimeStringModule.DateTimeString.create(
      record.updatedAt.toISOString()
    );

    // Combine results to handle potential errors in VO creation
    const combinedResult = Result.combine([
      userIdResult,
      emailResult,
      nameResult,
      passwordHashResult,
      createdAtResult,
      updatedAtResult,
    ]);

    if (combinedResult.isErr()) {
      // Log the specific VO creation error
      console.error(
        '[UserRepository] Failed to create Value Objects from DB record:',
        combinedResult.error
      );
      throw new InfrastructureError('Failed to map database record to User: Invalid data format.', {
        cause: combinedResult.error,
      });
    }

    // Extract successful VO instances
    const [userId, email, name, passwordHash, createdAt, updatedAt] = combinedResult.value;

    // Reconstruct the User entity using the created Value Objects
    // User.reconstruct returns User directly, assumes valid VOs
    try {
      const user = User.reconstruct({
        id: userId,
        email: email,
        name: name,
        passwordHash: passwordHash,
        createdAt: createdAt,
        updatedAt: updatedAt,
      });
      return user;
    } catch (reconstructionError) {
      // Catch potential errors during reconstruction (if any)
      console.error('[UserRepository] Error during User.reconstruct:', reconstructionError);
      throw new InfrastructureError('Failed to reconstruct User entity after VO creation.', {
        cause: reconstructionError,
      });
    }
  }

  /**
   * Maps a User domain entity to a database record format (UserDbInsert) for insertion/update.
   * Extracts primitive values from Value Objects.
   * @param entity The User domain entity.
   * @returns The database record format.
   */
  protected _toPersistence(entity: User): UserDbInsert {
    const data: UserDbInsert = {
      id: entity.id.value,
      name: entity.name.value, // Extract string value from UserName VO
      email: entity.email.value,
      passwordHash: entity.passwordHash.value,
      // createdAt and updatedAt are handled by the DB, so not included here
    };
    return data;
  }

  /**
   * Finds a user by their email address.
   * @param email The Email value object.
   * @returns A Result containing the User entity or null if not found, or an InfrastructureError.
   */
  async findByEmail(email: Email): Promise<Result<User | null, InfrastructureError>> {
    try {
      const [result] = await this.db
        .select()
        .from(this.schema)
        .where(eq(this.schema.email, email.value))
        .limit(1);

      if (!result) {
        return ok(null);
      }
      // Wrap _toDomain in a try-catch as it can throw
      try {
        return ok(this._toDomain(result));
      } catch (mappingError) {
        // Log the mapping error specifically
        console.error(`Failed to map record for email ${email.value}:`, mappingError);
        if (mappingError instanceof InfrastructureError) {
          return err(mappingError); // Propagate as InfrastructureError
        }
        return err(
          new InfrastructureError(`Failed to process record found for email ${email.value}`, {
            cause: mappingError,
          })
        );
      }
    } catch (error) {
      const infraError = new InfrastructureError(`Failed to find user by email ${email.value}`, {
        cause: error,
      });
      // Log the infrastructure error
      console.error(infraError.message, infraError.cause);
      // Return InfrastructureError directly as it provides more specific context
      return err(infraError);
    }
  }

  // --- Inherited methods (findById, save, delete) from BaseRepository ---
  // No need to re-implement unless specific overrides are needed for User.

  async findById(id: UserId): Promise<Result<User | null, InfrastructureError>> {
    try {
      const [record] = await this.db
        .select()
        .from(this.schema)
        .where(eq(this.idColumn, id.value))
        .limit(1);

      if (!record) {
        return ok(null);
      }
      try {
        // Use _toDomain for mapping. _toDomain now handles VO creation and reconstruction.
        const user = this._toDomain(record);
        return ok(user);
      } catch (mappingError) {
        console.error(`[UserRepository] Error mapping record for ID ${id.value}:`, mappingError);
        if (mappingError instanceof InfrastructureError) {
          return err(mappingError);
        }
        // Wrap other errors as InfrastructureError
        return err(
          new InfrastructureError(
            `[UserRepository] Failed to process record found for ID ${id.value}`,
            { cause: mappingError }
          )
        );
      }
    } catch (error) {
      console.error(`[UserRepository] Database error finding user by id ${id.value}:`, error);
      return err(
        new InfrastructureError(`[UserRepository] Failed to find user by id ${id.value}`, {
          cause: error,
        })
      );
    }
  }

  async save(entity: User): Promise<Result<void, InfrastructureError>> {
    try {
      const persistenceData = this._toPersistence(entity);
      await this.db.insert(this.schema).values(persistenceData).onConflictDoUpdate({
        target: this.idColumn,
        set: persistenceData,
      });
      return ok(undefined);
    } catch (error) {
      console.error(`[UserRepository] Database error saving user ${entity.id.value}:`, error);
      return err(
        new InfrastructureError(`[UserRepository] Failed to save user ${entity.id.value}`, {
          cause: error,
        })
      );
    }
  }

  async delete(id: UserId): Promise<Result<void, InfrastructureError>> {
    try {
      const result = await this.db
        .delete(this.schema)
        .where(eq(this.idColumn, id.value))
        .returning({ id: this.idColumn });
      // Check if any row was actually deleted
      if (result.length === 0) {
        console.warn(`[UserRepository] Attempted to delete non-existent user with id ${id.value}`);
        // Return specific error if user not found, include type in message
        // return err(new InfrastructureError(`User with id ${id.value} not found for deletion.`, { name: 'NOT_FOUND' }));
        return err(
          new InfrastructureError(`[NOT_FOUND] User with id ${id.value} not found for deletion.`)
        );
      }
      return ok(undefined);
    } catch (error) {
      console.error(`[UserRepository] Database error deleting user ${id.value}:`, error);
      return err(
        new InfrastructureError(`[UserRepository] Failed to delete user ${id.value}`, {
          cause: error,
        })
      );
    }
  }
}

import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgColumn } from 'drizzle-orm/pg-core';
import { Result, ok, err } from 'neverthrow';
import { inject, injectable } from 'tsyringe';

import { UserId } from '@/domain/models/user/user-id.vo';
import { User } from '@/domain/models/user/user.entity';
import { UserRepositoryInterface } from '@/domain/repositories/user.repository.interface';
import { UserMapper } from '@/infrastructure/mappers/user.mapper';
import { ErrorCode } from '@/shared/errors/error-code.enum';
import { InfrastructureError } from '@/shared/errors/infrastructure.error';
import { Email } from '@/shared/value-objects/email.vo';

import { users } from '../schema/users.schema';

import { BaseRepository } from './base.repository';

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
   * Constructor injecting the database instance and user mapper.
   * @param db Drizzle database instance from DI container.
   * @param userMapper User entity mapper for domain-database conversions
   */
  constructor(
    @inject('Database') db: NodePgDatabase,
    @inject(UserMapper) private readonly userMapper: UserMapper
  ) {
    super(db); // Pass db instance to the base class constructor
  }

  /**
   * Maps a database record (UserDbSelect) to a User domain entity.
   * Uses the userMapper to convert between representations.
   * @param record The database record.
   * @returns The User domain entity.
   * @throws InfrastructureError if mapping fails.
   */
  protected _toDomain(record: UserDbSelect): User {
    const userResult = this.userMapper.toDomain(record);

    if (userResult.isErr()) {
      throw userResult.error;
    }

    return userResult.value;
  }

  /**
   * Maps a User domain entity to a database record format (UserDbInsert) for insertion/update.
   * Uses the userMapper to convert between representations.
   * @param entity The User domain entity.
   * @returns The database record format.
   * @throws InfrastructureError if mapping fails.
   */
  protected _toPersistence(entity: User): UserDbInsert {
    const dataResult = this.userMapper.toPersistence(entity);

    if (dataResult.isErr()) {
      throw dataResult.error;
    }

    return dataResult.value;
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

      try {
        return ok(this._toDomain(result));
      } catch (mappingError) {
        if (mappingError instanceof InfrastructureError) {
          return err(mappingError);
        }
        return err(
          new InfrastructureError(`Failed to process record found for email ${email.value}`, {
            cause: mappingError instanceof Error ? mappingError : undefined,
          })
        );
      }
    } catch (error) {
      const infraError = new InfrastructureError(`Failed to find user by email ${email.value}`, {
        cause: error instanceof Error ? error : undefined,
      });
      return err(infraError);
    }
  }

  /**
   * Finds all user entities, optionally applying limit and offset.
   * @param options - Optional object containing limit and offset.
   * @returns A Result containing an array of User entities or an InfrastructureError.
   */
  async findAll(
    options: { limit?: number; offset?: number } = {}
  ): Promise<Result<User[], InfrastructureError>> {
    const { limit, offset } = options;
    try {
      let results: UserDbSelect[]; // Declare results array type

      // Select query based on limit/offset presence
      if (limit !== undefined && offset !== undefined) {
        results = await this.db.select().from(this.schema).limit(limit).offset(offset);
      } else if (limit !== undefined) {
        results = await this.db.select().from(this.schema).limit(limit);
      } else if (offset !== undefined) {
        results = await this.db.select().from(this.schema).offset(offset);
      } else {
        results = await this.db.select().from(this.schema);
      }

      // Map each record to domain entity, handling potential errors
      const usersResult = Result.combine(
        results.map((record) => {
          try {
            return ok(this._toDomain(record));
          } catch (mappingError) {
            return err(
              mappingError instanceof InfrastructureError
                ? mappingError
                : new InfrastructureError('Failed to process record during findAll mapping', {
                    cause: mappingError instanceof Error ? mappingError : undefined,
                  })
            );
          }
        })
      );

      // If any mapping failed, return the combined error
      if (usersResult.isErr()) {
        return err(
          new InfrastructureError('Failed to map one or more user records in findAll', {
            cause: usersResult.error, // Aggregate errors
          })
        );
      }

      // Return the array of successfully mapped User entities
      return ok(usersResult.value);
    } catch (error) {
      const infraError = new InfrastructureError('Failed to find all users', {
        cause: error instanceof Error ? error : undefined,
      });
      return err(infraError);
    }
  }

  /**
   * Saves a user entity, performing email uniqueness check before saving.
   * Overrides the base save method to add this specific behavior.
   * @param entity The User domain entity.
   * @returns A Result containing void or an InfrastructureError.
   */
  async save(entity: User): Promise<Result<void, InfrastructureError>> {
    try {
      // Emailの重複チェック
      const existingUserResult = await this.findByEmail(entity.email);

      if (existingUserResult.isOk() && existingUserResult.value) {
        const existingUser = existingUserResult.value;

        // 同じIDなら更新、異なるIDならエラー
        if (!existingUser.id.equals(entity.id)) {
          return err(
            new InfrastructureError(`メールアドレス ${entity.email.value} は既に使用されています`, {
              metadata: { code: ErrorCode.ConflictError },
            })
          );
        }
      }

      // BaseRepositoryのsaveメソッドを使用
      return super.save(entity);
    } catch (error) {
      return err(
        new InfrastructureError(`Failed to save user data: ${entity.id.value}`, {
          cause: error instanceof Error ? error : undefined,
        })
      );
    }
  }

  // findById, deleteはBaseRepositoryの実装を使用
}

import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgColumn } from 'drizzle-orm/pg-core';
import { Result, ok, err } from 'neverthrow';
import { inject, injectable } from 'tsyringe';

import { UserId } from '@/domain/models/user/user-id.vo';
import { User } from '@/domain/models/user/user.entity';
import { UserRepositoryInterface } from '@/domain/repositories/user.repository.interface';
import { UserMapper } from '@/infrastructure/mappers/user.mapper';
import { AppError } from '@/shared/errors/app.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';
import type { LoggerInterface } from '@/shared/logger/logger.interface';
import { LoggerToken } from '@/shared/logger/logger.token';
import { AppResult } from '@/shared/types/common.types';
import { Email } from '@/shared/value-objects/email.vo';

import { users } from '../schema/users.schema';

import { BaseRepository } from './base.repository';

// Drizzle schema selection/insertion types (adjust if schema file exports these)
// eslint-disable-next-line @typescript-eslint/naming-convention
type UserDbSelect = typeof users.$inferSelect;
// eslint-disable-next-line @typescript-eslint/naming-convention
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
   * Constructor injecting the database instance, logger, and user mapper.
   * @param db Drizzle database instance from DI container.
   * @param logger Logger instance for logging operations.
   * @param userMapper User entity mapper for domain-database conversions
   */
  constructor(
    @inject('Database') db: NodePgDatabase,
    @inject(LoggerToken) logger: LoggerInterface,
    @inject(UserMapper) private readonly userMapper: UserMapper
  ) {
    super(db, logger); // Pass db and logger instances to the base class constructor
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
   * @returns A Result containing the User entity or null if not found, or an AppError.
   */
  async findByEmail(email: Email): Promise<AppResult<User | null>> {
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
        this.logger.error(
          {
            message: `Failed to process record found for email ${email.value}`,
            email: email.value,
            operation: 'findByEmail',
          },
          mappingError
        );

        return err(
          mappingError instanceof AppError
            ? mappingError
            : new AppError(ErrorCode.DatabaseError, 'Mapping failed during findByEmail', {
                cause: mappingError instanceof Error ? mappingError : undefined,
              })
        );
      }
    } catch (error) {
      this.logger.error(
        {
          message: `Failed to find user by email ${email.value}`,
          email: email.value,
          operation: 'findByEmail',
        },
        error
      );

      const appError = new AppError(
        ErrorCode.DatabaseError,
        `Failed to find user by email ${email.value}`,
        { cause: error instanceof Error ? error : undefined }
      );
      return err(appError);
    }
  }

  /**
   * Finds all user entities, optionally applying limit and offset.
   * @param options - Optional object containing limit and offset.
   * @returns A Result containing an array of User entities or an AppError.
   */
  async findAll(options: { limit?: number; offset?: number } = {}): Promise<AppResult<User[]>> {
    const { limit, offset } = options;
    try {
      let results: UserDbSelect[];

      if (limit !== undefined && offset !== undefined) {
        results = await this.db.select().from(this.schema).limit(limit).offset(offset);
      } else if (limit !== undefined) {
        results = await this.db.select().from(this.schema).limit(limit);
      } else if (offset !== undefined) {
        results = await this.db.select().from(this.schema).offset(offset);
      } else {
        results = await this.db.select().from(this.schema);
      }

      const usersResult = Result.combine(
        results.map((record) => {
          try {
            return ok(this._toDomain(record));
          } catch (mappingError) {
            this.logger.error(
              {
                message: 'Failed to process record during findAll mapping',
                operation: 'findAll',
              },
              mappingError
            );

            return err(
              mappingError instanceof AppError
                ? mappingError
                : new AppError(ErrorCode.DatabaseError, 'Mapping failed during findAll', {
                    cause: mappingError instanceof Error ? mappingError : undefined,
                  })
            );
          }
        })
      );

      if (usersResult.isErr()) {
        return err(
          new AppError(ErrorCode.DatabaseError, 'Failed to map one or more user records', {
            cause: usersResult.error,
          })
        );
      }

      return ok(usersResult.value);
    } catch (error) {
      this.logger.error(
        {
          message: 'Failed to find all users',
          operation: 'findAll',
        },
        error
      );

      const appError = new AppError(ErrorCode.DatabaseError, 'Failed to find all users', {
        cause: error instanceof Error ? error : undefined,
      });
      return err(appError);
    }
  }

  // saveメソッドをBaseRepositoryに委任します。
  // データベースのユニーク制約違反エラーは、BaseRepositoryのsaveメソッド内で
  // ErrorCode.ConflictErrorとして処理されます。

  // findById, deleteはBaseRepositoryの実装を使用
}

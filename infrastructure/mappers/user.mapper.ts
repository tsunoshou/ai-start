import { UserDTO } from '@/application/dtos/user.dto';
import { User } from '@/domain/models/user/user.entity';

/**
 * @class UserMapper
 * @description Provides static methods to map between User domain entity and UserDTO.
 */
export class UserMapper {
  /**
   * Maps a User entity to a UserDTO.
   * Extracts primitive values from Value Objects and excludes sensitive data.
   * @param {User} entity - The User domain entity.
   * @returns {UserDTO} The corresponding UserDTO.
   */
  public static toDTO(entity: User): UserDTO {
    return {
      id: entity.id.value,
      name: entity.name.value,
      email: entity.email.value,
      createdAt: entity.createdAt.value, // Assuming DateTimeString VO has .value
      updatedAt: entity.updatedAt.value, // Assuming DateTimeString VO has .value
    };
  }

  /**
   * Maps an array of User entities to an array of UserDTOs.
   * @param {User[]} entities - An array of User domain entities.
   * @returns {UserDTO[]} An array of corresponding UserDTOs.
   */
  public static toDTOs(entities: User[]): UserDTO[] {
    return entities.map(this.toDTO);
  }

  // Note: Mapping from DTO back to Entity is typically handled within
  // the application layer (use cases) or using Value Object create methods,
  // as DTOs usually lack enough information (like password hash) or domain logic
  // to fully reconstruct a valid entity.
  // If needed, a `toDomain` method could be added here, but careful consideration
  // of its purpose and limitations is required.
}

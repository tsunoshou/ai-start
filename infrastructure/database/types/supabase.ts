/**
 * Supabase用の型定義
 *
 * このファイルはSupabaseとの型安全な連携を提供します
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    tables: {
      users: {
        row: {
          id: string;
          email: string;
          displayName: string | null;
          biography: string | null;
          avatarUrl: string | null;
          birthDate: string | null;
          location: string | null;
          preferredLanguage: string | null;
          isVerified: boolean;
          verificationToken: string | null;
          verificationTokenExpiresAt: string | null;
          resetPasswordToken: string | null;
          resetPasswordTokenExpiresAt: string | null;
          lastLoginAt: string | null;
          createdAt: string;
          updatedAt: string;
        };
        insert: {
          id?: string;
          email: string;
          displayName?: string | null;
          biography?: string | null;
          avatarUrl?: string | null;
          birthDate?: string | null;
          location?: string | null;
          preferredLanguage?: string | null;
          isVerified?: boolean;
          verificationToken?: string | null;
          verificationTokenExpiresAt?: string | null;
          resetPasswordToken?: string | null;
          resetPasswordTokenExpiresAt?: string | null;
          lastLoginAt?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        update: {
          id?: string;
          email?: string;
          displayName?: string | null;
          biography?: string | null;
          avatarUrl?: string | null;
          birthDate?: string | null;
          location?: string | null;
          preferredLanguage?: string | null;
          isVerified?: boolean;
          verificationToken?: string | null;
          verificationTokenExpiresAt?: string | null;
          resetPasswordToken?: string | null;
          resetPasswordTokenExpiresAt?: string | null;
          lastLoginAt?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      userRoles: {
        row: {
          userId: string;
          role: string;
          assignedAt: string;
        };
        insert: {
          userId: string;
          role: string;
          assignedAt?: string;
        };
        update: {
          userId?: string;
          role?: string;
          assignedAt?: string;
        };
      };
    };
    views: {
      [key: string]: never;
    };
    functions: {
      [key: string]: never;
    };
    enums: {
      [key: string]: never;
    };
  };
}

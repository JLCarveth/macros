/**
 * User-related types
 */

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}

export interface UserGoals {
  id: string;
  userId: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  goalWeightKg: number | null;
  createdAt: Date;
  updatedAt: Date;
}

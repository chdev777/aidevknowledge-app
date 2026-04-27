export type UserRole = 'DX推進' | '情報支援' | '管理者';

/** サインアップで自己申告できる role（管理者は招待のみ） */
export const SELF_SIGNUP_ROLES: readonly UserRole[] = ['DX推進', '情報支援'] as const;

export const USER_ROLES: readonly UserRole[] = ['DX推進', '情報支援', '管理者'] as const;

/** Public profile — `users/{uid}` */
export interface User {
  id: string;
  name: string;
  handle: string;
  role: UserRole;
  color: string;
  avatarPath?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

/** Private profile — `users/{uid}/private/profile` */
export interface UserPrivateProfile {
  email: string;
  createdAt: Date;
}

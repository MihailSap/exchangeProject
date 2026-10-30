export type UserProfile = {
  id: number;
  name: string;
  avatarUrl?: string | null;
  region?: string | null;
  contacts?: string | null;
  emailConfirmed: boolean;
  createdAt?: string;
};

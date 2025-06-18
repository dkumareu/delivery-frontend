export enum UserRole {
  ADMIN = "admin",
  BACK_OFFICE = "back_office",
  FIELD_SERVICE = "field_service",
  WAREHOUSE = "warehouse",
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

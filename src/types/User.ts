export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  applicationId?: string;
  role: string;
  createdAt?: string;
  createdBy?: string;
}

export type GetUsersResponse = {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

export type CreateUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  applicationId?: string;
  role: string;
}

export type EditUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  applicationId?: string;
  role: string;
}

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

export type GetPaginatedUsers = {
  items: User[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
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

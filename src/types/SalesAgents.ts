export type Distributor = {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export type GetPaginatedDistributors = {
  items: Distributor[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export type CreateDistributorPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: string;
}

export type EditDistributorPayload = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}
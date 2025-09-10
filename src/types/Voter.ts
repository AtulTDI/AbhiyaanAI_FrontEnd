export type Voter = {
  id?: string;
  fullName: string;
  phoneNumber: string;
  createdAt?: string;
  createdBy?: string;
  baseVideoId?: string;
}

export type GetPaginatedVoters = {
  items: Voter[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export type CreateVoterPayload = {
  fullName: string;
  phoneNumber: string;
}

export type EditVoterPayload = {
  fullName?: string;
  phoneNumber?: string;
}

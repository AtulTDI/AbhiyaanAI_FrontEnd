export type Recipient = {
  id?: string;
  fullName: string;
  phoneNumber: string;
  createdAt?: string;
  createdBy?: string;
  baseVideoId?: string;
  sendStatus?: string;
};

export type GetPaginatedRecipients = {
  id?: string;
  items: Recipient[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
};

export type CreateRecipientPayload = {
  fullName: string;
  phoneNumber: string;
};

export type EditRecipientPayload = {
  fullName?: string;
  phoneNumber?: string;
};

// ---- Offline / Local DB types ----
export interface RecipientLocal {
  id: string;
  fullName: string | null;
  phoneNumber: string | null;
  isSynced: number;
}

export interface RecipientQueryParams {
  searchText?: string;
  page?: number;
  pageSize?: number;
}

export interface RecipientQueryResult {
  data: RecipientLocal[];
  total: number;
}

export type Recipient = {
  id?: string;
  fullName: string;
  phoneNumber: string;
  createdAt?: string;
  createdBy?: string;
  baseVideoId?: string;
  sendStatus?: string;
}

export type GetPaginatedRecipients = {
  items: Recipient[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export type CreateRecipientPayload = {
  fullName: string;
  phoneNumber: string;
}

export type EditRecipientPayload = {
  fullName?: string;
  phoneNumber?: string;
}

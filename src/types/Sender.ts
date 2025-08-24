export type Sender = {
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
  emailConfirmed?: boolean;
}

export type GetSendersResponse = {
  users: Sender[];
  total: number;
  page: number;
  pageSize: number;
}

export type CreateSenderPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: string;
}

export type EditSenderPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  applicationId?: string;
  role: string;
}

export type SalesAgent = {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export type CreateSalesAgentPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: string;
}
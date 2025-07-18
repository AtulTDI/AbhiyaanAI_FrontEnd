export type Voter = {
  id?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  createdBy?: string;
}

export type CreateVoterPayload = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export type EditVoterPayload = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

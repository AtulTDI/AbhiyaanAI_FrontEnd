export type Voter = {
  id: string;
  epicId: string;
  fullName: string;
  fatherHusbandName: string;
  age: number;
  gender: string;
  mobileNumber: string;
  caste: string;
  address: string;
  listArea: number;
  rank: number;
  houseNumber: string;
  prabagNumber: number;
  familyMembers: any[];
  votingBoothAddress: string;
  votingBoothNumber: number;
  votingRoomNumber: number;
  isActive?: boolean; 
  isVerified: boolean;
};

export type GetPaginatedVoters = {
  data: Voter[];
  page: number;
  pageSize: number;
  totalRecords: number;
}

export type GetFamilyMembers = {
  count: number;
  familyId: string;
  headVoterId: string;
  members: Voter[];
}
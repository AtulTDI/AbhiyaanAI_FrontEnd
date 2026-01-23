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
  votingRoomNumber: number;
  votingDateAndTime: string;
  isStarVoter?: boolean;
  isVerified: boolean;
};

export type GetPaginatedVoters = {
  data: Voter[];
  page: number;
  pageSize: number;
  totalRecords: number;
}

export type GetFamilyMembers = {
  data: Voter[];
  count: number;
  familyId: string;
  headVoterId: string;
  members: Voter[];
  totalRecords: number;
}

export interface VoterSurveyRequest {
  id?: string;
  voterId?: string;
  supportType?: number;
  supportStrength?: number;
  casteId?: string; 
  otherCaste?: string,
  newAddress: string,
  society: string,
  flatNumber: string,
  email: string,
  secondaryMobileNumber: string,
  dateOfBirth: string,
  needsFollowUp: boolean,
  specialVisitDate: string,
  specialVisitRemarks: string,
  voterDied: boolean,
  remarks: string,
  isVoted: boolean,
  demands?: VoterDemandItem[];
}

export interface VoterSurveyResponse {
  id: string;
  voterId: string;
  casteId?: string; 
  otherCaste?: string;
  supportType: number;
  supportStrength?: number;
  remarks?: string;
  surveyedAt: string;
  surveyedByUserId: string;
}

export interface SupportTypeColor {
  value: number;
  key: string;
  label: string;
  colorCode: string;
}

export interface Caste {
  id: string;
  nameEn: string;
  nameMr: string;
}

export type DemandCategory = {
  id: string;
  nameMr: string;
  nameEn: string;
};

export type Demand = {
  id: string;
  demandMr: string;
  demandEn: string;
};

export type VoterDemandItem = {
  id?: string;
  demand?: string;
  demandMr?: string;
  category?: string;
  categoryId: string;
  description: string;
  demandId: string;
  isResolved?: boolean;
};

export type VoterDemandUpdatePayload = {
  voterDemandId: string;
  voterId: string;
  demandCategoryId: string;
  demandId: string;
  description: string;
};

export type ResolveVoterDemand = {
  voterDemandId: string;
  resolutionNote?: string;
};

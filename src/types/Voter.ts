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

export type ColorCodeStatItem = {
  count: number;
  color: string;
};

export type ColorCodeStats = {
  ours: ColorCodeStatItem;
  neutral: ColorCodeStatItem;
  opponent: ColorCodeStatItem;
  unknow: ColorCodeStatItem;
  outOfstation: ColorCodeStatItem;
  needSpecialVisit: ColorCodeStatItem;
  beneficiary: ColorCodeStatItem;
};

export type SurnameStat = {
  surname: string;
  count: number;
};

export type PaginatedSurnameStats = {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  data: SurnameStat[];
};

export type AgeGroupStats = {
  age18To25: number;
  age26To35: number;
  age36To45: number;
  age46To60: number;
  age60Plus: number;
};

export type GenderGroupStats = {
  male: number;
  female: number;
  other: number;
}

export type CasteStats = {
  casteId: string,
  casteNameEn: string,
  casteNameMr: string,
  count: number
}

export type BoothStats = {
  listNumber: string,
  address: string,
  count: number
}

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

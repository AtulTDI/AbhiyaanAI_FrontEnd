export type Voter = {
  id: string;
  rank?: number | null;
  epicId?: string | null;
  fullName: string;
  fatherHusbandName?: string | null;
  age: number | string | null;
  gender: string;
  mobileNumber?: string | null;
  caste?: string | null;
  address?: string | null;
  listArea: number | string;
  houseNumber?: string | null;
  prabagNumber: number;
  assemblyConstituencyDetails?: string | null;
  familyMembers?: Voter[];
  votingBoothAddress?: string | null;
  votingRoomNumber?: number | string | null;
  votingDateAndTime?: string | null;
  isStarVoter?: boolean;
  isVerified?: boolean;
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
};

export type CasteStats = {
  casteId: string;
  casteNameEn: string;
  casteNameMr: string;
  count: number;
};

export type BoothStats = {
  listNumber: string;
  address: string;
  count: number;
};

export type GetPaginatedVoters = {
  data: Voter[];
  page: number;
  pageSize: number;
  totalRecords: number;
};

export type GetFamilyMembers = {
  data: Voter[];
  count: number;
  familyId: string;
  headVoterId: string;
  members: Voter[];
  totalRecords: number;
};

export interface VoterSurveyRequest {
  id?: string;
  voterId?: string;
  supportType: number;
  supportStrength: number;
  casteId?: string | null;
  otherCaste?: string | null;
  newAddress?: string | null;
  society?: string | null;
  flatNumber?: string | null;
  email?: string | null;
  secondaryMobileNumber?: string | null;
  dateOfBirth?: string | null;
  needsFollowUp: boolean;
  specialVisitDate?: string | null;
  specialVisitRemarks?: string | null;
  specialVisitDone?: boolean;
  specialVisitUserId?: string | null;
  voterDied: boolean;
  remarks?: string | null;
  isVoted: boolean;
  surveyedByUserId?: string | null;
  surveyedAt?: string | null;
  demands?: VoterDemandItem[];
}
export interface Survey {
  id?: string | null;
  voterId?: string;
  supportType?: number | null;
  supportStrength?: number | null;
  dateOfBirth?: string | null;
  remarks?: string | null;
  email?: string | null;
  secondaryMobileNumber?: string | null;
  newAddress?: string | null;
  society?: string | null;
  flatNumber?: string | null;
  casteId?: string | null;
  otherCaste?: string | null;
  needsFollowUp?: boolean | number;
  voterDied?: boolean | number;
  isVoted?: boolean | number;
  specialVisitDone?: boolean | number;
  specialVisitDate?: string | null;
  specialVisitRemarks?: string | null;
  specialVisitUserId?: string | null;
  surveyedByUserId?: string | null;
  surveyedAt?: string | null;
  isSynced?: number;
  updatedAt?: string | null;
  demands?: VoterDemandItem[];
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
  categoryId?: string;
  description?: string;
  demandId?: string;
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

// ---- Offline / Local DB types ----
export interface VoterQueryParams {
  searchText?: string;
  page?: number;
  pageSize?: number;
}

export interface VoterQueryResult {
  data: Voter[];
  total: number;
}

export interface VoterUpdatePayload {
  fullName?: string;
  fatherHusbandName?: string;
  age?: number;
  gender?: string;
  address?: string;
  mobileNumber?: string;
  isStarVoter?: number;
  isVerified?: number;
}

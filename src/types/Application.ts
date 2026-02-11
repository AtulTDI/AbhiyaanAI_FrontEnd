export type Application = {
  id?: string;
  createdAt?: string;
  name: string;
  remainingVideoCount?: string;
  totalVideoCount: number;
  salesAgent: string;
  salesAgentId?: string;
  videoGenerationRate?: string;
  premiumVoice?: boolean;
  whapiBaseUrl?: string;
  whapiVendorUid?: string;
  whapiBearerToken?: string; 
  isElection?: boolean;
  showVideoCampaign?: boolean;
  showImageCampaign?: boolean;
  isActive: boolean;
}

export type GetPaginatedApplications = {
  items: Application[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  premiumVoice: boolean;
  isElection?: boolean;
}

export type CreateApplicationPayload = {
  appName: string;
  totalVideoCount: number;
  salesAgent: string;
  videoGenerationRate?: string;
  premiumVoice?: boolean;
  isElection?: boolean;
  whapiBaseUrl?: string;
  whapiVendorUid?: string;
  whapiBearerToken?: string; 
}

export type EditApplicationPayload = {
  name: string;
  totalVideoCount: number;
  salesAgent: string;
  videoGenerationRate?: string;
  premiumVoice?: boolean;
  isElection?: boolean;
  isActive: boolean;
  whapiBaseUrl?: string;
  whapiVendorUid?: string;
  whapiBearerToken?: string; 
}
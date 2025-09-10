export type Application = {
  id?: string;
  createdAt?: string;
  name: string;
  remainingVideoCount?: string;
  totalVideoCount: number;
  salesAgent: string;
  salesAgentId?: string;
  videoGenerationRate?: string;
  isActive: boolean;
}

export type GetPaginatedApplications = {
  items: Application[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export type CreateApplicationPayload = {
  appName: string;
  totalVideoCount: number;
  salesAgent: string;
  videoGenerationRate?: string;
}

export type EditApplicationPayload = {
  name: string;
  totalVideoCount: number;
  salesAgent: string;
  videoGenerationRate?: string;
  isActive: boolean;
}
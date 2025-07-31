export type Application = {
  id?: string;
  createdAt?: string;
  name: string;
  totalVideoCount: number;
  salesAgent: string;
  videoGenerationRate?: string;
  isActive: boolean;
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
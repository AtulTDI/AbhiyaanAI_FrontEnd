export type Application = {
  id?: string;
  createdAt?: string;
  name: string;
  videoCount: number;
  isActive: boolean;
}

export type CreateApplicationPayload = {
  appName: string;
  videoCount: number;
}

export type EditApplicationPayload = {
  name: string;
  videoCount: number;
  isActive: boolean;
}
import { UploadableFile } from './Upload';

export type Video = {
  id: string;
  name: string;
  campaign: string;
  campaignName?: string;
  message?: string;
  cloningSpeed?: number;
  voiceCloneId?: string;
  status: string;
  file: UploadableFile;
  createdAt?: string;
  isShared: boolean;
  s3Url?: string;
};

export type GetPaginatedVideos = {
  id?: string;
  videos: { items: Video[] };
  items: Video[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
};

export type GenerateVideo = {
  baseVideoId: string;
  recipientIds: string[];
};

export type GetVideoLink = {
  recipientId: string;
  baseVideoID: string;
  platformType: string;
  sharableLink?: string;
};

export type SampleVideo = {
  file: UploadableFile;
  recipientName: string;
  cloningSpeed?: number;
  voiceCloneId?: string;
};

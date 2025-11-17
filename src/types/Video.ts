export type Video = {
  id: string;
  name: string;
  campaign: string;
  campaignName?: string;
  message?: string;
  cloningSpeed?: number;
  status: string;
  file: any;
}

export type GetPaginatedVideos = {
  videos: { items: Video[] };
  items: Video[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export type GenerateVideo = {
  baseVideoId: string;
  recipientIds: string[];
}

export type GetVideoLink = {
  recipientId: string;
  baseVideoID: string;
  platformType: string;
  sharableLink?: string;
}

export type SampleVideo = {
  file: any;
  recipientName: string;
  cloningSpeed?: number; 
}
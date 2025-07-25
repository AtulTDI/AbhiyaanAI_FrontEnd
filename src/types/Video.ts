export type Video = {
  id: string;
  name: string;
  campaign: string;
  status: string;
  file: any;
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
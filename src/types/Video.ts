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
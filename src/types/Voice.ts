export type Voice = {
  voiceId: string;
  applicationName: string;
  campaignName: string;
  lastCampaignRunDate: string;
}

export type GetPaginatedVoices = {
  items: Voice[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  premiumVoice: boolean;
}

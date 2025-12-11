export type Image = {
  id: string;
  campaignName: string;
  message: string;
  images?: string[];
  isShared?: boolean;
  createdAt: string;
}

export type GetPaginatedImages = {
  items: Image[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}
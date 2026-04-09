export interface SyncQueueItem {
  id: string;
  type: string;
  payload: string;
  createdAt: string;
}

export interface SyncQueuePayload {
  recordId: string;
  [key: string]: unknown;
}

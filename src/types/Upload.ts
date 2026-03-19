export type NativeFormDataFile = {
  uri: string;
  name: string;
  type: string;
};

export type UploadableFile = {
  uri?: string;
  name?: string;
  mimeType?: string;
  type?: string;
  file?: File;
  locked?: boolean;
};

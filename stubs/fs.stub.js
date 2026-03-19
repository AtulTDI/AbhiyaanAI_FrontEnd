const RNFS = {
  // Paths
  MainBundlePath: '',
  CachesDirectoryPath: '',
  ExternalCachesDirectoryPath: '',
  DocumentDirectoryPath: '',
  DownloadDirectoryPath: '',
  ExternalDirectoryPath: '',
  ExternalStorageDirectoryPath: '',
  TemporaryDirectoryPath: '',
  LibraryDirectoryPath: '',
  PicturesDirectoryPath: '',

  // File operations
  readFile: async () => '',
  readFileAssets: async () => '',
  readFileRes: async () => '',
  writeFile: async () => {},
  appendFile: async () => {},
  moveFile: async () => {},
  copyFile: async () => {},
  copyFileAssets: async () => {},
  copyFileRes: async () => {},
  unlink: async () => {},
  exists: async () => false,
  existsAssets: async () => false,
  existsRes: async () => false,

  // Directory operations
  readDir: async () => [],
  readDirAssets: async () => [],
  readDirRes: async () => [],
  mkdir: async () => {},
  readdir: async () => [],
  stat: async () => ({}),
  hash: async () => '',
  touch: async () => '',

  // Download / upload
  downloadFile: () => ({
    jobId: -1,
    promise: Promise.resolve({ statusCode: 0, bytesWritten: 0 })
  }),
  uploadFiles: () => ({ jobId: -1, promise: Promise.resolve({ statusCode: 0 }) }),
  stopDownload: () => {},
  stopUpload: () => {},
  getFSInfo: async () => ({ freeSpace: 0, totalSpace: 0 }),

  // Encoding constants
  EncodingUTF8: 'utf8',
  EncodingASCII: 'ascii',
  EncodingBase64: 'base64'
};

export default RNFS;

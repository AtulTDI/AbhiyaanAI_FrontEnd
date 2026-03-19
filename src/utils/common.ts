import { format } from 'date-fns';

export const base64ToBlob = (base64Data: string, contentType: string): Blob => {
  const byteCharacters = atob(base64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
};

type ApiErrorData =
  | string
  | {
      title?: string;
      message?: string;
    }
  | Array<{
      description?: string;
    }>;

type ApiErrorShape = {
  response?: {
    status?: number;
    data?: ApiErrorData;
  };
};

export const extractErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong'
) => {
  const normalizedError = error as ApiErrorShape;
  const status = normalizedError.response?.status;

  if (status === 500) {
    return fallback;
  }

  const data = normalizedError.response?.data;

  if (typeof data === 'string') {
    return data;
  }

  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    if (first && typeof first === 'object' && 'description' in first) {
      return first.description || fallback;
    }
  }

  if (data && !Array.isArray(data) && typeof data === 'object') {
    return data.title || data.message || fallback;
  }

  return fallback;
};

export const getFileNameWithoutExtension = (fullName: string): string => {
  return fullName.replace(/\.[^/.]+$/, '');
};

export const sortByDateDesc = <T extends Record<string, unknown>>(
  data: T[],
  key: keyof T
) => {
  return [...data].sort(
    (a, b) => new Date(b[key] as string).getTime() - new Date(a[key] as string).getTime()
  );
};

export const toUtcIsoDate = (date: Date) => {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  ).toISOString();
};

export const formatForDisplay = (iso?: string) => {
  if (!iso) return '';
  return format(new Date(iso), 'dd-MM-yyyy');
};

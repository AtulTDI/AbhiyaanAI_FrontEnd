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

export const extractErrorMessage = (error: any, fallback = "Something went wrong") => {
  const status = error?.response?.status;

  if (status === 500) {
    return fallback;
  }

  if (typeof error?.response?.data === "string") {
    return error.response.data;
  }

  return (
    error?.response?.data?.title ||
    error?.response?.data?.message ||
    fallback
  );
};

export const getFileNameWithoutExtension = (fullName: string): string => {
  return fullName.replace(/\.[^/.]+$/, "");
};
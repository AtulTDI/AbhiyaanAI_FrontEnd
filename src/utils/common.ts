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

export const extractErrorMessage = (
  error: any,
  fallback = "Something went wrong"
) => {
  const status = error?.response?.status;

  if (status === 500) {
    return fallback;
  }

  const data = error?.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    if (first && typeof first === "object" && "description" in first) {
      return first.description || fallback;
    }
  }

  return (
    data?.title ||
    data?.message ||
    fallback
  );
};


export const getFileNameWithoutExtension = (fullName: string): string => {
  return fullName.replace(/\.[^/.]+$/, "");
};


export const sortByDateDesc = (data, key) => {
  return [...data].sort(
    (a, b) => new Date(b[key]).getTime() - new Date(a[key]).getTime()
  );
}

export const getGender = (genderEnum: number) => {
  if (genderEnum === 1) {
    return "Male";
  }

  return "Female"
}
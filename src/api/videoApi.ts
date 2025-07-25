import { Platform } from "react-native";
import axios from "./axiosInstance";
import { GenerateVideo, GetVideoLink, Video } from "../types/Video";
import { getItem } from "../utils/storage";
import { getVideoThumbnail } from "../utils/getVideoThumbnail";

/**
 * Get paginated videos with optional search
 */
export const getVideos = async () => {
  const role = await getItem("role");
  const response = await axios.get<Video>(`/BaseVideos/${role === "User" ? "getsharedvideos" : "getmyvideos"}`);

  return response;
}

/**
 * Get video by ID
 */
export const shareVideoById = (id: string, payload: boolean) =>
  axios.put<Video>(`/BaseVideos/${id}/shareforcampaign`, payload);

/**
 * Upload video
 */

export const base64ToBlob = async (base64: string, contentType: string): Promise<Blob> => {
  const response = await fetch(`data:${contentType};base64,${base64}`);
  return await response.blob();
};


export const uploadVideo = async (payload: Video) => {
  const formData = new FormData();

  // --- Upload File ---
  const fileName = payload.file.name || "video.mp4";
  const mimeType = payload.file.mimeType || "video/mp4";

  if (payload.file.uri?.startsWith("file://")) {
    // Mobile (file path)
    formData.append("file", {
      uri: payload.file.uri,
      name: fileName,
      type: mimeType,
    } as any);
  } else if (payload.file.uri?.startsWith("data:")) {
    // Base64 data
    const base64 = payload.file.uri.split(",")[1];
    const blob = await base64ToBlob(base64, mimeType);

    if (Platform.OS === "web") {
      // Web File from Blob
      const file = new File([blob], fileName, { type: mimeType });
      formData.append("file", file);
    } else {
      // Native - save to temp file
      const fs = require("expo-file-system");
      const tempPath = `${fs.cacheDirectory}${fileName}`;
      await fs.writeAsStringAsync(tempPath, base64, {
        encoding: fs.EncodingType.Base64,
      });

      formData.append("file", {
        uri: tempPath,
        name: fileName,
        type: mimeType,
      } as any);
    }
  } else if (payload.file.file instanceof File) {
    formData.append("file", payload.file.file);
  } else {
    throw new Error("Unsupported file format");
  }

  // --- Generate and Attach Thumbnail ---
  const thumbnail = await getVideoThumbnail(payload.file.uri, fileName);
  if (thumbnail) {
    if (Platform.OS === "web" && thumbnail.file) {
      formData.append("thumbnail", thumbnail.file);
    } else {
      formData.append("thumbnail", {
        uri: thumbnail.uri,
        name: thumbnail.name,
        type: thumbnail.mimeType,
      } as any);
    }
  }

  // --- Other Form Fields ---
  formData.append("campaignName", payload.campaign);

  // --- Upload API ---
  const response = await axios.post("/BaseVideos/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    transformRequest: (data) => data,
  });

  return response.data;
};
/**
 * Edit video by ID
 */
export const editVideoById = (id: string, payload: Video) =>
  axios.put<Video>(`/BaseVideos/${id}`, payload);

/**
 * Delete video by ID
 */
export const deleteVideoById = (id: string) =>
  axios.delete(`/BaseVideos/${id}/deletevideo`);

/**
 * Generate customised video
 */
export const generateCustomisedVideo = (payload: GenerateVideo) =>
  axios.post<GenerateVideo>(`/CustomizedAIVideo`, payload);


/**
 * Get generated customised video
 */
export const getCustomisedVideos = () =>
  axios.get<GenerateVideo>(`/GetUserCustomizedVideos`);


/**
 * Get customised video link
 */
export const getCustomisedVideoLink = (payload: GetVideoLink) =>
  axios.post<GetVideoLink>('/VideoShare/sendvideo', payload);
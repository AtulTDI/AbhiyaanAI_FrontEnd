import axios from "./axiosInstance";
import { GenerateVideo, GetVideoLink, Video } from "../types/Video";
import { base64ToBlob } from "../utils/common";
import { getItem } from "../utils/storage";

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

export const uploadVideo = async (payload: Video) => {
  const formData = new FormData();

  if (payload.file.uri && payload.file.uri.startsWith("file://")) {
    formData.append("file", {
      uri: payload.file.uri,
      name: payload.file.name,
      type: payload.file.mimeType,
    } as any);
  } else if (payload.file.file instanceof File) {
    formData.append("file", payload.file.file);
  } else if (payload.file.uri?.startsWith("data:")) {
    const base64 = payload.file.uri.split(",")[1];
    const blob = base64ToBlob(base64, payload.file.mimeType);
    formData.append("file", blob, payload.file.name);
  } else {
    throw new Error("Unsupported file format");
  }
  formData.append("campaignName", payload.campaign);

  const response = await axios.post("/BaseVideos/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
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
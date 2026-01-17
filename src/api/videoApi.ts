import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import axios from "./axiosInstance";
import { GenerateVideo, GetPaginatedVideos, GetVideoLink, SampleVideo, Video } from "../types/Video";
import { getVideoThumbnail } from "../utils/getVideoThumbnail";
import { getAuthData } from "../utils/storage";

/**
 * Get paginated videos with optional search
 */
export const getVideos = async (pageNumber, pageSize) => {
  const { role } = await getAuthData();

  const response = await axios.get<GetPaginatedVideos>(`/BaseVideos/${role === "User" || role === "Sender" ? `getsharedvideos?page=${pageNumber + 1}&pageSize=${pageSize}` : `getmyvideos?page=${pageNumber + 1}&pageSize=${pageSize}`}`, { useApiPrefix: true });

  return response;
}

/**
 * Get in progress video count
 */
export const getInProgressVideoCount = () =>
  axios.get(`/CustomizedAIVideo/get-inprogress-video-count`, { useApiPrefix: true });


/**
 * Share video by ID
 */
export const shareVideoById = (id: string, payload: boolean) =>
  axios.put<Video>(`/BaseVideos/${id}/shareforcampaign`, payload, { useApiPrefix: true });

/**
 * Upload video
 */

export const base64ToBlob = async (base64: string, contentType: string): Promise<Blob> => {
  const response = await fetch(`data:${contentType};base64,${base64}`);
  return await response.blob();
};


export const uploadVideo = async (payload: Video) => {
  const formData = new FormData();
  const fileName = payload.file.name || "video.mp4";
  const mimeType = payload.file.mimeType || "video/mp4";
  let fileUri = payload.file.uri;

  // --- Check file exists on Mobile ---
  if (Platform.OS !== "web" && fileUri.startsWith("file://")) {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error("Video file does not exist at path: " + fileUri);
    }
  }

  // --- Append file to FormData ---
  if (Platform.OS === "web" && payload.file.file instanceof File) {
    formData.append("file", payload.file.file);
  } else {
    formData.append("file", {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);
  }

  // --- Generate Thumbnail (optional) ---
  try {
    const thumbnail = await getVideoThumbnail(fileUri, fileName);
    if (thumbnail) {
      if (Platform.OS === "web" && thumbnail.file) {
        formData.append("thumbnail", thumbnail.file);
      } else if (thumbnail.uri) {
        formData.append("thumbnail", {
          uri: thumbnail.uri,
          name: thumbnail.name,
          type: thumbnail.mimeType,
        } as any);
      }
    }
  } catch (err) {
    console.warn("Thumbnail generation failed:", err);
  }

  // --- Other Form Fields ---
  formData.append("campaignName", payload.campaign);
  formData.append("message", payload.message);
  formData.append("cloningSpeed", payload.cloningSpeed);
  formData.append("voiceCloneId", payload.voiceCloneId);
  // --- Upload API ---
  const response = await axios.post("/BaseVideos/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    useApiPrefix: true,
    transformRequest: (data) => data,
  });

  return response.data;
};

/**
 * Edit video by ID
 */
export const editVideoById = (id: string, payload: Video) =>
  axios.put<Video>(`/BaseVideos/${id}`, payload, { useApiPrefix: true });

/**
 * Delete video by ID
 */
export const deleteVideoById = (id: string) =>
  axios.delete(`/BaseVideos/${id}/deletevideo`, { useApiPrefix: true });

/**
 * Generate customised video
 */
export const generateCustomisedVideo = (payload: GenerateVideo) =>
  axios.post<GenerateVideo>(`/CustomizedAIVideo/createcustomized-aivideo`, payload, { useApiPrefix: true });

/**
 * Generate customised video
 */
export const generateSampleVideo = async (payload: SampleVideo) => {
  const formData = new FormData();

  // ---------- FILE NAME & MIME ----------
  const fileName =
    payload.file.name
      ?.replace(/\s+/g, "_")
      ?.replace(/[^a-zA-Z0-9._-]/g, "") || "video.mp4";

  const mimeType = payload.file.mimeType || "video/mp4";

  // ---------- APPEND FILE (WEB FIRST) ----------
  if (payload.file.file instanceof File) {
    formData.append("file", payload.file.file);
  }

  // ---------- DATA URI ----------
  else if (payload.file.uri?.startsWith("data:")) {
    const blob = await (await fetch(payload.file.uri)).blob();
    const file = new File([blob], fileName, { type: mimeType });
    formData.append("file", file);
  }

  // ---------- CONTENT/PH URI (ANDROID / IOS PICKER) ----------
  else if (
    payload.file.uri?.startsWith("content://") ||
    payload.file.uri?.startsWith("ph://")
  ) {
    const response = await fetch(payload.file.uri);
    const blob = await response.blob();

    const tempPath = `${FileSystem.cacheDirectory}${fileName}`;

    const reader = new FileReader();
    const base64: string = await new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const base64Data = base64.split(",")[1];

    await FileSystem.writeAsStringAsync(tempPath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    formData.append("file", {
      uri: tempPath,
      name: fileName,
      type: mimeType,
    } as any);
  }

  // ---------- FILE URI (MOBILE) ----------
  else if (payload.file.uri?.startsWith("file://")) {
    if (Platform.OS === "web") {
      const response = await fetch(payload.file.uri);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: mimeType });
      formData.append("file", file);
    } else {
      formData.append("file", {
        uri: payload.file.uri,
        name: fileName,
        type: mimeType,
      } as any);
    }
  }

  // ---------- FALLBACK ----------
  else if (payload.file.uri) {
    const response = await fetch(payload.file.uri);
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: mimeType });
    formData.append("file", file);
  } else {
    throw new Error("Unsupported file format");
  }

  formData.append("RecipientName", String(payload.recipientName));
  formData.append("CloningSpeed", String(payload.cloningSpeed));

  if ((payload as any).voiceCloneId) {
    formData.append(
      "VoiceCloneId",
      String((payload as any).voiceCloneId)
    );
  }

  // ---------- AXIOS CALL (MOBILE-SAFE) ----------
  const response = await axios.post(
    `/CustomizedAIVideo/createsamplevideo`,
    formData,
    {
      useApiPrefix: true,
      timeout: 0,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,

      headers: {
        Accept: "application/json",
        "Content-Type": 'multipart/form-data',
      },
    }
  );

  return response.data;
};


/**
 * Get generated customised video
 */
export const getCustomisedVideos = () =>
  axios.get<GenerateVideo>(`/CustomizedAIVideo/getusercustomized-videos`, { useApiPrefix: true });


/**
 * Get customised video link
 */
export const getCustomisedVideoLink = (payload: GetVideoLink) =>
  axios.post<GetVideoLink>('/VideoShare/sendvideo', payload, { useApiPrefix: true });
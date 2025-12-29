import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { CreateRecipientPayload, EditRecipientPayload, GetPaginatedRecipients, Recipient } from "../types/Recipient";
import { base64ToBlob } from "../utils/common";
import axios from "./axiosInstance";

/**
 * Get paginated recipients with optional search
 */
export const getRecipients = (pageNumber, pageSize, searchText) =>
  axios.get<GetPaginatedRecipients>(`/Recipients/getrecipients?searchText=${searchText}&page=${pageNumber + 1}&pageSize=${pageSize}`, { useApiPrefix: true });


/**
 * Get paginated recipients without processing videos
 */
export const getRecipientsForProcessing = (id: string, pageNumber, pageSize, searchText) =>
  axios.get<GetPaginatedRecipients>(`/Recipients/getrecipientsforprocessing`, {
    params: { baseVideoID: id, searchText: searchText ?? "", page: pageNumber + 1, pageSize: pageSize },
    useApiPrefix: true,
  });

/**
 * Get recipients with in progress vidoes using base video id
 */
export const getRecipientsWithInProgressVidoes = () =>
  axios.get('/Recipients/getinProgressaivideos', {
    useApiPrefix: true,
  });


/**
* Get paginated recipients with completed vidoes using base video id
*/
export const getRecipientsWithCompletedVideoId = (id: string, pageNumber, pageSize, searchText) =>
  axios.get('/Recipients/getcompletedaivideoswithbaseid',
    {
      params: { baseVideoID: id, searchText: searchText, page: pageNumber + 1, pageSize: pageSize },
      useApiPrefix: true
    });

/**
 * Add new recipient
 */
export const createRecipient = (payload: CreateRecipientPayload) =>
  axios.post<Recipient>("/Recipients", payload, { useApiPrefix: true });


/**
 * Add multiple recipients
 */
export const uploadRecipients = async (file: any) => {
  const formData = new FormData();
  const fileName = file.name || "upload.xlsx";
  const mimeType =
    file.mimeType ||
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  if (file?.uri?.startsWith("data:")) {
    // Base64 case
    const base64 = file.uri.split(",")[1];
    const blob = await base64ToBlob(base64, mimeType);

    if (Platform.OS === "web") {
      const webFile = new File([blob], fileName, { type: mimeType });
      formData.append("file", webFile);
    } else {
      const tempPath = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(tempPath, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      formData.append("file", {
        uri: tempPath,
        name: fileName,
        type: mimeType,
      } as any);
    }
  } else if (file instanceof File) {
    // Web File
    formData.append("file", file);
  } else if (file?.uri?.startsWith("file://")) {
    // RN Picker or native uri
    formData.append("file", {
      uri: file.uri,
      name: fileName,
      type: mimeType,
    } as any);
  } else {
    throw new Error("Unsupported file format");
  }

  const response = await axios.post("/Recipients/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    useApiPrefix: true,
    transformRequest: (data) => data, // ensure FormData isn't serialized
  });

  return response.data;
};

/**
 * Get recipients by Campaign for images
 */
export const getRecipientsByCampaignId = (id: string, pageNumber, pageSize, searchText) =>
  axios.get('/Recipients/recipients-with-image-campaign',
    {
      params: { campaignId: id, searchText: searchText, page: pageNumber + 1, pageSize: pageSize },
      useApiPrefix: true
    });

/**
 * Edit recipient by ID
 */
export const editRecipientById = (id: string, payload: EditRecipientPayload) =>
  axios.put<Recipient>(`/Recipients/${id}`, payload, { useApiPrefix: true });

/**
 * Delete recipient by ID
 */
export const deleteRecipientById = (id: string) =>
  axios.delete(`/Recipients/${id}`, { useApiPrefix: true });

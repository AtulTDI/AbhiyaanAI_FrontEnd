import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import axios from "./axiosInstance";
import { CreateVoterPayload, EditVoterPayload, GetPaginatedVoters, Voter } from "../types/Voter";
import { base64ToBlob } from "../utils/common";

/**
 * Get paginated voters with optional search
 */
export const getVoters = (pageNumber, pageSize) =>
  axios.get<GetPaginatedVoters>(`/Recipients/getrecipients?page=${pageNumber + 1}&pageSize=${pageSize}`, { useApiPrefix: true });


/**
 * Get paginated voters without processing videos
 */
export const getVotersForProcessing = (id: string, pageNumber, pageSize) =>
  axios.get<GetPaginatedVoters>(`/Recipients/getrecipientsforprocessing`, {
    params: { baseVideoID: id, page: pageNumber + 1, pageSize: pageSize },
    useApiPrefix: true,
  });

/**
 * Get paginated voters with in progress vidoes using base video id
 */
export const getVotersWithInProgressVidoes = (pageNumber, pageSize) =>
  axios.get(`/Recipients/getinProgressaivideos?page=${pageNumber + 1}&pageSize=${pageSize}`, {
    useApiPrefix: true,
  });


/**
* Get paginated voters with completed vidoes using base video id
*/
export const getVotersWithCompletedVideoId = (id: string, pageNumber, pageSize) =>
  axios.get('/Recipients/getcompletedaivideoswithbaseid',
    {
      params: { baseVideoID: id, page: pageNumber + 1, pageSize: pageSize },
      useApiPrefix: true
    });


/**
 * Get user by ID
 */
export const getVoterById = (id: string) =>
  axios.get<Voter>(`/Recipients/${id}`, { useApiPrefix: true });

/**
 * Add new user
 */
export const createVoter = (payload: CreateVoterPayload) =>
  axios.post<Voter>("/Recipients", payload, { useApiPrefix: true });


/**
 * Add multiple users
 */
export const uploadVoters = async (file: any) => {
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
 * Edit user by ID
 */
export const editVoterById = (id: string, payload: EditVoterPayload) =>
  axios.put<Voter>(`/Recipients/${id}`, payload, { useApiPrefix: true });

/**
 * Delete user by ID
 */
export const deleteVoterById = (id: string) =>
  axios.delete(`/Recipients/${id}`, { useApiPrefix: true });

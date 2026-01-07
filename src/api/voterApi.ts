import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import axios from "./axiosInstance";
import { GetFamilyMembers, GetPaginatedVoters, Voter } from "../types/Voter";
import { base64ToBlob } from "../utils/common";

/**
 * Get paginated voters with optional search
 */
export const getVoters = (pageNumber, pageSize, searchText) =>
  axios.get<GetPaginatedVoters>(`/Voters/getvoters?page=${pageNumber}&pageSize=${pageSize}&searchText=${searchText}`, { useApiPrefix: true });

/**
 * Get voter by id
 */
export const getVoterById = (id) =>
  axios.get<Voter>(`/Voters/get-voters-by-id/${id}`, { useApiPrefix: true });


/**
 * Add multiple voters
 */
export const uploadVoters = async (file: any, applicationId: string) => {
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

  const response = await axios.post(`/Voters/import?applicationId=${applicationId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    useApiPrefix: true,
    transformRequest: (data) => data,
  });

  return response.data;
};

/**
 * Update voter mobile number
 */
export const updateMobileNumber = (id, number) =>
  axios.put<Voter>(`/Voters/update-mobile-number/${id}?mobileNumber=${number}`, {}, { useApiPrefix: true });

/**
 * Verify voter
 */
export const verifyVoter = (id, type) =>
  axios.put<Voter>(`/Voters/verify-voter/${id}?isVerify=${type}`, {}, { useApiPrefix: true });

/**
 * Get family members
 */
export const getFamilyMembers = (id) =>
  axios.get<GetFamilyMembers>(`/Voters/get-family-members/${id}`, { useApiPrefix: true });

/**
 * Get eligible family members
 */
export const getEligibleFamilyMembers = (applicationId, pageNumber, pageSize, searchText) =>
  axios.get<GetFamilyMembers>(`/Voters/getvoters-eligible-for-family/${applicationId}?page=${pageNumber}&pageSize=${pageSize}&searchText=${searchText}`, { useApiPrefix: true });


/**
 * Add family member
 */
export const addFamilyMember = (data) =>
  axios.post<Voter>("/Voters/addvoter-to-family", data, { useApiPrefix: true });

/**
 * Remove family member
 */
export const removeFamilyMember = (id) =>
  axios.post<Voter>(`/Voters/remove-from-family?voterId=${id}`, {}, { useApiPrefix: true });

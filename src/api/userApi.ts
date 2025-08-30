import axios from "./axiosInstance";
import {
  User,
  CreateUserPayload,
  EditUserPayload,
} from "../types/User";
import { base64ToBlob } from "../utils/common";

/**
 * Get paginated users with optional search
 */
export const getUsers = () =>
  axios.get<User>("/Users/get-users", { useApiPrefix: true });

/**
 * Get paginated distributors with optional search
 */
export const getDistributors = () =>
  axios.get<User>("/Users/get-distributors", { useApiPrefix: true });

/**
 * Get paginated customer admins with optional search
 */
export const getCustomerAdmins = () =>
  axios.get<User>("/Users/get-admins", { useApiPrefix: true });

/**
 * Add new user
 */
export const createUser = (payload: CreateUserPayload) =>
  axios.post<User>("/Users/register", payload, { useApiPrefix: true });

/**
 * Edit user by ID
 */
export const editUserById = (id: string, payload: EditUserPayload) =>
  axios.put<User>(`/Users/${id}`, payload, { useApiPrefix: true });

/**
 * Delete user by ID
 */
export const deleteUserById = (id: string) =>
  axios.delete(`/Users/delete/${id}`, { useApiPrefix: true });

/**
 * Add multiple users
 */
export const uploadUsers = async (file: any) => {
  const formData = new FormData();

  // Case: base64 string in file.uri
  if (file?.uri?.startsWith("data:")) {
    const [metadata, base64] = file.uri.split(",");
    const mimeType = file.mimeType || metadata.match(/data:(.*);base64/)?.[1] || "application/octet-stream";
    const blob = base64ToBlob(base64, mimeType);
    formData.append("file", blob, file.name || "upload.xlsx");
  }
  // Case: plain File object (web)
  else if (file instanceof File) {
    formData.append("file", file);
  }
  // Case: file from RN picker with uri
  else if (file?.uri) {
    formData.append("file", {
      uri: file.uri,
      name: file.name || "upload.xlsx",
      type: file.mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    } as any);
  } else {
    throw new Error("Unsupported file format");
  }

  const response = await axios.post("/Users/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    useApiPrefix: true,
  });

  return response.data;
};



import axios from "./axiosInstance";
import { CreateVoterPayload, EditVoterPayload, Voter } from "../types/Voter";
import { base64ToBlob } from "../utils/common";

/**
 * Get paginated users with optional search
 */
export const getVoters = () =>
  axios.get<Voter>("/Recipients/getrecipients");


/**
 * Get paginated voters with in progress vidoes using base video id
 */
export const getVotersWithVideoId = (id: string) =>
  axios.get('/Recipients/getinProgressaivideoswithbaseid', {
    params: { baseVideoID: id },
  });


/**
* Get paginated voters with completed vidoes using base video id
*/
export const getVotersWithCompletedVideoId = (id: string) =>
  axios.get('/Recipients/getcompletedaivideoswithbaseid', {
    params: { baseVideoID: id },
  });


/**
 * Get user by ID
 */
export const getVoterById = (id: string) =>
  axios.get<Voter>(`/Recipients/${id}`);

/**
 * Add new user
 */
export const createVoter = (payload: CreateVoterPayload) =>
  axios.post<Voter>("/Recipients", payload);


/**
 * Add multiple users
 */
export const uploadVoters = async (file: any) => {
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

  const response = await axios.post("/Recipients/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};


/**
 * Edit user by ID
 */
export const editVoterById = (id: string, payload: EditVoterPayload) =>
  axios.put<Voter>(`/Recipients/${id}`, payload);

/**
 * Delete user by ID
 */
export const deleteVoterById = (id: string) =>
  axios.delete(`/Recipients/${id}`);

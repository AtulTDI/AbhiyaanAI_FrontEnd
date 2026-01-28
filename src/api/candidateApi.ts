import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import axios from "./axiosInstance";
import { Candidate, CandidateCreateUpdate } from "../types/Candidate";

const isWeb = Platform.OS === "web";

const guessMimeType = (filename?: string) => {
  if (!filename) return "image/jpeg";
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "heic":
      return "image/heic";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
};

export const getCandidates = () =>
  axios.get<Candidate[]>(
    "/Candidates/get-candidates",
    { useApiPrefix: true, useVoterBase: true }
  );

export const getCandidateById = (candidateId: string) =>
  axios.get<Candidate>(
    `/Candidates/candidates/${candidateId}`,
    { useApiPrefix: true, useVoterBase: true }
  );

export const addCandidate = async (data: CandidateCreateUpdate) => {
  const formData = new FormData();

  formData.append("name", data.name);
  formData.append("nameMr", data.nameMr);
  formData.append("partyName", data.partyName);
  formData.append("partyNameMr", data.partyNameMr);
  formData.append("symbolName", data.symbolName);

  if (data.candidatePhoto) {
    await appendFile(formData, data.candidatePhoto, "candidatePhoto");
  }

  if (data.symbolImage) {
    await appendFile(formData, data.symbolImage, "symbolImage");
  }

  const response = await axios.post(
    "/Candidates/add-candidates",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      useApiPrefix: true,
      useVoterBase: true,
      transformRequest: (d) => d,
    }
  );

  return response.data;
};

export const updateCandidate = async (data: CandidateCreateUpdate) => {
  if (!data.id) throw new Error("Candidate id is required");

  const formData = new FormData();

  formData.append("id", data.id);
  formData.append("name", data.name);
  formData.append("nameMr", data.nameMr);
  formData.append("partyName", data.partyName);
  formData.append("partyNameMr", data.partyNameMr);
  formData.append("symbolName", data.symbolName);

  if (data.candidatePhoto) {
    await appendFile(formData, data.candidatePhoto, "candidatePhoto");
  } else {
    formData.append("candidatePhoto", null);
  }

  if (data.symbolImage) {
    await appendFile(formData, data.symbolImage, "symbolImage");
  } else {
    formData.append("symbolImage", null);
  }

  return axios.put(
    "/Candidates/update-candidate",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      useApiPrefix: true,
      useVoterBase: true,
      transformRequest: (d) => d,
    }
  );
};

export const deleteCandidate = (id: string) =>
  axios.delete(
    `/Candidates/delete/${id}`,
    { useApiPrefix: true, useVoterBase: true }
  );

export const generateVoterSlip = (voterId: string) =>
  axios.get(
    `/Candidates/generate-voter-slip/${voterId}`,
    { useApiPrefix: true, useVoterBase: true }
  );

const appendFile = async (
  formData: FormData,
  uploadedFile: any,
  key: string
) => {
  if (!uploadedFile) return;

  if (isWeb && uploadedFile.file instanceof File) {
    formData.append(key, uploadedFile.file);
    return;
  }

  let uri = uploadedFile.uri;
  let name =
    uploadedFile.name ||
    uri?.split("/").pop() ||
    `photo_${Date.now()}.jpg`;

  let type = guessMimeType(name);

  // Handle content:// URIs safely
  if (uri?.startsWith("content://")) {
    const dest = `${FileSystem.cacheDirectory}${name}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    uri = dest;
  }

  formData.append(key, {
    uri,
    name,
    type,
  } as any);
};